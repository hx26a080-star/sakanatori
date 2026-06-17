import React from 'react';
import { GameStats, Difficulty, Badge } from '../types';
import { RotateCcw, Award, Star, Trophy, Activity, MessageSquare } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameStatsBoxProps {
  stats: GameStats;
  difficulty: Difficulty;
  timeLimit: number;
  onRestart: () => void;
}

export const BADGES: Badge[] = [
  {
    id: 'no_miss',
    name: '百発百中 (Perfect Aim)',
    description: '空振りを1回もせずにゲームを終了する',
    emoji: '🎯',
    color: 'from-emerald-400 to-teal-600',
    requirement: 'ミス（空振り）0回 ＆ 漁獲量 5匹以上',
  },
  {
    id: 'golden_expert',
    name: '黄金の探究者 (Golden Expert)',
    description: '黄金のレア魚（黄金ウオ）を捕獲する',
    emoji: '✨',
    color: 'from-yellow-400 to-amber-600',
    requirement: '黄金ウオを 1 匹以上捕獲',
  },
  {
    id: 'combo_king',
    name: '怒涛の連鎖 (Combo King)',
    description: '高いコンボ数を叩き出す',
    emoji: '⚡',
    color: 'from-cyan-400 via-blue-500 to-indigo-600',
    requirement: '最大コンボ 10 以上',
  },
  {
    id: 'shark_slayer',
    name: 'ジョーズ・ハンター (Shark Hunter)',
    description: '巨大なサメを捕獲する',
    emoji: '🦈',
    color: 'from-blue-600 to-slate-800',
    requirement: 'ホホジロサメを 1 匹以上捕獲',
  },
  {
    id: 'zen_master',
    name: '静寂の海 (Zen Fisherman)',
    description: 'ハザードに触れず、一定以上の魚を捕獲する',
    emoji: '🧘',
    color: 'from-purple-500 to-pink-600',
    requirement: '爆発・感電いずれも 0 回 ＆ 漁獲量 10 匹以上',
  }
];

