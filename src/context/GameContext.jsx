import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { createDeck } from '../data/deck';

const GameContext = createContext(null);

// ── AI Flavor texts ──
const AUDIT_FLAVORS = [
  "The opposition smells something fishy...",
  "A whistleblower tipped off the media!",
  "Senate committee demands an investigation!",
  "Public watchdog group files a complaint!",
  "Journalists are digging into your records...",
];
const PASS_FLAVORS = [
  "The opposition is distracted by their own scandals.",
  "Media attention is elsewhere today.",
  "No one is watching... for now.",
  "The opposition chose to focus on other matters.",
  "A quiet news cycle lets this one slide.",
];

// ── Initial State Factory ──
function createInitialState() {
  const deck = createDeck();
  const hand = deck.splice(0, 5);
  return {
    publicTrust: 5,
    budget: 0,
    developmentPoints: 0,
    agendaSlots: [null, null, null],
    deck,
    hand,
    turnNumber: 1,
    phase: 'play',        // 'play' | 'dilemma' | 'audit' | 'decay' | 'gameover' | 'player_audit'
    gameResult: null,      // 'victory' | 'defeat_impeachment' | 'defeat_termlimit' | 'victory_termlimit'
    pendingSlotIndex: null,
    pendingCard: null,
    auditResult: null,     // { audited, caught, flavor, effects }
    playerAuditResult: null, // { investigated, caught, effects }
    selectedReformTarget: null,
    turnStarted: false,
    freeAuditNext: false,  // Whistleblower effect
    // AI state (display only)
    aiTrust: 5,
    aiBudget: 0,
    aiDP: 0,
    aiSlots: [null, null, null],
  };
}

