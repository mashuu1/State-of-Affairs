import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurifyModal() {
  const { state, closePurify, purifyFullAccountability, selectTargetedPurify } = useGame();

  if (!state.isPurifying) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePurify}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="gov-modal relative z-10 w-full max-w-md border-4 border-red-900 bg-[#faedcd] p-6 shadow-2xl"
        >
          {/* Decorative scanline overlay */}
          <div className="gov-modal-scan" />
          
          <div className="text-center border-b border-red-900/20 pb-4">
            <div className="text-[10px] font-black text-red-900 uppercase tracking-[0.2em] mb-1">State Purification Protocol</div>
            <h2 className="text-3xl font-black text-red-900 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              CHOOSE YOUR PATH
            </h2>
            <p className="mt-2 text-sm text-red-950/70 font-medium italic">
              "To restore public trust, a sacrifice must be made."
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {/* Option 1: Full Accountability */}
            <button
              onClick={purifyFullAccountability}
              className="w-full text-left p-4 rounded-xl border-2 border-red-900/30 bg-red-900/5 hover:bg-red-900/10 hover:border-red-600 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-black text-red-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  Full Accountability
                </span>
                <span className="px-2 py-0.5 bg-red-900 text-white text-[9px] font-bold rounded uppercase">System Cleanse</span>
              </div>
              <p className="text-xs text-red-950/80 leading-relaxed">
                Take responsibility for all corrupt dealings. <span className="font-bold underline">Clears ALL corruption tokens</span> from the state, but <span className="font-bold underline">you cannot play for 2 turns</span>.
              </p>
              <div className="mt-3 flex gap-2">
                <div className="px-2 py-1 bg-red-900/20 rounded text-[9px] font-black text-red-900 uppercase">Clear All Slots</div>
                <div className="px-2 py-1 bg-red-900/20 rounded text-[9px] font-black text-red-900 uppercase">2-Turn Penalty</div>
              </div>
            </button>

            {/* Option 2: Targeted Restitution */}
            <button
              onClick={selectTargetedPurify}
              className="w-full text-left p-4 rounded-xl border-2 border-slate-900/30 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-600 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-black text-slate-800 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  Targeted Restitution
                </span>
                <span className="px-2 py-0.5 bg-slate-700 text-white text-[9px] font-bold rounded uppercase">Precision Cut</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Dismantle a specific corrupt project to save face. <span className="font-bold">Destroy one corrupt asset</span> and remove its token. Costs <span className="font-bold">-1 Development Point</span>, but allows you to continue your term without interruption.
              </p>
              <div className="mt-3 flex gap-2">
                <div className="px-2 py-1 bg-slate-900/10 rounded text-[9px] font-black text-slate-900 uppercase">Lose -1 DP</div>
                <div className="px-2 py-1 bg-slate-900/10 rounded text-[9px] font-black text-slate-900 uppercase">No Turn Penalty</div>
              </div>
            </button>
          </div>

          <button
            onClick={closePurify}
            className="mt-6 w-full py-3 text-[10px] font-black text-slate-900/40 hover:text-red-900 uppercase tracking-widest transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wait... reconsider the cost
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
