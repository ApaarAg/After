import assert from 'node:assert/strict';
import test from 'node:test';
import { adaptPredictionResponse, DEFAULT_HERO_PREDICTION } from '../data/heroPrediction.ts';
import {
  clamp01,
  computeHeroTimeline,
  dampScalar,
  HERO_STAGES,
  smoothstep,
} from './heroTimeline.ts';

test('computeHeroTimeline transitions monotonically through all 7 hero stages', () => {
  const samples = [0.02, 0.2, 0.35, 0.5, 0.67, 0.82, 0.96];
  const ids = samples.map((p) => computeHeroTimeline(p).activeStageId);
  assert.deepEqual(ids, HERO_STAGES.map((s) => s.id));
});

test('camera descends from darkness into building comparison then zooms back out', () => {
  const s1 = computeHeroTimeline(0.0);
  const s4 = computeHeroTimeline(0.5);
  const s7 = computeHeroTimeline(1.0);

  assert.ok(s1.cameraPos.y > s4.cameraPos.y, 'camera should descend toward building');
  assert.ok(s7.cameraPos.y > s4.cameraPos.y, 'camera should pull back out in stage 07');
  assert.ok(s1.fogDensity > s4.fogDensity, 'atmospheric fog should clear during descent');
});

test('reconstruction rises in stage 05 and collapses back before stage 06 reveal', () => {
  const beforeRecon = computeHeroTimeline(0.5);
  const peakRecon = computeHeroTimeline(0.68);
  const resolved = computeHeroTimeline(0.82);
  const zoomOut = computeHeroTimeline(0.96);

  assert.equal(beforeRecon.comparisonVisibility, 1);
  assert.equal(beforeRecon.reconstructionFactor, 0);
  assert.ok(peakRecon.reconstructionFactor > 0.85);
  assert.equal(resolved.reconstructionFactor, 0);
  assert.equal(resolved.comparisonVisibility, 0);
  assert.equal(zoomOut.comparisonVisibility, 0);
  assert.ok(resolved.classificationReveal > 0.7);
});

test('dampScalar and smoothstep behave within bounds', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(1.8), 1);
  assert.equal(smoothstep(0.2, 0.8, 0.2), 0);
  assert.equal(smoothstep(0.2, 0.8, 0.8), 1);

  let val = 0;
  for (let i = 0; i < 20; i++) {
    val = dampScalar(val, 10, 6, 0.016);
  }
  assert.ok(val > 5 && val < 10);
});

test('prediction contract keeps placeholder non-live and adapts live FastAPI payload cleanly', () => {
  assert.equal(DEFAULT_HERO_PREDICTION.isLiveInference, false);
  assert.equal(DEFAULT_HERO_PREDICTION.confidence, null);

  const live = adaptPredictionResponse({
    damage_class: 'major',
    confidence: 0.912,
    probabilities: { 'no-damage': 0.02, minor: 0.04, major: 0.912, destroyed: 0.028 },
    model_version: 'siamese-v1',
    target_id: 'B-14',
  });
  assert.equal(live.isLiveInference, true);
  assert.equal(live.damageClass, 'major');
  assert.equal(live.confidence, 0.912);
  assert.equal(live.targetLabel, 'BUILDING B-14');
});
