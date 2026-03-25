import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export default function AuditOverlay() {
  const { state, resolveAudit } = useGame();
  const [stage, setStage] = useState('thinking'); // 'thinking' | 'result'

  useEffect(() => {
    if (state.phase === 'audit' && !state.auditResult) {
      setStage('thinking');
      // AI "thinks" for 1.5s then resolves
      const timer = setTimeout(() => {
        resolveAudit();
        setStage('result');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.auditResult, resolveAudit]);

  if (state.phase !== 'audit' && (!state.auditResult || state.phase === 'gameover')) return null;

  // Show result for a moment after audit resolves
  if (state.auditResult && state.phase === 'play') {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-fadeIn">
        <div className={`px-6 py-4 rounded-xl border-2 shadow-2xl max-w-xs text-center ${
          state.auditResult.caught
            ? 'bg-red-900/90 border-red-500'
            : 'bg-emerald-900/90 border-emerald-500'
        }`}>
          <p className="text-xs text-slate-300 italic mb-2">"{state.auditResult.flavor}"</p>
          <p className="text-sm font-bold text-white">{state.auditResult.effects}</p>
        </div>
      </div>
    );
  }

  // Thinking state
  if (state.phase === 'audit' && stage === 'thinking') {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-slate-800 border-2 border-amber-500 rounded-xl p-6 max-w-xs text-center animate-fadeIn shadow-2xl">
          <div className="text-3xl mb-3 animate-bounce">🔍</div>
          <h3 className="text-base font-bold text-amber-300 mb-2">AI is investigating...</h3>
          <p className="text-xs text-slate-400">The opposition is deciding whether to audit your project.</p>
          <div className="mt-3 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
