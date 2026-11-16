import * as THREE from 'three';
import type { UvCropBounds } from '../../../types/hero';

export interface BuildingTargetLayer {
  group: THREE.Group;
  setBeforeTexture: (beforeTex: THREE.Texture) => void;
  setAfterTexture: (afterTex: THREE.Texture) => void;
  setDamageTexture: (damageTex: THREE.Texture) => void;
  setBeforeAfterTextures: (beforeTex: THREE.Texture, afterTex: THREE.Texture) => void;
  update: (params: {
    elapsed: number;
    targetFocusAlpha: number;
    comparisonVisibility: number;
    splitRatio: number;
    reconstructionFactor: number;
    classificationReveal: number;
    hovered: boolean;
  }) => void;
  dispose: () => void;
}

export function createBuildingTarget(
  scene: THREE.Scene,
  beforeUv: UvCropBounds,
  afterUv: UvCropBounds,
  damageUv: UvCropBounds,
): BuildingTargetLayer {
  const group = new THREE.Group();
  scene.add(group);

  // Exact 4:3 inspection parcel geometry matching co-registered nadir pair aspect ratio
  const TARGET_W = 2.6;
  const TARGET_D = 1.95;

  // 0. Soft radial contact shadow halo grounding the lifted inspection plate
  const shadowGeo = new THREE.PlaneGeometry(TARGET_W * 1.32, TARGET_D * 1.32);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.ShaderMaterial({
    uniforms: {
      uAlpha: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        vec2 c = abs(vUv - 0.5) * 2.0;
        float dist = length(max(c - 0.62, 0.0));
        float shadow = (1.0 - smoothstep(0.0, 0.42, dist)) * 0.58 * uAlpha;
        gl_FragColor = vec4(0.02, 0.02, 0.02, shadow);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.008;
  shadowMesh.renderOrder = 5;
  group.add(shadowMesh);

  // 1. Matte graphite architectural parcel plinth
  const plinthShape = new THREE.Shape();
  plinthShape.moveTo(-TARGET_W * 0.54, -TARGET_D * 0.54);
  plinthShape.lineTo(TARGET_W * 0.54, -TARGET_D * 0.54);
  plinthShape.lineTo(TARGET_W * 0.54, TARGET_D * 0.54);
  plinthShape.lineTo(-TARGET_W * 0.54, TARGET_D * 0.54);
  plinthShape.closePath();

  const plinthGeo = new THREE.ExtrudeGeometry(plinthShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.014,
    bevelSegments: 2,
  });
  plinthGeo.rotateX(-Math.PI / 2);

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x161614,
    roughness: 0.88,
    metalness: 0.12,
    transparent: true,
    opacity: 0.96,
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = 0.012;
  plinthMesh.renderOrder = 6;
  group.add(plinthMesh);

  // 2. Co-registered Pre/Post Photographic Plane with GLSL micro-sharpening & tactile divider band
  const imageryGeo = new THREE.PlaneGeometry(TARGET_W, TARGET_D);
  imageryGeo.rotateX(-Math.PI / 2);

  const imageryMat = new THREE.ShaderMaterial({
    uniforms: {
      uBeforeTex: { value: null },
      uAfterTex: { value: null },
      uDamageTex: { value: null },
      uHasBefore: { value: 0 },
      uHasAfter: { value: 0 },
      uHasDamage: { value: 0 },
      uBeforeTexel: { value: new THREE.Vector2(1 / 1200, 1 / 900) },
      uAfterTexel: { value: new THREE.Vector2(1 / 1200, 1 / 900) },
      uDamageTexel: { value: new THREE.Vector2(1 / 1200, 1 / 900) },
      uSplit: { value: 0.5 },
      uAlpha: { value: 0 },
      uCompareMix: { value: 0 },
      uClassifiedTint: { value: 0 },
      uTime: { value: 0 },
      uBeforeMin: { value: new THREE.Vector2(beforeUv.uMin, beforeUv.vMin) },
      uBeforeMax: { value: new THREE.Vector2(beforeUv.uMax, beforeUv.vMax) },
      uAfterMin: { value: new THREE.Vector2(afterUv.uMin, afterUv.vMin) },
      uAfterMax: { value: new THREE.Vector2(afterUv.uMax, afterUv.vMax) },
      uDamageMin: { value: new THREE.Vector2(damageUv.uMin, damageUv.vMin) },
      uDamageMax: { value: new THREE.Vector2(damageUv.uMax, damageUv.vMax) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uBeforeTex;
      uniform sampler2D uAfterTex;
      uniform sampler2D uDamageTex;
      uniform float uHasBefore;
      uniform float uHasAfter;
      uniform float uHasDamage;
      uniform vec2 uBeforeTexel;
      uniform vec2 uAfterTexel;
      uniform vec2 uDamageTexel;
      uniform float uSplit;
      uniform float uAlpha;
      uniform float uCompareMix;
      uniform float uClassifiedTint;
      uniform float uTime;
      uniform vec2 uBeforeMin;
      uniform vec2 uBeforeMax;
      uniform vec2 uAfterMin;
      uniform vec2 uAfterMax;
      uniform vec2 uDamageMin;
      uniform vec2 uDamageMax;
      varying vec2 vUv;

      vec3 sampleSharp(sampler2D tex, vec2 uv, vec2 px) {
        vec3 c = texture2D(tex, uv).rgb;
        vec3 n = texture2D(tex, uv + vec2(0.0, px.y)).rgb;
        vec3 s = texture2D(tex, uv - vec2(0.0, px.y)).rgb;
        vec3 e = texture2D(tex, uv + vec2(px.x, 0.0)).rgb;
        vec3 w = texture2D(tex, uv - vec2(px.x, 0.0)).rgb;
        vec3 avg = (n + s + e + w) * 0.25;
        return clamp(c + (c - avg) * 0.36, 0.0, 1.0);
      }

      void main() {
        vec2 bUv = mix(uBeforeMin, uBeforeMax, vUv);
        vec2 aUv = mix(uAfterMin, uAfterMax, vUv);
        vec2 dUv = mix(uDamageMin, uDamageMax, vUv);

        vec3 preCol = uHasBefore > 0.5 ? sampleSharp(uBeforeTex, bUv, uBeforeTexel) : vec3(0.14, 0.14, 0.13);
        vec3 postCol = uHasAfter > 0.5 ? sampleSharp(uAfterTex, aUv, uAfterTexel) : vec3(0.18, 0.16, 0.15);
        vec3 dmgCol = uHasDamage > 0.5 ? sampleSharp(uDamageTex, dUv, uDamageTexel) : postCol;

        // Crisp co-registered horizontal wipe during Stage 04
        float mask = step(uSplit, vUv.x);
        vec3 splitCol = mix(preCol, postCol, mask);
        vec3 baseCol = mix(preCol, splitCol, uCompareMix);

        // Transition smoothly to focused post-disaster structural damage parcel in Stage 06
        vec3 mutedRed = vec3(0.82, 0.33, 0.31);
        vec3 resolvedDmg = mix(dmgCol, mutedRed, 0.12);
        baseCol = mix(baseCol, resolvedDmg, uClassifiedTint);

        // Minimal hairline divider during Stage 04 (no glowing pulse band)
        float distLine = abs(vUv.x - uSplit);
        float lineMask = (1.0 - smoothstep(0.0, 0.0045, distLine)) * uCompareMix;
        vec3 dividerAmber = vec3(0.776, 0.655, 0.416);
        vec3 finalCol = mix(baseCol, dividerAmber, lineMask * 0.92);

        gl_FragColor = vec4(finalCol, uAlpha);
      }
    `,
    transparent: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const imageryMesh = new THREE.Mesh(imageryGeo, imageryMat);
  imageryMesh.position.y = 0.075;
  imageryMesh.renderOrder = 7;
  group.add(imageryMesh);

  // 3. Hairline perimeter border (quiet -> #C6A76A during active analysis -> muted #D1534F on Stage 06)
  const hw = TARGET_W * 0.506;
  const hd = TARGET_D * 0.506;
  const borderPts = [
    new THREE.Vector3(-hw, 0.088, -hd),
    new THREE.Vector3(hw, 0.088, -hd),
    new THREE.Vector3(hw, 0.088, hd),
    new THREE.Vector3(-hw, 0.088, hd),
  ];
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
  const borderMat = new THREE.LineBasicMaterial({
    color: 0xc6a76a,
    transparent: true,
    opacity: 0,
  });
  const borderLoop = new THREE.LineLoop(borderGeo, borderMat);
  borderLoop.renderOrder = 8;
  group.add(borderLoop);

  // Minimal corner registration ticks
  const bracketPts: number[] = [];
  const tickLen = 0.14;
  const corners = [
    [-hw, -hd, 1, 1],
    [hw, -hd, -1, 1],
    [hw, hd, -1, -1],
    [-hw, hd, 1, -1],
  ];
  for (const [cx, cz, sx, sz] of corners) {
    bracketPts.push(cx, 0.098, cz, cx + sx * tickLen, 0.098, cz);
    bracketPts.push(cx, 0.098, cz, cx, 0.098, cz + sz * tickLen);
  }
  const bracketGeo = new THREE.BufferGeometry();
  bracketGeo.setAttribute('position', new THREE.Float32BufferAttribute(bracketPts, 3));
  const bracketMat = new THREE.LineBasicMaterial({
    color: 0xf2f0ea,
    transparent: true,
    opacity: 0,
  });
  const bracketLines = new THREE.LineSegments(bracketGeo, bracketMat);
  bracketLines.renderOrder = 8;
  group.add(bracketLines);

  const analysisAmber = new THREE.Color(0xc6a76a);
  const mutedRed = new THREE.Color(0xd1534f);

  const readTexel = (tex: THREE.Texture, uniformVec: THREE.Vector2) => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      uniformVec.set(1 / img.width, 1 / img.height);
    }
  };

  return {
    group,
    setBeforeTexture(beforeTex) {
      imageryMat.uniforms.uBeforeTex.value = beforeTex;
      imageryMat.uniforms.uHasBefore.value = 1;
      readTexel(beforeTex, imageryMat.uniforms.uBeforeTexel.value);
    },
    setAfterTexture(afterTex) {
      imageryMat.uniforms.uAfterTex.value = afterTex;
      imageryMat.uniforms.uHasAfter.value = 1;
      readTexel(afterTex, imageryMat.uniforms.uAfterTexel.value);
    },
    setDamageTexture(damageTex) {
      imageryMat.uniforms.uDamageTex.value = damageTex;
      imageryMat.uniforms.uHasDamage.value = 1;
      readTexel(damageTex, imageryMat.uniforms.uDamageTexel.value);
    },
    setBeforeAfterTextures(beforeTex, afterTex) {
      imageryMat.uniforms.uBeforeTex.value = beforeTex;
      imageryMat.uniforms.uAfterTex.value = afterTex;
      imageryMat.uniforms.uHasBefore.value = 1;
      imageryMat.uniforms.uHasAfter.value = 1;
      readTexel(beforeTex, imageryMat.uniforms.uBeforeTexel.value);
      readTexel(afterTex, imageryMat.uniforms.uAfterTexel.value);
    },
    update({
      elapsed,
      targetFocusAlpha,
      comparisonVisibility,
      splitRatio,
      reconstructionFactor,
      classificationReveal,
      hovered,
    }) {
      const planeAlpha =
        Math.max(targetFocusAlpha * 0.96, comparisonVisibility, classificationReveal) *
        (1 - reconstructionFactor * 0.56);

      // Gentle inspection lift during Stage 03-04, returning cleanly onto swath in Stage 06-07
      const liftY =
        Math.max(targetFocusAlpha, comparisonVisibility) *
        (1 - classificationReveal * 0.72) *
        (hovered ? 0.068 : 0.048);
      group.position.y = liftY;

      shadowMat.uniforms.uAlpha.value = Math.min(1, planeAlpha);
      plinthMat.opacity = Math.min(0.96, planeAlpha);

      imageryMat.uniforms.uTime.value = elapsed;
      imageryMat.uniforms.uAlpha.value = Math.min(1, planeAlpha);
      imageryMat.uniforms.uSplit.value = splitRatio;
      imageryMat.uniforms.uCompareMix.value = comparisonVisibility;
      imageryMat.uniforms.uClassifiedTint.value = classificationReveal;

      const breath = 0.02 * Math.sin(elapsed * 1.4);
      borderMat.color.copy(analysisAmber).lerp(mutedRed, classificationReveal);
      borderMat.opacity =
        Math.max(targetFocusAlpha, classificationReveal) * ((hovered ? 0.78 : 0.56) + breath);
      bracketMat.opacity =
        Math.max(targetFocusAlpha, classificationReveal) * ((hovered ? 0.65 : 0.42) + breath);
    },
    dispose() {
      shadowGeo.dispose();
      shadowMat.dispose();
      plinthGeo.dispose();
      plinthMat.dispose();
      imageryGeo.dispose();
      imageryMat.dispose();
      borderGeo.dispose();
      borderMat.dispose();
      bracketGeo.dispose();
      bracketMat.dispose();
    },
  };
}
