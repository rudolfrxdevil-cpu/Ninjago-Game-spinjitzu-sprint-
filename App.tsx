import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import StoryGameCanvas from './components/StoryGameCanvas';
import MissionBriefing from './components/MissionBriefing';
import { GameState, MissionData, NinjaElement, Realm } from './types';
import { generateMission } from './services/geminiService';
import { soundManager } from './services/sound';
import { REALM_INFO, ENVIRONMENT_COLORS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [ninjaElement, setNinjaElement] = useState<NinjaElement>(NinjaElement.ENERGY);
  
  // Scoring & Progression
  const [lastScore, setLastScore] = useState(0);
  const [earnedPointsInRun, setEarnedPointsInRun] = useState(0);
  const [totalNinjaPoints, setTotalNinjaPoints] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  
  // Story Mode State
  const [hearts, setHearts] = useState(5);
  
  // Dev Mode Modal State
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // Check offline status
  const isOffline = !process.env.API_KEY || process.env.API_KEY.length === 0;

  // Load points from local storage on mount
  useEffect(() => {
    const savedPoints = localStorage.getItem('ninjaPoints');
    if (savedPoints) {
      setTotalNinjaPoints(parseInt(savedPoints, 10));
    }
  }, []);

  const openDevModal = () => {
    setDevPasswordInput('');
    setShowDevModal(true);
    soundManager.playClick();
  };

  const closeDevModal = () => {
    setShowDevModal(false);
    soundManager.playClick();
  };

  const submitDevPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (devPasswordInput === "Acronixdev") {
        setIsDevMode(true);
        setShowDevModal(false);
        soundManager.playCollect();
    } else {
        soundManager.playCrash();
        alert("Incorrect Password.");
        setDevPasswordInput('');
    }
  };

  const handleStartMission = async (name: string, element: NinjaElement, realm?: Realm) => {
    soundManager.playClick();
    setNinjaElement(element);
    setIsLoading(true);
    setGameState(GameState.LOADING_MISSION);
    setHearts(5); // Reset health for story mode
    
    try {
      const data = await generateMission(name, element, realm);
      setMissionData(data);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error("Failed to start mission", error);
      // Fallback
      setMissionData({
          missionTitle: realm ? `Journey to ${realm}` : "Offline Dojo",
          introText: "Offline Mode Active. Good luck!",
          environmentType: realm || "DOJO",
          difficulty: 3,
          obstacleTheme: "Standard Enemies"
      });
      setGameState(GameState.PLAYING);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDamage = () => {
      setHearts(prev => {
          const newVal = prev - 1;
          if (newVal <= 0) {
              handleGameOver(0); 
          }
          return newVal;
      });
  };

  const handleGameOver = (score: number, success?: boolean) => {
    setLastScore(score);
    
    let newPoints = 0;
    // Story Mode Calculation
    if (missionData?.environmentType !== 'DOJO') {
        // If story mode and reached end (success)
        if (success) {
            newPoints = 5; 
        } else {
            newPoints = Math.floor(score / 500); 
        }
    } else {
        // Training Mode
        newPoints = Math.floor(score / 100);
    }

    setEarnedPointsInRun(newPoints);
    
    const newTotal = totalNinjaPoints + newPoints;
    setTotalNinjaPoints(newTotal);
    localStorage.setItem('ninjaPoints', newTotal.toString());

    setGameState(GameState.GAME_OVER);
  };

  const resetGame = () => {
    soundManager.playClick();
    setGameState(GameState.START_MENU);
    setMissionData(null);
  };
  
  const goToMainMenu = () => {
    soundManager.playClick();
    setGameState(GameState.START_MENU);
    setMissionData(null);
  };

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playClick();
  };

  // --- PROGRESSION LOGIC ---
  const MAX_POINTS = 15;
  const progressPercent = Math.min((totalNinjaPoints / MAX_POINTS) * 100, 100);
  
  const unlockAirjitzu = totalNinjaPoints >= 5 || isDevMode;
  const unlockRisingDragon = totalNinjaPoints >= 10 || isDevMode;
  const unlockElementalDragon = totalNinjaPoints >= 15 || isDevMode;
  
  // Story mode is unlocked if you have at least Airjitzu (5 points) or are offline/dev
  // Note: Previous request forced unlock for testing, reverting to points-based but lenient for offline
  const isStoryModeUnlocked = totalNinjaPoints >= 5 || isDevMode || isOffline;
  
  const isStoryMode = missionData && missionData.environmentType !== 'DOJO';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('https://vignette.wikia.nocookie.net/ninjago/images/d/d0/S8NinjagoCity.png/revision/latest?cb=20170730210528')"
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/60 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-80" />
      
      {/* Mute Button */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 bg-slate-800/80 p-3 rounded-full border-2 border-slate-500 hover:bg-slate-700 text-white transition-all shadow-lg"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl text-red-600 mb-2 ninja-font drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] text-center">
          Spinjitzu Sprint
        </h1>
        <p className="text-slate-200 mb-8 tracking-widest uppercase text-sm font-bold drop-shadow-md">
          A Gemini Powered Ninja Training
          {isDevMode && <span className="text-yellow-400 ml-2 animate-pulse">[DEV MODE ACTIVE]</span>}
        </p>

        {isOffline && gameState === GameState.START_MENU && (
             <div className="mb-4 bg-yellow-600/90 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-widest shadow-lg border border-yellow-400">
                Offline Mode Active (No API Key)
             </div>
        )}

        {/* --- START MENU --- */}
        {gameState === GameState.START_MENU && (
          <div className="w-full max-w-4xl flex flex-col gap-6">
            
            {/* Ninja Status Bar */}
            <div className="bg-slate-800/90 border-2 border-slate-600 p-6 rounded-xl shadow-2xl backdrop-blur-sm pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-2">
                <h3 className="text-xl text-yellow-500 ninja-font">Ninja Status</h3>
                <div className="text-white font-bold text-lg">
                  {totalNinjaPoints} Ninja Points
                </div>
              </div>
              
              {/* Progress Bar with Markers */}
              <div className="relative w-full h-8 mt-4 mb-2">
                 {/* Bar Background */}
                 <div className="absolute inset-0 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                     <div 
                        className={`h-full transition-all duration-1000 ${unlockElementalDragon ? 'bg-gradient-to-r from-yellow-400 to-red-500' : 'bg-green-600'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                 </div>

                 {/* Ability Marker: 5 Points (Airjitzu) */}
                 <div className="absolute top-0 bottom-0 left-[33%] w-0.5 bg-slate-500/50"></div>
                 <div className="absolute -top-6 left-[33%] -translate-x-1/2 flex flex-col items-center group">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${unlockAirjitzu ? 'text-blue-400' : 'text-slate-600'}`}>Airjitzu</span>
                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${unlockAirjitzu ? 'bg-blue-500 border-white shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-slate-800 border-slate-600'}`}></div>
                 </div>

                 {/* Ability Marker: 10 Points (Rising Dragon) */}
                 <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-slate-500/50"></div>
                 <div className="absolute -top-6 left-[66%] -translate-x-1/2 flex flex-col items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${unlockRisingDragon ? 'text-orange-400' : 'text-slate-600'}`}>Dash</span>
                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${unlockRisingDragon ? 'bg-orange-500 border-white shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-800 border-slate-600'}`}></div>
                 </div>

                 {/* Ability Marker: 15 Points (True Potential) */}
                 <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-slate-500/50"></div>
                 <div className="absolute -top-6 right-0 translate-x-1/4 flex flex-col items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors ${unlockElementalDragon ? 'text-emerald-400' : 'text-slate-600'}`}>Dragon</span>
                    <div className={`w-3 h-3 rounded-full border-2 transition-all ${unlockElementalDragon ? 'bg-emerald-500 border-white shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-800 border-slate-600'}`}></div>
                 </div>
              </div>
              <div className="text-center text-xs text-slate-500 italic mt-1">
                 Collect points in Training Mode to unlock abilities.
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-stretch w-full">
              {/* Training Mode Card */}
              <button 
                onClick={() => {
                  soundManager.playClick();
                  setGameState(GameState.TRAINING_SETUP);
                }}
                className="flex-1 bg-slate-800/90 border-4 border-yellow-500 hover:border-yellow-400 p-8 rounded-xl shadow-2xl transition-all hover:scale-105 group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="w-24 h-24 bg-yellow-500 rounded-full blur-2xl"></div>
                </div>
                <h2 className="text-3xl text-yellow-500 ninja-font mb-4">Training Mode</h2>
                <p className="text-slate-300 mb-6">
                  Endless procedural challenges. Earn points here!
                </p>
                <div className="inline-block px-4 py-2 bg-yellow-600 text-slate-900 font-bold rounded uppercase text-sm">
                  Enter Dojo
                </div>
              </button>

              {/* Story Mode Card */}
              <button 
                onClick={() => {
                   if (isStoryModeUnlocked) {
                      soundManager.playClick();
                      setGameState(GameState.REALM_SELECT);
                   } else {
                      soundManager.playCrash();
                   }
                }}
                disabled={!isStoryModeUnlocked}
                className={`flex-1 bg-slate-800/90 border-4 p-8 rounded-xl shadow-2xl transition-all group text-left relative overflow-hidden
                  ${isStoryModeUnlocked ? 'border-purple-500 hover:border-purple-400 hover:scale-105 cursor-pointer' : 'border-slate-700 opacity-60 grayscale cursor-not-allowed'}
                `}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className="w-24 h-24 rounded-full blur-2xl bg-purple-500"></div>
                </div>
                
                {!isStoryModeUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
                        <div className="bg-slate-900 border-2 border-red-500 px-4 py-2 rounded shadow-lg text-red-500 font-bold ninja-font text-xl transform -rotate-12">
                            LOCKED (Need 5 Pts)
                        </div>
                    </div>
                )}

                <h2 className="text-3xl ninja-font mb-4 text-purple-400 group-hover:text-purple-300">
                    Story Mode
                </h2>
                <p className="text-slate-400 mb-6">
                  Free Roaming Adventure. Use unlocked abilities to explore.
                </p>
                <div className={`inline-block px-4 py-2 font-bold rounded uppercase text-sm border ${isStoryModeUnlocked ? 'bg-purple-700 text-purple-100 border-purple-600' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                  {isStoryModeUnlocked ? 'Select Realm' : 'Unlock at 5 Points'}
                </div>
              </button>
            </div>

            {/* Developer Access Button - In Start Menu */}
            {!isDevMode && (
                <div className="text-center mt-4">
                    <button 
                        onClick={openDevModal}
                        className="px-6 py-2 bg-slate-800/80 border border-slate-700 rounded text-slate-500 hover:text-white hover:border-red-500 hover:bg-slate-700 transition-all text-xs uppercase font-bold tracking-widest font-mono"
                    >
                        [ Developer Override ]
                    </button>
                </div>
            )}
          </div>
        )}

        {/* --- REALM SELECT --- */}
        {gameState === GameState.REALM_SELECT && (
           <div className="w-full max-w-5xl flex flex-col items-center">
             <h2 className="text-4xl text-purple-400 mb-2 ninja-font text-center drop-shadow-md">Select Destination</h2>
             <p className="text-slate-300 mb-8 italic">"The Realm Crystal is in your hands."</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4 overflow-y-auto max-h-[60vh] pb-8 scrollbar-hide">
                {Object.values(Realm).map((realm) => {
                    const info = REALM_INFO[realm];
                    const colors = ENVIRONMENT_COLORS[realm];
                    return (
                        <button
                            key={realm}
                            onClick={() => handleStartMission('Realm Traveler', NinjaElement.ENERGY, realm)}
                            className="relative overflow-hidden rounded-xl border-4 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] group text-left h-48 flex flex-col justify-end p-4"
                            style={{ 
                                borderColor: colors.accent,
                                backgroundColor: colors.sky 
                            }}
                        >
                            {/* Realm Visual Preview (Gradient) */}
                            <div 
                                className="absolute inset-0"
                                style={{ 
                                    background: `linear-gradient(to bottom, ${colors.sky} 0%, ${colors.ground} 80%)`,
                                    opacity: 0.8
                                }}
                            />
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white ninja-font drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                    {realm}
                                </h3>
                                <p className="text-xs text-white/90 font-bold uppercase tracking-wider mb-1 drop-shadow-md">
                                    Threat: {info.enemies}
                                </p>
                                <p className="text-sm text-white/80 leading-tight drop-shadow-md">
                                    {info.description}
                                </p>
                            </div>
                            
                            {/* Hover effect highlight */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </button>
                    )
                })}
             </div>

             <button 
               onClick={goToMainMenu}
               className="mt-4 px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded shadow-lg transition"
             >
               Back to Sanctuary
             </button>
           </div>
        )}

        {/* --- TRAINING SETUP --- */}
        {gameState === GameState.TRAINING_SETUP && (
          <div className="w-full flex flex-col items-center">
            <MissionBriefing onStartMission={(n, e) => handleStartMission(n, e)} isLoading={false} />
            <button 
               onClick={goToMainMenu}
               className="mt-6 text-slate-400 hover:text-white underline text-sm transition-colors"
             >
               Back to Main Menu
             </button>
          </div>
        )}

        {/* --- LOADING --- */}
        {gameState === GameState.LOADING_MISSION && (
           <MissionBriefing onStartMission={() => {}} isLoading={true} />
        )}

        {/* --- PLAYING --- */}
        {gameState === GameState.PLAYING && missionData && (
          <div className="flex flex-col items-center w-full max-w-4xl">
             <div className="w-full bg-slate-800/90 backdrop-blur-sm p-4 rounded-t-lg border-x-4 border-t-4 border-slate-700 flex justify-between items-center text-white shadow-xl">
               <div>
                 <h3 className="text-xl text-yellow-500 ninja-font">{missionData.missionTitle}</h3>
                 <p className="text-xs text-slate-400">{missionData.obstacleTheme} • Diff: {missionData.difficulty}/10</p>
               </div>
               <div className="text-right max-w-md hidden md:block">
                 <p className="italic text-sm text-slate-300">"{missionData.introText}"</p>
               </div>
             </div>
             
             {/* RENDER THE CORRECT CANVAS BASED ON MODE */}
             {isStoryMode ? (
                 <StoryGameCanvas 
                    missionData={missionData}
                    ninjaElement={ninjaElement}
                    onGameOver={handleGameOver}
                    onDamage={handleDamage}
                    hearts={hearts}
                    unlockAirjitzu={unlockAirjitzu}
                    unlockRisingDragon={unlockRisingDragon}
                    unlockElementalDragon={unlockElementalDragon}
                 />
             ) : (
                 <GameCanvas 
                    missionData={missionData} 
                    ninjaElement={ninjaElement} 
                    onGameOver={(s) => handleGameOver(s)} 
                 />
             )}
          </div>
        )}

        {/* --- GAME OVER --- */}
        {gameState === GameState.GAME_OVER && (
          <div className="text-center bg-slate-800/95 backdrop-blur p-8 rounded-lg border-4 border-red-900 shadow-2xl max-w-md w-full">
            <h2 className="text-4xl text-red-500 mb-4 ninja-font">
                {hearts > 0 ? "Mission Complete!" : "Mission Failed!"}
            </h2>
            <p className="text-white text-xl mb-6">
                {hearts > 0 ? "The Realm is safe... for now." : "You stumbled, but a ninja always gets back up."}
            </p>
            
            <div className="bg-slate-900/50 p-4 rounded-lg mb-8">
              {!isStoryMode && <div className="text-slate-400 text-sm uppercase font-bold tracking-wider">Distance Reached</div>}
              {!isStoryMode && <div className="text-5xl font-bold text-white mb-2">{lastScore}m</div>}
              
              <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400">
                <span className="text-xl font-bold">+{earnedPointsInRun} Ninja Points</span>
                {earnedPointsInRun > 0 && (
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">Total: {totalNinjaPoints} Points</div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={resetGame}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg transition transform hover:scale-105 ninja-font"
              >
                Return to Menu
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Dev Mode Modal Overlay */}
      {showDevModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <div className="bg-slate-800 border-2 border-red-500 p-6 rounded-lg w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                <h3 className="text-xl text-red-500 ninja-font mb-4 text-center tracking-widest">Developer Access</h3>
                <form onSubmit={submitDevPassword} className="flex flex-col gap-4">
                    <input 
                        type="password" 
                        value={devPasswordInput}
                        onChange={(e) => setDevPasswordInput(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full p-3 bg-slate-900 border border-slate-600 rounded text-white focus:border-red-500 outline-none transition-colors text-center font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                        autoFocus
                    />
                    <div className="flex gap-3 mt-2">
                            <button type="button" onClick={closeDevModal} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold uppercase text-sm transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded text-white font-bold uppercase text-sm transition-colors shadow-lg shadow-red-900/50">Unlock</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;