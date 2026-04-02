import { motion } from 'framer-motion';

export default function CardPreview({ card }) {
  if (!card) return null;

  const isInfra = card?.type === 'infrastructure';
  const isSupport = card?.type === 'support';
  const isAction = card?.type === 'action';
  const isPolicy = isAction && card?.actionType === 'policy';

  const typeBg = isInfra ? 'bg-slate-700/70' : isPolicy ? 'bg-cyan-700/70' : 'bg-emerald-700/70';
  const glowColor = isInfra ? 'rgba(34,211,238,0.18)' : isPolicy ? 'rgba(34,211,238,0.18)' : 'rgba(16,185,129,0.18)';
  const typeLabel = isInfra ? 'INFRASTRUCTURE' : isSupport ? 'REFORM' : isPolicy ? 'POLICY' : 'ACTION';

  return (
    <motion.div
      initial={{ opacity: 0, x: -14, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="card-preview-panel"
      style={{
        fontFamily: "var(--font-body)",
        boxShadow: `0 0 30px ${glowColor}, 0 8px 32px rgba(0,0,0,0.8)`,
      }}
    >
      <div className="card-preview-glow-line" />

      <div className="px-4 pt-3 pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-black tracking-[0.2em] px-2 py-0.5 rounded ${typeBg} text-white`}>
            {typeLabel}
          </span>
        </div>
        <h3
          className="text-lg font-black text-white uppercase tracking-wide leading-tight"
          style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.7)', fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}
        >
          {card.name}
        </h3>
      </div>

      <div className="card-preview-body">
        <div className="px-4 py-2 border-b border-slate-700/50 bg-black/30">
          {isInfra && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 tracking-wider">HONEST COST</span>
                <span className="text-sm font-black text-amber-400" style={{ textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
                  💰 {card.honestCost}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 tracking-wider">CUT CORNERS</span>
                <span className="text-sm font-black text-red-400" style={{ textShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                  💰 {card.corruptCost}
                </span>
              </div>
            </div>
          )}
          {isSupport && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 tracking-wider">COST</span>
              <span className="text-sm font-black text-amber-400" style={{ textShadow: '0 0 8px rgba(251,191,36,0.5)' }}>
                {card.cost > 0 ? `💰 ${card.cost}` : '✦ FREE'}
              </span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 card-preview-scroll">
          <div className="text-[10px] font-black text-cyan-400/60 tracking-[0.15em] mb-1.5">EFFECT</div>
          <p className="text-[13px] font-bold text-slate-200 leading-relaxed" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.65)' }}>
            {card.description}
          </p>
        </div>

        {isInfra && (
          <div className="px-4 py-2 border-t border-slate-700/50 bg-black/20 space-y-1.5">
            <div className="text-[10px] font-black text-cyan-400/60 tracking-[0.15em] mb-1">REWARDS</div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs">✓</span>
              <div>
                <span className="text-[10px] text-emerald-300 font-black tracking-wider">HONEST</span>
                <p className="text-[12px] text-emerald-200 font-bold" style={{ textShadow: '1px 1px 0 #000' }}>
                  {card.honestReward}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 text-xs">✗</span>
              <div>
                <span className="text-[10px] text-red-300 font-black tracking-wider">CORRUPT</span>
                <p className="text-[12px] text-red-200 font-bold" style={{ textShadow: '1px 1px 0 #000' }}>
                  {card.corruptReward}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card-preview-glow-line card-preview-glow-bottom" />
    </motion.div>
  );
}
