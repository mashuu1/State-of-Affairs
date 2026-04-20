import { createContext, useContext, useReducer, useCallback, useRef, useState } from 'react';
import { createDeck, createAIDeck } from '../data/deck';
import {
  AGENDA_SLOT_COUNT,
  DP_WIN_THRESHOLD,
  TRUST_MAX,
  UPGRADE_COST,
  UPGRADE_DP_REWARD,
  warnIfGameConfigInconsistent,
} from '../constants/game';

const GameContext = createContext(null);

// ── AI Flavor texts ──
const AUDIT_FLAVORS = [
  "The opposition smells something fishy...",
  "A whistleblower tipped off the media!",
  "Senate committee demands an investigation!",
  "Public watchdog group files a complaint!",
  "Journalists are digging into your records...",
  "Public audit in progress—the public is watching closely.",
];
const PASS_FLAVORS = [
  "The opposition is distracted by their own scandals.",
  "Media attention is elsewhere today.",
  "No one is watching... for now.",
  "The opposition chose to focus on other matters.",
  "A quiet news cycle lets this one slide.",
  "The public is preoccupied with another unfolding story.",
];

warnIfGameConfigInconsistent();

// ── Initial State Factory ──
function createInitialState() {
  const deck = createDeck();
  const hand = [];

  return {
    publicTrust: TRUST_MAX,
    budget: 0,
    developmentPoints: 0,
    agendaSlots: Array.from({ length: AGENDA_SLOT_COUNT }, () => null),
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
    nextHonestDiscount: 0, // Grassroots Initiative effect
    humanCapitalActive: false, // Human Capital Investment passive
    greenSubsidyActive: false, // Green Subsidy passive
    incarceratedTurns: 0,
    isPurifying: false,
    isSelectingPurify: false,
    draggingCard: null,
    // AI state — hand starts empty, draws on turn 1 START_TURN
    aiTrust: TRUST_MAX,
    aiBudget: 0,
    aiDP: 0,
    aiSlots: Array.from({ length: AGENDA_SLOT_COUNT }, () => null),
    aiDeck: createAIDeck(),
    aiHand: [],
    aiThinking: false,
    // Support card logs — tracks cards played this turn for UI indicator
    turnSupportLog: [],     // player's support cards played this turn
    aiTurnSupportLog: [],   // AI's support cards played this turn
  };
}

