import React from 'react';
import { GameStats, Difficulty } from '../types';
import { RotateCcw, Award, Star, TrendingUp, Trophy, HelpCircle, Activity } from 'lucide-react';

interface GameStatsBoxProps {
  stats: GameStats;
  difficulty: Difficulty;
  timeLimit: number;
  onRestart: () => void;
}

export const GameStatsBox: React.FC<GameStatsBoxProps> = ({ stats, difficulty, timeLimit, onRestart }) => {
  const { score, highScore, caughtCount, totalCaught, maxCombo, pufferExplodes, jellyShocks } = stats;

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
          <div className="p-2 bg-slate-900/40 rounded-xl">
            <span className="text-slate-500 block mb-0.5">ハザード被害</span>
            <span className="font-bold text-rose-400 text-sm">
              {pufferExplodes + jellyShocks} 回
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
