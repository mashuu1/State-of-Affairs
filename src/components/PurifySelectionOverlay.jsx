import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurifySelectionOverlay() {
  const { state, cancelPurifySelection } = useGame();

  if (!state.isSelectingPurify) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-black/80 backdrop-blur-md border-2 border-red-900/50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-0.5">Selection Mode</span>
            <span className="text-sm font-bold text-white uppercase tracking-tight">Select a Corrupt Project to Dismantle</span>
          </div>
          
          <div className="h-6 w-[1px] bg-white/20" />
          
          <button
            onClick={cancelPurifySelection}
            className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </div>
      
      {/* Full screen dim for selection */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-red-900/5 z-[70] pointer-events-none"
      />
    </AnimatePresence>
  );
}
