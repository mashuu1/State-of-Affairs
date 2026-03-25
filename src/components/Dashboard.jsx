import { useGame } from '../context/GameContext';

export default function Dashboard({ isAI = false, variant = 'full' }) {
  const { state } = useGame();

  const trust = isAI ? state.aiTrust : state.publicTrust;
  const budget = isAI ? state.aiBudget : state.budget;
  const dp = isAI ? state.aiDP : state.developmentPoints;
  const label = isAI ? 'OPPONENT' : 'PLAYER';

  const trustPercent = (trust / 5) * 100;
  const barColor = trust >= 4 ? '#22c55e' : trust >= 2 ? '#f59e0b' : '#ef4444';

  // ─── Trust-only variant (left corner) ───
  if (variant === 'trust') {
    return (
      <div className="px-2 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
          <span className="text-[10px] text-slate-400 font-mono ml-auto">{trust}/5</span>
        </div>
        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-600">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${trustPercent}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    );
  }

  // ─── Stats-only variant (right corner) ───
  if (variant === 'stats') {
    return (
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
        {/* Budget */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400">Budget</span>
          <span className="text-base font-bold text-amber-400 font-mono">{budget}</span>
        </div>
        {/* DP */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400">DP</span>
          <div className="flex gap-0.5 mt-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-sm border ${
                  i < dp
                    ? 'bg-emerald-400 border-emerald-300'
                    : 'bg-slate-700 border-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
        {/* Turn (player only) */}
        {!isAI && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400">Turn</span>
            <span className="text-sm font-bold text-slate-300 font-mono">{state.turnNumber}</span>
          </div>
        )}
        {/* Deck count (player only) */}
        {!isAI && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-400">Deck</span>
            <span className="text-sm font-bold text-slate-300 font-mono">{state.deck.length}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Full variant (legacy fallback) ───
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 ${isAI ? 'flex-row-reverse' : ''}`}>
      <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase w-16 text-center">
        {label}
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Trust</span>
          <span className="font-mono">{trust}/5</span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-600">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${trustPercent}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center px-2">
        <span className="text-[10px] text-slate-400">Budget</span>
        <span className="text-lg font-bold text-amber-400 font-mono">{budget}</span>
      </div>
      <div className="flex flex-col items-center px-2">
        <span className="text-[10px] text-slate-400">DP</span>
        <div className="flex gap-0.5 mt-0.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm border ${
                i < dp
                  ? 'bg-emerald-400 border-emerald-300'
                  : 'bg-slate-700 border-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
      {!isAI && (
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] text-slate-400">Turn</span>
          <span className="text-sm font-bold text-slate-300 font-mono">{state.turnNumber}</span>
        </div>
      )}
      {!isAI && (
        <div className="flex flex-col items-center px-2">
          <span className="text-[10px] text-slate-400">Deck</span>
          <span className="text-sm font-bold text-slate-300 font-mono">{state.deck.length}</span>
        </div>
      )}
    </div>
  );
}
