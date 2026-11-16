export type DamageClass = 'no-damage' | 'minor' | 'major' | 'destroyed';

export type HeroStageId =
  | 'darkness'
  | 'observation'
  | 'isolation'
  | 'comparison'
  | 'reconstruction'
  | 'classification'
  | 'zoom-out';

export type AssetProvenanceStatus = 'verified-repo-asset' | 'temporary-placeholder';

export type SemanticAssetRole =
  | 'satelliteOverview'
  | 'buildingBefore'
  | 'buildingAfter'
  | 'buildingCrop'
  | 'damageNoDamage'
  | 'damageMinor'
  | 'damageMajor'
  | 'damageDestroyed'
  | 'environmentalFallback';

export interface UvCropBounds {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

export interface HeroAssetSpec {
  id: string;
  semanticRole: SemanticAssetRole;
  label: string;
  src: string;
  aspectRatio: string;
  cropTopFraction: number;
  uvBounds: UvCropBounds;
  provenanceStatus: AssetProvenanceStatus;
  isCoRegisteredPair: boolean;
  provenanceNote: string;
}

export interface DamageExampleMeta {
  damageClass: DamageClass;
  semanticRole: SemanticAssetRole;
  label: string;
  shortLabel: string;
  semanticHex: string;
  toneSummary: string;
  provenanceStatus: AssetProvenanceStatus;
  assetSrc: string | null;
}

export interface HeroPrediction {
  damageClass: DamageClass;
  confidence: number | null;
  probabilities: Record<DamageClass, number> | null;
  modelVersion: string | null;
  isLiveInference: boolean;
  evaluationLabel: string;
  statusLabel: string;
  analysisLabel: string;
  targetLabel: string;
}

export interface HeroStageMeta {
  id: HeroStageId;
  index: number;
  code: string;
  label: string;
  scrollTarget: number;
  start: number;
  end: number;
}

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface HeroTimelineState {
  progress: number;
  activeStageId: HeroStageId;
  activeStageIndex: number;
  cameraPos: Vec3Tuple;
  cameraTarget: Vec3Tuple;
  fogDensity: number;
  terrainAlpha: number;
  satelliteAlpha: number;
  contextDimFactor: number;
  targetFocusAlpha: number;
  comparisonVisibility: number;
  comparisonAutoSplit: number;
  reconstructionFactor: number;
  featureStepIndex: number;
  classificationReveal: number;
  zoomOutFactor: number;
  scaleStageIndex: number;
}
