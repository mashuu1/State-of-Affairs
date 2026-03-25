import { useGame } from '../context/GameContext';

export default function TurnControls() {
  const { state, startTurn, endTurn } = useGame();

  const canStart = state.phase === 'play' && !state.turnStarted;
  const canEnd = state.phase === 'play' && state.turnStarted;

  return (
    <div className="flex items-center gap-2">
      {canStart && (
        <button
          onClick={startTurn}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm tracking-wide font-black rounded-lg transition-all duration-200 hover:-translate-y-0.5 border border-indigo-400 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
        >
          ▶ Start Turn {state.turnNumber}
        </button>
      )}
      {canEnd && (
        <button
          onClick={endTurn}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm tracking-wide font-black rounded-lg transition-all duration-200 hover:-translate-y-0.5 border border-amber-400 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
        >
          ⏭ End Turn
        </button>
      )}
    </div>
  );
}
