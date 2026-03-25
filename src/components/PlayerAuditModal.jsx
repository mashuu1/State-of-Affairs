import { useGame } from '../context/GameContext';

export default function PlayerAuditModal() {
  const { state, playerResolveAudit } = useGame();
  
  if (state.phase !== 'player_audit' && !state.playerAuditResult) return null;

  // Show result overlay when resolved
  if (state.playerAuditResult && (state.phase === 'play' || state.phase === 'gameover')) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-fadeIn pointer-events-none">
        <div className={`px-6 py-4 rounded-[4px] border-[2px] shadow-[4px_4px_0_#000] max-w-sm text-center ${
          state.playerAuditResult.caught
            ? 'bg-[#22c55e] border-[#14532d]' // Player won the audit (AI caught) -> Green success
            : 'bg-[#ef4444] border-[#7f1d1d]' // Player lost trust or passed -> Red/Warning
        }`}>
          <p className="text-[12px] font-black tracking-wider text-white" style={{ textShadow: '1px 1px 0 #000' }}>
            {state.playerAuditResult.effects}
          </p>
        </div>
      </div>
    );
  }

  // Active choice modal
  if (state.phase === 'player_audit') {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-[#1e293b] border-[2px] border-black rounded-[4px] p-6 max-w-sm w-full mx-4 animate-fadeIn shadow-[8px_8px_0_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Pixelify Sans', monospace" }}>
          <h2 className="text-xl font-black text-[#f59e0b] text-center mb-2" style={{ textShadow: '2px 2px 0 #000' }}>Suspicious Activity!</h2>
          <p className="text-[12px] text-white text-center mb-6 leading-relaxed" style={{ textShadow: '1px 1px 0 #000' }}>
            The AI has initiated an Infrastructure Project face-down. Will you launch an investigation?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => playerResolveAudit(true)}
              className="flex-1 py-3 bg-[#b91c1c] hover:bg-[#991b1b] border-[2px] border-black text-white font-black rounded shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all"
            >
              🔍 Investigate
              <div className="text-[9px] opacity-80 mt-1 font-normal">-1 Trust if Innocent!</div>
            </button>
            <button
              onClick={() => playerResolveAudit(false)}
              className="flex-1 py-3 bg-[#475569] hover:bg-[#334155] border-[2px] border-black text-white font-black rounded shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] transition-all"
            >
              👎 Pass
              <div className="text-[9px] opacity-80 mt-1 font-normal">AI finishes building</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
