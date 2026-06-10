import React from 'react';

interface SeaweedProps {
  heightClass: string;
  delayClass: string;
  leftPercent: number;
  colorClass: string;
}

export const Seaweed: React.FC<SeaweedProps> = ({ heightClass, delayClass, leftPercent, colorClass }) => {
  return (
    <div
      className={`absolute bottom-0 pointer-events-none select-none flex flex-col items-center origin-bottom animate-sway`}
      style={{
        left: `${leftPercent}%`,
        animationDelay: delayClass,
        animationDuration: '4s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      }}
    >
      {/* Sinuous seaweed sections */}
      <div className={`w-4 ${heightClass} ${colorClass} rounded-t-full relative filter blur-[0.5px]`}>
        {/* Leaves */}
        <div className={`absolute -left-2 top-1/4 w-3 h-6 ${colorClass} rounded-tl-full rounded-br-full rotate-45 origin-right`} />
        <div className={`absolute -right-2 top-1/2 w-3 h-6 ${colorClass} rounded-tr-full rounded-bl-full -rotate-45 origin-left`} />
        <div className={`absolute -left-2 top-3/4 w-3 h-6 ${colorClass} rounded-tl-full rounded-br-full rotate-45 origin-right`} />
      </div>
    </div>
  );
};

// Add standard sway animation
export const SeaweedContainer: React.FC = () => {
  const seaweeds = [
    { heightClass: 'h-48 md:h-64', delayClass: '0s', leftPercent: 5, colorClass: 'bg-emerald-700/40' },
    { heightClass: 'h-32 md:h-44', delayClass: '1s', leftPercent: 8, colorClass: 'bg-teal-600/30' },
    { heightClass: 'h-56 md:h-72', delayClass: '0.5s', leftPercent: 18, colorClass: 'bg-emerald-600/40' },
    { heightClass: 'h-40 md:h-52', delayClass: '1.5s', leftPercent: 25, colorClass: 'bg-cyan-700/30' },
    { heightClass: 'h-64 md:h-80', delayClass: '2.2s', leftPercent: 78, colorClass: 'bg-emerald-700/40' },
    { heightClass: 'h-44 md:h-56', delayClass: '0.8s', leftPercent: 84, colorClass: 'bg-teal-600/40' },
    { heightClass: 'h-52 md:h-68', delayClass: '1.8s', leftPercent: 92, colorClass: 'bg-emerald-600/30' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
      {seaweeds.map((sw, idx) => (
        <Seaweed
          key={idx}
          heightClass={sw.heightClass}
          delayClass={sw.delayClass}
          leftPercent={sw.leftPercent}
          colorClass={sw.colorClass}
        />
      ))}
      
      {/* Floating background bubbles */}
      <div className="absolute inset-0 z-0">
        {[...Array(12)].map((_, idx) => {
          const delay = idx * 1.2;
          const left = 10 + (idx * 8.5) % 80;
          const size = 6 + (idx * 3) % 16;
          return (
            <div
              key={idx}
              className="absolute bottom-0 bg-white/10 rounded-full animate-bubble"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${8 + (idx % 4) * 2}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
