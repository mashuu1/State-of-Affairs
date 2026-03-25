import { useState } from 'react';
import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';
import { motion, AnimatePresence } from 'framer-motion';

export default function HandArea() {
  const { state, playAction, playSupport } = useGame();
  const [selectingTarget, setSelectingTarget] = useState(null); // card needing a corrupt slot target

  const handleCardClick = (card) => {
    if (state.phase !== 'play' || !state.turnStarted) return;

    if (card.type === 'support') {
      // Support/Utility cards
      if (card.effect === 'remove_corruption') {
        // Check if player can afford it
        if (card.cost > 0 && state.budget < card.cost) return;
        // Need to select a corrupt slot
        const hasCorrupt = state.agendaSlots.some(s => s && s.corruptionToken);
        if (hasCorrupt) {
          setSelectingTarget(card);
        }
      } else {
        // Whistleblower & Economic Boom — no target needed
        if (card.cost > 0 && state.budget < card.cost) return;
        playSupport(card);
      }
    } else if (card.type === 'action') {
      if (card.actionType === 'reform') {
        const hasCorrupt = state.agendaSlots.some(s => s && s.corruptionToken);
        if (hasCorrupt) {
          setSelectingTarget(card);
        }
      } else if (card.actionType === 'policy') {
        playAction(card);
      }
    }
    // Infrastructure cards are dragged, not clicked
  };

  const handleTargetSelect = (slotIdx) => {
    if (!selectingTarget) return;
    if (selectingTarget.type === 'support') {
      playSupport(selectingTarget, slotIdx);
    } else {
      playAction(selectingTarget, slotIdx);
    }
    setSelectingTarget(null);
  };

  return (
    <div className="relative">
      {/* Target selection overlay */}
      {selectingTarget && (
        <div className="absolute -top-24 left-0 right-0 flex items-center justify-center gap-2 z-20 animate-fadeIn">
          <span className="text-[10px] text-teal-300 mr-2">Select corrupt building:</span>
          {state.agendaSlots.map((slot, idx) => (
            slot && slot.corruptionToken ? (
              <button
                key={idx}
                onClick={() => handleTargetSelect(idx)}
                className="px-2 py-1 text-[10px] bg-teal-700 hover:bg-teal-600 text-white rounded border border-teal-500 transition-colors"
              >
                Slot {idx + 1}: {slot.name}
              </button>
            ) : null
          ))}
          <button
            onClick={() => setSelectingTarget(null)}
            className="px-2 py-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-white rounded border border-slate-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Hand */}
      <div className="flex items-end justify-center gap-2">
        <AnimatePresence>
          {state.hand.map((card) => (
            <motion.div 
              key={card.id} 
              layoutId={card.id}
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <motion.div
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.35 }}
                style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
              >
                <CardComponent
                  card={card}
                  draggable={card.type === 'infrastructure' && state.phase === 'play' && state.turnStarted}
                  onClick={handleCardClick}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        {state.hand.length === 0 && (
          <p className="text-slate-500 text-xs italic">No cards in hand</p>
        )}
      </div>
    </div>
  );
}
