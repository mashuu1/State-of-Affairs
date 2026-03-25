export default function CardComponent({ card, onClick, draggable = false, onBoard = false, inDeck = false }) {
  const isInfra = card.type === 'infrastructure';
  const isSupport = card.type === 'support';
  
  // Color scheme per card type
  const bgColorClass = isInfra ? "bg-[#71717a]" : isSupport ? "bg-[#22c55e]" : "bg-[#22c55e]";
  const borderColor = isInfra ? "border-[#3f3f46]" : isSupport ? "border-[#14532d]" : "border-[#14532d]";

  // On board: show status
  const isPending = onBoard && card.status === 'pending_audit';
  const isCorrupt = onBoard && card.corruptionToken;

  const handleDragStart = (e) => {
    if (!draggable) return;

    const ghostInfo = e.currentTarget.getBoundingClientRect();
    const ghostNode = e.currentTarget.cloneNode(true);
    
    if (ghostNode.childNodes.length > 1) {
      ghostNode.lastChild.style.display = 'none';
    }
    
    ghostNode.style.position = 'absolute';
    ghostNode.style.top = '-1000px';
    ghostNode.style.left = '-1000px';
    ghostNode.style.width = ghostInfo.width + 'px';
    ghostNode.style.height = ghostInfo.height + 'px';
    ghostNode.style.transform = 'none';
    document.body.appendChild(ghostNode);
    
    e.dataTransfer.setDragImage(ghostNode, ghostInfo.width / 2, ghostInfo.height / 2);
    
    setTimeout(() => {
      if (document.body.contains(ghostNode)) {
        document.body.removeChild(ghostNode);
      }
    }, 0);

    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardData', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  };

  const pixelTextStyle = {
    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 0 rgba(0,0,0,0.8)',
    letterSpacing: '0.5px'
  };

  // Build cost/reward display text
  const getCostText = () => {
    if (isInfra) {
      return `Honest: ${card.honestCost}💰 / Cut: ${card.corruptCost}💰`;
    }
    if (isSupport) {
      if (card.cost > 0) return `Cost: ${card.cost} Budget`;
      return 'Free';
    }
    return '';
  };

  const getTypeLabel = () => {
    if (isInfra) return 'INFRA';
    if (isSupport) return 'SUPPORT';
    return 'ACTION';
  };

  const getCostBadge = () => {
    if (isInfra) return `⚒ ${card.honestCost}/${card.corruptCost}`;
    if (isSupport && card.cost > 0) return `💰 ${card.cost}`;
    if (isSupport) return '✦ Free';
    return '⚡ Act';
  };

  return (
    <div
      className={`
        relative select-none outline-none
        ${onBoard ? 'w-full max-h-full' : inDeck ? 'w-full h-full' : 'w-[120px] sm:w-[150px] mx-1 flex-shrink-0'}
        ${draggable && !inDeck ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform' : ''}
      `}
      style={{ 
        aspectRatio: '330 / 539',
        transformStyle: 'preserve-3d'
      }}
      draggable={draggable && isInfra}
      onDragStart={handleDragStart}
      onClick={() => onClick && onClick(card)}
    >
      {/* ════ FRONT FACE ════ */}
      <div 
        className={`absolute inset-0 rounded-[4px] border-[2px] ${borderColor} ${bgColorClass}
          ${isPending ? 'pending-shimmer' : ''}
          ${isCorrupt ? 'shadow-[0_0_10px_rgba(239,68,68,0.8)]' : ''}
          ${!inDeck && !onBoard ? 'shadow-[2px_2px_0_rgba(0,0,0,0.5)] hover:shadow-[4px_4px_0_rgba(0,0,0,0.5)]' : ''}
          ${inDeck ? 'shadow-[1px_1px_0_rgba(0,0,0,0.5)]' : ''}`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[2px]">
        {/* Corruption timer */}
        {isCorrupt && card.timer !== null && (
          <div className="absolute top-1 right-1 corruption-pulse z-20">
            <span className="text-red-500 font-black text-lg font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {card.timer}
            </span>
          </div>
        )}

        {/* Pending overlay */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-[2px] z-20 backdrop-blur-[1px]">
            <span className="text-[12px] text-amber-400 font-black tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center">PENDING<br/>AUDIT</span>
          </div>
        )}

        {/* --- Card Text Overlay --- */}
        <div className="relative z-10 w-full h-full flex flex-col p-2 text-center items-center pointer-events-none">
          
          {/* Top Header: Name */}
          <div 
            className="text-[11px] font-black text-white uppercase leading-tight mt-[2%]"
            style={pixelTextStyle}
          >
            {card.name}
          </div>
          
          {/* Middle: Effect and Description */}
          <div className="flex-1 flex flex-col justify-center items-center w-full px-1">
            {/* Cost display */}
            <div 
              className="text-[9px] font-black text-amber-300 tracking-wider mb-1 px-1.5 py-0.5 bg-black/40 rounded"
              style={pixelTextStyle}
            >
              {getCostText()}
            </div>

            <div 
              className="text-[12px] font-black text-white tracking-wider mb-1"
              style={pixelTextStyle}
            >
              EFFECT
            </div>
            <div 
              className="text-[9px] font-black text-white leading-snug px-1 text-balance"
              style={pixelTextStyle}
            >
              {card.description}
            </div>

            {/* Show reward for infrastructure */}
            {isInfra && (
              <div className="mt-1.5 w-full">
                <div className="text-[8px] font-black text-emerald-300 leading-snug" style={pixelTextStyle}>
                  ✓ Honest: {card.honestReward}
                </div>
                <div className="text-[8px] font-black text-red-300 leading-snug" style={pixelTextStyle}>
                  ✗ Corrupt: {card.corruptReward}
                </div>
              </div>
            )}
          </div>
          
        </div>

        {/* Footer: Type + Cost badges */}
        {!onBoard && (
          <div className="absolute bottom-1 left-0 w-full px-1.5 flex justify-between items-center text-[8px] font-black tracking-wider z-10 pointer-events-none pb-0.5">
            <span className="px-1 py-0.5 rounded bg-black/60 text-white drop-shadow">
              {getTypeLabel()}
            </span>
            <span className="px-1 py-0.5 rounded bg-black/60 text-amber-300 drop-shadow">
              {getCostBadge()}
            </span>
          </div>
        )}

        {/* Corruption indicator lower text */}
        {isCorrupt && !isPending && (
          <div className="absolute bottom-1 left-1.5 z-20">
            <span className="text-[9px] bg-black/60 px-1 py-0.5 rounded text-red-500 font-black drop-shadow">⚠ CORRUPT</span>
          </div>
        )}
        </div>
      </div>

      {/* ════ BACK FACE ════ */}
      <div 
        className={`absolute inset-0 rounded-[4px] bg-transparent
          ${!inDeck && !onBoard ? 'shadow-[2px_2px_0_rgba(0,0,0,0.5)]' : ''}
          ${inDeck ? 'shadow-[1px_1px_0_rgba(0,0,0,0.5)]' : ''}`}
        style={{
          backfaceVisibility: 'hidden', 
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          backgroundImage: "url('/PJBG.png')",
          backgroundSize: '150%',
          backgroundPosition: 'center',
        }}
      />
    </div>
  );
}
