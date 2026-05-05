export const XP_RULES = {
  CHECK_IN_PERSONAL: 10,
  CHECK_IN_SELF: 3,
  WEIGHT_LOG: 1,
  TRAINING_LOG: 2,
  TRAINER_LIKE_BONUS: 5,
  DAILY_MAX: 16,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 30 },
  { level: 3, xp: 80 },
  { level: 4, xp: 160 },
  { level: 5, xp: 280 },
  { level: 6, xp: 450 },
  { level: 7, xp: 680 },
  { level: 8, xp: 980 },
  { level: 9, xp: 1360 },
  { level: 10, xp: 1830 },
] as const;

export type Level = (typeof LEVEL_THRESHOLDS)[number]["level"];

export function xpToNextLevel(currentXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  remaining: number | null;
} {
  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (currentXp >= t.xp) level = t.level;
  }
  const next = LEVEL_THRESHOLDS.find((t) => t.level === level + 1);
  const current = LEVEL_THRESHOLDS.find((t) => t.level === level)!;
  if (!next) {
    return { level, xpIntoLevel: currentXp - current.xp, xpForNextLevel: null, remaining: null };
  }
  return {
    level,
    xpIntoLevel: currentXp - current.xp,
    xpForNextLevel: next.xp - current.xp,
    remaining: next.xp - currentXp,
  };
}
