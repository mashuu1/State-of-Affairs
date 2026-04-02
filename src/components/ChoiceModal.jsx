import { useGame } from '../context/GameContext';

export default function ChoiceModal() {
  const { state, buildHonest, buildCorrupt, cancelDilemma, showToast } = useGame();

  if (state.phase !== 'dilemma' || !state.pendingCard) return null;

  const honestCost = state.pendingCard.honestCost || 3;
  const corruptCost = state.pendingCard.corruptCost || 1;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="gov-modal gov-modal--dilemma">
        <div className="gov-modal-scan" />
          
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-700/50">
            <div className="gov-modal-top gov-heading">PROCUREMENT DECISION</div>
            <h2 className="gov-modal-title gov-heading">THE DILEMMA</h2>
            <p className="gov-modal-sub">
              How will you build <span className="text-amber-300 font-semibold">{state.pendingCard.name}</span>?
            </p>
          </div>

          {/* Card preview */}
          <div className="mt-3 bg-black/35 border border-slate-700/40 rounded-xl p-3 shadow-inner">
            <p className="text-[13px] text-slate-200/80 leading-relaxed text-center" style={{ fontFamily: "var(--font-body)" }}>
              {state.pendingCard.description}
            </p>
          </div>

          {/* Choice buttons */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Honest Option */}
            <button
              onClick={() => {
                if (state.budget < honestCost) showToast('Not enough budget for Honest Build!', 'error');
                else buildHonest();
              }}
              className={`gov-choice ${state.budget >= honestCost ? 'gov-choice--honest' : 'gov-choice--disabled'}`}
              disabled={state.budget < honestCost}
            >
              <div className="gov-choice-title gov-heading">HONEST BUILD</div>
              <div className="gov-choice-sub">Cost {honestCost} • {state.pendingCard.honestReward || '+1 DP'}</div>
            </button>

            {/* Corrupt Option */}
            <button
              onClick={() => {
                if (state.budget < corruptCost) showToast('Not enough budget to Cut Corners!', 'error');
                else buildCorrupt();
              }}
              className={`gov-choice ${state.budget >= corruptCost ? 'gov-choice--corrupt' : 'gov-choice--disabled'}`}
              disabled={state.budget < corruptCost}
            >
              <div className="gov-choice-title gov-heading">CUT CORNERS</div>
              <div className="gov-choice-sub">Cost {corruptCost} • {state.pendingCard.corruptReward || '+2 DP'}</div>
            </button>
          </div>

          {/* Budget row */}
          <div className="mt-4 flex justify-between items-center bg-black/25 border border-slate-700/40 rounded-xl p-2">
            <span className="text-[11px] text-slate-300/60 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
              Available Budget
            </span>
            <span className="text-amber-300 font-black text-xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
              {state.budget}
            </span>
          </div>

          {/* Cancel */}
          <button
            onClick={cancelDilemma}
            className="mt-3 py-2 text-xs text-slate-300/50 hover:text-white hover:bg-white/5 uppercase tracking-widest border border-transparent hover:border-slate-600/30 transition-colors rounded-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cancel
          </button>
      </div>
    </div>
  );
}
