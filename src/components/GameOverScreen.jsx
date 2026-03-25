import { useGame } from '../context/GameContext';

export default function GameOverScreen() {
  const { state, restart } = useGame();

  if (state.phase !== 'gameover') return null;

  const isVictory = state.gameResult === 'victory' || state.gameResult === 'victory_termlimit';

  const messages = {
    victory: { title: '🏆 VICTORY!', subtitle: 'You reached 4 Development Points!', color: 'emerald' },
    victory_termlimit: { title: '🏆 TERM ENDED — YOU WIN!', subtitle: `You led with ${state.developmentPoints} DP vs AI's ${state.aiDP} DP.`, color: 'emerald' },
    defeat_impeachment: { title: '💀 IMPEACHED!', subtitle: 'Your Public Trust hit zero. The people have spoken.', color: 'red' },
    defeat_termlimit: { title: '😞 TERM ENDED — DEFEAT', subtitle: `AI had ${state.aiDP} DP vs your ${state.developmentPoints} DP.`, color: 'red' },
  };

  const msg = messages[state.gameResult] || messages.defeat_impeachment;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
      <div className={`bg-slate-800 border-2 rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-fadeIn shadow-2xl ${
        isVictory ? 'border-emerald-400' : 'border-red-400'
      }`}>
        <h1 className="text-3xl font-bold text-white mb-2">{msg.title}</h1>
        <p className="text-sm text-slate-300 mb-6">{msg.subtitle}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-[10px] text-slate-400">Trust</p>
            <p className="text-xl font-bold text-white">{state.publicTrust}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-[10px] text-slate-400">DP</p>
            <p className="text-xl font-bold text-emerald-400">{state.developmentPoints}</p>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <p className="text-[10px] text-slate-400">Turns</p>
            <p className="text-xl font-bold text-white">{state.turnNumber}</p>
          </div>
        </div>

        <button
          onClick={restart}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-200 hover:scale-105 ${
            isVictory
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
