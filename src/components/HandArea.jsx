import { useState } from 'react';
import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';
import { motion, AnimatePresence } from 'framer-motion';

export default function HandArea({ onSelectCard, dimmed = false }) {
  const { state, playAction, playSupport, showToast } = useGame();
  const [selectingTarget, setSelectingTarget] = useState(null);

  const handleCardClick = (card) => {
    onSelectCard && onSelectCard(card);
    if (state.phase !== 'play' || !state.turnStarted) return;

    if (card.type === 'support') {
      if (card.effect === 'remove_corruption') {
        if (card.cost > 0 && state.budget < card.cost) return showToast('Not enough budget!', 'error');
        const hasCorrupt = state.agendaSlots.some(s => s && s.corruptionToken);
        if (hasCorrupt) {
          setSelectingTarget(card);
        } else {
          showToast('No corrupt buildings to target!', 'info');
        }
      } else {
        if (card.cost > 0 && state.budget < card.cost) return showToast('Not enough budget!', 'error');
        playSupport(card);
      }
    } else if (card.type === 'action') {
      if (card.actionType === 'reform') {
        const hasCorrupt = state.agendaSlots.some(s => s && s.corruptionToken);
        if (hasCorrupt) {
          setSelectingTarget(card);
        } else {
          showToast('No corrupt buildings to target!', 'info');
        }
      } else if (card.actionType === 'policy') {
        playAction(card);
      }
    }
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

      {/* Hand — cards peek from bottom */}
      <div className={`hand-tray ${dimmed ? 'hand-tray--dimmed' : ''}`}>
        <AnimatePresence>
          {state.hand.map((card, i) => {
            const total = state.hand.length;
            const center = (total - 1) / 2;
            const offset = i - center;
            const fan = Math.min(12, Math.max(6, total * 1.6));
            const rotate = offset * (fan / Math.max(1, total - 1));
            const spacing =
              total <= 3 ? 118 :
              total <= 5 ? 96 :
              total <= 7 ? 78 :
              66;
            const x = offset * spacing;
            const y = Math.abs(offset) * 3;

            return (
            <motion.div 
              key={card.id} 
              layoutId={card.id}
              initial={{ opacity: 0, scale: 0.5, y: 80 }}
              animate={{ opacity: 1, scale: 1, x, y, rotate, filter: 'none' }}
              exit={{ opacity: 0, scale: 0.8, y: 80 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="hand-card-slot"
              style={{ zIndex: 10 + i, transformOrigin: '50% 100%' }}
            >
              <motion.div
                initial={{ rotateY: 180 }}
                animate={{ rotateY: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.35 }}
                style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
                whileHover={{ y: -18, scale: 1.08, rotate: rotate * 0.15, filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.22))' }}
              >
                <CardComponent
                  card={card}
                  draggable={card.type === 'infrastructure' && state.phase === 'play' && state.turnStarted}
                  onClick={handleCardClick}
                />
              </motion.div>
            </motion.div>
          )})}
        </AnimatePresence>
        {state.hand.length === 0 && (
          <p className="text-slate-500 text-xs italic">No cards in hand</p>
        )}
      </div>
    </div>
  );
}
