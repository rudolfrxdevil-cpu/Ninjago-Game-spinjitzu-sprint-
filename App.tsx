import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import MissionBriefing from './components/MissionBriefing';
import { GameState, MissionData, NinjaElement } from './types';
import { generateMission } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [ninjaElement, setNinjaElement] = useState<NinjaElement>(NinjaElement.ENERGY);
  
  // Scoring & Progression
  const [lastScore, setLastScore] = useState(0);
  const [earnedPointsInRun, setEarnedPointsInRun] = useState(0);
  const [totalNinjaPoints, setTotalNinjaPoints] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);

  // Load points from local storage on mount
  useEffect(() => {
    const savedPoints = localStorage.getItem('ninjaPoints');
    if (savedPoints) {
      setTotalNinjaPoints(parseInt(savedPoints, 10));
    }
  }, []);

  const handleStartMission = async (name: string, element: NinjaElement) => {
    setNinjaElement(element);
    setIsLoading(true);
    setGameState(GameState.LOADING_MISSION);
    
    try {
      const data = await generateMission(name, element);
      setMissionData(data);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error("Failed to start mission", error);
      // Fallback
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
    setGameState(GameState.TRAINING_SETUP);
    setMissionData(null);
  };
  
  const goToMainMenu = () => {
    setGameState(GameState.START_MENU);
    setMissionData(null);
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
              
              {isFullPotentialUnlocked && (
                <div className="mt-2 text-center text-xs text-yellow-300 font-bold uppercase tracking-widest animate-bounce">
                  ⚠ Secret Technique Available (Coming Soon) ⚠
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-stretch w-full">
              {/* Training Mode Card */}
              <button 
                onClick={() => setGameState(GameState.TRAINING_SETUP)}
                className="flex-1 bg-slate-800/90 border-4 border-yellow-500 hover:border-yellow-400 p-8 rounded-xl shadow-2xl transition-all hover:scale-105 group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div className="w-24 h-24 bg-yellow-500 rounded-full blur-2xl"></div>
                </div>
                <h2 className="text-3xl text-yellow-500 ninja-font mb-4">Training Mode</h2>
                <p className="text-slate-300 mb-6">
                  Endless procedural challenges generated by Master Wu. Earn 1 Ninja Point for every 100m.
                </p>
                <div className="inline-block px-4 py-2 bg-yellow-600 text-slate-900 font-bold rounded uppercase text-sm">
                  Enter Dojo
                </div>
              </button>

              {/* Story Mode Card */}
              <button 
                onClick={() => setGameState(GameState.STORY_MODE)}
                className="flex-1 bg-slate-800/90 border-4 border-slate-600 hover:border-slate-500 p-8 rounded-xl shadow-2xl transition-all hover:scale-105 group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <div className="w-24 h-24 bg-red-500 rounded-full blur-2xl"></div>
                </div>
                <h2 className="text-3xl text-slate-400 group-hover:text-red-400 transition-colors ninja-font mb-4">Story Mode</h2>
                <p className="text-slate-400 mb-6">
                  Embark on an epic quest to save Ninjago City from the Overlord.
                </p>
                <div className="inline-block px-4 py-2 bg-slate-700 text-slate-400 font-bold rounded uppercase text-sm border border-slate-600">
                  Coming Soon
                </div>
              </button>
            </div>
          </div>
        )}

        {/* --- STORY MODE PLACEHOLDER --- */}
        {gameState === GameState.STORY_MODE && (
           <div className="text-center bg-slate-800/95 backdrop-blur p-12 rounded-lg border-4 border-slate-600 shadow-2xl max-w-2xl w-full">
             <h2 className="text-4xl text-slate-300 mb-4 ninja-font">Story Mode</h2>
             <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
             <p className="text-white text-xl mb-8 leading-relaxed">
               The scrolls for this adventure are still being written. Master Wu is meditating on the plot twists.
               <br/><br/>
               <span className="text-slate-400 text-sm">Check back in a future update!</span>
             </p>
             <button 
               onClick={goToMainMenu}
               className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded shadow-lg transition transform hover:scale-105"
             >
               Back to Menu
             </button>
           </div>
        )}

        {/* --- TRAINING SETUP (Was MENU) --- */}
        {gameState === GameState.TRAINING_SETUP && (
          <div className="w-full flex flex-col items-center">
            <MissionBriefing onStartMission={handleStartMission} isLoading={false} />
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
                Train Again
              </button>
              <button 
                onClick={goToMainMenu}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded shadow-lg transition transform hover:scale-105"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;