import { useState } from 'react';
import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';

export default function AgendaBoard({ isAI = false }) {
  const { state, dragToSlot, upgradeInfrastructure } = useGame();
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const slots = isAI ? state.aiSlots : state.agendaSlots;

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
      const cardData = JSON.parse(e.dataTransfer.getData('cardData'));
      dragToSlot(cardData, idx);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {slots.map((card, idx) => (
        <div
          key={idx}
          className={[
            'arena-slot',
            'w-[92px] sm:w-[124px]',
            card ? 'arena-slot--occupied' : 'arena-slot--empty',
            dragOverSlot === idx ? 'slot-highlight scale-[1.03]' : '',
            !card && !isAI ? 'arena-slot--droppable' : '',
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
              onClick={!isAI ? () => upgradeInfrastructure(idx) : undefined}
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
  );
}