export const GameStatsBox: React.FC<GameStatsBoxProps> = ({ stats, difficulty, timeLimit, onRestart }) => {
  const { score, highScore, caughtCount, totalCaught, maxCombo, pufferExplodes, jellyShocks, missCount } = stats;

  const [newlyUnlocked, setNewlyUnlocked] = React.useState<string[]>([]);
  const [allUnlocked, setAllUnlocked] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      // 1. Load unlocked badges from previous sessions
      const stored = localStorage.getItem('fish_game_unlocked_badges');
      let unlockedList: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(unlockedList)) unlockedList = [];

      // 2. Compute unlocks from this run
      const newlyUnlockedThisRun: string[] = [];
      
      const meetsNoMiss = (missCount === 0 || (stats as any).misses === 0) && totalCaught >= 5;
      const meetsGolden = (caughtCount.golden || 0) >= 1;
      const meetsCombo = maxCombo >= 10;
      const meetsShark = (caughtCount.big || 0) >= 1;
      const meetsZen = pufferExplodes === 0 && jellyShocks === 0 && totalCaught >= 10;

      if (meetsNoMiss && !unlockedList.includes('no_miss')) newlyUnlockedThisRun.push('no_miss');
      if (meetsGolden && !unlockedList.includes('golden_expert')) newlyUnlockedThisRun.push('golden_expert');
      if (meetsCombo && !unlockedList.includes('combo_king')) newlyUnlockedThisRun.push('combo_king');
      if (meetsShark && !unlockedList.includes('shark_slayer')) newlyUnlockedThisRun.push('shark_slayer');
      if (meetsZen && !unlockedList.includes('zen_master')) newlyUnlockedThisRun.push('zen_master');

      if (newlyUnlockedThisRun.length > 0) {
        const nextUnlockedList = [...unlockedList, ...newlyUnlockedThisRun];
        localStorage.setItem('fish_game_unlocked_badges', JSON.stringify(nextUnlockedList));
        setNewlyUnlocked(newlyUnlockedThisRun);
        setAllUnlocked(nextUnlockedList);
        
        // Play badge unlock chime sound
        setTimeout(() => {
          try {
            sound.playRareCatch(); 
          } catch (_) {}
        }, 300);
      } else {
        setAllUnlocked(unlockedList);
      }
    } catch (e) {
      console.error('Error in badge unlocking logic', e);
    }
  }, [stats, missCount, totalCaught, caughtCount, maxCombo, pufferExplodes, jellyShocks]);

  // Custom feedback/ranking based on high score
  const rankInfo = React.useMemo(() => {
    if (score >= 600) {
      return { title: '🔱 伝説の深海神 (Deep Sea God)', desc: '海のすべての魚を完全に掌握した神級の腕前！', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/50' };
    } else if (score >= 400) {
      return { title: '👑 熟練のスーパー大漁師', desc: '港中の人々に称賛される一流の漁師です！', color: 'text-amber-400 bg-amber-950/40 border-amber-500/50' };
    } else if (score >= 250) {
      return { title: '🐟 一人前の漁師 (Pro Fisherman)', desc: '一人前の腕前として、どんな海でも渡っていけます。', color: 'text-teal-400 bg-teal-950/40 border-teal-500/50' };
    } else if (score >= 100) {
      return { title: '⛵ 新米の見習い漁師', desc: 'なかなかの腕前！次はもっと高得点の魚を狙おう。', color: 'text-sky-300 bg-sky-950/40 border-sky-500/50' };
    } else {
      return { title: '🐡 フラップ波打ち際ビギナー', desc: 'まずは目の前のゆっくりな魚を着実に捕まえよう！', color: 'text-slate-400 bg-slate-950/40 border-slate-500/50' };
    }
  }, [score]);

  const diffLabels: Record<Difficulty, string> = {
    easy: 'かんたん 🟢',
    normal: 'ふつう 🟡',
    hard: 'むずかしい 🔴',
  };

  return (
    <div className="w-full max-w-xl bg-slate-900/45 border border-white/10 rounded-3xl p-6 md:p-8 text-white shadow-2xl backdrop-blur-md animate-scaleUp">
      {/* Trophy Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/10 text-amber-400 mb-3 animate-bounce">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-black font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
          リザルト (Result)
        </h2>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
          難易度: <span className="font-bold text-slate-200">{diffLabels[difficulty]}</span> | 制限時間: {timeLimit}s
        </p>
      </div>

      {/* Newly Unlocked Badge Popup banner */}
      {newlyUnlocked.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/20 to-yellow-500/10 border border-yellow-500/40 rounded-2xl animate-pulse flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 rounded-full text-yellow-400">
            <Star size={20} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-black text-yellow-400 tracking-wider">実績を解除しました！ (Badge Unlocked)</p>
            <p className="text-xs text-slate-200 mt-0.5 font-bold">
              {newlyUnlocked.map(id => BADGES.find(b => b.id === id)?.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Main Score & High Score */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 font-medium">今回のスコア (Score)</p>
          <p className="text-3xl md:text-4xl font-extrabold text-cyan-300 tracking-tight mt-1">
            {score} <span className="text-lg">pt</span>
          </p>
        </div>
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 text-center relative overflow-hidden">
          <p className="text-xs text-slate-400 font-medium">自己ベスト (Best)</p>
          <p className="text-3xl md:text-4xl font-extrabold text-amber-400 tracking-tight mt-1">
            {highScore} <span className="text-lg">pt</span>
          </p>
          {score >= highScore && score > 0 && (
            <div className="absolute -top-1 -right-8 w-24 h-6 bg-red-600/90 text-[10px] font-bold text-white uppercase tracking-wider rotate-32 flex items-center justify-center border border-white/20">
              NEW !
            </div>
          )}
        </div>
      </div>

      {/* Fishing License / Rank */}
      <div className={`border rounded-2xl p-4 mb-6 text-center ${rankInfo.color}`}>
        <p className="text-[11px] uppercase tracking-wider font-semibold opacity-75">獲得称号 (Fisherman Class)</p>
        <h3 className="text-lg md:text-xl font-bold mt-1 tracking-tight">
          {rankInfo.title}
        </h3>
        <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
          {rankInfo.desc}
        </p>
      </div>

      {/* Milestone Badges System Grid */}
      <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 mb-6">
        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
          <Award size={12} className="text-yellow-400" />
          獲得した実績 (Milestone Badges)
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {BADGES.map((badge) => {
            const isUnlocked = allUnlocked.includes(badge.id);
            const isNew = newlyUnlocked.includes(badge.id);
            
            return (
              <div 
                key={badge.id}
                className={`flex flex-col items-center p-2 rounded-xl text-center relative transition group cursor-pointer ${
                  isUnlocked 
                    ? 'bg-slate-800/80 border border-white/10 shadow-lg' 
                    : 'bg-slate-950/40 border border-white/5 opacity-40'
                }`}
                id={`badge-card-${badge.id}`}
              >
                {isNew && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                )}
                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br ${isUnlocked ? badge.color : 'from-slate-800 to-slate-900'} flex items-center justify-center text-base md:text-lg shadow shadow-black/40 mb-1 group-hover:scale-105 transition`}>
                  {isUnlocked ? badge.emoji : '🔒'}
                </div>
                <span className="text-[8px] md:text-[9px] font-bold text-slate-400 truncate w-full">
                  {badge.name.split(' ')[0]}
                </span>
                
                {/* Custom hover tooltip popover */}
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-48 bg-slate-950/95 border border-white/10 rounded-lg p-2.5 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-30 shadow-2xl text-left">
                  <p className="font-extrabold text-xs text-yellow-400 flex items-center gap-1.5">
                    <span>{badge.emoji}</span> {badge.name}
                  </p>
                  <p className="text-[10px] text-white/90 mt-1 leading-relaxed">{badge.description}</p>
                  <p className="text-[9px] text-[#5059ff] mt-1 italic font-mono">クリア条件: {badge.requirement}</p>
                  <p className={`text-[9px] mt-1.5 text-right font-bold ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isUnlocked ? '✓ 獲得済み (Unlocked)' : '未獲得 (Locked)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed stats grids */}
      <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 mb-6">
        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
          <Activity size={12} className="text-cyan-500" />
          プレイ詳細統計 (Statistics)
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-2 bg-slate-900/40 rounded-xl">
            <span className="text-slate-500 block mb-0.5">総漁獲量</span>
            <span className="font-bold text-slate-200 text-sm">{totalCaught} 匹</span>
          </div>
          <div className="p-2 bg-slate-900/40 rounded-xl">
            <span className="text-slate-500 block mb-0.5">最大コンボ</span>
            <span className="font-bold text-teal-400 text-sm">{maxCombo} Combo</span>
          </div>
          <div className="p-2 bg-slate-900/40 rounded-xl" title={`ミス: ${missCount}回`}>
            <span className="text-slate-500 block mb-0.5">ハザード/ミス</span>
            <span className="font-bold text-rose-400 text-sm">
              {pufferExplodes + jellyShocks}/{missCount}
            </span>
          </div>
        </div>

        {/* Catch breakdown counts */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">魚種別の詳細 (Breakdown)</span>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex justify-between items-center px-2 py-1 bg-slate-900/20 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1">🐟 普通ウオ</span>
              <span className="font-semibold text-slate-200">{caughtCount.normal} 匹</span>
            </div>
            <div className="flex justify-between items-center px-2 py-1 bg-slate-900/20 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1">🐠 快速サバ</span>
              <span className="font-semibold text-cyan-400">{caughtCount.fast} 匹</span>
            </div>
            <div className="flex justify-between items-center px-2 py-1 bg-slate-900/20 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1">🦈 巨大マグロ</span>
              <span className="font-semibold text-blue-400">{caughtCount.big} 匹</span>
            </div>
            <div className="flex justify-between items-center px-2 py-1 bg-slate-900/20 rounded-lg">
              <span className="text-slate-400 flex items-center gap-1">✨ 黄金の魚</span>
              <span className="font-semibold text-amber-300">{caughtCount.golden} 匹</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restart Button */}
      <button
        id="restart-game-btn"
        onClick={onRestart}
        className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-slate-950 font-black text-base rounded-2xl transition-all duration-300 transform active:scale-98 shadow-xl shadow-cyan-500/10 border border-cyan-300/40 flex items-center justify-center gap-2 group cursor-pointer"
      >
        <RotateCcw size={18} className="group-hover:rotate-45 transition-transform duration-300" />
        もう一度挑戦する (Play Again)
      </button>

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};
