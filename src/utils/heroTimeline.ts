import type { HeroStageId, HeroStageMeta, HeroTimelineState, Vec3Tuple } from '../types/hero';

export const HERO_STAGES: HeroStageMeta[] = [
  {
    id: 'darkness',
    index: 0,
    code: '01',
    label: 'Darkness',
    scrollTarget: 0.0,
    start: 0.0,
    end: 0.12,
  },
  {
    id: 'observation',
    index: 1,
    code: '02',
    label: 'Satellite Observation',
    scrollTarget: 0.21,
    start: 0.12,
    end: 0.28,
  },
  {
    id: 'isolation',
    index: 2,
    code: '03',
    label: 'Building Isolation',
    scrollTarget: 0.35,
    start: 0.28,
    end: 0.42,
  },
  {
    id: 'comparison',
    index: 3,
    code: '04',
    label: 'Pre / Post Analysis',
    scrollTarget: 0.5,
    start: 0.42,
    end: 0.58,
  },
  {
    id: 'reconstruction',
    index: 4,
    code: '05',
    label: 'Data Reconstruction',
    scrollTarget: 0.67,
    start: 0.58,
    end: 0.76,
  },
  {
    id: 'classification',
    index: 5,
    code: '06',
    label: 'Damage Classification',
    scrollTarget: 0.82,
    start: 0.76,
    end: 0.88,
  },
  {
    id: 'zoom-out',
    index: 6,
    code: '07',
    label: 'Scale & Return',
    scrollTarget: 0.96,
    start: 0.88,
    end: 1.0,
  },
];

export const FEATURE_RECONSTRUCTION_STEPS: string[] = [
  'IMAGE',
  'CROP',
  'FEATURES',
  'COMPARISON',
  'CLASSIFICATION',
];

export const SCALE_TRANSITION_STEPS: string[] = [
  'ONE BUILDING',
  'NEIGHBORHOOD',
  'DISASTER REGION',
  'AFTERMATHVISION',
];

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function dampScalar(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number,
): number {
  const safeDt = Math.max(0, Math.min(dtSeconds, 0.25));
  const factor = 1 - Math.exp(-lambda * safeDt);
  return current + (target - current) * factor;
}

function lerpVec3(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  const k = clamp01(t);
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    z: a.z + (b.z - a.z) * k,
  };
}

/**
 * Pure deterministic scroll-to-scene choreography mapper (0..1).
 * Keeps animation values centralized rather than scattered across components.
 */
