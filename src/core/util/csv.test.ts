/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { GlucoseReading, ScenarioEvent } from '../types';
import { readingsToCsv } from './csv';

const r = (ts: number, value: number): GlucoseReading => ({ id: `r${ts}`, deviceId: 'd', source: 'cgm', timestamp: ts, raw: value, value, trend: 'flat', uploaded: false });

test('csv: readings and scenario switches merge into one timeline', () => {
  const events: ScenarioEvent[] = [
    { id: 'e1', timestamp: 1500, kind: 'scenario', from: 'normal', to: 'meal' },
    { id: 'e2', timestamp: 2500, kind: 'scenario', from: 'meal', to: 'normal' },
  ];
  const lines = readingsToCsv([r(1000, 100), r(2000, 120), r(3000, 130)], events, 'mg/dL').trim().split('\r\n');
  assert.equal(lines.length, 6);
  assert.match(lines[2], /,scenario,.*scenario normal -> meal,e1$/);
  assert.match(lines[4], /,scenario,.*scenario meal -> normal,e2$/);
});

test('csv: the header carries no simulator-only column', () => {
  const header = readingsToCsv([r(1000, 100)], [], 'mg/dL').split('\r\n')[0];
  assert.ok(!header.includes('sim_effect_mgdl'), header);
  assert.equal(header.split(',').length, 12);
});
