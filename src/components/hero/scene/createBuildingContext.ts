import * as THREE from 'three';
import type { DamageClass } from '../../../types/hero';

export interface BuildingContextLayer {
  group: THREE.Group;
  update: (
    elapsed: number,
    terrainAlpha: number,
    dimFactor: number,
    zoomOutFactor: number,
  ) => void;
  dispose: () => void;
}

interface ContextParcel {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  radialDist: number;
  damage: DamageClass;
  hasSetback: boolean;
}

const DAMAGE_RGB: Record<DamageClass, [number, number, number]> = {
  'no-damage': [0.55, 0.54, 0.51], // neutral warm stone (#8C8981)
  minor: [0.83, 0.61, 0.26],       // muted amber (#D49B42)
  major: [0.85, 0.47, 0.21],       // muted orange (#D97736)
  destroyed: [0.82, 0.33, 0.31],   // muted red (#D1534F)
};

function deterministicHash(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
}

/**
 * Builds crisp architectural LiDAR structural wireframes + sheer translucent smoked-glass
 * massing tiers + ground-level semantic footprints so the high-resolution satellite swath
 * beneath remains sharp and unobstructed instead of being covered by opaque solid blocks.
 */
export function createBuildingContext(
  scene: THREE.Scene,
  isMobile: boolean,
): BuildingContextLayer {
  const group = new THREE.Group();
  scene.add(group);

  const parcels: ContextParcel[] = [];
  const gridRange = isMobile ? 3 : 5;
  const damageClasses: DamageClass[] = ['no-damage', 'minor', 'major', 'destroyed'];

  for (let gx = -gridRange; gx <= 2; gx++) {
    for (let gz = -3; gz <= 3; gz++) {
      // Leave central target parcel clear around (0, 0)
      if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;

      const idx = (gx + 10) * 31 + (gz + 10);
      const jitterX = (deterministicHash(idx * 3) - 0.5) * 0.42;
      const jitterZ = (deterministicHash(idx * 5) - 0.5) * 0.42;
      const x = gx * 1.78 + jitterX;
      const z = gz * 1.78 + jitterZ;
      // Exclude harbor water & hillside edges so wireframes only sit over urban blocks
      if (x < -9.2 || x > 3.6 || Math.abs(z) > 6.2) continue;
      const w = 0.68 + deterministicHash(idx * 7) * 0.56;
      const d = 0.68 + deterministicHash(idx * 11) * 0.56;
      const h = 0.16 + deterministicHash(idx * 13) * 0.44;
      const hasSetback = deterministicHash(idx * 19) > 0.35;
      const dmgRoll = deterministicHash(idx * 17);
      const damage: DamageClass =
        dmgRoll < 0.38
          ? damageClasses[0]
          : dmgRoll < 0.62
            ? damageClasses[1]
            : dmgRoll < 0.82
              ? damageClasses[2]
              : damageClasses[3];

      parcels.push({
        x,
        z,
        w,
        h,
        d,
        radialDist: Math.hypot(x, z),
        damage,
        hasSetback,
      });
    }
  }

  // 1. Sheer architectural wireframe / edge-lit glass shader for primary podium & stepped upper roof
  const shellGeo = new THREE.BoxGeometry(1, 1, 1);
  const instanceDistAttr = new Float32Array(parcels.length);
  const setbackCount = parcels.filter((p) => p.hasSetback).length;
  const setbackDistAttr = new Float32Array(Math.max(1, setbackCount));

  // Clone geometry so each InstancedMesh carries its own radial attribute cleanly
  const primaryGeo = shellGeo.clone();
  const setbackGeo = shellGeo.clone();

  parcels.forEach((p, i) => {
    instanceDistAttr[i] = p.radialDist;
  });

  primaryGeo.setAttribute('aRadialDist', new THREE.InstancedBufferAttribute(instanceDistAttr, 1));
  const primaryMat = new THREE.ShaderMaterial({
    uniforms: {
      uTerrainAlpha: { value: 0.25 },
      uDimFactor: { value: 0 },
      uZoomOut: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aRadialDist;
      varying vec3 vLocalPos;
      varying vec3 vNormalDir;
      varying vec3 vInstanceCol;
      varying float vRadialDist;

      void main() {
        vLocalPos = position;
        vNormalDir = abs(normal);
        vRadialDist = aRadialDist;
        #ifdef USE_INSTANCING_COLOR
          vInstanceCol = instanceColor;
        #else
          vInstanceCol = vec3(0.55, 0.54, 0.51);
        #endif

        vec4 mvPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTerrainAlpha;
      uniform float uDimFactor;
      uniform float uZoomOut;
      uniform float uTime;
      varying vec3 vLocalPos;
      varying vec3 vNormalDir;
      varying vec3 vInstanceCol;
      varying float vRadialDist;

      void main() {
        vec3 edgeDist = 0.5 - abs(vLocalPos);
        float edgeX = 1.0 - smoothstep(0.014, 0.056, min(edgeDist.y, edgeDist.z));
        float edgeY = 1.0 - smoothstep(0.014, 0.056, min(edgeDist.x, edgeDist.z));
        float edgeZ = 1.0 - smoothstep(0.014, 0.056, min(edgeDist.x, edgeDist.y));
        float wireMask = max(max(edgeX * vNormalDir.x, edgeY * vNormalDir.y), edgeZ * vNormalDir.z);

        float waveFront = mix(-2.0, 16.5, uZoomOut);
        float waveReveal = smoothstep(waveFront + 1.2, waveFront - 1.8, vRadialDist) * smoothstep(0.02, 0.22, uZoomOut);
        float waveBand = exp(-pow((vRadialDist - waveFront) * 0.85, 2.0)) * smoothstep(0.05, 0.35, uZoomOut);

        vec3 baseWireCol = vec3(0.42, 0.40, 0.37);
        vec3 semanticCol = mix(baseWireCol, vInstanceCol, waveReveal);
        semanticCol = mix(semanticCol, vec3(0.776, 0.655, 0.416), waveBand * 0.28);

        float dimScale = 1.0 - uDimFactor * 0.72;
        float faceAlpha = mix(0.032, 0.075, waveReveal) * uTerrainAlpha * dimScale;
        float lineAlpha = mix(0.30, 0.82, waveReveal) * uTerrainAlpha * dimScale + waveBand * 0.14;

        vec3 faceFill = mix(vec3(0.08, 0.08, 0.075), vInstanceCol * 0.24, waveReveal);
        vec3 finalCol = mix(faceFill, semanticCol, wireMask);
        float finalAlpha = mix(faceAlpha, lineAlpha, wireMask);

        if (finalAlpha < 0.008) discard;
        gl_FragColor = vec4(finalCol, clamp(finalAlpha, 0.0, 0.92));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Ground-level crisp footprint outline plane for each parcel
  const footprintGeo = new THREE.PlaneGeometry(1.12, 1.12);
  footprintGeo.rotateX(-Math.PI / 2);
  const footprintDistAttr = new Float32Array(parcels.length);
  parcels.forEach((p, i) => {
    footprintDistAttr[i] = p.radialDist;
  });
  footprintGeo.setAttribute('aRadialDist', new THREE.InstancedBufferAttribute(footprintDistAttr, 1));

  const footprintMat = new THREE.ShaderMaterial({
    uniforms: {
      uTerrainAlpha: { value: 0.25 },
      uDimFactor: { value: 0 },
      uZoomOut: { value: 0 },
    },
    vertexShader: `
      attribute float aRadialDist;
      varying vec2 vUv;
      varying vec3 vInstanceCol;
      varying float vRadialDist;

      void main() {
        vUv = uv;
        vRadialDist = aRadialDist;
        #ifdef USE_INSTANCING_COLOR
          vInstanceCol = instanceColor;
        #else
          vInstanceCol = vec3(0.55, 0.54, 0.51);
        #endif

        vec4 mvPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTerrainAlpha;
      uniform float uDimFactor;
      uniform float uZoomOut;
      varying vec2 vUv;
      varying vec3 vInstanceCol;
      varying float vRadialDist;

      void main() {
        vec2 d = abs(vUv - 0.5);
        float maxD = max(d.x, d.y);
        float ring = smoothstep(0.455, 0.475, maxD) * (1.0 - smoothstep(0.49, 0.5, maxD));

        float waveFront = mix(-2.0, 16.5, uZoomOut);
        float waveReveal = smoothstep(waveFront + 1.2, waveFront - 1.8, vRadialDist) * smoothstep(0.02, 0.22, uZoomOut);

        float dimScale = 1.0 - uDimFactor * 0.65;
        vec3 col = mix(vec3(0.32, 0.31, 0.29), vInstanceCol, waveReveal);
        float alpha = ring * mix(0.28, 0.78, waveReveal) * uTerrainAlpha * dimScale;

        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const primaryInstanced = new THREE.InstancedMesh(primaryGeo, primaryMat, parcels.length);
  const footprintInstanced = new THREE.InstancedMesh(footprintGeo, footprintMat, parcels.length);

  // Secondary upper roof setback tier for architectural silhouette variety
  const setbackParcels = parcels.filter((p) => p.hasSetback);
  setbackParcels.forEach((p, i) => {
    setbackDistAttr[i] = p.radialDist;
  });
  setbackGeo.setAttribute('aRadialDist', new THREE.InstancedBufferAttribute(setbackDistAttr, 1));
  const setbackMat = primaryMat.clone();
  const setbackInstanced = new THREE.InstancedMesh(
    setbackGeo,
    setbackMat,
    Math.max(1, setbackParcels.length),
  );

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const applyMatrices = (heightGrowth: number) => {
    let sIdx = 0;
    parcels.forEach((p, i) => {
      const hScaled = Math.max(0.02, p.h * heightGrowth);
      dummy.position.set(p.x, hScaled * 0.5, p.z);
      dummy.scale.set(p.w, hScaled, p.d);
      dummy.updateMatrix();
      primaryInstanced.setMatrixAt(i, dummy.matrix);

      if (p.hasSetback) {
        const upperH = Math.max(0.015, p.h * 0.42 * heightGrowth);
        dummy.position.set(p.x + p.w * 0.06, hScaled + upperH * 0.5, p.z - p.d * 0.05);
        dummy.scale.set(p.w * 0.58, upperH, p.d * 0.58);
        dummy.updateMatrix();
        setbackInstanced.setMatrixAt(sIdx, dummy.matrix);
        sIdx++;
      }
    });
    primaryInstanced.instanceMatrix.needsUpdate = true;
    setbackInstanced.instanceMatrix.needsUpdate = true;
  };

  // Static footprint matrices + semantic colors
  let sColorIdx = 0;
  parcels.forEach((p, i) => {
    dummy.position.set(p.x, 0.016, p.z);
    dummy.scale.set(p.w, 1, p.d);
    dummy.updateMatrix();
    footprintInstanced.setMatrixAt(i, dummy.matrix);

    const [r, g, b] = DAMAGE_RGB[p.damage];
    color.setRGB(r, g, b);
    primaryInstanced.setColorAt(i, color);
    footprintInstanced.setColorAt(i, color);
    if (p.hasSetback) {
      setbackInstanced.setColorAt(sColorIdx, color);
      sColorIdx++;
    }
  });

  applyMatrices(1);

  footprintInstanced.instanceMatrix.needsUpdate = true;
  if (primaryInstanced.instanceColor) primaryInstanced.instanceColor.needsUpdate = true;
  if (setbackInstanced.instanceColor) setbackInstanced.instanceColor.needsUpdate = true;
  if (footprintInstanced.instanceColor) footprintInstanced.instanceColor.needsUpdate = true;

  primaryInstanced.frustumCulled = false;
  setbackInstanced.frustumCulled = false;
  footprintInstanced.frustumCulled = false;

  footprintInstanced.renderOrder = 2;
  primaryInstanced.renderOrder = 3;
  setbackInstanced.renderOrder = 4;

  group.add(footprintInstanced);
  group.add(primaryInstanced);
  group.add(setbackInstanced);

  // Unused helper kept clean: remove shellGeo template
  shellGeo.dispose();

  let lastGrowth = -1;

  return {
    group,
    update(elapsed, terrainAlpha, dimFactor, zoomOutFactor) {
      // Smoothly elevate LiDAR structural wireframes during observation & Stage 07 scale return
      const targetGrowth = Math.max(
        0.18,
        Math.min(1.05, terrainAlpha * 0.72 + zoomOutFactor * 0.34 - dimFactor * 0.35),
      );
      if (Math.abs(targetGrowth - lastGrowth) > 0.008) {
        applyMatrices(targetGrowth);
        lastGrowth = targetGrowth;
      }

      primaryMat.uniforms.uTerrainAlpha.value = terrainAlpha;
      primaryMat.uniforms.uDimFactor.value = dimFactor;
      primaryMat.uniforms.uZoomOut.value = zoomOutFactor;
      primaryMat.uniforms.uTime.value = elapsed;

      setbackMat.uniforms.uTerrainAlpha.value = terrainAlpha;
      setbackMat.uniforms.uDimFactor.value = dimFactor;
      setbackMat.uniforms.uZoomOut.value = zoomOutFactor;
      setbackMat.uniforms.uTime.value = elapsed;

      footprintMat.uniforms.uTerrainAlpha.value = terrainAlpha;
      footprintMat.uniforms.uDimFactor.value = dimFactor;
      footprintMat.uniforms.uZoomOut.value = zoomOutFactor;
    },
    dispose() {
      primaryGeo.dispose();
      primaryMat.dispose();
      setbackGeo.dispose();
      setbackMat.dispose();
      footprintGeo.dispose();
      footprintMat.dispose();
    },
  };
}
