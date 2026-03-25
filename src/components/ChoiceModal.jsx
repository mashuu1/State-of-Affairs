import { useGame } from '../context/GameContext';

export default function ChoiceModal() {
  const { state, buildHonest, buildCorrupt, cancelDilemma } = useGame();

  if (state.phase !== 'dilemma' || !state.pendingCard) return null;

  const honestCost = state.pendingCard.honestCost || 3;
  const corruptCost = state.pendingCard.corruptCost || 1;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-4 border-slate-700 shadow-[8px_8px_0_0_rgba(0,0,0,0.8)] p-1 animate-fadeIn">
        <div className="bg-slate-800 border-2 border-slate-600 p-5 flex flex-col gap-4">
          
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-700">
            <h2 className="text-xl text-white uppercase tracking-widest mb-2 font-bold drop-shadow-md">The Dilemma</h2>
            <p className="text-sm text-slate-300">
              How will you build <span className="text-amber-400 font-bold">{state.pendingCard.name}</span>?
            </p>
          </div>

          {/* Card preview */}
          <div className="bg-black/80 border-2 border-slate-700 p-3 shadow-inner">
            <p className="text-sm text-slate-300 leading-relaxed text-center">{state.pendingCard.description}</p>
          </div>

          {/* Choice buttons */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Honest Option */}
            <button
              onClick={buildHonest}
              disabled={state.budget < honestCost}
              className={`relative w-full py-3 px-4 text-center transition-none border-[3px] group ${
                state.budget >= honestCost
                  ? 'bg-emerald-600 border-t-emerald-400 border-l-emerald-400 border-b-emerald-800 border-r-emerald-800 text-white hover:bg-emerald-500 active:border-t-emerald-800 active:border-l-emerald-800 active:border-b-emerald-400 active:border-r-emerald-400'
                  : 'bg-slate-700 border-t-slate-600 border-l-slate-600 border-b-slate-800 border-r-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="font-bold tracking-widest uppercase mb-1 drop-shadow-sm">
                [ Honest ]
              </div>
              <div className={`text-xs ${state.budget >= honestCost ? 'text-emerald-100' : 'text-slate-500'}`}>
                Cost: {honestCost} Budget → {state.pendingCard.honestReward || '+1 DP'}
              </div>
            </button>

            {/* Corrupt Option */}
            <button
              onClick={buildCorrupt}
              disabled={state.budget < corruptCost}
              className={`relative w-full py-3 px-4 text-center transition-none border-[3px] group ${
                state.budget >= corruptCost
                  ? 'bg-red-600 border-t-red-400 border-l-red-400 border-b-red-800 border-r-red-800 text-white hover:bg-red-500 active:border-t-red-800 active:border-l-red-800 active:border-b-red-400 active:border-r-red-400'
                  : 'bg-slate-700 border-t-slate-600 border-l-slate-600 border-b-slate-800 border-r-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="font-bold tracking-widest uppercase mb-1 drop-shadow-sm">
                [ Cut Corners ]
              </div>
              <div className={`text-xs ${state.budget >= corruptCost ? 'text-orange-200' : 'text-slate-500'}`}>
                Cost: {corruptCost} Budget → {state.pendingCard.corruptReward || '+2 DP !'}
              </div>
            </button>
          </div>

          {/* Budget row */}
          <div className="flex justify-between items-center bg-slate-900 border-2 border-slate-700 p-2 mt-2">
            <span className="text-xs text-slate-400 uppercase tracking-widest">Available Budget:</span>
            <span className="text-amber-400 font-bold text-lg drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">{state.budget}</span>
          </div>

          {/* Cancel */}
          <button
            onClick={cancelDilemma}
            className="mt-1 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-700 uppercase tracking-widest border-2 border-transparent hover:border-slate-600 transition-colors"
          >
            Cancel
          </button>
          
        </div>
      </div>
    </div>
  );
}
