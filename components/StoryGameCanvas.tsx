import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  ENVIRONMENT_COLORS, 
  ELEMENT_COLORS
} from '../constants';
import { MissionData, NinjaElement, PlayerState, Obstacle, Particle, Platform, Realm } from '../types';
import { soundManager } from '../services/sound';

interface StoryGameCanvasProps {
  missionData: MissionData;
  ninjaElement: NinjaElement;
  onGameOver: (score: number, success: boolean) => void;
  onDamage: () => void; 
  hearts: number;
  unlockAirjitzu: boolean;
  unlockRisingDragon: boolean;
  unlockElementalDragon: boolean;
}

// Top-Down Physics Constants
const TD_MOVE_SPEED = 4;
const TD_JUMP_FORCE = 10;
const TD_GRAVITY = 0.6;
const DRAGON_DURATION = 5000; // 5 seconds
const DRAGON_COOLDOWN = 15000; // 15 seconds
const RISING_DRAGON_COOLDOWN = 5000;

const StoryGameCanvas: React.FC<StoryGameCanvasProps> = ({ 
    missionData, 
    ninjaElement, 
    onGameOver, 
    onDamage, 
    hearts, 
    unlockAirjitzu,
    unlockRisingDragon,
    unlockElementalDragon
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  
  // Game Loop Refs
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const cameraRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });
  
  // Controls
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const joystickInputRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // Ability State
  const dragonStateRef = useRef<{active: boolean, readyTime: number, endTime: number}>({ active: false, readyTime: 0, endTime: 0 });
  const risingDragonStateRef = useRef<{active: boolean, readyTime: number}>({ active: false, readyTime: 0 });
  const airjitzuCountRef = useRef<number>(0); // Track double jumps

  // For UI updates (Cooldowns)
  const [dragonCooldownPct, setDragonCooldownPct] = useState(0);
  const [risingCooldownPct, setRisingCooldownPct] = useState(0);

  // Player State (Top Down)
  const playerRef = useRef<PlayerState>({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    isGrounded: true,
    element: ninjaElement,
    rotation: 0,
    facing: 1,
    invulnerable: 0
  });

  // Level State
  const levelRef = useRef<{
    islands: {x: number, y: number, w: number, h: number}[];
    enemies: Obstacle[];
    goal: {x: number, y: number, w: number, h: number};
  }>({ islands: [], enemies: [], goal: {x:0, y:0, w:0, h:0} });

  const particlesRef = useRef<Particle[]>([]);
  const isSpinningRef = useRef<boolean>(false);
  const spinEnergyRef = useRef<number>(100);

  // --- LEVEL GENERATION (TOP DOWN MAP) ---
  useEffect(() => {
    const islands: {x: number, y: number, w: number, h: number}[] = [];
    const enemies: Obstacle[] = [];
    
    // Starting Island - MADE VERY LARGE AND SAFE AS REQUESTED
    islands.push({ x: -500, y: -500, w: 2000, h: 2000 });

    const numIslands = 5;
    let currentX = 1500;
    let currentY = 500;

    for (let i = 0; i < numIslands; i++) {
        const w = 400;
        const h = 400;
        // Just adding some distant islands for visual effect, but keeping them empty
        currentX += 500;
        islands.push({ x: currentX, y: currentY, w, h });
        
        // NO ENEMIES GENERATED HERE
    }

    // Goal at the end
    const goal = {
        x: currentX + 150,
        y: currentY + 150,
        w: 80, 
        h: 80
    };

    levelRef.current = { islands, enemies, goal };
    playerRef.current.x = 100;
    playerRef.current.y = 100;
    playerRef.current.z = 0;

    return () => soundManager.stopSpin();
  }, [missionData]);


  // --- PHYSICS ENGINE ---
  const checkOverlap = (
    r1: {x: number, y: number, w?: number, h?: number, width?: number, height?: number}, 
    r2: {x: number, y: number, w?: number, h?: number, width?: number, height?: number}
  ) => {
    const w1 = r1.w || r1.width || 0;
    const h1 = r1.h || r1.height || 0;
    const w2 = r2.w || r2.width || 0;
    const h2 = r2.h || r2.height || 0;
    return (
        r1.x < r2.x + w2 &&
        r1.x + w1 > r2.x &&
        r1.y < r2.y + h2 &&
        r1.y + h1 > r2.y
    );
  };

  const createParticles = (x: number, y: number, z: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x, y, z,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        vz: Math.random() * 5,
        life: 1.0,
        color
      });
    }
  };

  // --- ABILITY LOGIC ---

  const jump = useCallback(() => {
    // Normal Jump
    if (playerRef.current.isGrounded) {
      soundManager.playJump();
      playerRef.current.vz = TD_JUMP_FORCE;
      playerRef.current.isGrounded = false;
      playerRef.current.z = 1; 
      airjitzuCountRef.current = 1; // Used 1 jump
    } 
    // Airjitzu (Double Jump)
    else if (unlockAirjitzu && airjitzuCountRef.current === 1) {
        soundManager.startSpin(); // Sound effect
        playerRef.current.vz = TD_JUMP_FORCE * 1.2; // Higher jump
        airjitzuCountRef.current = 2;
        // Visuals
        createParticles(playerRef.current.x, playerRef.current.y, playerRef.current.z, '#ffffff', 20);
        setTimeout(() => soundManager.stopSpin(), 500);
    }
  }, [unlockAirjitzu]);

  const activateDragon = useCallback(() => {
      const now = Date.now();
      if (dragonStateRef.current.readyTime > now) return; // Cooldown

      soundManager.playCollect(); // Dragon roar sound placeholder
      dragonStateRef.current.active = true;
      dragonStateRef.current.endTime = now + DRAGON_DURATION;
      dragonStateRef.current.readyTime = now + DRAGON_COOLDOWN;
      
      // Initial boost
      playerRef.current.z = 60; 
      playerRef.current.vz = 0;
  }, []);

  const activateRisingDragon = useCallback(() => {
      const now = Date.now();
      if (risingDragonStateRef.current.readyTime > now) return;

      soundManager.playCollect();
      risingDragonStateRef.current.active = true;
      risingDragonStateRef.current.readyTime = now + RISING_DRAGON_COOLDOWN;
      
      // Dash Physics
      let dx = 0;
      let dy = 0;
      
      // Determine dash direction from joystick or facing
      if (Math.abs(joystickInputRef.current.x) > 0.1 || Math.abs(joystickInputRef.current.y) > 0.1) {
          dx = joystickInputRef.current.x;
          dy = joystickInputRef.current.y;
      } else {
          dx = playerRef.current.facing; // default facing
      }

      // Normalize
      const len = Math.sqrt(dx*dx + dy*dy);
      if (len > 0) {
        playerRef.current.vx = (dx / len) * 20; // Super speed
        playerRef.current.vy = (dy / len) * 20;
      }
      
      // Reset after short burst
      setTimeout(() => {
          risingDragonStateRef.current.active = false;
      }, 300); // 0.3s Dash

  }, []);

  const startSpin = useCallback(() => {
    if (spinEnergyRef.current > 10) {
      if (!isSpinningRef.current) soundManager.startSpin();
      isSpinningRef.current = true;
    }
  }, []);

  const stopSpin = useCallback(() => {
    isSpinningRef.current = false;
    soundManager.stopSpin();
  }, []);

  // --- INPUT LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space') jump();
      if (e.code === 'ShiftLeft' || e.code === 'KeyK') startSpin();
      // Keyboard shortcuts for abilities
      if (e.code === 'KeyE' && unlockElementalDragon) activateDragon();
      if (e.code === 'KeyR' && unlockRisingDragon) activateRisingDragon();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'KeyK') stopSpin();
    };
    
    // Joystick
    const joystick = joystickRef.current;
    let touchId: number | null = null;
    const maxRadius = 40;

    const updateJoystick = (touch: Touch) => {
        if (!joystick) return;
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        
        const distance = Math.sqrt(dx*dx + dy*dy);
        const cappedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(dy, dx);
        
        const moveX = Math.cos(angle) * cappedDistance;
        const moveY = Math.sin(angle) * cappedDistance;

        if (joystickKnobRef.current) {
            joystickKnobRef.current.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        }

        // Normalize input -1 to 1
        joystickInputRef.current = {
            x: moveX / maxRadius,
            y: moveY / maxRadius
        };
    };

    const handleTouchStart = (e: TouchEvent) => {
        if (touchId === null && (e.target === joystick || joystick?.contains(e.target as Node))) {
            e.preventDefault();
            const touch = e.changedTouches[0];
            touchId = touch.identifier;
            updateJoystick(touch);
        }
    };
    const handleTouchMove = (e: TouchEvent) => {
        if (touchId === null) return;
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                updateJoystick(e.changedTouches[i]);
            }
        }
    };
    const handleTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                joystickInputRef.current = { x: 0, y: 0 };
                if (joystickKnobRef.current) {
                    joystickKnobRef.current.style.transform = `translate(-50%, -50%)`;
                }
                break;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (joystick) {
        joystick.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (joystick) {
        joystick.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [jump, startSpin, stopSpin, activateDragon, activateRisingDragon, unlockRisingDragon, unlockElementalDragon]);


  // --- GAME LOOP ---
  const update = useCallback((time: number) => {
    if (hearts <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    const now = Date.now();
    const player = playerRef.current;

    // --- MANAGE ABILITY STATES ---
    if (dragonStateRef.current.active && now > dragonStateRef.current.endTime) {
        dragonStateRef.current.active = false;
    }
    const isDragon = dragonStateRef.current.active;
    
    // UI Cooldown Updates
    // Elemental Dragon
    if (unlockElementalDragon) {
        if (dragonStateRef.current.readyTime > now) {
            const rem = dragonStateRef.current.readyTime - now;
            setDragonCooldownPct((rem / DRAGON_COOLDOWN) * 100);
        } else {
            setDragonCooldownPct(0);
        }
    }
    
    // Rising Dragon
    if (unlockRisingDragon) {
        if (risingDragonStateRef.current.readyTime > now) {
            const rem = risingDragonStateRef.current.readyTime - now;
            setRisingCooldownPct((rem / RISING_DRAGON_COOLDOWN) * 100);
        } else {
            setRisingCooldownPct(0);
        }
    }


    // 1. Movement Logic (X/Y)
    let dx = 0;
    let dy = 0;

    if (!risingDragonStateRef.current.active) {
        // Normal movement input
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) dy = -1;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) dy = 1;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) dx = -1;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) dx = 1;
        
        // Joystick override
        if (Math.abs(joystickInputRef.current.x) > 0.1 || Math.abs(joystickInputRef.current.y) > 0.1) {
            dx = joystickInputRef.current.x;
            dy = joystickInputRef.current.y;
        }

        // Normalize diagonal
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 1 && (keysRef.current['ArrowUp'] || keysRef.current['KeyW'])) {
            dx /= len;
            dy /= len;
        }

        // Speed multiplier for Dragon
        const speed = isDragon ? TD_MOVE_SPEED * 1.5 : TD_MOVE_SPEED;

        player.vx = dx * speed;
        player.vy = dy * speed;
    } else {
        // Dash Friction
        player.vx *= 0.95;
        player.vy *= 0.95;
    }
    
    // Apply Movement
    player.x += player.vx;
    player.y += player.vy;

    if (player.vx > 0) player.facing = 1;
    if (player.vx < 0) player.facing = -1;

    // 2. Jump/Z-Axis Logic
    if (isDragon) {
        // Flying Mode (Hover)
        const targetZ = 60 + Math.sin(frameCountRef.current * 0.1) * 10;
        player.z += (targetZ - player.z) * 0.1;
        player.vz = 0;
        player.isGrounded = false;
        createParticles(player.x + player.width/2, player.y + player.height/2, player.z, ELEMENT_COLORS[player.element], 1);
    } else {
        // Standard Physics
        player.vz -= TD_GRAVITY;
        player.z += player.vz;

        // Ground Check
        if (player.z <= 0) {
            player.z = 0;
            player.vz = 0;
            player.isGrounded = true;
            airjitzuCountRef.current = 0; // Reset double jump
        }
    }

    // 3. Fall into Void Check
    if (player.isGrounded && player.invulnerable <= 0 && !isDragon) {
        let onIsland = false;
        const centerX = player.x + player.width/2;
        const centerY = player.y + player.height/2;

        for (const isle of levelRef.current.islands) {
            if (
                centerX > isle.x && 
                centerX < isle.x + isle.w &&
                centerY > isle.y && 
                centerY < isle.y + isle.h
            ) {
                onIsland = true;
                break;
            }
        }

        if (!onIsland) {
            // Player fell
            soundManager.playCrash();
            onDamage();
            // Respawn at center of main safe island
            player.x = 100;
            player.y = 100;
            player.invulnerable = 60;
            player.z = 200; // Fall from sky
        }
    }

    // 4. Spin Energy
    if (isSpinningRef.current) {
        spinEnergyRef.current -= 1.0;
        if (spinEnergyRef.current <= 0) stopSpin();
    } else {
        spinEnergyRef.current = Math.min(spinEnergyRef.current + 0.5, 100);
    }
    
    if (player.invulnerable > 0) player.invulnerable--;

    // 6. Camera Follow (Smooth)
    const targetCamX = player.x + player.width/2 - CANVAS_WIDTH / 2;
    const targetCamY = player.y + player.height/2 - CANVAS_HEIGHT / 2;
    
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;

    // 7. Goal Check
    if (checkOverlap(player, levelRef.current.goal)) {
        onGameOver(Math.floor(player.x), true);
    }

    // --- DRAWING ---
    const colors = ENVIRONMENT_COLORS[missionData.environmentType] || ENVIRONMENT_COLORS.DOJO;
    
    // Fill Background (Void/Sky)
    ctx.fillStyle = colors.sky; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    // Draw Islands (Ground)
    ctx.fillStyle = colors.ground;
    levelRef.current.islands.forEach(isle => {
        // Draw main block
        ctx.fillRect(isle.x, isle.y, isle.w, isle.h);
        // Draw darker border/edge to give 3D feel
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(isle.x, isle.y + isle.h, isle.w, 10);
        ctx.fillStyle = colors.ground;
    });

    // Draw Goal
    const goal = levelRef.current.goal;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Golden glow
    ctx.beginPath();
    ctx.arc(goal.x + goal.w/2, goal.y + goal.h/2, goal.w/2 + Math.sin(frameCountRef.current * 0.1)*5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(goal.x + 20, goal.y + 20, 40, 40);

    // 1. Shadows (Always on ground z=0)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    
    // Player Shadow
    ctx.beginPath();
    const shadowScale = Math.max(0.2, 1 - (player.z / 200));
    ctx.ellipse(
        player.x + player.width/2, 
        player.y + player.height - 5, 
        (player.width/2) * shadowScale, 
        (player.width/4) * shadowScale, 
        0, 0, Math.PI * 2
    );
    ctx.fill();

    // 2. Player
    // Calculate render Y based on Z (jumping)
    const renderY = player.y - player.z;
    
    ctx.save();
    ctx.translate(player.x + player.width/2, renderY + player.height/2);
    
    if (player.invulnerable > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    if (isDragon) {
        // DRAW DRAGON (Simplified)
        ctx.scale(player.facing, 1);
        ctx.fillStyle = ELEMENT_COLORS[player.element];
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 20, 0, 0, Math.PI*2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.lineTo(60, 0);
        ctx.lineTo(30, 10);
        ctx.fill();
        // Wings (Flapping)
        const wingY = Math.sin(frameCountRef.current * 0.5) * 20;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-20, -10 - 40 + wingY);
        ctx.lineTo(20, -10 - 40 + wingY);
        ctx.fill();
        
    } else if (risingDragonStateRef.current.active) {
        // RISING DRAGON DASH VISUAL
        if (player.facing === -1) ctx.scale(-1, 1);
        
        ctx.fillStyle = ELEMENT_COLORS[player.element];
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-40, -20);
        ctx.lineTo(-40, 20);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

    } else if (isSpinningRef.current) {
        // Spinjitzu Tornado
        const wobble = Math.sin(frameCountRef.current * 0.5) * 5;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
        grad.addColorStop(0, ELEMENT_COLORS[player.element]);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 45 + wobble, 0, Math.PI * 2);
        ctx.fill();
        
        // Airjitzu spiral
        if (!player.isGrounded) {
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.arc(0, 0 + (frameCountRef.current % 20) - 10, 30, 0, Math.PI*2);
             ctx.stroke();
        }

    } else {
        // Normal Top-Down Ninja
        if (player.facing === -1) ctx.scale(-1, 1);
        
        // Body
        ctx.fillStyle = ELEMENT_COLORS[player.element];
        ctx.fillRect(-15, -10, 30, 25);
        
        // Head
        ctx.fillStyle = '#facc15'; // Skin
        ctx.fillRect(-12, -25, 24, 20);
        
        // Mask
        ctx.fillStyle = ELEMENT_COLORS[player.element];
        ctx.fillRect(-13, -26, 26, 10); // Hood
        ctx.fillRect(-13, -12, 26, 8); // Mask lower

        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(2, -18, 4, 4);
    }
    ctx.restore();

    // Particles
    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        // Particle Z movement
        const pRenderY = p.y - p.z;
        ctx.arc(p.x, pRenderY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vz -= 0.5; // gravity for particles
        if (p.z < 0) { p.z = 0; p.vx *= 0.8; p.vy *= 0.8; }
        
        p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    ctx.restore();
    requestRef.current = requestAnimationFrame(() => update(time));
  }, [hearts, missionData, onDamage, onGameOver, unlockAirjitzu, unlockElementalDragon, unlockRisingDragon]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame((time) => update(time));
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="relative group select-none">
       <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-slate-800 rounded-lg shadow-xl bg-gray-900 cursor-pointer touch-none w-full max-w-[800px] h-auto"
        style={{ touchAction: 'none' }}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-1">
         {Array.from({length: 5}).map((_, i) => (
             <span key={i} className="text-2xl drop-shadow-md">
                 {i < hearts ? '❤️' : '🖤'}
             </span>
         ))}
      </div>

      <div className="absolute top-4 right-4 w-32 h-4 bg-slate-900/80 border border-white/50 rounded-full overflow-hidden">
         <div 
            style={{ width: `${spinEnergyRef.current}%` }}
            className="h-full bg-yellow-400 transition-all duration-75 ease-linear"
         ></div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-4 px-8">
        <div className="flex justify-between items-end w-full pointer-events-auto">
            {/* Joystick */}
            <div className="w-40 h-40 relative flex items-center justify-center">
                 <div ref={joystickRef} className="w-28 h-28 rounded-full bg-slate-800/50 border-2 border-white/20 backdrop-blur-sm relative touch-none pointer-events-auto">
                    <div 
                        ref={joystickKnobRef}
                        className="w-12 h-12 rounded-full bg-white/80 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
                    ></div>
                 </div>
                 <div className="absolute bottom-2 text-white/50 text-xs font-bold uppercase pointer-events-none drop-shadow-md">Move</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-2 items-end">
                {/* Special Abilities Column */}
                <div className="flex flex-col gap-4 mr-2">
                    {/* Rising Dragon */}
                    {unlockRisingDragon && (
                         <button
                            className="w-16 h-16 rounded-full bg-orange-600 border-2 border-orange-400 shadow-xl active:scale-95 flex flex-col items-center justify-center touch-none select-none relative overflow-hidden"
                            onTouchStart={(e) => { e.preventDefault(); activateRisingDragon(); }}
                            onMouseDown={(e) => { e.preventDefault(); activateRisingDragon(); }}
                        >
                            {risingCooldownPct > 0 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <div className="text-white text-xs font-bold">{Math.ceil((RISING_DRAGON_COOLDOWN * (risingCooldownPct/100))/1000)}s</div>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/30 h-[var(--h)] transition-all" style={{ '--h': `${risingCooldownPct}%` } as any}></div>
                            <span className="text-2xl">🔥</span>
                        </button>
                    )}

                    {/* Elemental Dragon */}
                    {unlockElementalDragon && (
                        <button
                            className="w-16 h-16 rounded-full bg-emerald-600 border-2 border-emerald-400 shadow-xl active:scale-95 flex flex-col items-center justify-center touch-none select-none relative overflow-hidden"
                            onTouchStart={(e) => { e.preventDefault(); activateDragon(); }}
                            onMouseDown={(e) => { e.preventDefault(); activateDragon(); }}
                        >
                             {dragonCooldownPct > 0 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <div className="text-white text-xs font-bold">{Math.ceil((DRAGON_COOLDOWN * (dragonCooldownPct/100))/1000)}s</div>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/30 h-[var(--h)] transition-all" style={{ '--h': `${dragonCooldownPct}%` } as any}></div>
                            <span className="text-2xl">🐉</span>
                        </button>
                    )}
                </div>

                {/* Standard Actions */}
                <div className="flex gap-4">
                    <button
                        className="w-24 h-24 rounded-full bg-yellow-500 border-4 border-yellow-300 shadow-xl active:scale-95 flex flex-col items-center justify-center touch-none select-none active:bg-yellow-600 transition-all"
                        onTouchStart={(e) => { e.preventDefault(); startSpin(); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopSpin(); }}
                        onMouseDown={(e) => { e.preventDefault(); startSpin(); }}
                        onMouseUp={(e) => { e.preventDefault(); stopSpin(); }}
                        onMouseLeave={() => stopSpin()}
                    >
                        <span className="ninja-font font-bold text-yellow-900 text-sm">SPIN</span>
                        <span className="text-[10px] text-yellow-900 font-bold uppercase">Attack</span>
                    </button>
                    <button
                        className="w-24 h-24 rounded-full bg-blue-600 border-4 border-blue-400 shadow-xl active:scale-95 flex flex-col items-center justify-center touch-none select-none active:bg-blue-700 transition-all"
                        onTouchStart={(e) => { e.preventDefault(); jump(); }}
                        onMouseDown={(e) => { e.preventDefault(); jump(); }}
                    >
                        <span className="ninja-font font-bold text-white text-sm">JUMP</span>
                        <span className="text-[10px] text-white/80 font-bold uppercase">
                            {unlockAirjitzu ? 'Airjitzu' : 'Dodge'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
     </div>
    </div>
  );
};

export default StoryGameCanvas;