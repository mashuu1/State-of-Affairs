import { useState } from 'react';
import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';

export default function AgendaBoard({ isAI = false }) {
  const { state, dragToSlot } = useGame();
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
    <div className="flex items-center justify-center gap-3">
      {slots.map((card, idx) => (
        <div
          key={idx}
          className={`
            w-[90px] sm:w-[120px] rounded-[4px] border-2 transition-all duration-200
            ${card ? 'border-transparent bg-transparent' : 'border-dashed border-slate-600 bg-slate-900/50'}
            ${dragOverSlot === idx ? 'slot-highlight scale-105' : ''}
            ${!card && !isAI ? 'hover:border-slate-500' : ''}
            flex flex-col items-center justify-center
          `}
          style={{ aspectRatio: '330 / 539' }}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, idx)}
        >
          {card ? (
            <CardComponent card={card} onBoard={true} />
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
