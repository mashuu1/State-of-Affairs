export const TRUST_MAX = 5;
export const AGENDA_SLOT_COUNT = 3;
export const DP_WIN_THRESHOLD = 4;
export const DP_DISPLAY_MAX = 10;
export const UPGRADE_COST = 8;
export const UPGRADE_DP_REWARD = 1;

export function warnIfGameConfigInconsistent() {
  const maxHonestDp =
    AGENDA_SLOT_COUNT + AGENDA_SLOT_COUNT * UPGRADE_DP_REWARD;

  if (import.meta?.env?.DEV && DP_WIN_THRESHOLD > maxHonestDp) {
    console.warn(
      `[game config] DP_WIN_THRESHOLD (${DP_WIN_THRESHOLD}) is higher than maxHonestDp (${maxHonestDp}). ` +
        `An all-honest strategy may be unable to reach the DP win condition.`
    );
  }
}
