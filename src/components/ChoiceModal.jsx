import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function ChoiceModal() {
  const { state, buildHonest, buildCorrupt, buildBayanihan, buildPhased, cancelDilemma, showToast } = useGame();
  const [downpayment, setDp] = useState(0);

  if (state.phase !== 'dilemma' || !state.pendingCard) return null;

  const honestCost = state.pendingCard.honestCost || 3;
  const corruptCost = state.pendingCard.corruptCost || 1;
  const phasedTotalCost = honestCost + 1;

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
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Honest Option */}
            <button
              onClick={() => {
                if (state.budget < honestCost) showToast('Not enough budget for Honest Build!', 'error');
                else buildHonest();
              }}
              className={`col-span-1 gov-choice ${state.budget >= honestCost ? 'gov-choice--honest' : 'gov-choice--disabled'}`}
              disabled={state.budget < honestCost}
            >
              <div className="gov-choice-title gov-heading text-[11px]">HONEST BUILD</div>
              <div className="gov-choice-sub text-[9px]">Cost {honestCost} • {state.pendingCard.honestReward || '+1 DP'}</div>
            </button>

            {/* Corrupt Option */}
            <button
              onClick={() => {
                if (state.budget < corruptCost) showToast('Not enough budget to Cut Corners!', 'error');
                else buildCorrupt();
              }}
              className={`col-span-1 gov-choice ${state.budget >= corruptCost ? 'gov-choice--corrupt' : 'gov-choice--disabled'}`}
              disabled={state.budget < corruptCost}
            >
              <div className="gov-choice-title gov-heading text-[11px]">CUT CORNERS</div>
              <div className="gov-choice-sub text-[9px]">Cost {corruptCost} • {state.pendingCard.corruptReward || '+2 DP'}</div>
            </button>

            {/* Bayanihan Option */}
            <button
              onClick={() => {
                buildBayanihan();
              }}
              className="col-span-2 gov-choice bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all"
            >
              <div className="gov-choice-title gov-heading text-slate-200">BAYANIHAN (0 Budget)</div>
              <div className="gov-choice-sub">Takes 3 turns • +1 DP upon finish</div>
            </button>

            {/* Phased Sequence Option */}
            <div className="col-span-2 flex flex-col gap-2 p-3 bg-indigo-900/40 border border-indigo-500/30 rounded-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-center z-10">
                <div>
                  <div className="gov-choice-title gov-heading text-indigo-300">PHASED BUILD (Loan)</div>
                  <div className="gov-choice-sub text-indigo-200/60">Total Cost: {phasedTotalCost} • +1 DP upon finish</div>
                </div>
                
                {/* Downpayment controls */}
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-indigo-500/20">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 pl-1">Downpayment</span>
                  <button 
                    className="w-5 h-5 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-xs text-white"
                    onClick={() => setDp(Math.max(0, downpayment - 1))}
                  >-</button>
                  <span className="text-white font-mono text-sm w-4 text-center">{downpayment}</span>
                  <button 
                    className="w-5 h-5 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-xs text-white"
                    onClick={() => setDp(Math.min(state.budget, downpayment + 1))}
                  >+</button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (state.budget < downpayment) showToast('Not enough budget for downpayment!', 'error');
                  else buildPhased(downpayment);
                }}
                className={`z-10 py-2 w-full text-center rounded-lg border text-sm font-bold tracking-widest transition-colors ${state.budget >= downpayment ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)] hover:bg-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}
                style={{ fontFamily: "var(--font-display)" }}
                disabled={state.budget < downpayment}
              >
                START BUILD (Pay {downpayment})
              </button>
            </div>
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
            className="mt-3 w-full py-2.5 text-sm text-red-800 font-bold hover:text-white hover:bg-red-700 uppercase tracking-widest border-2 border-red-400 bg-red-100 transition-colors rounded-xl flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-lg leading-none">✕</span> Cancel
          </button>
      </div>
    </div>
  );
}
