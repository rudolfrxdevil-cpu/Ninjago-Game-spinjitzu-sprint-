import React, { useRef, useEffect, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  MOVE_SPEED_BASE, 
  PLAYER_SIZE, 
  ENVIRONMENT_COLORS, 
  ELEMENT_COLORS
} from '../constants';
import { MissionData, NinjaElement, PlayerState, Obstacle, Particle } from '../types';
import { soundManager } from '../utils/sound';

interface GameCanvasProps {
  missionData: MissionData;
  ninjaElement: NinjaElement;
  onGameOver: (score: number) => void;
}

const SEGMENT_PATTERNS = [
  { difficulty: 1, width: 200, obstacles: [{ type: 'BLOCK', x: 0, y: 0, w: 40, h: 40 }] },
  { difficulty: 3, width: 400, obstacles: [{ type: 'SPIKE', x: 0, y: 0, w: 30, h: 30 }, { type: 'SPIKE', x: 150, y: 0, w: 30, h: 30 }] },
  { difficulty: 2, width: 300, obstacles: [{ type: 'BLOCK', x: 0, y: 0, w: 40, h: 80 }] },
  { difficulty: 3, width: 350, obstacles: [{ type: 'ENEMY', x: 0, y: 0, w: 40, h: 50 }, { type: 'BLOCK', x: 100, y: 0, w: 40, h: 40 }] },
  { difficulty: 5, width: 600, obstacles: [{ type: 'BLOCK', x: 0, y: 0, w: 40, h: 40 }, { type: 'BLOCK', x: 120, y: 50, w: 60, h: 20 }, { type: 'BLOCK', x: 280, y: 0, w: 40, h: 40 }] },
  { difficulty: 7, width: 800, obstacles: [{ type: 'ENEMY', x: 0, y: 0, w: 40, h: 50 }, { type: 'SPIKE', x: 180, y: 0, w: 30, h: 30 }, { type: 'BLOCK', x: 350, y: 0, w: 40, h: 90 }, { type: 'ENEMY', x: 500, y: 0, w: 40, h: 50 }] },
  { difficulty: 6, width: 500, obstacles: [{ type: 'SPIKE', x: 0, y: 0, w: 30, h: 30 }, { type: 'SPIKE', x: 100, y: 0, w: 30, h: 30 }, { type: 'SPIKE', x: 200, y: 0, w: 30, h: 30 }] }
];

