import type { DamageClass, HeroPrediction } from '../types/hero';
import { HERO_ASSETS } from './heroAssets';

/**
 * Default non-live placeholder prediction used to demonstrate the final
 * classification reveal before a live FastAPI inference backend is connected.
 * Arbitrary numeric confidence values are omitted (`confidence: null`).
 */
export const DEFAULT_HERO_PREDICTION: HeroPrediction = {
  damageClass: 'destroyed',
  confidence: null,
  probabilities: null,
  modelVersion: null,
  isLiveInference: false,
  evaluationLabel: 'ILLUSTRATIVE RESULT',
  statusLabel: 'LIVE INFERENCE NOT CONNECTED',
  analysisLabel: 'PRE / POST',
  targetLabel: 'BUILDING 01842',
};

export interface FastApiPredictionPayload {
  damage_class: DamageClass;
  confidence?: number | null;
  probabilities?: Partial<Record<DamageClass, number>> | null;
  model_version?: string | null;
  target_id?: string;
}

/**
 * Adapter stub converting a future FastAPI prediction JSON response into
 * the typed HeroPrediction contract without modifying UI components.
 */
export function adaptPredictionResponse(
  payload: FastApiPredictionPayload,
): HeroPrediction {
  const probs = payload.probabilities
    ? {
        'no-damage': payload.probabilities['no-damage'] ?? 0,
        minor: payload.probabilities.minor ?? 0,
        major: payload.probabilities.major ?? 0,
        destroyed: payload.probabilities.destroyed ?? 0,
      }
    : null;

  return {
    damageClass: payload.damage_class,
    confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
    probabilities: probs,
    modelVersion: payload.model_version ?? null,
    isLiveInference: true,
    evaluationLabel: 'MODEL PREDICTION',
    statusLabel: payload.model_version
      ? `MODEL ${payload.model_version}`
      : 'LIVE INFERENCE',
    analysisLabel: 'PRE / POST',
    targetLabel: payload.target_id
      ? `BUILDING ${payload.target_id}`
      : 'BUILDING 01842',
  };
}

export function getDamageSemanticMeta(damageClass: DamageClass) {
  return HERO_ASSETS.damageExamples[damageClass];
}
