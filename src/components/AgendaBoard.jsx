import { useState } from 'react';
import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';
import PaymentModal from './PaymentModal';

export default function AgendaBoard({ isAI = false }) {
  const { state, dragToSlot, upgradeInfrastructure, purifySlot, playSupport, showToast } = useGame();
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [paymentSlot, setPaymentSlot] = useState(null);

  const slots = isAI ? state.aiSlots : state.agendaSlots;
  const isSelectingPurify = !isAI && state.isSelectingPurify;

  const handleDragOver = (e, idx) => {
    if (isAI) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(idx);
  };

  const handleDragLeave = () => setDragOverSlot(null);

  const handleDrop = (e, idx) => {
    if (isAI) return;
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const cardStr = e.dataTransfer.getData('cardData') || e.dataTransfer.getData('text/plain');
      if (!cardStr) {
        console.warn('Drop failed: No cardData or text/plain found in dataTransfer');
        return;
      }
      const cardData = JSON.parse(cardStr);
      
      if (cardData.type === 'infrastructure') {
        dragToSlot(cardData, idx);
      } else if (cardData.type === 'support') {
        // If it targets a specific building (like remove_corruption)
        if (cardData.effect === 'remove_corruption') {
          const target = slots[idx];
          if (target && target.corruptionToken) {
            playSupport(cardData, idx);
          } else {
            showToast('Target must be a corrupt building!', 'info');
          }
        } else {
          // Global support card
          playSupport(cardData);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleCardClick = (idx, card) => {
    if (isAI) return;
    
    if (isSelectingPurify) {
      if (card.corruptionToken) {
        purifySlot(idx);
      }
      return;
    }

    if (card.buildType === 'phased' && card.status === 'building') {
      setPaymentSlot(idx);
    } else if (card.status === 'building') {
      // Ignore click on bayanihan building, give a small feedback or just do nothing
      return;
    } else if (card.status === 'built') {
      upgradeInfrastructure(idx);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        {slots.map((card, idx) => (
          <div
            key={idx}
            className={[
              'arena-slot',
              'w-[100px] sm:w-[120px]',
              card ? 'arena-slot--occupied' : 'arena-slot--empty',
              dragOverSlot === idx ? 'slot-highlight scale-[1.03]' : '',
              !isAI && state.draggingCard?.type === 'support' ? 'slot-highlight-support' : '',
              !card && !isAI ? 'arena-slot--droppable' : '',
              isSelectingPurify && card?.corruptionToken ? 'ring-4 ring-red-500 animate-pulse cursor-pointer z-10' : '',
              isSelectingPurify && !card?.corruptionToken ? 'opacity-40 grayscale cursor-default' : '',
            ].join(' ')}
            style={{ aspectRatio: '330 / 539' }}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
          >
            {card ? (
              <CardComponent
                card={card}
                onBoard={true}
                onClick={!isAI ? () => handleCardClick(idx, card) : undefined}
              />
            ) : (
              <div className="text-center">
                <span className="text-2xl text-slate-700 font-bold">{idx + 1}</span>
                {!isAI && (
                  <p className="text-[8px] text-slate-600 mt-1">DROP HERE</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {paymentSlot !== null && (
        <PaymentModal slotIndex={paymentSlot} onClose={() => setPaymentSlot(null)} />
      )}
    </>
  );
}