const GameCanvas: React.FC<GameCanvasProps> = ({ missionData, ninjaElement, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElemRef = useRef<HTMLDivElement>(null);
  const energyBarInnerRef = useRef<HTMLDivElement>(null);
  const spinBtnRef = useRef<HTMLButtonElement>(null);
  
  const requestRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  const playerRef = useRef<PlayerState>({
    x: 100,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    vy: 0,
    isGrounded: true,
    element: ninjaElement,
    rotation: 0
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const speedRef = useRef<number>(MOVE_SPEED_BASE + (missionData.difficulty * 0.2));
  const isGameOverRef = useRef<boolean>(false);
  const nextSpawnXRef = useRef<number>(CANVAS_WIDTH + 200);

  const isSpinningRef = useRef<boolean>(false);
  const spinEnergyRef = useRef<number>(100); 

  // Ensure spin sound stops on unmount or game over
  useEffect(() => {
    return () => {
        soundManager.stopSpin();
    };
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15, 
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color
      });
    }
  };

  const jump = useCallback(() => {
    if (playerRef.current.isGrounded && !isGameOverRef.current) {
      soundManager.playJump();
      playerRef.current.vy = JUMP_FORCE;
      playerRef.current.isGrounded = false;
      playerRef.current.rotation = 0;
      createParticles(playerRef.current.x + PLAYER_SIZE/2, playerRef.current.y + PLAYER_SIZE, '#ffffff', 5);
    }
  }, []);

  const startSpin = useCallback(() => {
    if (!isGameOverRef.current && spinEnergyRef.current > 10) {
      if (!isSpinningRef.current) {
        soundManager.startSpin();
      }
      isSpinningRef.current = true;
    }
  }, []);

  const stopSpin = useCallback(() => {
    isSpinningRef.current = false;
    soundManager.stopSpin();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        jump();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyS') {
        e.preventDefault();
        startSpin();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyS') {
        stopSpin();
      }
    };
    
    const handleCanvasTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.addEventListener('touchstart', handleCanvasTouch);
        canvas.addEventListener('mousedown', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button')) return;
            jump();
        });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleCanvasTouch);
      }
    };
  }, [jump, startSpin, stopSpin]);

  const update = useCallback((time: number) => {
    if (isGameOverRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    scoreRef.current += 0.1;

    if (scoreElemRef.current) {
      scoreElemRef.current.textContent = `Distance: ${Math.floor(scoreRef.current)}m`;
    }

    if (isSpinningRef.current) {
      spinEnergyRef.current -= 1.5;
      if (spinEnergyRef.current <= 0) {
        spinEnergyRef.current = 0;
        isSpinningRef.current = false;
        soundManager.stopSpin(); // Force stop sound if energy runs out
      }
    } else {
      spinEnergyRef.current += 0.3;
      if (spinEnergyRef.current > 100) spinEnergyRef.current = 100;
    }

    if (energyBarInnerRef.current) {
      energyBarInnerRef.current.style.width = `${spinEnergyRef.current}%`;
      energyBarInnerRef.current.style.backgroundColor = isSpinningRef.current ? '#fbbf24' : spinEnergyRef.current < 20 ? '#ef4444' : '#34d399';
    }

    if (spinBtnRef.current) {
      if (spinEnergyRef.current < 10 && !isSpinningRef.current) {
        spinBtnRef.current.style.filter = 'grayscale(100%) opacity(0.5)';
      } else {
        spinBtnRef.current.style.filter = 'none';
      }
    }

    const player = playerRef.current;
    player.vy += GRAVITY;
    player.y += player.vy;

    if (!isSpinningRef.current) {
        if (!player.isGrounded) {
            player.rotation += 15;
        } else {
            player.rotation = 0;
        }
    } else {
        player.rotation += 45;
    }

    if (player.y + player.height >= CANVAS_HEIGHT - GROUND_HEIGHT) {
      player.y = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
      player.vy = 0;
      player.isGrounded = true;
    }

    nextSpawnXRef.current -= speedRef.current;

    if (nextSpawnXRef.current < CANVAS_WIDTH) {
      const validPatterns = SEGMENT_PATTERNS.filter(p => p.difficulty <= (missionData.difficulty || 1) + 2);
      const pattern = validPatterns[Math.floor(Math.random() * validPatterns.length)];
      
      pattern.obstacles.forEach(def => {
        obstaclesRef.current.push({
          id: Date.now() + Math.random(),
          x: nextSpawnXRef.current + def.x,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - (def.h || 40) - def.y, 
          width: def.w || 40,
          height: def.h || 40,
          type: def.type as any,
          speed: speedRef.current
        });
      });

      const gap = 150 + Math.random() * 200;
      nextSpawnXRef.current += pattern.width + gap;
    }

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= obs.speed;

      if (
        player.x < obs.x + obs.width - 10 && 
        player.x + player.width - 10 > obs.x &&
        player.y < obs.y + obs.height - 10 &&
        player.y + player.height - 10 > obs.y
      ) {
        if (isSpinningRef.current) {
            obstaclesRef.current.splice(i, 1);
            soundManager.playCollect();
            createParticles(obs.x + obs.width/2, obs.y + obs.height/2, ELEMENT_COLORS[player.element], 15);
            createParticles(obs.x + obs.width/2, obs.y + obs.height/2, '#ffffff', 5);
            scoreRef.current += 10;
            continue;
        } else {
            isGameOverRef.current = true;
            soundManager.stopSpin();
            soundManager.playCrash();
            createParticles(player.x, player.y, ELEMENT_COLORS[player.element], 20);
            onGameOver(Math.floor(scoreRef.current));
        }
      }

      if (obs.x + obs.width < 0) {
        obstaclesRef.current.splice(i, 1);
      }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    const colors = ENVIRONMENT_COLORS[missionData.environmentType] || ENVIRONMENT_COLORS.DOJO;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, colors.sky);
    gradient.addColorStop(1, '#020617'); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    ctx.fillStyle = colors.accent;
    for (let i=0; i < CANVAS_WIDTH; i += 40) {
      const offset = (frameCountRef.current * speedRef.current) % 40;
      ctx.beginPath();
      ctx.arc(i - offset, CANVAS_HEIGHT - GROUND_HEIGHT + 15, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    obstaclesRef.current.forEach(obs => {
      ctx.save();
      if (obs.type === 'SPIKE') {
        ctx.fillStyle = '#9ca3af'; 
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
      } else if (obs.type === 'ENEMY') {
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(obs.x + 5, obs.y + 10, 8, 8);
        ctx.fillRect(obs.x + 20, obs.y + 10, 8, 8);
      } else {
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(obs.x + 10, obs.y - 5, 20, 5);
      }
      ctx.restore();
    });

    if (isSpinningRef.current) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        // --- RESTORED "OLD" WOBBLE CONE VISUALS ---
        const wobble = Math.sin(frameCountRef.current * 0.5) * 5;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
        grad.addColorStop(0, ELEMENT_COLORS[player.element]);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-30 + wobble, -60);
        ctx.lineTo(30 - wobble, -60);
        ctx.lineTo(0, 30);
        ctx.fill();
        ctx.rotate(frameCountRef.current * 0.2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -10, 40, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate((player.rotation * Math.PI) / 180);
    
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-10, -18, 20, 18);
    ctx.fillStyle = ELEMENT_COLORS[player.element];
    ctx.fillRect(-12, -20, 24, 10);
    ctx.fillRect(-12, -5, 24, 8);
    ctx.fillStyle = 'black';
    ctx.fillRect(-8, -10, 4, 4);
    ctx.fillRect(4, -10, 4, 4);
    ctx.fillStyle = ELEMENT_COLORS[player.element];
    ctx.fillRect(-15, 0, 30, 20); 
    ctx.fillStyle = 'black';
    ctx.fillRect(-16, 12, 32, 4);
    ctx.restore();

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    requestRef.current = requestAnimationFrame(() => update(time));
  }, [missionData, onGameOver]);

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
      />
      
      <div 
        ref={scoreElemRef}
        className="absolute top-4 right-4 text-3xl font-bold ninja-font text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
      >
        Distance: 0m
      </div>

      <div className="absolute top-4 left-4 w-48 h-6 bg-slate-900/80 border-2 border-white/50 rounded-full overflow-hidden">
         <div 
            ref={energyBarInnerRef}
            className="h-full bg-emerald-400 transition-all duration-75 ease-linear w-full"
         ></div>
         <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-wider">
            Spinjitzu Energy
         </div>
      </div>

      <div className="absolute top-16 left-4 text-white/50 text-xs pointer-events-none hidden md:block">
        [Space] Jump • [Shift] Spin
      </div>

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-4 px-4">
        <div className="flex justify-between items-end w-full pointer-events-auto">
            <button
                className="w-20 h-20 rounded-full bg-blue-600 border-4 border-blue-400 shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 active:bg-blue-700 flex items-center justify-center group select-none touch-none"
                onTouchStart={(e) => { e.preventDefault(); jump(); }}
                onMouseDown={(e) => { e.preventDefault(); jump(); }}
            >
                <div className="text-white text-xs font-bold ninja-font text-center leading-tight drop-shadow-md">
                    JUMP
                </div>
            </button>

            <button 
                ref={spinBtnRef}
                id="spin-btn"
                className="w-24 h-24 rounded-full bg-yellow-500 border-4 border-yellow-300 shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 active:bg-yellow-600 flex items-center justify-center select-none touch-none transition-all"
                onTouchStart={(e) => { e.preventDefault(); startSpin(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopSpin(); }}
                onMouseDown={(e) => { e.preventDefault(); startSpin(); }}
                onMouseUp={(e) => { e.preventDefault(); stopSpin(); }}
                onMouseLeave={() => stopSpin()}
            >
                 <div className="flex flex-col items-center pointer-events-none">
                    <span className="ninja-font text-yellow-900 text-sm font-bold leading-none drop-shadow-sm">SPIN</span>
                    <span className="text-[10px] text-yellow-900 font-bold uppercase mt-1">Hold</span>
                 </div>
            </button>
        </div>
     </div>
    </div>
  );
};

export default GameCanvas;