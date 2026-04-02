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
          className="gov-btn gov-btn--start"
        >
          Start Turn {state.turnNumber}
        </button>
      )}
      {canEnd && (
        <button
          onClick={endTurn}
          className="gov-btn gov-btn--end"
        >
          End Turn
        </button>
      )}
    </div>
  );
}
