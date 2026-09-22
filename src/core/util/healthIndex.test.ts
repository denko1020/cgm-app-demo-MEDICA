/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ActivitySample, GlucoseReading, ScenarioEvent, TherapySettings } from '../types';
import { collectHealthMaterials, healthScore } from './healthIndex';

const therapy: TherapySettings = { targetLow: 70, targetHigh: 180, alertsEnabled: true };
const T0 = 1_800_000_000_000;
const MIN = 60_000;

const reading = (minute: number, value: number): GlucoseReading => ({
  id: `r${minute}`,
  deviceId: 'dev',
  source: 'cgm',
  timestamp: T0 + minute * MIN,
  raw: value,
  value,
  trend: 'flat',
  uploaded: true,
});
/** A minute whose cadence reaches the active threshold (60 steps/min). */
const brisk = (minute: number, steps = 100): ActivitySample => ({ id: `a${minute}`, timestamp: T0 + minute * MIN, steps, durationSec: 60 });
/** Ordinary day-to-day movement, the only thing the simulator emits. */
const idle = (minute: number): ActivitySample => ({ id: `i${minute}`, timestamp: T0 + minute * MIN, steps: 3, durationSec: 60 });

test('materials: active minutes come from step cadence, steps count every window inside it', () => {
  const activity = [brisk(10), brisk(11), idle(12), brisk(-2000)];
  const m = collectHealthMaterials([], [], activity, therapy, T0 + 60 * MIN);
  assert.equal(m.activeMinutes, 2);
  assert.equal(m.steps, 203);
  assert.equal(m.timeInRange, null);
  assert.equal(healthScore(m), null);
});

test('materials: day-to-day steps alone never count as active minutes', () => {
  const activity = [idle(1), idle(2), idle(3), { id: 'e', timestamp: T0 + 4 * MIN, steps: 59, durationSec: 60 }];
  const m = collectHealthMaterials([], [], activity, therapy, T0 + 60 * MIN);
  assert.equal(m.activeMinutes, 0);
  assert.equal(m.steps, 68);
});

test('materials: post-meal rise is peak minus the reading just before the meal switch', () => {
  const readings = [reading(0, 100), reading(5, 102), reading(20, 150), reading(40, 170), reading(200, 110)];
  const meal: ScenarioEvent = { id: 'e', timestamp: T0 + 6 * MIN, kind: 'scenario', from: 'normal', to: 'meal' };
  const m = collectHealthMaterials(readings, [meal], [], therapy, T0 + 300 * MIN);
  assert.equal(m.postMealRise, 68);
  assert.equal(m.meals, 1);
  assert.equal(m.timeInRange, 1);
});

test('score: one function over the materials, rewarding range, activity and a small rise', () => {
  const good = healthScore({ activeMinutes: 30, steps: 4000, timeInRange: 1, postMealRise: 30, meals: 1 });
  const poor = healthScore({ activeMinutes: 0, steps: 0, timeInRange: 0.5, postMealRise: 120, meals: 1 });
  const noMeal = healthScore({ activeMinutes: 30, steps: 4000, timeInRange: 1, postMealRise: null, meals: 0 });
  assert.equal(good, 100);
  assert.equal(poor, 20);
  assert.equal(noMeal, 100);
});
