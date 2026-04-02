export default function CardComponent({ card, onClick, draggable = false, onBoard = false, inDeck = false }) {
  const isInfra = card.type === 'infrastructure';
  const isSupport = card.type === 'support';
  const isAction = card.type === 'action';
  const isReform = isSupport || (isAction && card.actionType === 'reform');
  const isPolicy = isAction && card.actionType === 'policy';
  
  const cardClass =
    isInfra ? 'gov-card--infra' : isPolicy ? 'gov-card--policy' : isReform ? 'gov-card--reform' : 'gov-card--neutral';

  // On board: show status
  const isPending = onBoard && card.status === 'pending_audit';
  const isCorrupt = onBoard && card.corruptionToken;
  const isUpgraded = onBoard && isInfra && card.status === 'built' && card.upgraded;
  const canUpgrade = onBoard && isInfra && card.status === 'built' && !card.corruptionToken && !card.upgraded;
  const isFaceDown = onBoard && (card.status === 'pending_audit' || card.status === 'pending_player_audit');

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
      className={[
        'gov-card',
        cardClass,
        'relative select-none outline-none',
        onBoard ? 'w-full max-h-full' : inDeck ? 'w-full h-full' : 'w-[120px] sm:w-[150px] mx-1 flex-shrink-0',
        onBoard ? 'gov-card--board' : inDeck ? 'gov-card--deck' : 'gov-card--hand',
        draggable && !inDeck ? 'cursor-grab active:cursor-grabbing' : '',
        onClick ? 'cursor-pointer' : '',
        isFaceDown ? 'gov-card--facedown' : '',
        isCorrupt ? 'gov-card--corrupt' : '',
      ].join(' ')}
      style={{ 
        aspectRatio: '330 / 539',
        transformStyle: 'preserve-3d'
      }}
      draggable={draggable && isInfra}
      onDragStart={handleDragStart}
      onClick={() => onClick && onClick(card)}
      data-card-type={card.type}
      data-action-type={card.actionType || ''}
      data-status={card.status || ''}
    >
      {/* ════ FRONT FACE ════ */}
      <div 
        className={[
          'gov-card-face',
          'gov-card-face--front',
          'absolute inset-0 rounded-[10px] border-[1px]',
          isPending ? 'pending-shimmer' : '',
        ].join(' ')}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[10px]">
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 rounded-[10px] z-20 backdrop-blur-[2px]">
            <span className="text-[12px] text-amber-400 font-black tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center">
              {card.pendingAction === 'upgrade' ? (
                <>
                  PENDING
                  <br />
                  UPGRADE
                  <br />
                  AUDIT
                </>
              ) : (
                <>
                  PENDING
                  <br />
                  AUDIT
                </>
              )}
            </span>
          </div>
        )}

        {/* Upgrade badges */}
        {(isUpgraded || canUpgrade) && !isPending && (
          <div className="absolute top-1 left-1 z-20">
            <span className={`text-[9px] px-1 py-0.5 rounded font-black drop-shadow bg-black/70 ${
              isUpgraded ? 'text-cyan-300' : 'text-amber-300'
            }`}>
              {isUpgraded ? `LV ${(card.level || 2)}` : '▲ UPGRADE (8💰)'}
            </span>
          </div>
        )}

        {/* Category glyphs / stamps */}
        {!isFaceDown && (
          <div className="absolute top-1 right-1 z-20 flex items-center gap-1">
            {isReform && (
              <span className="gov-chip gov-chip--cert" aria-hidden>
                CERTIFIED
              </span>
            )}
            {isPolicy && (
              <span className="gov-chip gov-chip--policy" aria-hidden title="Policy">
                §
              </span>
            )}
            {isInfra && (
              <span className="gov-chip gov-chip--blueprint" aria-hidden title="Blueprint">
                ⌁
              </span>
            )}
          </div>
        )}

        {/* --- Card Text Overlay --- */}
        <div className="relative z-10 w-full h-full flex flex-col p-2 text-center items-center pointer-events-none">
          
          {/* Top Header: Name */}
          <div 
            className="gov-card-title text-[12px] font-black text-white uppercase leading-tight mt-[2%]"
          >
            {card.name}
          </div>
          
          {/* Middle: Effect and Description */}
          <div className="gov-card-body">
            <div
              className="gov-card-cost"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.12em" }}
            >
              {getCostText()}
            </div>

            <div
              className="gov-card-brief gov-heading"
            >
              {isInfra ? 'PROJECT BRIEF' : isPolicy ? 'POLICY BRIEF' : 'REFORM BRIEF'}
            </div>

            <div className="gov-card-divider" />

            <div
              className="gov-card-desc"
            >
              {card.description}
            </div>

            {isInfra && (
              <div className="gov-card-rewards">
                <div className="gov-card-reward gov-card-reward--good">
                  <span>✓</span>
                  <span>Honest: {card.honestReward}</span>
                </div>
                <div className="gov-card-reward gov-card-reward--bad">
                  <span>✗</span>
                  <span>Corrupt: {card.corruptReward}</span>
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
        className={[
          'gov-card-face',
          'gov-card-face--back',
          'absolute inset-0 rounded-[10px]',
        ].join(' ')}
        style={{
          backfaceVisibility: 'hidden', 
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      />

      {(isFaceDown || isPending) && (
        <div className="gov-card-stamp" aria-hidden>
          <div className="gov-card-stamp-inner">
            <div className="gov-card-stamp-top gov-heading">
              {card.pendingAction === 'upgrade' ? 'CLASSIFIED UPGRADE' : 'CONFIDENTIAL'}
            </div>
            <div className="gov-card-stamp-sub">
              {isInfra ? 'INFRASTRUCTURE DOSSIER' : isPolicy ? 'POLICY FILE' : 'REFORM FILE'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
