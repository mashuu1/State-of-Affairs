import { useEffect } from 'react';
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
import { LayoutGroup } from 'framer-motion';
import './App.css';

function GameBoard() {
  return (
    <LayoutGroup>
      <div className="w-full h-full bg-white text-slate-950 overflow-hidden select-none relative"
      style={{
        fontFamily: "'Pixelify Sans', monospace",
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gridTemplateRows: 'auto 1fr auto',
      }}
    >
      {/* ═══════ TOP-LEFT: Opponent Trust Bar ═══════ */}
      <div className="flex items-start justify-start px-4 pt-3">
        <div className="w-40">
          <Dashboard isAI={true} variant="trust" />
        </div>
      </div>

      {/* ═══════ TOP-CENTER: (empty, arena starts in middle row) ═══════ */}
      <div />

      {/* ═══════ TOP-RIGHT: Opponent Stats ═══════ */}
      <div className="flex items-start justify-end px-4 pt-3">
        <Dashboard isAI={true} variant="stats" />
      </div>

      {/* ═══════ MIDDLE-LEFT: (empty) ═══════ */}
      <div />

      {/* ═══════ MIDDLE-CENTER: ARENA (the red-line area) ═══════ */}
      <div className="flex flex-col items-center justify-center py-1 gap-0 min-h-0 overflow-hidden">
        {/* Opponent Chibi */}
        <div className="mb-1 flex flex-col items-center justify-center">
          <img 
            src="/ai_character.gif" 
            alt="A.I. Opponent" 
            className="w-12 h-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform hover:scale-105" 
            style={{ imageRendering: 'pixelated' }} 
          />
          <p className="text-[9px] text-slate-300 font-bold mt-0.5 tracking-widest drop-shadow-md">OPPONENT</p>
        </div>

        {/* AI Agenda Slots */}
        <AgendaBoard isAI={true} />

        {/* Center Divider */}
        <div className="flex items-center justify-center py-2 w-full px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <span className="px-3 text-[9px] text-slate-500 font-bold tracking-[0.2em]">⚔ ARENA ⚔</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        {/* Player Agenda Slots & Deck */}
        <div className="relative flex items-center justify-center w-fit mx-auto">
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

      {/* ═══════ BOTTOM-LEFT: Player Trust Bar ═══════ */}
      <div className="flex items-end justify-start px-4 pb-3">
        <div className="w-40">
          <Dashboard isAI={false} variant="trust" />
        </div>
      </div>

      {/* ═══════ BOTTOM-CENTER: Hand Area ═══════ */}
      <div className="flex items-end justify-center pb-3">
        <HandArea />
      </div>

      {/* ═══════ BOTTOM-RIGHT: Player Stats ═══════ */}
      <div className="flex items-end justify-end px-4 pb-3">
        <Dashboard isAI={false} variant="stats" />
      </div>

      {/* ═══════ OVERLAYS ═══════ */}
      <AuditOverlay />
      <ChoiceModal />
      <PlayerAuditModal />
      <GameOverScreen />
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