// ── Reducer ──
function gameReducer(state, action) {
  switch (action.type) {
    case 'AI_START_THINKING':
      return { ...state, aiThinking: true };
    case 'AI_DONE_THINKING':
      return { ...state, aiThinking: false };

    case 'SET_DRAGGING_CARD':
      return { ...state, draggingCard: action.payload };

    case 'START_TURN': {
      if (state.phase !== 'play' || state.turnStarted) return state;

      if (state.incarceratedTurns > 0) {
        // Decrease incarceration and call END_TURN to process decay/AI turn
        const nextState = {
          ...state,
          incarceratedTurns: state.incarceratedTurns - 1,
          budget: state.budget + 3, // Player still receives turn income
          turnStarted: true,
          auditResult: null,
          playerAuditResult: null,
        };
        return gameReducer(nextState, { type: 'END_TURN' });
      }

      const newDeck = [...state.deck];
      const newHand = [...state.hand];
      const newAiDeck = [...state.aiDeck];
      const newAiHand = [...state.aiHand];
      let newPhase = 'play';
      let gameResult = null;

      // Player draws: 6 cards on turn 1 (opening hand), 1 card on subsequent turns
      const drawCount = state.turnNumber === 1 ? Math.min(6, newDeck.length) : (newDeck.length > 0 ? 1 : 0);
      for (let d = 0; d < drawCount; d++) {
        if (newDeck.length > 0) newHand.push(newDeck.shift());
      }

      // AI draws its opening hand (6 cards) on turn 1
      if (state.turnNumber === 1) {
        const aiDrawCount = Math.min(6, newAiDeck.length);
        for (let d = 0; d < aiDrawCount; d++) {
          if (newAiDeck.length > 0) newAiHand.push(newAiDeck.shift());
        }
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
        aiDeck: newAiDeck,
        aiHand: newAiHand,
        budget: state.budget + 3,
        phase: newPhase,
        gameResult,
        turnStarted: true,
        auditResult: null,
        playerAuditResult: null,
        agendaSlots: sanitizedSlots,
        turnSupportLog: [],
        aiTurnSupportLog: [],
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
      let cost = state.pendingCard.honestCost || 3;
      let nextHonestDiscount = state.nextHonestDiscount;
      if (nextHonestDiscount > 0) {
        cost = Math.max(0, cost - 1);
        nextHonestDiscount -= 1;
      }

      if (state.budget < cost) return state;
      const card = {
        ...state.pendingCard,
        status: 'pending_audit',
        pendingAction: 'build',
        buildType: 'honest',
        corruptionToken: false,
        timer: null,
        level: 1,
        upgraded: false,
      };
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
        auditResult: null,
        playerAuditResult: null,
        nextHonestDiscount,
      };
    }

    case 'BUILD_CORRUPT': {
      const cost = state.pendingCard.corruptCost || 1;
      if (state.budget < cost) return state;
      const card = {
        ...state.pendingCard,
        status: 'pending_audit',
        pendingAction: 'build',
        buildType: 'corrupt',
        corruptionToken: true,
        timer: 3,
        level: 1,
        upgraded: false,
      };
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
        auditResult: null,
        playerAuditResult: null,
      };
    }

    case 'BUILD_BAYANIHAN': {
      const card = {
        ...state.pendingCard,
        status: 'pending_audit',
        pendingAction: 'build',
        buildType: 'bayanihan',
        corruptionToken: false,
        timer: 3, // takes 3 turns
        level: 1,
        upgraded: false,
      };
      const newSlots = [...state.agendaSlots];
      newSlots[state.pendingSlotIndex] = card;
      const newHand = state.hand.filter(c => c.id !== state.pendingCard.id);
      return {
        ...state,
        budget: state.budget, // 0 budget
        agendaSlots: newSlots,
        hand: newHand,
        phase: 'audit',
        pendingSlotIndex: null,
        pendingCard: null,
        auditResult: null,
        playerAuditResult: null,
      };
    }

    case 'BUILD_PHASED': {
      const { downpayment } = action.payload;
      if (state.budget < downpayment) return state;
      const totalCost = (state.pendingCard.honestCost || 3) + 1; // Honest + 1 Interest
      
      const card = {
        ...state.pendingCard,
        status: 'pending_audit',
        pendingAction: 'build',
        buildType: 'phased',
        corruptionToken: false,
        remainingBalance: totalCost - downpayment,
        timer: null,
        level: 1,
        upgraded: false,
      };
      const newSlots = [...state.agendaSlots];
      newSlots[state.pendingSlotIndex] = card;
      const newHand = state.hand.filter(c => c.id !== state.pendingCard.id);
      
      // If fully paid by downpayment
      if (card.remainingBalance <= 0) {
        card.status = 'built';
        card.remainingBalance = 0;
        // Skipping audit if fully paid upfront? Still goes to audit but will resolve as built.
      }

      return {
        ...state,
        budget: state.budget - downpayment,
        agendaSlots: newSlots,
        hand: newHand,
        phase: 'audit',
        pendingSlotIndex: null,
        pendingCard: null,
        auditResult: null,
        playerAuditResult: null,
      };
    }

    case 'PAY_PHASED_INSTALLMENT': {
      const { slotIndex, amount } = action.payload;
      if (state.budget < amount) return state;
      
      const newSlots = [...state.agendaSlots];
      const card = { ...newSlots[slotIndex] };
      
      if (card.type !== 'infrastructure' || card.buildType !== 'phased' || card.status !== 'building') return state;
      
      card.remainingBalance -= amount;
      let newDP = state.developmentPoints;
      
      if (card.remainingBalance <= 0) {
        card.remainingBalance = 0;
        card.status = 'built';
        newDP += 1; // Granted DP when built
      }
      
      newSlots[slotIndex] = card;
      
      // Check win condition
      let gameResult = state.gameResult;
      let phase = state.phase;
      if (newDP >= DP_WIN_THRESHOLD) { 
        gameResult = 'victory'; 
        phase = 'gameover'; 
      }

      return {
        ...state,
        budget: state.budget - amount,
        agendaSlots: newSlots,
        developmentPoints: newDP,
        gameResult,
        phase
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

    case 'UPGRADE_INFRA': {
      if (state.phase !== 'play' || !state.turnStarted) return state;
      const { slotIndex } = action.payload;
      const current = state.agendaSlots[slotIndex];
      if (!current || current.type !== 'infrastructure') return state;
      if (current.status !== 'built') return state;
      if (current.corruptionToken) return state; // must be "cleared" first
      if (current.upgraded) return state;
      if (state.budget < UPGRADE_COST) return state;

      const newSlots = [...state.agendaSlots];
      newSlots[slotIndex] = { ...current, status: 'pending_audit', pendingAction: 'upgrade' };

      return {
        ...state,
        budget: state.budget - UPGRADE_COST,
        agendaSlots: newSlots,
        phase: 'audit',
        auditResult: null,
        playerAuditResult: null,
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
      const isUpgrade = placedCard.pendingAction === 'upgrade';
      let effects = '';
      let caught = false;

      if (investigate) {
        if (placedCard.buildType === 'corrupt') {
          caught = true;
          newSlots[idx] = null;
          aiTrust = Math.max(0, aiTrust - 3);
          playerTrust = Math.min(TRUST_MAX, playerTrust + 1);
          effects = isUpgrade
            ? "Caught! Audit found corruption during the upgrade. AI project destroyed. AI Trust -3. You gained +1 Trust."
            : "Caught! AI project destroyed. AI Trust -3. You gained +1 Trust.";
        } else {
          placedCard.status = 'built';
          if (isUpgrade) {
            aiDP += UPGRADE_DP_REWARD;
            placedCard.upgraded = true;
            placedCard.level = (placedCard.level || 1) + 1;
          } else {
            aiDP += 1;
          }
          aiTrust = Math.min(TRUST_MAX, aiTrust + 1);
          playerTrust = Math.max(0, playerTrust - 1);
          newSlots[idx] = placedCard;
          effects = isUpgrade
            ? `Innocent! Upgrade verified. AI DP +${UPGRADE_DP_REWARD}, AI Trust +1. You lost 1 Trust.`
            : "Innocent! AI project verified. AI DP +1, AI Trust +1. You lost 1 Trust.";
        }
      } else {
        placedCard.status = 'built';
        if (isUpgrade) {
          aiDP += UPGRADE_DP_REWARD;
          placedCard.upgraded = true;
          placedCard.level = (placedCard.level || 1) + 1;
          effects = `No investigation. AI upgrade completed. AI gains +${UPGRADE_DP_REWARD} DP.`;
        } else {
          // Don't reveal the build method when player passes
          const dpGain = placedCard.buildType === 'corrupt' ? 2 : 1;
          aiDP += dpGain;
          effects = "No investigation. AI project completed.";
        }
        newSlots[idx] = placedCard;
      }

      let gameResult = state.gameResult;
      let phase = 'play';
      if (state.developmentPoints >= DP_WIN_THRESHOLD) { gameResult = 'victory'; phase = 'gameover'; }
      else if (playerTrust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }
      else if (aiTrust <= 0) { gameResult = 'victory'; phase = 'gameover'; }
      else if (aiDP >= DP_WIN_THRESHOLD) { gameResult = 'defeat_termlimit'; phase = 'gameover'; }

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
      const { audited } = action.payload;
      const newSlots = [...state.agendaSlots];
      let dp = state.developmentPoints;
      let trust = state.publicTrust;
      let effects = '';

      // Find the newly placed card (status === 'pending_audit')
      const idx = newSlots.findIndex(s => s && s.status === 'pending_audit');
      if (idx === -1) return state;

      const placedCard = { ...newSlots[idx] };
      const isUpgrade = placedCard.pendingAction === 'upgrade';

      if (audited) {
        if (placedCard.buildType === 'corrupt') {
          // CAUGHT cheating
          newSlots[idx] = null;
          trust = Math.max(0, trust - 3);
          effects = isUpgrade
            ? `Caught! Audit found corruption during the upgrade. ${placedCard.name} demolished. Trust -3.`
            : `Caught! ${placedCard.name} destroyed. Trust -3.`;
        } else if (placedCard.buildType === 'bayanihan') {
          placedCard.status = 'building';
          trust = Math.min(TRUST_MAX, trust + 1);
          newSlots[idx] = placedCard;
          effects = `Cleared! ${placedCard.name} will be built over 3 turns via Bayanihan. Trust +1.`;
        } else if (placedCard.buildType === 'phased') {
          if (placedCard.remainingBalance <= 0) {
            placedCard.status = 'built';
            dp += 1;
            effects = `Cleared! ${placedCard.name} fully paid upfront! DP +1, Trust +1.`;
          } else {
            placedCard.status = 'building';
            effects = `Cleared! ${placedCard.name} construction started. Pay installments to finish. Trust +1.`;
          }
          trust = Math.min(TRUST_MAX, trust + 1);
          newSlots[idx] = placedCard;
        } else {
          // Innocent — honest build/upgrade audited
          placedCard.status = 'built';
          if (isUpgrade) {
            dp += UPGRADE_DP_REWARD;
            placedCard.upgraded = true;
            placedCard.level = (placedCard.level || 1) + 1;
          } else {
            dp += 1;
            // Passive bonuses
            if (state.humanCapitalActive && (placedCard.name === 'Public Hospital' || placedCard.name === 'Public School')) {
              dp += 1;
              effects += " (Human Capital Bonus: +1 DP)";
            }
            if (state.greenSubsidyActive && (placedCard.name === 'Power Grid' || placedCard.name === 'Water Facility' || placedCard.name === 'Transit System')) {
              dp += 1;
              effects += " (Green Subsidy Bonus: +1 DP)";
            }
          }
          trust = Math.min(TRUST_MAX, trust + 1);
          newSlots[idx] = placedCard;
          effects = (isUpgrade
            ? `Cleared! Upgrade verified. DP +${UPGRADE_DP_REWARD}, Trust +1.`
            : `Cleared! ${placedCard.name} verified. DP +1, Trust +1.`) + effects;
        }
      } else {
        // AI passed on audit
        placedCard.status = 'built';
        if (isUpgrade) {
          dp += UPGRADE_DP_REWARD;
          placedCard.upgraded = true;
          placedCard.level = (placedCard.level || 1) + 1;
          effects = `No audit. Upgrade completed. DP +${UPGRADE_DP_REWARD}.`;
        } else if (placedCard.buildType === 'honest') {
          dp += 1;
          // Passive bonuses
          if (state.humanCapitalActive && (placedCard.name === 'Public Hospital' || placedCard.name === 'Public School')) {
            dp += 1;
            effects += " (Human Capital Bonus: +1 DP)";
          }
          if (state.greenSubsidyActive && (placedCard.name === 'Power Grid' || placedCard.name === 'Water Facility' || placedCard.name === 'Transit System')) {
            dp += 1;
            effects += " (Green Subsidy Bonus: +1 DP)";
          }
          effects = `No audit. ${placedCard.name} built honestly. DP +1.` + effects;
        } else if (placedCard.buildType === 'bayanihan') {
          placedCard.status = 'building';
          effects = `No audit. ${placedCard.name} Bayanihan began.`;
        } else if (placedCard.buildType === 'phased') {
          if (placedCard.remainingBalance <= 0) {
            placedCard.status = 'built';
            dp += 1;
            effects = `No audit. ${placedCard.name} fully paid upfront! DP +1.`;
          } else {
            placedCard.status = 'building';
            effects = `No audit. ${placedCard.name} construction started.`;
          }
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
      if (dp >= DP_WIN_THRESHOLD) { gameResult = 'victory'; phase = 'gameover'; }
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
      let newSlots = [...state.agendaSlots];
      let humanCapitalActive = state.humanCapitalActive;
      let greenSubsidyActive = state.greenSubsidyActive;
      let nextHonestDiscount = state.nextHonestDiscount;
      let incarceratedTurns = state.incarceratedTurns;
      let phase = state.phase;
      let turnStarted = state.turnStarted;

      // Deduct cost if the card has one
      if (card.cost > 0) {
        if (budget < card.cost) return state; // Can't afford
        budget -= card.cost;
      }

      switch (card.effect) {
        case 'remove_corruption': {
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
        case 'honest_discount': {
          nextHonestDiscount += 1;
          break;
        }
        case 'human_capital_passive': {
          humanCapitalActive = true;
          break;
        }
        case 'green_subsidy_passive': {
          greenSubsidyActive = true;
          break;
        }
        case 'criminal_prosecution': {
          newSlots = newSlots.map(s => s ? { ...s, corruptionToken: false, timer: null } : null);
          incarceratedTurns = 2;
          phase = 'play';
          turnStarted = true;
          break;
        }
        default:
          break;
      }

      return {
        ...state,
        hand: newHand,
        publicTrust: trust,
        budget: budget,
        freeAuditNext: freeAuditNext,
        agendaSlots: newSlots,
        humanCapitalActive,
        greenSubsidyActive,
        nextHonestDiscount,
        incarceratedTurns,
        phase,
        turnStarted,
        draggingCard: null,
        auditResult: null,
        playerAuditResult: null,
        turnSupportLog: [...state.turnSupportLog, { name: card.name, description: card.description }],
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
        if (card.effect === 'trust') trust = Math.min(TRUST_MAX, trust + card.value);
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

    case 'OPEN_PURIFY':
      return { ...state, isPurifying: true };
    case 'CLOSE_PURIFY':
      return { ...state, isPurifying: false };
    case 'SELECT_TARGETED_PURIFY':
      return { ...state, isPurifying: false, isSelectingPurify: true };
    case 'CANCEL_PURIFY_SELECTION':
      return { ...state, isSelectingPurify: false };
    case 'PURIFY_SLOT': {
      const { slotIndex } = action.payload;
      const newSlots = [...state.agendaSlots];
      const target = newSlots[slotIndex];
      
      if (!target || !target.corruptionToken) return state;
      
      // Dismantle the project
      newSlots[slotIndex] = null;
      
      return {
        ...state,
        agendaSlots: newSlots,
        developmentPoints: Math.max(0, state.developmentPoints - 1),
        isSelectingPurify: false,
      };
    }
    case 'PURIFY_FULL_ACCOUNTABILITY': {
      const newSlotsClean = state.agendaSlots.map(s => s ? { ...s, corruptionToken: false, timer: null } : null);
      return gameReducer({
        ...state,
        agendaSlots: newSlotsClean,
        incarceratedTurns: 2,
        isPurifying: false,
        turnStarted: true
      }, { type: 'END_TURN' });
    }

    case 'END_TURN': {
      // Systemic Decay
      const newSlots = [...state.agendaSlots];
      let trust = state.publicTrust;
      let dp = state.developmentPoints;

      for (let i = 0; i < newSlots.length; i++) {
        if (!newSlots[i]) continue;

        // Determine if this is a Bayanihan building ticking down
        if (newSlots[i].status === 'building' && newSlots[i].buildType === 'bayanihan') {
          // Block progression if incarcerated
          if (state.incarceratedTurns === 0) {
            const newCard = { ...newSlots[i], timer: newSlots[i].timer - 1 };
            if (newCard.timer <= 0) {
              newCard.status = 'built';
              dp += 1; // Or custom reward if dynamic
            }
            newSlots[i] = newCard;
          }
        }

        if (newSlots[i].corruptionToken) {
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

      // Simulate AI turn — weighted strategy selection
      const aiSlots = [...state.aiSlots];
      let aiBudget = state.aiBudget + 3;
      let aiDP = state.aiDP;
      let aiTrust = state.aiTrust;
      let aiHand = [...state.aiHand];
      const newAiDeck = [...state.aiDeck];

      // AI draws 1 card at the start of its turn, starting from round 2
      if (state.turnNumber >= 2 && newAiDeck.length > 0) {
        aiHand.push(newAiDeck.shift());
      }

      // ── AI plays a random number of support cards per turn ──
      const aiSupportLog = [];
      const supportCardsToPlay = [];
      for (let i = aiHand.length - 1; i >= 0; i--) {
        const c = aiHand[i];
        if (c.type !== 'support') continue;
        if (c.cost > 0 && aiBudget < c.cost) continue;
        if (c.effect === 'remove_corruption') continue;
        if (c.effect === 'criminal_prosecution') continue;
        supportCardsToPlay.push(i);
      }
      
      // Shuffle to add unpredictability in which cards get played
      supportCardsToPlay.sort(() => Math.random() - 0.5);
      
      // Play a random number of them (0 to all affordable)
      const numToPlay = Math.floor(Math.random() * (supportCardsToPlay.length + 1));
      
      for (let j = 0; j < numToPlay; j++) {
        const idx = supportCardsToPlay[j];
        const card = aiHand[idx];
        
        // Re-check budget since previous cards might have spent it
        if (card.cost > 0 && aiBudget < card.cost) continue;
        
        if (card.cost > 0) aiBudget -= card.cost;
        switch (card.effect) {
          case 'budget_boost': aiBudget += (card.value || 3); break;
          case 'honest_discount': break;
          case 'free_audit': break;
          case 'human_capital_passive': break;
          case 'green_subsidy_passive': break;
          default: break;
        }
        
        aiSupportLog.push({ name: card.name, description: card.description });
        aiHand[idx] = null; // mark as played
      }
      
      // Remove played cards from AI hand
      aiHand = aiHand.filter(c => c !== null);

      // ── AI picks a card from hand to build with ──
      const aiInfraCards = aiHand.filter(c => c.type === 'infrastructure');
      const emptyAiSlot = aiSlots.findIndex(s => s === null);

      if (emptyAiSlot !== -1 && aiInfraCards.length > 0) {
        // Pick a random infra card from AI's hand
        const pickedCard = aiInfraCards[Math.floor(Math.random() * aiInfraCards.length)];
        const honestCost = pickedCard.honestCost || 3;
        const corruptCost = pickedCard.corruptCost || 1;

        // Weighted strategy: Honest 40%, Corrupt 25%, Bayanihan 20%, Phased 15%
        const roll = Math.random();
        let built = false;

        if (roll < 0.40 && aiBudget >= honestCost) {
          // Honest
          aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'honest', corruptionToken: false, timer: null, level: 1, upgraded: false };
          aiBudget -= honestCost;
          aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          built = true;
        } else if (roll < 0.65 && aiBudget >= corruptCost) {
          // Corrupt
          aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'corrupt', corruptionToken: true, timer: 3, level: 1, upgraded: false };
          aiBudget -= corruptCost;
          aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          built = true;
        } else if (roll < 0.85) {
          // Bayanihan (free)
          aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'bayanihan', corruptionToken: false, timer: 3, level: 1, upgraded: false };
          aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          built = true;
        } else {
          // Phased (loan) — AI pays 1 as downpayment
          const downpayment = Math.min(1, aiBudget);
          const totalCost = honestCost + 1;
          aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'phased', corruptionToken: false, remainingBalance: totalCost - downpayment, timer: null, level: 1, upgraded: false };
          aiBudget -= downpayment;
          aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          built = true;
        }

        // Fallback: if weighted roll didn't work (not enough budget), try honest then corrupt then bayanihan
        if (!built) {
          if (aiBudget >= honestCost) {
            aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'honest', corruptionToken: false, timer: null, level: 1, upgraded: false };
            aiBudget -= honestCost;
            aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          } else if (aiBudget >= corruptCost) {
            aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'corrupt', corruptionToken: true, timer: 3, level: 1, upgraded: false };
            aiBudget -= corruptCost;
            aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          } else {
            // Bayanihan is always free
            aiSlots[emptyAiSlot] = { ...pickedCard, status: 'pending_player_audit', pendingAction: 'build', buildType: 'bayanihan', corruptionToken: false, timer: 3, level: 1, upgraded: false };
            aiHand = aiHand.filter(c => c.id !== pickedCard.id);
          }
        }
      }
      // If AI couldn't build (no empty slots or no infra cards), it may try to upgrade
      if (!aiSlots.some(s => s && s.status === 'pending_player_audit')) {
        const upgradableIdx = aiSlots.findIndex(s => s && s.status === 'built' && !s.corruptionToken && !s.upgraded);
        if (upgradableIdx !== -1 && aiBudget >= UPGRADE_COST && Math.random() < 0.35) {
          aiSlots[upgradableIdx] = { ...aiSlots[upgradableIdx], status: 'pending_player_audit', pendingAction: 'upgrade' };
          aiBudget -= UPGRADE_COST;
        }
      }

      // AI decay + AI Bayanihan timer progression + AI phased installment payments
      for (let i = 0; i < aiSlots.length; i++) {
        if (!aiSlots[i]) continue;

        // AI Bayanihan timer countdown
        if (aiSlots[i].status === 'building' && aiSlots[i].buildType === 'bayanihan') {
          const c = { ...aiSlots[i], timer: aiSlots[i].timer - 1 };
          if (c.timer <= 0) {
            c.status = 'built';
            aiDP += 1;
          }
          aiSlots[i] = c;
        }

        // AI phased installment payments
        if (aiSlots[i].status === 'building' && aiSlots[i].buildType === 'phased' && aiSlots[i].remainingBalance > 0) {
          const payment = Math.min(2, aiBudget, aiSlots[i].remainingBalance);
          if (payment > 0) {
            aiBudget -= payment;
            const c = { ...aiSlots[i], remainingBalance: aiSlots[i].remainingBalance - payment };
            if (c.remainingBalance <= 0) {
              c.status = 'built';
              c.remainingBalance = 0;
              aiDP += 1;
            }
            aiSlots[i] = c;
          }
        }

        // Corruption decay
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
      if (dp >= DP_WIN_THRESHOLD) { gameResult = 'victory'; phase = 'gameover'; }
      else if (trust <= 0) { gameResult = 'defeat_impeachment'; phase = 'gameover'; }
      else if (aiTrust <= 0) { gameResult = 'victory'; phase = 'gameover'; }
      else if (aiDP >= DP_WIN_THRESHOLD) { gameResult = 'defeat_termlimit'; phase = 'gameover'; }
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
        aiHand,
        aiDeck: newAiDeck,
        aiTurnSupportLog: aiSupportLog,
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
  
  // Toast System
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = Date.now();
    setToast({ msg, type, id });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  const startTurn = () => dispatch({ type: 'START_TURN' });
  const aiThinkingRef = useRef(null);
  const endTurn = useCallback(() => {
    // UX 6: AI "thinking" delay of 3-5 seconds
    dispatch({ type: 'AI_START_THINKING' });
    const delay = 3000 + Math.random() * 2000; // 3-5 seconds
    if (aiThinkingRef.current) clearTimeout(aiThinkingRef.current);
    aiThinkingRef.current = setTimeout(() => {
      dispatch({ type: 'AI_DONE_THINKING' });
      dispatch({ type: 'END_TURN' });
      aiThinkingRef.current = null;
    }, delay);
  }, []);
  const restart = () => {
    if (aiThinkingRef.current) clearTimeout(aiThinkingRef.current);
    dispatch({ type: 'RESTART' });
  };
  const dragToSlot = (card, slotIndex) => dispatch({ type: 'DRAG_TO_SLOT', payload: { card, slotIndex } });
  const buildHonest = () => dispatch({ type: 'BUILD_HONEST' });
  const buildCorrupt = () => dispatch({ type: 'BUILD_CORRUPT' });
  const buildBayanihan = () => dispatch({ type: 'BUILD_BAYANIHAN' });
  const buildPhased = (downpayment) => dispatch({ type: 'BUILD_PHASED', payload: { downpayment } });
  const payPhasedInstallment = (slotIndex, amount) => dispatch({ type: 'PAY_PHASED_INSTALLMENT', payload: { slotIndex, amount } });
  const cancelDilemma = () => dispatch({ type: 'CANCEL_DILEMMA' });
  const upgradeInfrastructure = (slotIndex) => dispatch({ type: 'UPGRADE_INFRA', payload: { slotIndex } });
  const playerResolveAudit = (investigate) => dispatch({ type: 'PLAYER_RESOLVE_AUDIT', payload: { investigate } });
  const resolveAudit = (audited) => {
    const isAudited = audited !== undefined ? audited : runAiAudit(state.budget);
    dispatch({ type: 'RESOLVE_AUDIT', payload: { audited: isAudited } });
  };
  const playSupport = (card, targetSlotIndex) => dispatch({ type: 'PLAY_SUPPORT', payload: { card, targetSlotIndex } });
  const playAction = (card, targetSlotIndex) => dispatch({ type: 'PLAY_ACTION', payload: { card, targetSlotIndex } });

  const setDraggingCard = (card) => dispatch({ type: 'SET_DRAGGING_CARD', payload: card });

  const openPurify = () => dispatch({ type: 'OPEN_PURIFY' });
  const closePurify = () => dispatch({ type: 'CLOSE_PURIFY' });
  const selectTargetedPurify = () => dispatch({ type: 'SELECT_TARGETED_PURIFY' });
  const cancelPurifySelection = () => dispatch({ type: 'CANCEL_PURIFY_SELECTION' });
  const purifySlot = (slotIndex) => dispatch({ type: 'PURIFY_SLOT', payload: { slotIndex } });
  const purifyFullAccountability = () => dispatch({ type: 'PURIFY_FULL_ACCOUNTABILITY' });

  const value = {
    state,
    dispatch,
    showToast,
    toast,
    startTurn,
    endTurn,
    restart,
    dragToSlot,
    buildHonest,
    buildCorrupt,
    buildBayanihan,
    buildPhased,
    payPhasedInstallment,
    cancelDilemma,
    upgradeInfrastructure,
    playerResolveAudit,
    resolveAudit,
    playSupport,
    playAction,
    setDraggingCard,
    openPurify,
    closePurify,
    selectTargetedPurify,
    cancelPurifySelection,
    purifySlot,
    purifyFullAccountability,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
