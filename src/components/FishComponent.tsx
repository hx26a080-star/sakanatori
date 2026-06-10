import React, { useMemo } from 'react';
import { Fish } from '../types';

interface FishComponentProps {
  fish: Fish;
  onClick: (id: string, event: React.MouseEvent) => void;
}

export const FishComponent: React.FC<FishComponentProps> = ({ fish, onClick }) => {
  const {
    id,
    type,
    name,
    emoji,
    color,
    direction,
    x,
    y,
    width,
    height,
    isCaught,
    clicksRequired,
    clicksRemaining,
    pufferState,
    points,
  } = fish;

  // Determine horizontal flip based on swimming direction
  const isL2R = direction === 'L2R';
  // Flipped styles depending on direction
  const flipStyle = isL2R ? 'scale-x-[-1]' : 'scale-x-[1]';

  // Specific state tags for rendering
  const isPuffed = pufferState === 'puffed' || pufferState === 'inflating';

  // Highlight rings and danger borders for specific fish types
  const borderStyles = useMemo(() => {
    switch (type) {
      case 'golden':
        return 'ring-4 ring-yellow-400/80 bg-gradient-to-r from-yellow-300 to-yellow-600 shadow-xl shadow-yellow-400/30 text-white';
      case 'big':
        return 'ring-4 ring-blue-500/80 bg-gradient-to-r from-cyan-500 to-blue-700 shadow-lg shadow-blue-500/30 text-white';
      case 'fast':
        return 'ring-2 ring-teal-400/60 bg-gradient-to-r from-cyan-400 to-blue-600 shadow-md shadow-cyan-500/20 text-white';
      case 'puffer':
        if (isPuffed) {
          return 'ring-4 ring-rose-500/80 bg-gradient-to-r from-red-500 to-rose-700 shadow-lg shadow-rose-500/40 text-white';
        }
        return 'ring-1 ring-amber-400/40 bg-gradient-to-r from-amber-500/30 to-orange-600/35 text-white';
      case 'jelly':
        return 'ring-3 ring-purple-400/80 bg-gradient-to-r from-purple-500/30 to-indigo-700/40 shadow-lg shadow-purple-500/20 text-white';
      default: // normal
        return 'ring-2 ring-cyan-300/40 bg-gradient-to-r from-orange-400 to-red-500 shadow-lg shadow-orange-500/20 text-white';
    }
  }, [type, isPuffed]);

  // Click requirement indicator for big tuna
  const renderHealthBar = () => {
    if (clicksRequired <= 1 || isCaught) return null;
    const percentage = (clicksRemaining / clicksRequired) * 100;
    return (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-900/80 rounded-full overflow-hidden border border-white/20 select-none pointer-events-none">
        <div
          className="h-full bg-cyan-400 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  // Warning text/state label above special fish
  const renderSpecialLabel = () => {
    if (isCaught) return null;
    if (type === 'golden') {
      return (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold text-sky-950 bg-amber-400 uppercase tracking-widest select-none pointer-events-none animate-bounce shadow">
          レア！
        </span>
      );
    }
    if (type === 'puffer') {
      if (pufferState === 'inflating') {
        return (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-amber-500 uppercase select-none pointer-events-none animate-pulse">
            ふくらみ中
          </span>
        );
      }
      if (pufferState === 'puffed') {
        return (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-rose-600 uppercase select-none pointer-events-none animate-bounce shadow">
            危険！爆発
          </span>
        );
      }
    }
    if (type === 'jelly') {
      return (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold text-purple-200 bg-purple-800 uppercase select-none pointer-events-none tracking-wide">
          感電注意！
        </span>
      );
    }
    return null;
  };

  if (isCaught) return null;

  return (
    <div
      id={`fish-${id}`}
      className="absolute transition-transform duration-75 select-none touch-none cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(-50%, -50%)`,
        zIndex: type === 'golden' ? 20 : type === 'big' ? 15 : 10,
      }}
      onClick={(e) => onClick(id, e)}
    >
      {/* Special notifications/warning labels */}
      {renderSpecialLabel()}
      
      {/* Click hp scale for big boss fish */}
      {renderHealthBar()}

      {/* Main Fish Body Outer Wrapper */}
      <div
        className={`w-full h-full rounded-full flex items-center justify-center relative transition-transform duration-200 ${borderStyles} ${
          isPuffed ? 'scale-125' : 'scale-100'
        } hover:scale-105 active:scale-95`}
      >
        {/* Tail fin wiggling wrapper */}
        <div className="absolute inset-0 flex items-center justify-center">
          
          {/* Fish Emoji / Illustration Container */}
          <div
            className={`text-center relative select-none pointer-events-none transition-all ${flipStyle}`}
            style={{
              fontSize: `${Math.min(width, height) * 0.7}px`,
              lineHeight: 1,
            }}
          >
            {/* The main fish sprite */}
            <span
              className={`inline-block ${
                !isCaught ? 'animate-swim-wiggle' : ''
              }`}
              style={{
                filter: type === 'golden' ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9))' : 'none',
                animationDuration: type === 'fast' ? '0.2s' : type === 'big' ? '0.6s' : '0.4s',
              }}
            >
              {emoji}
            </span>

            {/* Electric spark overlays for Jellyfish or Puffer spikes */}
            {type === 'jelly' && (
              <span className="absolute -inset-2 rounded-full border border-purple-400 opacity-60 animate-ping pointer-events-none" />
            )}

            {/* Spikes hint for puffy pufferfish */}
            {type === 'puffer' && isPuffed && (
              <span className="absolute text-rose-500 font-bold text-lg -top-2 -left-2 animate-pulse select-none opacity-90">
                ⚡
              </span>
            )}
          </div>
        </div>

        {/* Small detail indicator: name popup on hover */}
        <div className="opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] absolute -bottom-6 px-1 rounded whitespace-nowrap pointer-events-none">
          {name} ({type === 'big' ? `${clicksRemaining}打` : `${points}点`})
        </div>
      </div>
    </div>
  );
};
