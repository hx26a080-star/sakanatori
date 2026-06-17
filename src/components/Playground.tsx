import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Fish, FishType, CaughtEffect, NetSplash, GameStats, Difficulty, GameState } from '../types';
import { FishComponent } from './FishComponent';
import { Effects } from './Effects';
import { SeaweedContainer } from './Seaweed';
import { sound } from '../utils/audio';
import { Play, Pause, Trophy, Volume2, VolumeX, ShieldAlert, Sparkles, AlertTriangle, ArrowRight, Clock, Award } from 'lucide-react';

interface PlaygroundProps {
  difficulty: Difficulty;
  timeLimit: number; // in seconds
  onGameOver: (stats: GameStats) => void;
  onExit: () => void;
}

// Initial stats helper
const createEmptyStats = (high: number): GameStats => ({
  score: 0,
  highScore: high,
  caughtCount: { normal: 0, fast: 0, big: 0, golden: 0, puffer: 0, jelly: 0 },
  totalCaught: 0,
  maxCombo: 0,
  pufferExplodes: 0,
  jellyShocks: 0,
  missCount: 0,
});

export const Playground: React.FC<PlaygroundProps> = ({ difficulty, timeLimit, onGameOver, onExit }) => {
  // Game states
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [peakCombo, setPeakCombo] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [highScore, setHighScore] = useState<number>(0);

  // Lists for entities and effects
  const [fishList, setFishList] = useState<Fish[]>([]);
  const [caughtEffects, setCaughtEffects] = useState<CaughtEffect[]>([]);
  const [netSplashes, setNetSplashes] = useState<NetSplash[]>([]);

  // Mouse interaction coordinates for the custom net cursor (percentage of arena container)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPointerInArena, setIsPointerInArena] = useState<boolean>(false);
  const [isSwingActive, setIsSwingActive] = useState<boolean>(false);

  // Net freeze / electro-shock state
  const [isShocked, setIsShocked] = useState<boolean>(false);
  const [shockTimeRemaining, setShockTimeRemaining] = useState<number>(0);

  // Screen shake effect for puffer explosion
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);

  // Statistics for badges system
  const [caughtCount, setCaughtCount] = useState<Record<FishType, number>>({
    normal: 0,
    fast: 0,
    big: 0,
    golden: 0,
    puffer: 0,
    jelly: 0,
  });
  const [pufferExplodes, setPufferExplodes] = useState<number>(0);
  const [jellyShocks, setJellyShocks] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);

  const arenaRef = useRef<HTMLDivElement>(null);
  const nextFishIdRef = useRef<number>(1);
  const animationFrameId = useRef<number | null>(null);
  const lastStateRef = useRef({ gameState, isShocked });

  // Update refs to read latest values inside the game loop without re-triggering effects
  useEffect(() => {
    lastStateRef.current = { gameState, isShocked };
  }, [gameState, isShocked]);

  // Load High Score from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`fish_game_highscore_${difficulty}`);
      if (stored) {
        setHighScore(parseInt(stored, 10));
      }
    } catch (e) {
      console.error(e);
    }
  }, [difficulty]);

  // Handle Mute changes
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMute(nextMute);
  };

  // Convert mouse pixels to percentage relative to Play Arena container
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arenaRef.current || lastStateRef.current.gameState !== 'playing') return;
    const rect = arenaRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({
      x: Math.max(0, Math.min(100, px)),
      y: Math.max(0, Math.min(100, py)),
    });
    setIsPointerInArena(true);
  };

  const handlePointerLeave = () => {
    setIsPointerInArena(false);
  };

  // Create caught points popups
  const triggerCaughtEffect = useCallback((x: number, y: number, points: number, emoji: string, label: string = '') => {
    const id = `effect-${Date.now()}-${Math.random()}`;
    setCaughtEffects((prev) => [...prev, { id, x, y, points, emoji, label }]);
    setTimeout(() => {
      setCaughtEffects((prev) => prev.filter((eff) => eff.id !== id));
    }, 1100);
  }, []);

  // Set net swing effects
  const triggerNetSplash = useCallback((x: number, y: number) => {
    const id = `splash-${Date.now()}-${Math.random()}`;
    setNetSplashes((prev) => [...prev, { id, x, y, size: 100 }]);
    setTimeout(() => {
      setNetSplashes((prev) => prev.filter((sp) => sp.id !== id));
    }, 300);
  }, []);

  // Reset combo counter with subtle visual cues
  const resetCombo = useCallback(() => {
    if (combo > 0) {
      sound.playBuzz();
      setCombo(0);
    }
  }, [combo]);

  // Catch operations
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    
    // If player is shocked, clicking is blocked!
    if (isShocked) {
      sound.playBuzz();
      return;
    }

    if (!arenaRef.current) return;
    
    // Calculate click coordinates in percentage
    const rect = arenaRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Trigger physical swing visual & audio
    sound.playSwoosh();
    setIsSwingActive(true);
    setTimeout(() => setIsSwingActive(false), 200);
    triggerNetSplash(clickX, clickY);

    // Collision detection radius (e.g. within 60px of screen coordinates, translated to roughly 8-10% of container)
    // We check absolute distance in pixels for realistic proportions regardless of screen scale
    const collisionRadiusPx = 65; 

    setFishList((prevFish) => {
      let isAnyFishHit = false;
      const nextList = prevFish.map((fish) => {
        if (fish.isCaught || fish.isEscaped) return fish;

        // Calculate actual positions in pixels
        const arenaWidth = rect.width;
        const arenaHeight = rect.height;

        const fishPixelX = (fish.x / 100) * arenaWidth;
        const fishPixelY = (fish.y / 100) * arenaHeight;
        const clickPixelX = (clickX / 100) * arenaWidth;
        const clickPixelY = (clickY / 100) * arenaHeight;

        const dist = Math.hypot(fishPixelX - clickPixelX, fishPixelY - clickPixelY);

        if (dist <= collisionRadiusPx) {
          isAnyFishHit = true;
          
          // Action depending on fish type
          if (fish.type === 'puffer') {
            // Pufferfish explosion if clicked in puffed state
            if (fish.pufferState === 'puffed') {
              sound.playExplosion();
              setShakeScreen(true);
              setTimeout(() => setShakeScreen(false), 500);
              triggerCaughtEffect(fish.x, fish.y, -25, '💥', '爆発！減点');
              setScore((prev) => Math.max(0, prev - 25));
              resetCombo();
              setPufferExplodes((prev) => prev + 1);
              
              // Increment puffer explosion statistics
              try {
                const currentExplodes = parseInt(localStorage.getItem('fish_game_stats_puffer') || '0', 10);
                localStorage.setItem('fish_game_stats_puffer', (currentExplodes + 1).toString());
              } catch (_) {}

              return { ...fish, isCaught: true }; // puffer exploded, goes away
            }
          }

          if (fish.type === 'jelly') {
            // Jellyfish electro-shocks the player net
            sound.playShock();
            setIsShocked(true);
            setShockTimeRemaining(1.5); // Net frozen for 1.5s
            setJellyShocks((prev) => prev + 1);
            triggerCaughtEffect(fish.x, fish.y, -15, '⚡', 'しびれた！');
            setScore((prev) => Math.max(0, prev - 15));
            resetCombo();
            return { ...fish, isCaught: true };
          }

          // Regular fish click handler
          const nextRemaining = fish.clicksRemaining - 1;
          if (nextRemaining <= 0) {
            // Fish CAUGHT!
            const isRare = fish.type === 'golden' || fish.type === 'big';
            if (isRare) {
              sound.playRareCatch();
            } else {
              sound.playCatch();
            }

            setCaughtCount((prev) => ({
              ...prev,
              [fish.type]: prev[fish.type] + 1,
            }));

            // Calculate combo bonuses
            const comboMultiplier = 1 + Math.floor(combo / 5) * 0.1; // +10% score bonus every 5 combo
            const pointEarned = Math.round(fish.points * comboMultiplier);
            const comboTag = combo >= 5 ? `Combo x${1 + Math.floor(combo / 5) * 0.1}` : '';

            triggerCaughtEffect(fish.x, fish.y, pointEarned, fish.emoji, comboTag);
            
            setScore((prev) => prev + pointEarned);
            setCombo((prev) => {
              const nextVal = prev + 1;
              if (nextVal > peakCombo) setPeakCombo(nextVal);
              return nextVal;
            });

            // Increment specific local stats counters safely in background
            try {
              const currentCaught = parseInt(localStorage.getItem(`fish_game_count_${fish.type}`) || '0', 10);
              localStorage.setItem(`fish_game_count_${fish.type}`, (currentCaught + 1).toString());
            } catch (_) {}

            return { ...fish, isCaught: true, clicksRemaining: 0 };
          } else {
            // Big fish clicked but needs more hits
            sound.playCatch(); // shorter clip
            return { ...fish, clicksRemaining: nextRemaining };
          }
        }
        return fish;
      });

      // If clicked but missed all fish, reset combo (makes the game challenging!)
      if (!isAnyFishHit) {
        resetCombo();
        setMissCount((prev) => prev + 1);
      }

      return nextList;
    });
  };

  // External click handler strictly on fish itself
  const handleFishClick = (id: string, event: React.MouseEvent) => {
    // Rely primarily on arena click coordinate mapping so clicking anywhere near work natively
    // We prevent propagation to avoid duplicates
    event.stopPropagation();
    // Simulate clicking at this point
    if (gameState !== 'playing') return;
    handleArenaClick(event as any);
  };

  // Spawn fish generator depending on selected difficulty
  const spawnFish = useCallback(() => {
    if (gameState !== 'playing') return;

    // Different lists of fish templates based on difficulty
    const spawnPool: { type: FishType; name: string; emoji: string; color: string; points: number; speed: number; clicks: number }[] = [
      { type: 'normal', name: 'クマノミ', emoji: '🐠', color: 'indigo', points: 10, speed: 0.6, clicks: 1 },
      { type: 'normal', name: 'イワシ', emoji: '🐟', color: 'sky', points: 10, speed: 0.7, clicks: 1 },
    ];

    if (difficulty === 'normal' || difficulty === 'hard') {
      spawnPool.push(
        { type: 'fast', name: 'イカ', emoji: ' squid 🦑', points: 25, color: 'emerald', speed: 1.4, clicks: 1 },
        { type: 'big', name: 'ホホジロサメ', emoji: '🦈', points: 50, color: 'blue', speed: 0.35, clicks: 3 },
      );
    } else {
      // Easy has simple values
      spawnPool.push({ type: 'fast', name: 'トビウオ', emoji: '🐟', points: 15, color: 'cyan', speed: 1.1, clicks: 1 });
    }

    // Include hazards in Normal and Hard modes
    if (difficulty === 'normal') {
      spawnPool.push(
        { type: 'puffer', name: 'ハリセンボン', emoji: '🐡', color: 'amber', points: 20, speed: 0.45, clicks: 1 },
      );
    } else if (difficulty === 'hard') {
      spawnPool.push(
        { type: 'puffer', name: 'ドクトゲフグ', emoji: '🐡', color: 'rose', points: 20, speed: 0.5, clicks: 1 },
        { type: 'jelly', name: 'シビレクラゲ', emoji: '🐙', color: 'purple', points: 15, speed: 0.4, clicks: 1 }, // squid-colored jelly
      );
    }

    // Low probability rare Golden Fish (Golden Koi / Whale )
    const goldenChance = difficulty === 'hard' ? 0.08 : difficulty === 'normal' ? 0.05 : 0.03;
    if (Math.random() < goldenChance) {
      spawnPool.push({ type: 'golden', name: '黄金ウオ', emoji: '✨', color: 'yellow', points: 100, speed: 1.8, clicks: 1 });
    }

    // Choose randomly from our filtered target pool
    const template = spawnPool[Math.floor(Math.random() * spawnPool.length)];

    // Randomize initial spawning side
    const direction = Math.random() < 0.5 ? 'L2R' : 'R2L';
    const initialX = direction === 'L2R' ? -10 : 110;
    const initialY = 15 + Math.random() * 70; // 15% to 85% to stay clear of headers/footers

    // Add slight variance to speeds
    const speedMultiplier = 0.8 + Math.random() * 0.4;
    const speed = template.speed * speedMultiplier * (difficulty === 'hard' ? 1.3 : difficulty === 'easy' ? 0.8 : 1.0);

    // Swimming patterns
    const swimPatterns: ('linear' | 'wave' | 'jerk')[] = ['linear', 'wave'];
    const swimPatter = template.type === 'golden' ? 'jerk' : swimPatterns[Math.floor(Math.random() * swimPatterns.length)];

    const newFish: Fish = {
      id: `fish-${nextFishIdRef.current++}-${Date.now()}`,
      type: template.type,
      name: template.name,
      emoji: template.emoji === '✨' ? '🐠' : template.emoji, // emoji replacement for golden
      color: template.color,
      points: template.points,
      speed,
      swimPatter,
      direction,
      x: initialX,
      y: initialY,
      width: template.type === 'big' ? 100 : template.type === 'puffer' ? 55 : template.type === 'golden' ? 45 : 55,
      height: template.type === 'big' ? 70 : template.type === 'puffer' ? 55 : template.type === 'golden' ? 45 : 55,
      isCaught: false,
      isEscaped: false,
      clicksRequired: template.clicks,
      clicksRemaining: template.clicks,
      phase: Math.random() * Math.PI * 2,
      scale: 1,
      pufferState: template.type === 'puffer' ? 'normal' : undefined,
      pufferTimer: template.type === 'puffer' ? 150 : undefined,
    };

    setFishList((prev) => [...prev, newFish]);
  }, [gameState, difficulty]);

  // Secondary game effects: spawning triggers and general loop controls
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Dynamic spawn interval based on difficulty density
    const spawnRate = difficulty === 'hard' ? 1100 : difficulty === 'normal' ? 1600 : 2100;
    const timer = setInterval(spawnFish, spawnRate);

    // Initial spawn
    spawnFish();
    setTimeout(spawnFish, 500);

    return () => clearInterval(timer);
  }, [gameState, difficulty, spawnFish]);

  // Main game logic loop: runs at 60 FPS update frames
  useEffect(() => {
    const updateFrame = () => {
      if (lastStateRef.current.gameState !== 'playing') {
        animationFrameId.current = requestAnimationFrame(updateFrame);
        return;
      }

      setFishList((prevFishList) => {
        return prevFishList
          .map((fish) => {
            if (fish.isCaught || fish.isEscaped) return fish;

            // 1. Update horizontal coordinate
            const step = fish.speed * 0.45; // adjustment step factor
            const nextX = fish.direction === 'L2R' ? fish.x + step : fish.x - step;

            // 2. Update vertical coordinate based on swimming pattern
            let nextY = fish.y;
            let nextPhase = fish.phase + 0.05;

            if (fish.swimPatter === 'wave' || fish.type === 'jelly') {
              // Sine-wave floating trajectory
              nextY = fish.y + Math.sin(nextPhase) * 0.25;
            } else if (fish.swimPatter === 'jerk') {
              // Jerky jumping bursts (fast golden fish)
              const burst = Math.abs(Math.sin(nextPhase)) > 0.8 ? 0.6 : 0.05;
              nextY = fish.y + (Math.random() - 0.5) * 0.5;
            }

            // 3. Special puffer state machine transitions
            let nextPufferState = fish.pufferState;
            let nextPufferTimer = fish.pufferTimer;
            let nextWidth = fish.width;
            let nextHeight = fish.height;

            if (fish.type === 'puffer' && nextPufferTimer !== undefined) {
              nextPufferTimer--;
              if (nextPufferTimer <= 0) {
                if (fish.pufferState === 'normal') {
                  nextPufferState = 'inflating';
                  nextPufferTimer = 40; // time to inflate
                } else if (fish.pufferState === 'inflating') {
                  nextPufferState = 'puffed';
                  nextPufferTimer = 160; // stays puffed
                } else if (fish.pufferState === 'puffed') {
                  nextPufferState = 'deflating';
                  nextPufferTimer = 40;
                } else {
                  nextPufferState = 'normal';
                  nextPufferTimer = 180; // lazy normal swim offset
                }
              }

              // Adjust visual target borders on puff cycles
              if (nextPufferState === 'puffed') {
                nextWidth = 72;
                nextHeight = 72;
              } else {
                nextWidth = 55;
                nextHeight = 55;
              }
            }

            // 4. Bound check escaping
            let isEscaped = false;
            if (fish.direction === 'L2R' && nextX > 115) isEscaped = true;
            if (fish.direction === 'R2L' && nextX < -15) isEscaped = true;

            return {
              ...fish,
              x: nextX,
              y: Math.max(12, Math.min(88, nextY)), // Keep inside arena height bounds
              phase: nextPhase,
              isEscaped,
              pufferState: nextPufferState,
              pufferTimer: nextPufferTimer,
              width: nextWidth,
              height: nextHeight,
            };
          })
          .filter((fish) => !fish.isEscaped && !fish.isCaught); // clean up dead objects
      });

      animationFrameId.current = requestAnimationFrame(updateFrame);
    };

    animationFrameId.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // System duration countdown ticking timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        
        // Critical countdown sound ticks
        if (nextTime <= 5 && nextTime > 0) {
          sound.playTick();
        }

        if (nextTime <= 0) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Decrease net stun duration if player jellyfish shocked
  useEffect(() => {
    if (!isShocked || gameState !== 'playing') return;

    const timer = setInterval(() => {
      setShockTimeRemaining((prev) => {
        const nextTime = prev - 0.1;
        if (nextTime <= 0) {
          setIsShocked(false);
          clearInterval(timer);
          return 0;
        }
        return nextTime;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isShocked, gameState]);

  // Compute final stats and trigger game over handler
  const handleTimeUp = () => {
    setGameState('gameover');
    sound.playGameOver(score >= 250);

    // Save score if it's high
    const savedHigh = localStorage.getItem(`fish_game_highscore_${difficulty}`);
    const highest = savedHigh ? parseInt(savedHigh, 10) : 0;
    if (score > highest) {
      localStorage.setItem(`fish_game_highscore_${difficulty}`, score.toString());
      setHighScore(score);
    }

    // Format final results object
    const totalCaughtCount = (Object.values(caughtCount) as number[]).reduce((a: number, b: number) => a + b, 0);
    const finalStats: GameStats = {
      score,
      highScore: Math.max(score, highest),
      caughtCount,
      totalCaught: totalCaughtCount,
      maxCombo: peakCombo,
      pufferExplodes,
      jellyShocks,
      missCount,
    };

    onGameOver(finalStats);
  };

  // Remaining level timer colour styling
  const timerColor = timeLeft > 20 ? 'text-teal-400' : timeLeft > 8 ? 'text-amber-400 animate-pulse' : 'text-rose-500 font-bold animate-ping';

  return (
    <div className={`w-full h-full flex flex-col relative bg-slate-950 overflow-hidden select-none touch-none ${shakeScreen ? 'animate-shake' : ''}`}>
      
      {/* 1. Sleek Play HUD Top Bar */}
      <header className="relative z-20 flex justify-between items-center px-4 md:px-10 py-5 bg-slate-900/50 backdrop-blur-md border-b border-white/10 select-none text-white">
        
        {/* Left Section: Back Home Button & Points */}
        <div className="flex items-center gap-4 md:gap-8">
          <button
            id="exit-game-btn"
            onClick={onExit}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-full font-bold border border-white/10 cursor-pointer transition shadow"
          >
            ← 戻る
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-cyan-400 font-bold">Current Score</span>
            <span className="text-2xl md:text-4xl font-mono font-bold tracking-tighter text-white">
              {String(score).padStart(6, '0')}
            </span>
          </div>

          <div className="h-10 w-[1px] bg-white/20 hidden min-[400px]:block"></div>

          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-pink-400 font-bold">Remaining Time</span>
            <span className={`text-2xl md:text-4xl font-mono font-bold tracking-tighter ${timeLeft <= 8 ? 'text-rose-500 animate-pulse' : 'text-pink-300'}`}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Section: Best Score & Mute Button */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:block px-4 py-2 bg-slate-800 rounded-full border border-white/5 text-xs md:text-sm">
            Best: <span className="text-yellow-400 font-bold">{highScore}</span>
          </div>

          <button
            id="mute-toggle-btn"
            onClick={toggleMute}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border border-white/5 text-cyan-400 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Combo Bar (floating, centered) */}
      {combo >= 2 && (
        <div className="sm:hidden absolute top-28 left-1/2 -translate-x-1/2 z-15 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-3.5 py-1 rounded-full font-black text-xs shadow-lg shadow-amber-950 flex items-center gap-1.5 border border-amber-400/30 animate-bounce">
          <Sparkles size={12} />
          <span>{combo} COMBO !</span>
        </div>
      )}

      {/* 2. Primary Play Area Ocean Stage */}
      <div
        id="play-arena"
        ref={arenaRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleArenaClick}
        className={`flex-1 w-full h-full relative overflow-hidden bg-gradient-to-b from-cyan-900/20 via-blue-900/40 to-slate-950 game-arena-cursor select-none pointer-events-auto`}
      >
        {/* Undersea environmental layout */}
        <SeaweedContainer />

        {/* Floating Bubble design decorators from Theme */}
        <div className="absolute top-1/4 left-10 w-4 h-4 bg-white/10 rounded-full pointer-events-none select-none"></div>
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/5 rounded-full pointer-events-none select-none"></div>
        <div className="absolute top-2/3 right-12 w-6 h-6 bg-white/10 rounded-full pointer-events-none select-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-white/5 rounded-full pointer-events-none select-none"></div>

        {/* Shock / Electric Stun Filter Overlay */}
        {isShocked && (
          <div className="absolute inset-0 bg-purple-600/15 border-4 border-purple-500/40 z-25 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="bg-purple-950/90 border border-purple-400/60 p-4 rounded-2xl flex items-center gap-3 shadow-2xl animate-shake">
              <AlertTriangle className="text-purple-400 animate-ping" size={24} />
              <div className="text-left">
                <p className="text-xs uppercase font-extrabold text-purple-400">しびれ中！ (STUNNED)</p>
                <p className="text-[11px] text-slate-300">感電して網が使えません！ {shockTimeRemaining.toFixed(1)}s</p>
              </div>
            </div>
          </div>
        )}

        {/* Render active swimming fish */}
        {fishList.map((fish) => (
          <FishComponent
            key={fish.id}
            fish={fish}
            onClick={handleFishClick}
          />
        ))}

        {/* Visual particles + float score overlay */}
        <Effects
          caughtEffects={caughtEffects}
          netSplashes={netSplashes}
        />

        {/* 3. Sleek Custom Net Cursor */}
        {isPointerInArena && !isShocked && (
          <div
            className="absolute rounded-full pointer-events-none select-none z-40 origin-center transition-transform duration-75 flex items-center justify-center"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              width: '100px',
              height: '100px',
              transform: `translate(-50%, -50%) ${isSwingActive ? 'scale(0.8) rotate(15deg)' : 'scale(1)'}`,
            }}
          >
            <div className="w-full h-full border-4 border-dashed border-white/40 rounded-full flex items-center justify-center relative shadow-lg">
              {/* Net Background Mask */}
              <div className="absolute inset-0 bg-cyan-400/5 rounded-full backdrop-blur-[2px]"></div>
              
              {/* Radial Net Mesh Pattern */}
              <div
                className="w-full h-full opacity-20 rounded-full"
                style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
                  backgroundSize: '12px 12px'
                }}
              ></div>

              <div className="absolute -bottom-4 bg-white text-slate-900 px-4 py-1 rounded-full font-bold text-xs shadow-xl tracking-wider select-none">
                {isSwingActive ? 'CATCH' : 'READY'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Sleek Bottom Control Panel */}
      <footer className="relative z-10 px-4 md:px-10 py-5 bg-slate-900 border-t border-white/5 flex items-center justify-between pointer-events-auto text-white">
        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
              ⚡
            </div>
            <div>
              <p className="text-[9px] uppercase text-white/40 font-black leading-none">Current Combo</p>
              <p className="text-base md:text-lg font-bold text-white font-mono mt-0.5">x{combo}</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center px-4 py-2 bg-slate-800/40 rounded-xl border border-white/5 text-xs text-slate-400 max-w-md">
            <span>操作：泳いでくる魚をクリックしてキャッチ！爆発フグ🐡や感電クラゲ🐙は回避を。</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <p className="text-[9px] uppercase text-white/40 mb-1.5 font-bold">Gameplay Area</p>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-white/5 text-xs font-bold font-sans">
            <span className="px-5 py-1.5 bg-cyan-600 rounded-md text-white uppercase tracking-wider shadow-lg">
              {difficulty === 'hard' ? 'DEEP SEA' : difficulty === 'normal' ? 'MID STREAM' : 'SHALLOWS'}
            </span>
            <span className="hidden min-[450px]:inline-block px-4 py-1.5 text-white/60 font-medium self-center uppercase tracking-wider text-[10px]">
              60s TIME ATTACK
            </span>
          </div>
        </div>
      </footer>

      {/* Inline styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-4px, -2px) rotate(-1deg); }
          30% { transform: translate(3px, 4px) rotate(1deg); }
          50% { transform: translate(-3px, 1px) rotate(-1deg); }
          70% { transform: translate(4px, -3px) rotate(1deg); }
          90% { transform: translate(-2px, 3px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
