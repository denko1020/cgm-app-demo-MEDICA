/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BASELINE, GlucoseModel } from './glucoseModel';

/** Deterministic LCG so both runs see the same noise. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Runs a scenario for `minutes` simulated minutes at 1-minute readings and returns peak − pre-switch glucose. */
function postMealRise(minutes = 120, seed = 42): number {
  const model = new GlucoseModel({ random: seeded(seed) });
  // Settle at baseline first.
  for (let i = 0; i < 30; i += 1) model.next('normal', 1);
  const base = model.glucose;
  let peak = base;
  for (let i = 0; i < minutes; i += 1) peak = Math.max(peak, model.next('meal', 1));
  return peak - base;
}

test('normal settles near the baseline', () => {
  const model = new GlucoseModel({ random: seeded(11), noiseSd: 0 });
  for (let i = 0; i < 60; i += 1) model.next('normal', 1);
  assert.ok(Math.abs(model.glucose - BASELINE) < 2, `settled at ${model.glucose.toFixed(1)}`);
});

test('meal rises by roughly the modelled excursion', () => {
  const rise = postMealRise();
  assert.ok(rise > 50 && rise < 100, `rise ${rise.toFixed(1)} should be a clear post-prandial excursion`);
});

test('hypo and hyper pull glucose to their own levels', () => {
  const low = new GlucoseModel({ random: seeded(5), noiseSd: 0 });
  for (let i = 0; i < 60; i += 1) low.next('hypo', 1);
  assert.ok(low.glucose < 70, `hypo should fall below the target low, got ${low.glucose.toFixed(1)}`);

  const high = new GlucoseModel({ random: seeded(5), noiseSd: 0 });
  for (let i = 0; i < 60; i += 1) high.next('hyper', 1);
  assert.ok(high.glucose > 180, `hyper should climb above the target high, got ${high.glucose.toFixed(1)}`);
});

test('the meal excursion comes back down on its own', () => {
  const model = new GlucoseModel({ random: seeded(3), noiseSd: 0 });
  for (let i = 0; i < 30; i += 1) model.next('normal', 1);
  let peak = -Infinity;
  for (let i = 0; i < 40; i += 1) peak = Math.max(peak, model.next('meal', 1));
  for (let i = 0; i < 120; i += 1) model.next('normal', 1);
  assert.ok(peak > BASELINE + 50, `peak ${peak.toFixed(1)}`);
  assert.ok(Math.abs(model.glucose - BASELINE) < 5, `should return to baseline, got ${model.glucose.toFixed(1)}`);
});
