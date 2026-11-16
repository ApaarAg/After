import * as THREE from 'three';
import type { UvCropBounds } from '../../../types/hero';

export interface TerrainLayer {
  group: THREE.Group;
  setSatelliteTexture: (tex: THREE.Texture) => void;
  update: (
    elapsed: number,
    terrainAlpha: number,
    satelliteAlpha: number,
    isolationDim: number,
  ) => void;
  dispose: () => void;
}

export function createTerrainLayer(
  scene: THREE.Scene,
  overviewUvBounds: UvCropBounds,
): TerrainLayer {
  const group = new THREE.Group();
  scene.add(group);

  // 1. Matte dark architectural contour terrain fading cleanly into warm charcoal horizon
  const terrainGeo = new THREE.PlaneGeometry(58, 58, 92, 92);
  terrainGeo.rotateX(-Math.PI / 2);

  const terrainMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0.25 },
      uLineColor: { value: new THREE.Color(0x46443e) },
      uGridColor: { value: new THREE.Color(0x282824) },
      uBaseColor: { value: new THREE.Color(0x0d0d0c) },
    },
    vertexShader: `
      varying vec2 vWorldXZ;
      varying float vElev;

      void main() {
        vec3 pos = position;
        float dist = length(pos.xz);
        // Flatten urban district basin while introducing subtle coastal/ridge relief outward
        float flatMask = smoothstep(12.0, 19.0, dist);
        float ridge = (
          sin(pos.x * 0.24) * cos(pos.z * 0.20) * 0.9 +
          sin((pos.x + pos.z) * 0.13) * 0.6
        ) * flatMask;
        pos.y += ridge;
        vWorldXZ = pos.xz;
        vElev = ridge;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uAlpha;
      uniform vec3 uLineColor;
      uniform vec3 uGridColor;
      uniform vec3 uBaseColor;
      varying vec2 vWorldXZ;
      varying float vElev;

      void main() {
        float dist = length(vWorldXZ);
        float radialFade = 1.0 - smoothstep(11.0, 28.0, dist);

        // Whisper-quiet topographic elevation contours
        float contourVal = abs(fract(vElev * 3.8) - 0.5);
        float contourLine = 1.0 - smoothstep(0.0, 0.045, contourVal);

        // Restrained architectural coordinate grid
        vec2 grid = abs(fract(vWorldXZ * 0.32 - 0.5) - 0.5) / fwidth(vWorldXZ * 0.32);
        float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);

        vec3 col = uBaseColor;
        col += uLineColor * contourLine * 0.22 * uAlpha;
        col += uGridColor * gridLine * 0.20 * uAlpha;

        gl_FragColor = vec4(col, radialFade);
      }
    `,
    transparent: true,
    depthWrite: true,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.y = -0.02;
  terrainMesh.renderOrder = 0;
  group.add(terrainMesh);

  // 2. Wide Regional Satellite Swath Surface with 5-tap GLSL micro-sharpening & orbital scanline
  const swathGeo = new THREE.PlaneGeometry(24, 17.5);
  swathGeo.rotateX(-Math.PI / 2);

  const swathMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uHasMap: { value: 0 },
      uAlpha: { value: 0 },
      uDim: { value: 0 },
      uTime: { value: 0 },
      uTexelSize: { value: new THREE.Vector2(1 / 1408, 1 / 792) },
      uUvMin: { value: new THREE.Vector2(overviewUvBounds.uMin, overviewUvBounds.vMin) },
      uUvMax: { value: new THREE.Vector2(overviewUvBounds.uMax, overviewUvBounds.vMax) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uHasMap;
      uniform float uAlpha;
      uniform float uDim;
      uniform float uTime;
      uniform vec2 uTexelSize;
      uniform vec2 uUvMin;
      uniform vec2 uUvMax;
      varying vec2 vUv;

      vec3 sampleSharpened(sampler2D tex, vec2 uv, vec2 px) {
        vec3 c = texture2D(tex, uv).rgb;
        vec3 n = texture2D(tex, uv + vec2(0.0, px.y)).rgb;
        vec3 s = texture2D(tex, uv - vec2(0.0, px.y)).rgb;
        vec3 e = texture2D(tex, uv + vec2(px.x, 0.0)).rgb;
        vec3 w = texture2D(tex, uv - vec2(px.x, 0.0)).rgb;
        vec3 avg = (n + s + e + w) * 0.25;
        return clamp(c + (c - avg) * 0.34, 0.0, 1.0);
      }

      void main() {
        vec2 mappedUv = mix(uUvMin, uUvMax, vUv);
        vec3 texColor = uHasMap > 0.5
          ? sampleSharpened(uMap, mappedUv, uTexelSize)
          : vec3(0.09, 0.09, 0.08);

        // Crisp natural Earth-observation tonal range
        float lum = dot(texColor, vec3(0.299, 0.587, 0.114));
        vec3 naturalTone = mix(texColor, vec3(lum), 0.1);
        naturalTone = (naturalTone - 0.5) * 1.08 + 0.5;
        naturalTone *= mix(1.0, 0.28, uDim);

        vec2 centered = (vUv - 0.5) * 2.0;
        float edge = 1.0 - smoothstep(0.68, 1.0, length(centered));

        gl_FragColor = vec4(naturalTone, edge * uAlpha * 0.96);
      }
    `,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const swathMesh = new THREE.Mesh(swathGeo, swathMat);
  swathMesh.position.y = 0.005;
  swathMesh.renderOrder = 1;
  group.add(swathMesh);

  return {
    group,
    setSatelliteTexture(tex) {
      swathMat.uniforms.uMap.value = tex;
      swathMat.uniforms.uHasMap.value = 1;
      const img = tex.image as { width?: number; height?: number } | undefined;
      if (img?.width && img?.height) {
        swathMat.uniforms.uTexelSize.value.set(1 / img.width, 1 / img.height);
      }
    },
    update(elapsed, terrainAlpha, satelliteAlpha, isolationDim) {
      terrainMat.uniforms.uTime.value = elapsed;
      terrainMat.uniforms.uAlpha.value = terrainAlpha;
      swathMat.uniforms.uTime.value = elapsed;
      swathMat.uniforms.uAlpha.value = satelliteAlpha;
      swathMat.uniforms.uDim.value = isolationDim;
    },
    dispose() {
      terrainGeo.dispose();
      terrainMat.dispose();
      swathGeo.dispose();
      swathMat.dispose();
    },
  };
}
