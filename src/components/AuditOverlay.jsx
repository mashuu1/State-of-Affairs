import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function AuditOverlay() {
  const { state, resolveAudit } = useGame();
  const [stage, setStage] = useState('thinking'); // 'thinking' | 'result'
  const [showResult, setShowResult] = useState(false);

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

  useEffect(() => {
    if (state.auditResult && state.phase === 'play') {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 4000);
      return () => clearTimeout(timer);
    } else if (!state.auditResult) {
      setShowResult(false);
    }
  }, [state.auditResult, state.phase]);

  if (state.phase !== 'audit' && (!state.auditResult || state.phase === 'gameover')) return null;

  // Show result for a moment after audit resolves
  if (state.auditResult && state.phase === 'play') {
    const kind = state.auditResult.caught
      ? 'scandal'
      : state.auditResult.audited
        ? 'integrity'
        : 'pass';

    return (
      <AnimatePresence>
        {showResult && (
          <motion.div
            key="audit-result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="gov-event-wrap pointer-events-none"
          >
            <div className={`gov-event ${kind === 'scandal' ? 'gov-event--scandal gov-shake' : kind === 'integrity' ? 'gov-event--integrity' : 'gov-event--pass'}`}>
              <div className="gov-event-kicker gov-heading">
                {kind === 'scandal' ? 'SCANDAL!' : kind === 'integrity' ? 'INTEGRITY BONUS' : 'NO AUDIT'}
              </div>
              <div className="gov-event-quote">“{state.auditResult.flavor}”</div>
              <div className="gov-event-body">{state.auditResult.effects}</div>
              {kind === 'integrity' && <div className="gov-sparkles" aria-hidden />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Thinking state
  if (state.phase === 'audit' && stage === 'thinking') {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
        <div className="gov-modal gov-modal--audit">
          <div className="gov-modal-scan" />
          <div className="gov-modal-top gov-heading">AUDIT REVIEW</div>
          <div className="gov-modal-title gov-heading">Opposition Committee</div>
          <div className="gov-modal-sub">Cross-checking procurement reports, vendor bids, and site inspections…</div>
          <div className="gov-modal-dots" aria-hidden>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
