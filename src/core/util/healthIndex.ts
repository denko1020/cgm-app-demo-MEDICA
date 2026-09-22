import type { ActivitySample, GlucoseReading, ScenarioEvent, TherapySettings } from '../types';

export const HEALTH_WINDOW_MS = 86_400_000;
/** Steps per minute from which a window counts as active movement (brisk walking) */
export const ACTIVE_STEPS_PER_MIN = 60;
/** How long after a meal switch we look for the glucose peak */
const POST_MEAL_WINDOW_MS = 2 * 3_600_000;

/**
 * Observable ingredients of the health index. Each one is shown on the Stats
 * screen on its own, so the index never hides where a number came from.
 */
export interface HealthMaterials {
  /** Minutes inside the window whose step cadence reaches ACTIVE_STEPS_PER_MIN */
  activeMinutes: number;
  /** Steps inside the window */
  steps: number;
  /** Fraction 0..1 of CGM readings inside the target range; null without readings */
  timeInRange: number | null;
  /** Peak minus pre-meal glucose (mg/dL) for the latest meal in the window; null without a meal */
  postMealRise: number | null;
  /** Number of meals the rise was measured over (0 or 1 today) */
  meals: number;
}

export function collectHealthMaterials(
  readings: GlucoseReading[],
  events: ScenarioEvent[],
  activity: ActivitySample[],
  therapy: TherapySettings,
  now: number,
  windowMs = HEALTH_WINDOW_MS,
): HealthMaterials {
  const since = now - windowMs;
  const cgm = readings.filter((r) => r.source === 'cgm' && r.timestamp >= since);

  const inWindow = activity.filter((a) => a.timestamp >= since);
  const activeMinutes = inWindow
    .filter((a) => a.durationSec > 0 && a.steps / (a.durationSec / 60) >= ACTIVE_STEPS_PER_MIN)
    .reduce((sum, a) => sum + a.durationSec / 60, 0);
  const steps = inWindow.reduce((sum, a) => sum + a.steps, 0);

  const inRange = cgm.filter((r) => r.value >= therapy.targetLow && r.value <= therapy.targetHigh).length;
  const timeInRange = cgm.length ? inRange / cgm.length : null;

  const meals = events.filter((e) => e.to === 'meal' && e.timestamp >= since);
  const lastMeal = meals[meals.length - 1];
  let postMealRise: number | null = null;
  if (lastMeal) {
    const before = cgm.filter((r) => r.timestamp <= lastMeal.timestamp);
    const after = cgm.filter((r) => r.timestamp > lastMeal.timestamp && r.timestamp <= lastMeal.timestamp + POST_MEAL_WINDOW_MS);
    const base = before.length ? before[before.length - 1].value : after[0]?.value;
    if (base !== undefined && after.length) postMealRise = Math.max(...after.map((r) => r.value)) - base;
  }

  return { activeMinutes: Math.round(activeMinutes), steps, timeInRange, postMealRise, meals: postMealRise === null ? 0 : 1 };
}

/**
 * The health index itself: one function over the materials above, so a new
 * definition only has to change this body. Current placeholder weights —
 *   40 % time in range, 30 % active minutes (30 min/day = full marks),
 *   30 % post-meal rise (≤30 mg/dL full marks, ≥120 mg/dL zero; no meal = no penalty).
 * Returns null until at least one CGM reading exists.
 */
export function healthScore(m: HealthMaterials): number | null {
  if (m.timeInRange === null) return null;
  const tir = m.timeInRange;
  const active = Math.min(m.activeMinutes / 30, 1);
  const rise = m.postMealRise === null ? 1 : Math.min(1, Math.max(0, 1 - (m.postMealRise - 30) / 90));
  return Math.round((0.4 * tir + 0.3 * active + 0.3 * rise) * 100);
}
