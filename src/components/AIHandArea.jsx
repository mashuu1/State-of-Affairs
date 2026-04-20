import { useGame } from '../context/GameContext';
import CardComponent from './CardComponent';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIHandArea() {
  const { state } = useGame();
  const hand = state.aiHand || [];

  return (
    <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-40">
      <div className="relative flex items-start justify-center w-full mt-[-20px]">
        <AnimatePresence>
          {hand.map((card, i) => {
            const total = hand.length;
            const center = (total - 1) / 2;
            const offset = i - center;
            
            const fan = Math.min(10, Math.max(5, total * 1.5));
            const rotate = offset * (fan / Math.max(1, total - 1));
            const spacing = total <= 5 ? 42 : 32;
            const x = offset * spacing;
            // Arc curves upward (negative y) so cards face away from player
            const y = -Math.abs(offset) * 2.5;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: -200, rotate: 0 }}
                animate={{ 
                  opacity: 1, 
                  x, 
                  y, 
                  rotate: -rotate,
                  scale: 0.75 
                }}
                exit={{ opacity: 0, y: -200 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                className="absolute origin-center"
              >
                <div className="w-[85px] sm:w-[105px] pointer-events-none"
                  style={{ transform: 'rotate(180deg)' }}
                >
                  {/* Face-down cards with 3D transform */}
                  <div style={{ transform: 'rotateY(180deg)', transformStyle: 'preserve-3d' }}>
                    <CardComponent card={card} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

