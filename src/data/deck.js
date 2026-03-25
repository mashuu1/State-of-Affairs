// ============================================================
// State of Affairs — Card Deck (30 cards)
// 15 Infrastructure + 15 Support/Utility
// ============================================================

const INFRASTRUCTURE_CARDS = [
  // Public Hospital ×3
  { id: 'inf-1',  type: 'infrastructure', name: 'Public Hospital',   description: 'Build a hospital for the people.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-2',  type: 'infrastructure', name: 'Public Hospital',   description: 'Build a hospital for the people.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-3',  type: 'infrastructure', name: 'Public Hospital',   description: 'Build a hospital for the people.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },

  // Transit System ×3
  { id: 'inf-4',  type: 'infrastructure', name: 'Transit System',    description: 'Expand metro and bus systems.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-5',  type: 'infrastructure', name: 'Transit System',    description: 'Expand metro and bus systems.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-6',  type: 'infrastructure', name: 'Transit System',    description: 'Expand metro and bus systems.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },

  // Public School ×3
  { id: 'inf-7',  type: 'infrastructure', name: 'Public School',     description: 'Invest in education infrastructure.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-8',  type: 'infrastructure', name: 'Public School',     description: 'Invest in education infrastructure.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-9',  type: 'infrastructure', name: 'Public School',     description: 'Invest in education infrastructure.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },

  // Power Grid ×3
  { id: 'inf-10', type: 'infrastructure', name: 'Power Grid',        description: 'Modernize the electrical grid.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-11', type: 'infrastructure', name: 'Power Grid',        description: 'Modernize the electrical grid.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-12', type: 'infrastructure', name: 'Power Grid',        description: 'Modernize the electrical grid.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },

  // Water Facility ×3
  { id: 'inf-13', type: 'infrastructure', name: 'Water Facility',    description: 'Clean water for rural areas.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-14', type: 'infrastructure', name: 'Water Facility',    description: 'Clean water for rural areas.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
  { id: 'inf-15', type: 'infrastructure', name: 'Water Facility',    description: 'Clean water for rural areas.', honestCost: 3, corruptCost: 1, honestReward: '+1 DP', corruptReward: '+2 DP, +1 Corruption Token' },
];

const SUPPORT_CARDS = [
  // Anti-Graft Commission ×4 — Consumable (Costs Budget)
  { id: 'sup-1',  type: 'support', subtype: 'consumable_budget', name: 'Anti-Graft Commission',  description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },
  { id: 'sup-2',  type: 'support', subtype: 'consumable_budget', name: 'Anti-Graft Commission',  description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },
  { id: 'sup-3',  type: 'support', subtype: 'consumable_budget', name: 'Anti-Graft Commission',  description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },
  { id: 'sup-4',  type: 'support', subtype: 'consumable_budget', name: 'Anti-Graft Commission',  description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },

  // Transparency Act ×3 — Consumable (Costs Budget)
  { id: 'sup-5',  type: 'support', subtype: 'consumable_budget', name: 'Transparency Act',       description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },
  { id: 'sup-6',  type: 'support', subtype: 'consumable_budget', name: 'Transparency Act',       description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },
  { id: 'sup-7',  type: 'support', subtype: 'consumable_budget', name: 'Transparency Act',       description: 'Removes Corruption Tokens from your board, stopping Trust Leaks.', cost: 2, effect: 'remove_corruption' },

  // Whistleblower ×4 — Consumable (free)
  { id: 'sup-8',  type: 'support', subtype: 'consumable', name: 'Whistleblower',                 description: 'Reduces the cost of your next Audit to 0.', cost: 0, effect: 'free_audit' },
  { id: 'sup-9',  type: 'support', subtype: 'consumable', name: 'Whistleblower',                 description: 'Reduces the cost of your next Audit to 0.', cost: 0, effect: 'free_audit' },
  { id: 'sup-10', type: 'support', subtype: 'consumable', name: 'Whistleblower',                 description: 'Reduces the cost of your next Audit to 0.', cost: 0, effect: 'free_audit' },
  { id: 'sup-11', type: 'support', subtype: 'consumable', name: 'Whistleblower',                 description: 'Reduces the cost of your next Audit to 0.', cost: 0, effect: 'free_audit' },

  // Economic Boom ×4 — Consumable (free)
  { id: 'sup-12', type: 'support', subtype: 'consumable', name: 'Economic Boom',                 description: 'Provides a one-time Budget boost.', cost: 0, effect: 'budget_boost', value: 3 },
  { id: 'sup-13', type: 'support', subtype: 'consumable', name: 'Economic Boom',                 description: 'Provides a one-time Budget boost.', cost: 0, effect: 'budget_boost', value: 3 },
  { id: 'sup-14', type: 'support', subtype: 'consumable', name: 'Economic Boom',                 description: 'Provides a one-time Budget boost.', cost: 0, effect: 'budget_boost', value: 3 },
  { id: 'sup-15', type: 'support', subtype: 'consumable', name: 'Economic Boom',                 description: 'Provides a one-time Budget boost.', cost: 0, effect: 'budget_boost', value: 3 },
];

/** Fisher-Yates shuffle */
export function shuffleDeck(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck() {
  return shuffleDeck([...INFRASTRUCTURE_CARDS, ...SUPPORT_CARDS]);
}

export { INFRASTRUCTURE_CARDS, SUPPORT_CARDS };
