import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MissionBriefing from './components/MissionBriefing';
import { GameState, MissionData, NinjaElement, Realm } from './types';
import { generateMission } from './services/geminiService';
import { soundManager } from './utils/sound';
import { REALM_INFO, ENVIRONMENT_COLORS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [ninjaElement, setNinjaElement] = useState<NinjaElement>(NinjaElement.ENERGY);
  
  // Scoring & Progression
  const [lastScore, setLastScore] = useState(0);
  const [earnedPointsInRun, setEarnedPointsInRun] = useState(0);
  const [totalNinjaPoints, setTotalNinjaPoints] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // Load points from local storage on mount
  useEffect(() => {
    const savedPoints = localStorage.getItem('ninjaPoints');
    if (savedPoints) {
      setTotalNinjaPoints(parseInt(savedPoints, 10));
    }
  }, []);

  const handleStartMission = async (name: string, element: NinjaElement, realm?: Realm) => {
    soundManager.playClick();
    setNinjaElement(element);
    setIsLoading(true);
    setGameState(GameState.LOADING_MISSION);
    
    try {
      const data = await generateMission(name, element, realm);
      setMissionData(data);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error("Failed to start mission", error);
      setGameState(GameState.TRAINING_SETUP);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    
    // Calculate Ninja Points (1 per 100 score)
    const newPoints = Math.floor(score / 100);
    setEarnedPointsInRun(newPoints);
    
    const newTotal = totalNinjaPoints + newPoints;
    setTotalNinjaPoints(newTotal);
    localStorage.setItem('ninjaPoints', newTotal.toString());

    setGameState(GameState.GAME_OVER);
  };

  const resetGame = () => {
    soundManager.playClick();
    // Return to the appropriate menu based on previous mode? For simplicity, go to Training setup or Main Menu
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

  const isFullPotentialUnlocked = totalNinjaPoints >= 15;
  const progressPercent = Math.min((totalNinjaPoints / 15) * 100, 100);

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
        <p className="text-slate-200 mb-8 tracking-widest uppercase text-sm font-bold drop-shadow-md">A Gemini Powered Ninja Training</p>

        {/* --- START MENU --- */}
        {gameState === GameState.START_MENU && (
          <div className="w-full max-w-4xl flex flex-col gap-6">
            
            {/* Ninja Status Bar */}
            <div className="bg-slate-800/90 border-2 border-slate-600 p-6 rounded-xl shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between items-center mb-2">
                <h3 className="text-xl text-yellow-500 ninja-font">Ninja Status</h3>
                <div className="text-white font-bold text-lg">
                  {totalNinjaPoints} Ninja Points
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-6 rounded-full border border-slate-700 overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-1000 ${isFullPotentialUnlocked ? 'bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse' : 'bg-green-500'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-black drop-shadow-md">
                   {isFullPotentialUnlocked ? 'TRUE POTENTIAL UNLOCKED' : `${totalNinjaPoints} / 15 to True Potential`}
                </div>
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
                  Endless procedural challenges. Earn Ninja Points to unlock Story Mode.
                </p>
                <div className="inline-block px-4 py-2 bg-yellow-600 text-slate-900 font-bold rounded uppercase text-sm">
                  Enter Dojo
                </div>
              </button>

              {/* Story Mode Card */}
              <button 
                onClick={() => {
                  if (isFullPotentialUnlocked) {
                    soundManager.playClick();
                    setGameState(GameState.REALM_SELECT);
                  } else {
                    soundManager.playCrash(); // Locked sound effect
                  }
                }}
                disabled={!isFullPotentialUnlocked}
                className={`flex-1 bg-slate-800/90 border-4 p-8 rounded-xl shadow-2xl transition-all group text-left relative overflow-hidden
                  ${isFullPotentialUnlocked 
                    ? 'border-purple-500 hover:border-purple-400 hover:scale-105 cursor-pointer' 
                    : 'border-slate-700 opacity-75 grayscale cursor-not-allowed'}
                `}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className={`w-24 h-24 rounded-full blur-2xl ${isFullPotentialUnlocked ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                </div>
                
                {!isFullPotentialUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
                        <div className="bg-slate-900 border-2 border-red-500 px-4 py-2 rounded shadow-lg text-red-500 font-bold ninja-font text-xl transform -rotate-12">
                            LOCKED
                        </div>
                    </div>
                )}

                <h2 className={`text-3xl ninja-font mb-4 ${isFullPotentialUnlocked ? 'text-purple-400 group-hover:text-purple-300' : 'text-slate-500'}`}>
                    Story Mode
                </h2>
                <p className="text-slate-400 mb-6">
                  Travel to the 16 Realms. Fight ghosts, pirates, and dragons in epic locations.
                </p>
                <div className={`inline-block px-4 py-2 font-bold rounded uppercase text-sm border 
                    ${isFullPotentialUnlocked ? 'bg-purple-700 text-purple-100 border-purple-600' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                  {isFullPotentialUnlocked ? 'Select Realm' : 'Unlock at 15 Points'}
                </div>
              </button>
            </div>
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
             <GameCanvas 
               missionData={missionData} 
               ninjaElement={ninjaElement} 
               onGameOver={handleGameOver} 
             />
          </div>
        )}

        {/* --- GAME OVER --- */}
        {gameState === GameState.GAME_OVER && (
          <div className="text-center bg-slate-800/95 backdrop-blur p-8 rounded-lg border-4 border-red-900 shadow-2xl max-w-md w-full">
            <h2 className="text-4xl text-red-500 mb-4 ninja-font">Mission Failed!</h2>
            <p className="text-white text-xl mb-6">You stumbled, but a ninja always gets back up.</p>
            
            <div className="bg-slate-900/50 p-4 rounded-lg mb-8">
              <div className="text-slate-400 text-sm uppercase font-bold tracking-wider">Distance Reached</div>
              <div className="text-5xl font-bold text-white mb-2">{lastScore}m</div>
              
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
    </div>
  );
};

export default App;