// ── Reducer ──
function gameReducer(state, action) {
  switch (action.type) {

    case 'START_TURN': {
      if (state.phase !== 'play' || state.turnStarted) return state;
      const newDeck = [...state.deck];
      const newHand = [...state.hand];
      let newPhase = 'play';
      let gameResult = null;

      // Draw a card
      if (newDeck.length > 0) {
        newHand.push(newDeck.shift());
      }

      // Check term limit (deck empty at start of turn)
      if (newDeck.length === 0 && state.deck.length === 0) {
        newPhase = 'gameover';
        gameResult = state.developmentPoints > state.aiDP ? 'victory_termlimit' : 'defeat_termlimit';
      }

      // Safety: clean up any orphaned pending_audit cards
      const sanitizedSlots = state.agendaSlots.map(slot => {
        if (slot && slot.status === 'pending_audit') {
          return { ...slot, status: 'built' };
        }
        return slot;
      });

      return {
        ...state,
        deck: newDeck,
        hand: newHand,
        budget: state.budget + 3,
        phase: newPhase,
        gameResult,
        turnStarted: true,
        auditResult: null,
        playerAuditResult: null,
        agendaSlots: sanitizedSlots,
      };
    }

    case 'DRAG_TO_SLOT': {
      if (state.phase !== 'play') return state;
      const { card, slotIndex } = action.payload;
      if (state.agendaSlots[slotIndex] !== null) return state;
      if (card.type !== 'infrastructure') return state;
      return {
        ...state,
        phase: 'dilemma',
        pendingSlotIndex: slotIndex,
        pendingCard: card,
      };
    }

    case 'BUILD_HONEST': {
      const cost = state.pendingCard.honestCost || 3;
      if (state.budget < cost) return state;
      const card = { ...state.pendingCard, status: 'pending_audit', buildType: 'honest', corruptionToken: false, timer: null };
      const newSlots = [...state.agendaSlots];
      newSlots[state.pendingSlotIndex] = card;
      const newHand = state.hand.filter(c => c.id !== state.pendingCard.id);
      return {
        ...state,
        budget: state.budget - cost,
        agendaSlots: newSlots,
        hand: newHand,
        phase: 'audit',
        pendingSlotIndex: null,
        pendingCard: null,
      };
    }

    case 'BUILD_CORRUPT': {
      const cost = state.pendingCard.corruptCost || 1;
      if (state.budget < cost) return state;
      const card = { ...state.pendingCard, status: 'pending_audit', buildType: 'corrupt', corruptionToken: true, timer: 3 };
      const newSlots = [...state.agendaSlots];
      newSlots[state.pendingSlotIndex] = card;
      const newHand = state.hand.filter(c => c.id !== state.pendingCard.id);
      return {
        ...state,
        budget: state.budget - cost,
        agendaSlots: newSlots,
        hand: newHand,
        phase: 'audit',
        pendingSlotIndex: null,
        pendingCard: null,
      };
    }

    case 'CANCEL_DILEMMA': {
      return {
        ...state,
        phase: 'play',
        pendingSlotIndex: null,
        pendingCard: null,
      };
    }

    case 'PLAYER_RESOLVE_AUDIT': {
      const { investigate } = action.payload;
      const newSlots = [...state.aiSlots];
      let aiDP = state.aiDP;
      let aiTrust = state.aiTrust;
      let playerTrust = state.publicTrust;
      
      const idx = newSlots.findIndex(s => s && s.status === 'pending_player_audit');
      if (idx === -1) return { ...state, phase: 'play' }; 
      
      const placedCard = { ...newSlots[idx] };
      let effects = '';
      let caught = false;

      if (investigate) {
        if (placedCard.buildType === 'corrupt') {
          caught = true;
          newSlots[idx] = null;
          aiTrust = Math.max(0, aiTrust - 3);
          playerTrust = Math.min(5, playerTrust + 1);
          effects = "Caught! AI project destroyed. AI Trust -3. You gained +1 Trust.";
        } else {
          placedCard.status = 'built';
          aiDP += 1;
          aiTrust = Math.min(5, aiTrust + 1);
          playerTrust = Math.max(0, playerTrust - 1);
          newSlots[idx] = placedCard;
          effects = "Innocent! AI project verified. AI DP +1, AI Trust +1. You lost 1 Trust.";
        }
      } else {
        placedCard.status = 'built';
        if (placedCard.buildType === 'honest') {
          aiDP += 1;
          effects = "No audit. AI built honestly. AI gains +1 DP.";
        } else {
          aiDP += 2;
          effects = "No audit. AI built with shortcuts. AI gains +2 DP.";
        }
        newSlots[idx] = placedCard;
      }

      let gameResult = state.gameResult;
      let phase = 'play';
      if (state.developmentPoints >= 4) { gameResult = 'victory'; phase = 'gameover'; }
      else if (playerTrust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }
      else if (aiTrust <= 0) { gameResult = 'victory'; phase = 'gameover'; }
      else if (aiDP >= 4) { gameResult = 'defeat_termlimit'; phase = 'gameover'; }

      return {
        ...state,
        aiSlots: newSlots,
        aiDP,
        aiTrust,
        publicTrust: playerTrust,
        phase,
        gameResult,
        playerAuditResult: { investigated: investigate, caught, effects }
      };
    }

    case 'RESOLVE_AUDIT': {
      const { audited, caught } = action.payload;
      const newSlots = [...state.agendaSlots];
      let dp = state.developmentPoints;
      let trust = state.publicTrust;
      let effects = '';

      // Find the newly placed card (status === 'pending_audit')
      const idx = newSlots.findIndex(s => s && s.status === 'pending_audit');
      if (idx === -1) return state;

      const placedCard = { ...newSlots[idx] };

      if (audited) {
        if (placedCard.buildType === 'corrupt') {
          // CAUGHT cheating
          newSlots[idx] = null;
          trust = Math.max(0, trust - 3);
          effects = `Caught! ${placedCard.name} destroyed. Trust -3.`;
        } else {
          // Innocent — honest build audited
          placedCard.status = 'built';
          dp += 1;
          trust = Math.min(5, trust + 1);
          newSlots[idx] = placedCard;
          effects = `Cleared! ${placedCard.name} verified. DP +1, Trust +1.`;
        }
      } else {
        // AI passed on audit
        placedCard.status = 'built';
        if (placedCard.buildType === 'honest') {
          dp += 1;
          effects = `No audit. ${placedCard.name} built honestly. DP +1.`;
        } else {
          dp += 2;
          effects = `No audit. ${placedCard.name} built with shortcuts. DP +2. Timer started!`;
        }
        newSlots[idx] = placedCard;
      }

      const flavor = audited
        ? AUDIT_FLAVORS[Math.floor(Math.random() * AUDIT_FLAVORS.length)]
        : PASS_FLAVORS[Math.floor(Math.random() * PASS_FLAVORS.length)];

      let gameResult = null;
      let phase = 'play';
      if (dp >= 4) { gameResult = 'victory'; phase = 'gameover'; }
      if (trust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }

      return {
        ...state,
        agendaSlots: newSlots,
        developmentPoints: dp,
        publicTrust: trust,
        phase,
        gameResult,
        auditResult: { audited, caught: audited && placedCard.buildType === 'corrupt', flavor, effects },
        freeAuditNext: false, // Reset after audit resolves
      };
    }

    case 'PLAY_SUPPORT': {
      const { card, targetSlotIndex } = action.payload;
      const newHand = state.hand.filter(c => c.id !== card.id);
      let trust = state.publicTrust;
      let budget = state.budget;
      let freeAuditNext = state.freeAuditNext;
      const newSlots = [...state.agendaSlots];

      // Deduct cost if the card has one
      if (card.cost > 0) {
        if (budget < card.cost) return state; // Can't afford
        budget -= card.cost;
      }

      switch (card.effect) {
        case 'remove_corruption': {
          // Remove corruption from a specific slot
          if (targetSlotIndex !== undefined) {
            const target = newSlots[targetSlotIndex];
            if (target && target.corruptionToken) {
              newSlots[targetSlotIndex] = { ...target, corruptionToken: false, timer: null };
            }
          }
          break;
        }
        case 'free_audit': {
          freeAuditNext = true;
          break;
        }
        case 'budget_boost': {
          budget += (card.value || 3);
          break;
        }
        default:
          break;
      }

      let gameResult = state.gameResult;
      let phase = state.phase;
      if (trust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }

      return {
        ...state,
        hand: newHand,
        budget,
        publicTrust: trust,
        agendaSlots: newSlots,
        phase,
        gameResult,
        freeAuditNext,
        auditResult: null,
        playerAuditResult: null,
      };
    }

    case 'PLAY_ACTION': {
      const { card, targetSlotIndex } = action.payload;
      const newHand = state.hand.filter(c => c.id !== card.id);
      let trust = state.publicTrust;
      let budget = state.budget;
      const newSlots = [...state.agendaSlots];

      if (card.actionType === 'reform' && targetSlotIndex !== undefined) {
        const target = newSlots[targetSlotIndex];
        if (target && target.corruptionToken) {
          newSlots[targetSlotIndex] = { ...target, corruptionToken: false, timer: null };
        }
      } else if (card.actionType === 'policy') {
        if (card.effect === 'budget') budget += card.value;
        if (card.effect === 'trust') trust = Math.min(5, trust + card.value);
      }

      let gameResult = state.gameResult;
      let phase = state.phase;
      if (trust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }

      return {
        ...state,
        hand: newHand,
        budget,
        publicTrust: trust,
        agendaSlots: newSlots,
        phase,
        gameResult,
        auditResult: null,
        playerAuditResult: null,
      };
    }

    case 'END_TURN': {
      // Systemic Decay
      const newSlots = [...state.agendaSlots];
      let trust = state.publicTrust;
      let dp = state.developmentPoints;

      for (let i = 0; i < newSlots.length; i++) {
        if (newSlots[i] && newSlots[i].corruptionToken) {
          trust -= 1;
          // Decrement timer
          const newCard = { ...newSlots[i], timer: newSlots[i].timer - 1 };
          if (newCard.timer <= 0) {
            // Structural collapse
            if (newCard.buildType === 'corrupt') dp = Math.max(0, dp - 2);
            else dp = Math.max(0, dp - 1);
            trust -= 1;
            newSlots[i] = null;
          } else {
            newSlots[i] = newCard;
          }
        }
      }

      trust = Math.max(0, trust);

      // Simulate AI turn (simple random)
      const aiSlots = [...state.aiSlots];
      let aiBudget = state.aiBudget + 3;
      let aiDP = state.aiDP;
      let aiTrust = state.aiTrust;
      // AI randomly builds in an empty slot
      const emptyAiSlot = aiSlots.findIndex(s => s === null);
      if (emptyAiSlot !== -1 && aiBudget >= 1) {
        const aiHonest = Math.random() > 0.4; // 60% honest
        if (aiHonest && aiBudget >= 3) {
          aiSlots[emptyAiSlot] = { type: 'infrastructure', name: 'AI Project', status: 'pending_player_audit', buildType: 'honest', corruptionToken: false, timer: null };
          aiBudget -= 3;
        } else if (aiBudget >= 1) {
          aiSlots[emptyAiSlot] = { type: 'infrastructure', name: 'AI Project', status: 'pending_player_audit', buildType: 'corrupt', corruptionToken: true, timer: 3 };
          aiBudget -= 1;
        }
      }
      // AI decay
      for (let i = 0; i < aiSlots.length; i++) {
        if (aiSlots[i] && aiSlots[i].corruptionToken && aiSlots[i].status !== 'pending_player_audit') {
          aiTrust -= 1;
          const c = { ...aiSlots[i], timer: aiSlots[i].timer - 1 };
          if (c.timer <= 0) {
            aiDP = Math.max(0, aiDP - 2);
            aiTrust -= 1;
            aiSlots[i] = null;
          } else {
            aiSlots[i] = c;
          }
        }
      }
      aiTrust = Math.max(0, aiTrust);

      let gameResult = null;
      let phase = 'play';
      if (dp >= 4) { gameResult = 'victory'; phase = 'gameover'; }
      else if (trust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }
      else if (aiTrust <= 0) { gameResult = 'victory'; phase = 'gameover'; }
      else if (aiDP >= 4) { gameResult = 'defeat_termlimit'; phase = 'gameover'; }
      else if (state.deck.length === 0) {
        gameResult = dp >= aiDP ? 'victory_termlimit' : 'defeat_termlimit';
        phase = 'gameover';
      }

      // If AI placed a pending card and we aren't gameover, go to player_audit phase
      if (phase === 'play' && aiSlots.some(s => s && s.status === 'pending_player_audit')) {
        phase = 'player_audit';
      }

      return {
        ...state,
        agendaSlots: newSlots,
        publicTrust: trust,
        developmentPoints: dp,
        turnNumber: state.turnNumber + 1,
        turnStarted: false,
        phase,
        gameResult,
        auditResult: null,
        aiSlots,
        aiBudget,
        aiDP,
        aiTrust,
      };
    }

    case 'RESTART': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// ── AI Audit Engine ──
function runAiAudit(budget) {
  // Directly enforce exactly 30% base, and 70% if suspicious
  let prob = 0.3;
  if (budget < 3) {
    prob = 0.7;
  }
  return Math.random() < prob;
}

// ── Provider ──
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const startTurn = useCallback(() => dispatch({ type: 'START_TURN' }), []);
  const dragToSlot = useCallback((card, slotIndex) => dispatch({ type: 'DRAG_TO_SLOT', payload: { card, slotIndex } }), []);
  const buildHonest = useCallback(() => dispatch({ type: 'BUILD_HONEST' }), []);
  const buildCorrupt = useCallback(() => dispatch({ type: 'BUILD_CORRUPT' }), []);
  const cancelDilemma = useCallback(() => dispatch({ type: 'CANCEL_DILEMMA' }), []);

  const stateRef = useRef(state);
  stateRef.current = state;
  const resolveAudit = useCallback(() => {
    const audited = runAiAudit(stateRef.current.budget);
    dispatch({ type: 'RESOLVE_AUDIT', payload: { audited, caught: audited } });
  }, []);

  const playerResolveAudit = useCallback((investigate) => {
    dispatch({ type: 'PLAYER_RESOLVE_AUDIT', payload: { investigate } });
  }, []);

  const playAction = useCallback((card, targetSlotIndex) =>
    dispatch({ type: 'PLAY_ACTION', payload: { card, targetSlotIndex } }), []);
  
  const playSupport = useCallback((card, targetSlotIndex) =>
    dispatch({ type: 'PLAY_SUPPORT', payload: { card, targetSlotIndex } }), []);

  const endTurn = useCallback(() => dispatch({ type: 'END_TURN' }), []);
  const restart = useCallback(() => dispatch({ type: 'RESTART' }), []);

  return (
    <GameContext.Provider value={{
      state,
      startTurn, dragToSlot, buildHonest, buildCorrupt, cancelDilemma,
      resolveAudit, playerResolveAudit, playAction, playSupport, endTurn, restart,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export default GameContext;
