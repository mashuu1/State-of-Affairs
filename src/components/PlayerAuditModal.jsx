import { useGame } from '../context/GameContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function PlayerAuditModal() {
  const { state, playerResolveAudit } = useGame();
  
  if (state.phase !== 'player_audit' && !state.playerAuditResult) return null;

  const pending = state.aiSlots.find(s => s && s.status === 'pending_player_audit');
  const isUpgrade = pending?.pendingAction === 'upgrade';

  // Show result overlay when resolved
  if (state.playerAuditResult && (state.phase === 'play' || state.phase === 'gameover')) {
    const kind = state.playerAuditResult.caught
      ? 'integrity'
      : state.playerAuditResult.investigated
        ? 'scandal'
        : 'pass';

    return (
      <div className="gov-event-wrap pointer-events-none">
        <AnimatePresence>
          <motion.div
            key="player-audit-result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={`gov-event ${kind === 'scandal' ? 'gov-event--scandal gov-shake' : kind === 'integrity' ? 'gov-event--integrity' : 'gov-event--pass'}`}
          >
            <div className="gov-event-kicker gov-heading">
              {kind === 'integrity' ? 'SCANDAL EXPOSED' : kind === 'scandal' ? 'FALSE ALARM' : 'NO INVESTIGATION'}
            </div>
            <div className="gov-event-body">{state.playerAuditResult.effects}</div>
            {kind === 'integrity' && <div className="gov-sparkles" aria-hidden />}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Active choice modal
  if (state.phase === 'player_audit') {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
        <div className="gov-modal gov-modal--player-audit">
          <div className="gov-modal-scan" />
          <h2 className="gov-modal-title gov-heading">
            {isUpgrade ? 'Upgrade Underway!' : 'Suspicious Activity!'}
          </h2>
          <p className="gov-modal-sub">
            {isUpgrade
              ? 'The AI is upgrading an Infrastructure Project face-down. Will you launch an investigation?'
              : 'The AI has initiated an Infrastructure Project face-down. Will you launch an investigation?'}
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => playerResolveAudit(true)}
              className="gov-choice gov-choice--investigate"
            >
              <div className="gov-choice-title gov-heading">INVESTIGATE</div>
              <div className="gov-choice-sub">-1 Trust if Innocent</div>
            </button>
            <button
              onClick={() => playerResolveAudit(false)}
              className="gov-choice gov-choice--pass"
            >
              <div className="gov-choice-title gov-heading">PASS</div>
              <div className="gov-choice-sub">{isUpgrade ? 'AI finishes upgrading' : 'AI finishes building'}</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
