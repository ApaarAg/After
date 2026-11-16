import type { DamageClass, DamageExampleMeta, HeroAssetSpec } from '../types/hero';

export const GITHUB_REPO_URL = 'https://github.com/ApaarAg/AftermathVision';

/**
 * Explicit semantic asset registry separating photographic evidence from illustrative
 * environmental assets. Every component requests its asset by explicit semantic key.
 */
export const HERO_ASSETS: {
  satelliteOverview: HeroAssetSpec;
  buildingBefore: HeroAssetSpec;
  buildingAfter: HeroAssetSpec;
  buildingCrop: HeroAssetSpec;
  damageNoDamage: DamageExampleMeta;
  damageMinor: DamageExampleMeta;
  damageMajor: DamageExampleMeta;
  damageDestroyed: DamageExampleMeta;
  environmentalFallback: HeroAssetSpec;
  damageExamples: Record<DamageClass, DamageExampleMeta>;
} = (() => {
  const damageNoDamage: DamageExampleMeta = {
    damageClass: 'no-damage',
    semanticRole: 'damageNoDamage',
    label: 'No Damage',
    shortLabel: 'NO DAMAGE',
    semanticHex: '#8C8981',
    toneSummary: 'Neutral stone baseline — intact roof envelope and perimeter.',
    provenanceStatus: 'temporary-placeholder',
    assetSrc: null,
  };

  const damageMinor: DamageExampleMeta = {
    damageClass: 'minor',
    semanticRole: 'damageMinor',
    label: 'Minor Damage',
    shortLabel: 'MINOR',
    semanticHex: '#D49B42',
    toneSummary: 'Muted amber — localized roof or surface distress.',
    provenanceStatus: 'temporary-placeholder',
    assetSrc: null,
  };

  const damageMajor: DamageExampleMeta = {
    damageClass: 'major',
    semanticRole: 'damageMajor',
    label: 'Major Damage',
    shortLabel: 'MAJOR',
    semanticHex: '#D97736',
    toneSummary: 'Muted orange — partial structural failure or bay collapse.',
    provenanceStatus: 'temporary-placeholder',
    assetSrc: null,
  };

  const damageDestroyed: DamageExampleMeta = {
    damageClass: 'destroyed',
    semanticRole: 'damageDestroyed',
    label: 'Destroyed',
    shortLabel: 'DESTROYED',
    semanticHex: '#D1534F',
    toneSummary: 'Muted crimson — complete structural collapse across footprint.',
    provenanceStatus: 'temporary-placeholder',
    assetSrc: '/src/assets/images/damage_example_crop_1794828352044.jpg',
  };

  return {
    satelliteOverview: {
      id: 'satellite-overview',
      semanticRole: 'satelliteOverview',
      label: 'Regional Satellite Swath',
      src: '/src/assets/images/hero_satellite_swath_1794828350703.jpg',
      aspectRatio: '16:9',
      cropTopFraction: 0.0,
      uvBounds: { uMin: 0.01, uMax: 0.99, vMin: 0.01, vMax: 0.99 },
      provenanceStatus: 'temporary-placeholder',
      isCoRegisteredPair: false,
      provenanceNote:
        'Illustrative regional nadir EO swath; replace with verified xBD overview tile when connecting repository data.',
    },
    buildingBefore: {
      id: 'building-before',
      semanticRole: 'buildingBefore',
      label: 'Pre-Disaster Observation',
      src: '/src/assets/images/building_before_coregistered_1794831065869.jpg',
      aspectRatio: '4:3',
      cropTopFraction: 0.0,
      uvBounds: { uMin: 0.02, uMax: 0.98, vMin: 0.02, vMax: 0.98 },
      provenanceStatus: 'temporary-placeholder',
      isCoRegisteredPair: true,
      provenanceNote:
        'Co-registered pre-disaster nadir pair showing intact target structure and surrounding urban grid.',
    },
    buildingAfter: {
      id: 'building-after',
      semanticRole: 'buildingAfter',
      label: 'Post-Disaster Observation',
      src: '/src/assets/images/damage_example_crop_1794828352044.jpg',
      aspectRatio: '4:3',
      cropTopFraction: 0.0,
      uvBounds: { uMin: 0.02, uMax: 0.98, vMin: 0.02, vMax: 0.98 },
      provenanceStatus: 'temporary-placeholder',
      isCoRegisteredPair: true,
      provenanceNote:
        'Co-registered post-disaster nadir pair showing structural collapse of the target parcel.',
    },
    buildingCrop: {
      id: 'building-crop',
      semanticRole: 'buildingCrop',
      label: 'Building 01842 Parcel Crop',
      src: '/src/assets/images/damage_example_crop_1794828352044.jpg',
      aspectRatio: '4:3',
      cropTopFraction: 0.0,
      uvBounds: { uMin: 0.14, uMax: 0.86, vMin: 0.14, vMax: 0.86 },
      provenanceStatus: 'temporary-placeholder',
      isCoRegisteredPair: true,
      provenanceNote:
        'Focused single-building post-disaster crop for Stage 06 classification reveal.',
    },
    damageNoDamage,
    damageMinor,
    damageMajor,
    damageDestroyed,
    environmentalFallback: {
      id: 'environmental-fallback',
      semanticRole: 'environmentalFallback',
      label: 'Atmospheric Horizon Context',
      src: '/src/assets/images/env_horizon_fallback_1794828352123.jpg',
      aspectRatio: '16:9',
      cropTopFraction: 0.0,
      uvBounds: { uMin: 0.0, uMax: 1.0, vMin: 0.0, vMax: 1.0 },
      provenanceStatus: 'temporary-placeholder',
      isCoRegisteredPair: false,
      provenanceNote: 'Documentary coastal horizon backdrop used when WebGL is unavailable.',
    },
    damageExamples: {
      'no-damage': damageNoDamage,
      minor: damageMinor,
      major: damageMajor,
      destroyed: damageDestroyed,
    },
  };
})();
