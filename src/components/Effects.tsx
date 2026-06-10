import React from 'react';
import { CaughtEffect, NetSplash } from '../types';

interface EffectsProps {
  caughtEffects: CaughtEffect[];
  netSplashes: NetSplash[];
}

export const Effects: React.FC<EffectsProps> = ({ caughtEffects, netSplashes }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30 select-none">
      
      {/* 1. Net Catch Splash Circle (網を向けたエフェクト) */}
      {netSplashes.map((splash) => (
        <div
          key={splash.id}
          className="absolute rounded-full border-2 border-dashed border-cyan-300/80 bg-cyan-400/10 flex items-center justify-center transition-all duration-300 ease-out origin-center"
          style={{
            left: `${splash.x}%`,
            top: `${splash.y}%`,
            width: `${splash.size}px`,
            height: `${splash.size}px`,
            transform: 'translate(-50%, -50%) scale(1.1)',
            animation: 'netExpand 0.25s ease-out forwards',
          }}
        >
          {/* Circular crosshairs to look like a net mesh pattern */}
          <div className="absolute inset-2 rounded-full border border-cyan-200/30 grid grid-cols-3 grid-rows-3 opacity-60">
            <div className="border-r border-b border-cyan-200/20" />
            <div className="border-r border-b border-cyan-200/20" />
            <div className="border-b border-cyan-200/20" />
            <div className="border-r border-b border-cyan-200/20" />
            <div className="border-r border-b border-cyan-200/20" />
            <div className="border-b border-cyan-200/20" />
            <div className="border-r border-cyan-200/20" />
            <div className="border-r border-cyan-200/20" />
            <div className="current" />
          </div>

          {/* Radial net lines */}
          <div className="absolute w-[100%] h-[1px] bg-cyan-300/20 transform rotate-45" />
          <div className="absolute w-[100%] h-[1px] bg-cyan-300/20 transform -rotate-45" />
        </div>
      ))}

      {/* 2. Floating floating points score tags */}
      {caughtEffects.map((effect) => {
        const isNegative = effect.points < 0;
        return (
          <div
            key={effect.id}
            className="absolute flex flex-col items-center justify-center font-bold filter drop-shadow animate-float-fade"
            style={{
              left: `${effect.x}%`,
              top: `${effect.y}%`,
              transform: 'translate(-50%, -100%)',
              animation: 'floatAndFade 1.1s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            }}
          >
            {/* Captured Fish emoji fly */}
            <span className="text-2xl mb-1 animate-bounce" style={{ animationDuration: '0.4s' }}>
              {effect.emoji}
            </span>

            {/* floating points indicator */}
            <span
              className={`text-xl md:text-2xl font-black px-2 py-0.5 rounded-full border ${
                isNegative
                  ? 'bg-rose-950/85 text-rose-400 border-rose-500/50'
                  : effect.points >= 50
                  ? 'bg-amber-950/85 text-amber-300 border-amber-400/50 scale-110'
                  : 'bg-teal-950/85 text-teal-300 border-teal-400/50'
              }`}
            >
              {effect.points >= 0 ? `+${effect.points}` : effect.points}
              {effect.label && (
                <span className="text-[10px] block py-0.5 leading-none font-medium text-center">
                  {effect.label}
                </span>
              )}
            </span>
          </div>
        );
      })}

      {/* Custom localized style tag for inline animations strictly for these effects */}
      <style>{`
        @keyframes netExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.15);
            opacity: 0;
          }
        }
        @keyframes floatAndFade {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          15% {
            transform: translate(-50%, -80%) scale(1.1);
            opacity: 1;
          }
          30% {
            transform: translate(-50%, -100%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -220%) scale(0.85);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
