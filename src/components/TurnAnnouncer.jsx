import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function TurnAnnouncer() {
  const { state } = useGame();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    if (state.turnStarted && state.phase === 'play') {
      setAnnouncement(`TURN ${state.turnNumber} START!`);
      const timer = setTimeout(() => setAnnouncement(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [state.turnStarted, state.turnNumber, state.phase]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[110]">
      <AnimatePresence>
        {announcement && (
          <motion.div
            initial={{ scale: 2, opacity: 0, letterSpacing: "-0.5em" }}
            animate={{ scale: 1, opacity: 1, letterSpacing: "0.2em" }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.6 }}
            className="flex items-center justify-center bg-transparent w-full"
          >
            {/* Dark gradient band behind the text for Master Duel look */}
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 120, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full flex items-center justify-center bg-gradient-to-r from-transparent via-cyan-900/60 to-transparent backdrop-blur-sm border-y border-cyan-500/30"
            />
            
            <h1 
              className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] z-10"
              style={{ 
                fontFamily: "'Pixelify Sans', monospace",
                WebkitTextStroke: "2px rgba(8, 145, 178, 0.5)",
              }}
            >
              {announcement}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
