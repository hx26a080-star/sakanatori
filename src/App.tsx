import { useState, useEffect } from 'react';
import { Playground } from './components/Playground';
import { GameStatsBox } from './components/GameStatsBox';
import { SeaweedContainer } from './components/Seaweed';
import { GameState, Difficulty, GameStats } from './types';
import { sound } from './utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, ShieldAlert, Sparkles, Award } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isAudioInitialized, setIsAudioInitialized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stats to store at game over
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    caughtCount: { normal: 0, fast: 0, big: 0, golden: 0, puffer: 0, jelly: 0 },
    totalCaught: 0,
    maxCombo: 0,
    pufferExplodes: 0,
    jellyShocks: 0,
  });

  // Safe read of High Score on startup for welcome HUD
  const [sessionHighScore, setSessionHighScore] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`fish_game_highscore_${difficulty}`);
      if (stored) {
        setSessionHighScore(parseInt(stored, 10));
      } else {
        setSessionHighScore(0);
      }
    } catch (_) {}
  }, [difficulty, gameState]);

  const handleStartGame = () => {
    // Resume/Start AudioContext as browser security requires direct clicks
    try {
      sound.setMute(isMuted);
      sound.playCatch(); // play visual interaction cue
      setIsAudioInitialized(true);
    } catch (e) {
      console.warn('Audio Context fail on startup interaction:', e);
    }
    setGameState('playing');
  };

  const handleGameOver = (finalStats: GameStats) => {
    // Lazy pull stats from localStorage counters to get precise breakdown info
    try {
      const normalCount = parseInt(localStorage.getItem('fish_game_count_normal') || '0', 10);
      const fastCount = parseInt(localStorage.getItem('fish_game_count_fast') || '0', 10);
      const bigCount = parseInt(localStorage.getItem('fish_game_count_big') || '0', 10);
      const goldenCount = parseInt(localStorage.getItem('fish_game_count_golden') || '0', 10);
      const pufferExp = parseInt(localStorage.getItem('fish_game_stats_puffer') || '0', 10);

      // Clean local incremental counters for next round
      localStorage.setItem('fish_game_count_normal', '0');
      localStorage.setItem('fish_game_count_fast', '0');
      localStorage.setItem('fish_game_count_big', '0');
      localStorage.setItem('fish_game_count_golden', '0');
      localStorage.setItem('fish_game_stats_puffer', '0');

      const total = normalCount + fastCount + bigCount + goldenCount;

      const enrichedStats: GameStats = {
        ...finalStats,
        caughtCount: {
          normal: normalCount,
          fast: fastCount,
          big: bigCount,
          golden: goldenCount,
          puffer: pufferExp,
          jelly: 0, // transient
        },
        totalCaught: total,
        pufferExplodes: pufferExp,
      };

      setGameStats(enrichedStats);
    } catch (_) {
      setGameStats(finalStats);
    }
    setGameState('gameover');
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMute(nextMuted);
  };

  const difficultyDetails: Record<Difficulty, { label: string; desc: string; border: string; bg: string; activeBg: string; text: string }> = {
    easy: {
      label: 'かんたん',
      desc: 'おだやかな浅瀬。のんびり魚捕りを楽しみたい方に最適。',
      border: 'border-white/10',
      bg: 'bg-slate-900/40',
      activeBg: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black',
      text: 'text-emerald-400',
    },
    normal: {
      label: 'ふつう',
      desc: '潮風香る中海。巨大マグロや爆発フグが出現する標準モード。',
      border: 'border-white/10',
      bg: 'bg-slate-900/40',
      activeBg: 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black',
      text: 'text-cyan-400',
    },
    hard: {
      label: 'むずかしい',
      desc: '荒れ狂う深海。感電クラゲやお邪魔フグが高速で大群生！',
      border: 'border-white/10',
      bg: 'bg-slate-900/40',
      activeBg: 'bg-pink-500 text-slate-950 shadow-lg shadow-pink-500/20 font-black',
      text: 'text-pink-400',
    },
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex select-none text-slate-100 font-sans antialiased justify-center items-center">
      
      {/* 1. START STATE VIEW */}
      {gameState === 'start' && (
        <div className="w-full h-full relative flex items-center justify-center p-4 bg-gradient-to-b from-cyan-900/20 via-blue-900/40 to-slate-950">
          <SeaweedContainer />

          {/* Floating Bubble design decorators from Theme */}
          <div className="absolute top-1/4 left-10 w-4 h-4 bg-white/10 rounded-full pointer-events-none select-none"></div>
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/5 rounded-full pointer-events-none select-none"></div>
          <div className="absolute top-2/3 right-12 w-6 h-6 bg-white/10 rounded-full pointer-events-none select-none"></div>
          <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-white/5 rounded-full pointer-events-none select-none"></div>

          {/* Golden sunbeam light overlay */}
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

          {/* Central Main Panel card */}
          <div className="w-full max-w-xl bg-slate-900/45 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md z-10 flex flex-col relative">
            
            {/* Header / Game Title */}
            <div className="text-center mb-6">
              <div className="inline-flex gap-2 items-center px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-3 select-none text-cyan-400 font-bold text-[10px] tracking-widest uppercase">
                <Sparkles size={12} />
                AQUA CATCH SYSTEM
              </div>
              <h1 className="text-3.5xl md:text-5xl font-black font-sans tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-200 uppercase drop-shadow">
                網で魚捕り
                <span className="block text-2xl md:text-3xl mt-1 font-extrabold text-cyan-300">
                  大作戦！
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-2 tracking-wide">
                サッと動く魚達をクリック(網)でキャッチして、ハイスコアを叩き出そう！
              </p>
            </div>

            {/* Instruction Grid */}
            <div className="bg-slate-950/55 border border-white/5 rounded-2xl p-4 mb-6 text-xs space-y-3 leading-relaxed">
              <h3 className="text-cyan-400 font-black tracking-widest uppercase border-b border-white/5 pb-1.5 flex items-center gap-1.5 text-[10px]">
                <Award size={14} /> 漁師の心得 & 魚類図鑑 (Rules)
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-white/5">
                  <span className="text-xl">🐠</span>
                  <div>
                    <p className="font-extrabold text-slate-200">普通魚 (+10 ~ 15)</p>
                    <p className="text-[10px] text-slate-500">標準的な速さ。確実に捕獲！</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-white/5">
                  <span className="text-xl">🦑</span>
                  <div>
                    <p className="font-extrabold text-cyan-400">快速イカ (+25)</p>
                    <p className="text-[10px] text-slate-500">瞬間的にダッシュ。先読みして網を！</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-white/5">
                  <span className="text-xl">🦈</span>
                  <div>
                    <p className="font-extrabold text-[#5059ff] no-underline">激闘サメ (+50)</p>
                    <p className="text-[10px] text-slate-500">体力が高い！ 3回連続クリック！</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/40 p-1.5 rounded-xl border border-white/5">
                  <span className="text-xl">✨</span>
                  <div>
                    <p className="font-extrabold text-amber-300">黄金魚 (+100)</p>
                    <p className="text-[10px] text-slate-500">超高速ジグザグ移動！激レア魚！</p>
                  </div>
                </div>
              </div>
              
              {/* Dangerous objects warnings */}
              <div className="grid grid-cols-2 gap-2 bg-rose-950/20 border border-rose-500/20 rounded-xl p-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐡</span>
                  <div>
                    <p className="font-extrabold text-rose-400 text-[10px]">お邪魔フグ (-25)</p>
                    <p className="text-[9px] text-rose-300/70">「膨らみ中」をクリックで爆発！</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="font-extrabold text-purple-400 text-[10px]">感電クラゲ (-15 & 気絶)</p>
                    <p className="text-[9px] text-purple-300/75">クリックで網が1.5秒間気絶！</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Selector controls */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                難易度を選択 (Select Difficulty)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(difficultyDetails) as Difficulty[]).map((diff) => {
                  const active = difficulty === diff;
                  const info = difficultyDetails[diff];
                  return (
                    <button
                      key={diff}
                      id={`diff-btn-${diff}`}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        active
                          ? info.activeBg
                          : `bg-slate-800/80 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700/80`
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 font-medium text-center mt-2.5">
                {difficultyDetails[difficulty].desc}
              </p>
            </div>

            {/* Welcome Best Score indicators */}
            {sessionHighScore > 0 && (
              <div className="mb-5 py-2.5 px-4 bg-slate-950/40 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  🏆 ベストスコア ({difficultyDetails[difficulty].label}):
                </span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {sessionHighScore} pt
                </span>
              </div>
            )}

            {/* Master Start Button! */}
            <div className="flex gap-2">
              <button
                id="mute-start-toggle"
                onClick={toggleMute}
                className="w-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-white/5 cursor-pointer flex items-center justify-center transition"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                id="start-game-btn"
                onClick={handleStartGame}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-slate-950 font-black text-base rounded-2xl transition-all duration-300 transform active:scale-98 shadow-xl shadow-cyan-500/10 border border-cyan-300/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play fill="currentColor" size={16} />
                ゲームスタート (Start Operation)
              </button>
            </div>

            {/* Disclaimer disclaimer */}
            <p className="text-[10px] text-slate-600 text-center mt-4 select-none pointer-events-none">
              © 2026 Aqua Catch Studio. Optimized for Sleek Viewport.
            </p>
          </div>
        </div>
      )}

      {/* 2. PLAYING STATE VIEW */}
      {gameState === 'playing' && (
        <Playground
          difficulty={difficulty}
          timeLimit={60} // 1 minute playing
          onGameOver={handleGameOver}
          onExit={() => setGameState('start')}
        />
      )}

      {/* 3. GAMEOVER STATE VIEW */}
      {gameState === 'gameover' && (
        <div className="w-full h-full relative flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950">
          <SeaweedContainer />
          
          <GameStatsBox
            stats={gameStats}
            difficulty={difficulty}
            timeLimit={60}
            onRestart={handleRestart}
          />
        </div>
      )}
    </div>
  );
}