export function computeHeroTimeline(scrollProgress: number): HeroTimelineState {
  const p = clamp01(scrollProgress);

  let activeStage: HeroStageMeta = HERO_STAGES[0];
  for (const stage of HERO_STAGES) {
    if (p >= stage.start && (p < stage.end || stage.id === 'zoom-out')) {
      activeStage = stage;
      break;
    }
  }

  // Camera waypoints across the continuous narrative
  const posDarkness: Vec3Tuple = { x: 0.0, y: 17.5, z: 15.5 };
  const posObservation: Vec3Tuple = { x: 0.0, y: 8.6, z: 7.8 };
  const posIsolation: Vec3Tuple = { x: 0.25, y: 4.35, z: 4.25 };
  const posComparison: Vec3Tuple = { x: 0.0, y: 3.75, z: 3.5 };
  const posReconstruction: Vec3Tuple = { x: 2.35, y: 3.85, z: 5.05 };
  const posClassification: Vec3Tuple = { x: 0.15, y: 4.05, z: 4.3 };
  const posZoomOut: Vec3Tuple = { x: 0.0, y: 14.0, z: 13.8 };

  const tgtGround: Vec3Tuple = { x: 0.0, y: 0.0, z: 0.0 };
  const tgtTarget: Vec3Tuple = { x: 0.0, y: 0.18, z: 0.0 };
  const tgtFeatures: Vec3Tuple = { x: 0.0, y: 0.95, z: 0.0 };

  let cameraPos = posDarkness;
  let cameraTarget = tgtGround;

  if (p < 0.28) {
    const t = smoothstep(0.04, 0.27, p);
    cameraPos = lerpVec3(posDarkness, posObservation, t);
    cameraTarget = lerpVec3(tgtGround, tgtTarget, t);
  } else if (p < 0.42) {
    const t = smoothstep(0.28, 0.41, p);
    cameraPos = lerpVec3(posObservation, posIsolation, t);
    cameraTarget = tgtTarget;
  } else if (p < 0.58) {
    const t = smoothstep(0.42, 0.52, p);
    cameraPos = lerpVec3(posIsolation, posComparison, t);
    cameraTarget = tgtTarget;
  } else if (p < 0.76) {
    const t = smoothstep(0.58, 0.67, p);
    cameraPos = lerpVec3(posComparison, posReconstruction, t);
    cameraTarget = lerpVec3(tgtTarget, tgtFeatures, t);
  } else if (p < 0.88) {
    const t = smoothstep(0.76, 0.84, p);
    cameraPos = lerpVec3(posReconstruction, posClassification, t);
    cameraTarget = lerpVec3(tgtFeatures, tgtTarget, t);
  } else {
    const t = smoothstep(0.88, 0.99, p);
    cameraPos = lerpVec3(posClassification, posZoomOut, t);
    cameraTarget = lerpVec3(tgtTarget, tgtGround, t);
  }

  // Atmospheric fog recedes during observation and deepens subtly on horizon zoom-out
  const fogDensity =
    p < 0.3
      ? lerp(0.072, 0.022, smoothstep(0.04, 0.28, p))
      : p > 0.88
        ? lerp(0.022, 0.032, smoothstep(0.88, 1.0, p))
        : 0.022;

  // Terrain & satellite observation visibility
  const terrainAlpha = lerp(0.2, 1.0, smoothstep(0.03, 0.24, p));
  const satelliteAlpha = smoothstep(0.14, 0.27, p);

  // Surrounding neighborhood dims during building isolation & comparison, returns during zoom-out
  const dimIn = smoothstep(0.27, 0.36, p);
  const dimOut = smoothstep(0.85, 0.94, p);
  const contextDimFactor = clamp01(dimIn * (1 - dimOut));

  // Analytical outline focus on the single target parcel
  const focusIn = smoothstep(0.28, 0.36, p);
  const focusOut = smoothstep(0.91, 0.99, p);
  const targetFocusAlpha = clamp01(focusIn * (1 - focusOut * 0.45));

  // Pre/Post comparison visibility & scroll-driven sweep
  const compIn = smoothstep(0.39, 0.45, p);
  const compOut = smoothstep(0.58, 0.64, p);
  const comparisonVisibility = clamp01(compIn * (1 - compOut));
  const comparisonAutoSplit = lerp(0.18, 0.84, smoothstep(0.42, 0.57, p));

  // Data reconstruction lift & convergence back to real world
  const reconRise = smoothstep(0.57, 0.65, p);
  const reconFall = smoothstep(0.72, 0.78, p);
  const reconstructionFactor = clamp01(reconRise * (1 - reconFall));

  // 7-step feature narrative index inside Stage 05 (0..6)
  const featureLocal = clamp01((p - 0.58) / (0.76 - 0.58));
  const featureStepIndex = Math.min(
    FEATURE_RECONSTRUCTION_STEPS.length - 1,
    Math.floor(featureLocal * FEATURE_RECONSTRUCTION_STEPS.length),
  );

  // Classification overlay reveal (Stage 06 + persists into early zoom-out)
  const classificationReveal = smoothstep(0.77, 0.84, p);

  // Zoom-out district classification reveal (Stage 07)
  const zoomOutFactor = smoothstep(0.86, 0.98, p);
  const zoomLocal = clamp01((p - 0.88) / 0.12);
  const scaleStageIndex = Math.min(
    SCALE_TRANSITION_STEPS.length - 1,
    Math.floor(zoomLocal * SCALE_TRANSITION_STEPS.length),
  );

  return {
    progress: p,
    activeStageId: activeStage.id as HeroStageId,
    activeStageIndex: activeStage.index,
    cameraPos,
    cameraTarget,
    fogDensity,
    terrainAlpha,
    satelliteAlpha,
    contextDimFactor,
    targetFocusAlpha,
    comparisonVisibility,
    comparisonAutoSplit,
    reconstructionFactor,
    featureStepIndex,
    classificationReveal,
    zoomOutFactor,
    scaleStageIndex,
  };
}
