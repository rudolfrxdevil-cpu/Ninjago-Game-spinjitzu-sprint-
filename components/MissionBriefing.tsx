import React, { useState } from 'react';
import { NinjaElement } from '../types';
import { ELEMENT_COLORS } from '../constants';

interface MissionBriefingProps {
  onStartMission: (name: string, element: NinjaElement) => void;
  isLoading: boolean;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ onStartMission, isLoading }) => {
  const [name, setName] = useState('Lloyd');
  const [selectedElement, setSelectedElement] = useState<NinjaElement>(NinjaElement.ENERGY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStartMission(name, selectedElement);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-2xl mx-auto p-8 bg-amber-100 rounded-lg shadow-2xl border-4 border-amber-800 relative overflow-hidden">
      {/* Decorative Texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>
      
      <div className="relative z-10 w-full text-center">
        <h2 className="text-4xl text-amber-900 mb-6 ninja-font tracking-wider">Mission Briefing</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="text-2xl text-amber-800 mb-4 font-bold">Consulting the Scrolls...</div>
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-amber-700 italic">"Patience is the true key to unlocking potential." - Master Wu</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-amber-900 font-bold mb-2">Ninja Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded focus:outline-none focus:border-amber-600 text-amber-900 font-bold placeholder-amber-300 transition-colors"
                placeholder="Enter your name..."
                required
              />
            </div>

            <div className="text-left">
              <label className="block text-amber-900 font-bold mb-2">Select Element</label>
              <div className="grid grid-cols-5 gap-2">
                {Object.values(NinjaElement).map((elem) => (
                  <button
                    key={elem}
                    type="button"
                    onClick={() => setSelectedElement(elem)}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all transform hover:scale-105
                      ${selectedElement === elem ? 'ring-4 ring-offset-2 ring-amber-500 scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'}
                    `}
                    style={{ backgroundColor: ELEMENT_COLORS[elem], color: elem === NinjaElement.ICE ? '#000' : '#FFF' }}
                    title={elem}
                  >
                    {elem[0]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-amber-700 font-medium">
                Current Element: <span style={{ color: ELEMENT_COLORS[selectedElement] }} className="drop-shadow-sm font-bold">{selectedElement}</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded shadow-lg transform transition active:scale-95 ninja-font tracking-wide border-b-4 border-red-800"
            >
              Start Training
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MissionBriefing;
