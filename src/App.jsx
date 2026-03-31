import { useEffect, useState } from 'react';
import { GameProvider } from './context/GameContext';
import Dashboard from './components/Dashboard';
import AgendaBoard from './components/AgendaBoard';
import HandArea from './components/HandArea';
import ChoiceModal from './components/ChoiceModal';
import AuditOverlay from './components/AuditOverlay';
import PlayerAuditModal from './components/PlayerAuditModal';
import GameOverScreen from './components/GameOverScreen';
import TurnControls from './components/TurnControls';
import DeckPile from './components/DeckPile';
import PlayerHUD from './components/PlayerHUD';
import CardPreview from './components/CardPreview';
import ToastManager from './components/ToastManager';
import TurnAnnouncer from './components/TurnAnnouncer';
import OpponentScanOverlay from './components/OpponentScanOverlay';
import { LayoutGroup } from 'framer-motion';
import './App.css';

function GameBoard() {
  const [previewCard, setPreviewCard] = useState(null);
  const [opponentScanning, setOpponentScanning] = useState(false);

  return (
    <LayoutGroup>
      <div className="w-full h-full gov-shell gov-text overflow-hidden select-none relative"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gridTemplateRows: 'auto 1fr auto auto',
      }}
    >
      {/* ═══════ TOP-LEFT: Opponent Trust Bar ═══════ */}
      <div className="flex items-start justify-start px-4 pt-3">
        <div className="w-full max-w-[280px]">
          <Dashboard isAI={true} variant="trust" />
        </div>
      </div>

      {/* ═══════ TOP-CENTER: (empty, arena starts in middle row) ═══════ */}
      <div />

      {/* ═══════ TOP-RIGHT: Opponent Stats ═══════ */}
      <div className="flex items-start justify-end px-4 pt-3">
        <div className="w-full max-w-[560px]">
          <Dashboard isAI={true} variant="stats" />
        </div>
      </div>

      {/* ═══════ MIDDLE-LEFT: (empty) ═══════ */}
      <div />

      {/* ═══════ MIDDLE-CENTER: ARENA (the red-line area) ═══════ */}
      <div className="flex flex-col items-center justify-center py-1 gap-0 min-h-0 overflow-visible relative">
        {/* Opponent Chibi */}
        <div className="mb-1 flex flex-col items-center justify-center relative z-[80]">
          <img 
            src="/ai_character.gif" 
            alt="A.I. Opponent" 
            className="w-14 h-auto drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)] transition-transform hover:scale-105" 
            style={{ imageRendering: 'pixelated' }} 
          />
          <p className="text-[9px] text-slate-300 font-bold mt-0.5 tracking-widest drop-shadow-md">OPPONENT</p>
        </div>

        {/* AI Agenda Slots */}
        <div className="relative overflow-hidden rounded-xl shrink-0">
          <AgendaBoard isAI={true} />
          <OpponentScanOverlay onActiveChange={setOpponentScanning} />
        </div>

        {/* Center Divider */}
        <div className="flex items-center justify-center py-2 w-full px-4 shrink-0">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <span className="px-3 text-[9px] text-slate-500 font-bold tracking-[0.2em]">⚔ ARENA ⚔</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        {/* Player Agenda Slots & Deck */}
        <div className="relative flex items-center justify-center w-fit mx-auto shrink-0">
          <AgendaBoard isAI={false} />
          
          <div className="absolute min-w-max -right-36 sm:-right-56 top-1/2 -translate-y-[65%] origin-left pointer-events-none">
            <DeckPile />
          </div>
        </div>

        {/* Player Chibi */}
        <div className="mt-1 flex flex-col items-center justify-center">
          <img 
            src="/player_character.gif" 
            alt="Player Character" 
            className="w-12 h-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-105" 
            style={{ imageRendering: 'pixelated' }} 
          />
          <p className="text-[9px] text-slate-300 font-bold mt-0.5 tracking-widest drop-shadow-md">PLAYER</p>
        </div>
      </div>

      {/* ═══════ MIDDLE-RIGHT: Turn Controls ═══════ */}
      <div className="flex items-center justify-end px-4">
        <TurnControls />
      </div>

      {/* ═══════ HUD ROW: Player Stats Bar (spans full width) ═══════ */}
      <div className="col-span-3 flex items-center justify-center px-4 pt-1">
        <PlayerHUD />
      </div>

      {/* ═══════ BOTTOM: Hand Area (spans full width) ═══════ */}
      <div className="col-span-3 flex items-end justify-center pb-0">
        <HandArea onSelectCard={setPreviewCard} dimmed={opponentScanning} />
      </div>

      {/* ═══════ Card Preview (left side, on hover) ═══════ */}
      <div className="card-preview-anchor">
        <CardPreview card={previewCard} />
      </div>

      {/* ═══════ OVERLAYS ═══════ */}
      <AuditOverlay />
      <ChoiceModal />
      <PlayerAuditModal />
      <GameOverScreen />
      <ToastManager />
      <TurnAnnouncer />
      </div>
    </LayoutGroup>
  );
}

export default function App() {
  // Prevent zooming via Ctrl + Scroll and Keyboard
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '_' || e.keyCode === 187 || e.keyCode === 189)) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <GameProvider>
      <div className="game-container-wrapper">
        <div className="game-container">
          <GameBoard />
        </div>
      </div>
    </GameProvider>
  );
}
