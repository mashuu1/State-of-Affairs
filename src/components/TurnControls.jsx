import { useGame } from '../context/GameContext';

export default function TurnControls() {
  const { state, startTurn, endTurn } = useGame();

  const canStart = state.phase === 'play' && !state.turnStarted && !state.aiThinking;
  const canEnd = state.phase === 'play' && state.turnStarted && !state.aiThinking;

  return (
    <div className="flex flex-col items-center gap-2">
      {state.incarceratedTurns > 0 && (
        <div className="px-3 py-1 bg-red-900/40 border border-red-500/50 rounded flex items-center gap-2">
          <span className="animate-pulse">⚖</span>
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
            Incarcerated: {state.incarceratedTurns} Turns Left
          </span>
        </div>
      )}
      {canStart && (
        <button
          onClick={startTurn}
          className="gov-btn gov-btn--start"
          style={{ fontSize: '16px', padding: '16px 28px', minWidth: '160px' }}
        >
          {state.incarceratedTurns > 0 ? 'Skip Turn' : `Start Turn ${state.turnNumber}`}
        </button>
      )}
      {canEnd && (
        <button
          onClick={endTurn}
          className="gov-btn gov-btn--end"
          style={{ fontSize: '16px', padding: '16px 28px', minWidth: '160px' }}
        >
          End Turn
        </button>
      )}
    </div>
  );
}
