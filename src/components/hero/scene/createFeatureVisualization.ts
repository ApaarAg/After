import * as THREE from 'three';

export interface FeatureVisualizationLayer {
  group: THREE.Group;
  update: (reconstructionFactor: number, elapsed: number) => void;
  dispose: () => void;
}

interface FragmentSeed {
  originX: number;
  originZ: number;
  pairSide: -1 | 1;
  tier: number;
  liftY: number;
  featureOffsetX: number;
  featureOffsetZ: number;
  stagger: number;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Quiet, mathematical, architectural feature representation for Stage 05.
 * Uses monochrome stone planes, fine hairline reference frames, and subtle
 * muted mineral amber (#C6A76A) active comparison traces — zero neon/cyan glow.
 */
export function createFeatureVisualization(
  scene: THREE.Scene,
  isMobile: boolean,
): FeatureVisualizationLayer {
  const group = new THREE.Group();
  scene.add(group);

  const cols = isMobile ? 6 : 10;
  const rows = isMobile ? 4 : 6;
  const count = cols * rows;
  const seeds: FragmentSeed[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = (c + 0.5) / cols - 0.5;
      const v = (r + 0.5) / rows - 0.5;
      const pairSide: -1 | 1 = c < cols / 2 ? -1 : 1;
      const layerTier = (r + c) % 3;
      const stagger = ((r * cols + c) / count) * 0.24;

      seeds.push({
        originX: u * 2.35,
        originZ: v * 1.7,
        pairSide,
        tier: layerTier,
        liftY: 0.58 + layerTier * 0.28,
        featureOffsetX: pairSide * 1.24 + u * 0.85,
        featureOffsetZ: v * 1.32,
        stagger,
      });
    }
  }

  // Translucent monochrome architectural wafer tiles
  const fragGeo = new THREE.BoxGeometry(0.105, 0.009, 0.105);
  const fragMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.65,
    metalness: 0.18,
    transparent: true,
    opacity: 0,
  });

  const fragments = new THREE.InstancedMesh(fragGeo, fragMat, count);
  seeds.forEach((s, i) => {
    if (s.pairSide === -1) {
      _color.setHex(0xe8e5de); // Soft ivory for pre-event observation branch
    } else {
      // Muted stone with selective subtle mineral amber delta markers on post-event branch
      _color.setHex(i % 5 === 0 ? 0xc6a76a : 0x77756f);
    }
    fragments.setColorAt(i, _color);
  });
  if (fragments.instanceColor) fragments.instanceColor.needsUpdate = true;
  fragments.frustumCulled = false;
  group.add(fragments);

  // Fine hairline reference planes (PRE left, POST right)
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.18, 0.008, 1.56));
  const preFrameMat = new THREE.LineBasicMaterial({
    color: 0x9c9a94,
    transparent: true,
    opacity: 0,
  });
  const postFrameMat = new THREE.LineBasicMaterial({
    color: 0xc6a76a,
    transparent: true,
    opacity: 0,
  });
  const preFrame = new THREE.LineSegments(frameGeo, preFrameMat);
  const postFrame = new THREE.LineSegments(frameGeo, postFrameMat);
  group.add(preFrame);
  group.add(postFrame);

  // Restrained parabolic convergence lines linking Pre & Post manifolds
  const arcSteps = 8;
  const arcSampleCount = Math.floor(count / 3);
  const arcPositions = new Float32Array(arcSampleCount * arcSteps * 6);
  const arcGeo = new THREE.BufferGeometry();
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
  const arcMat = new THREE.LineBasicMaterial({
    color: 0x9c9a94,
    transparent: true,
    opacity: 0,
  });
  const arcLines = new THREE.LineSegments(arcGeo, arcMat);
  group.add(arcLines);

  // Precision monochrome & mineral-amber classification instrument core
  const manifoldGroup = new THREE.Group();
  manifoldGroup.position.set(0, 1.18, 0);
  group.add(manifoldGroup);

  const prismGeo = new THREE.OctahedronGeometry(0.115, 0);
  const prismMat = new THREE.MeshStandardMaterial({
    color: 0xc6a76a,
    roughness: 0.42,
    metalness: 0.48,
    transparent: true,
    opacity: 0,
  });
  const convergencePrism = new THREE.Mesh(prismGeo, prismMat);
  manifoldGroup.add(convergencePrism);

  const ringOuterGeo = new THREE.TorusGeometry(0.22, 0.0032, 8, 48);
  const ringOuterMat = new THREE.MeshBasicMaterial({
    color: 0x9c9a94,
    transparent: true,
    opacity: 0,
  });
  const ringOuter = new THREE.Mesh(ringOuterGeo, ringOuterMat);
  manifoldGroup.add(ringOuter);

  const ringInnerGeo = new THREE.TorusGeometry(0.165, 0.003, 8, 48);
  const ringInnerMat = new THREE.MeshBasicMaterial({
    color: 0xc6a76a,
    transparent: true,
    opacity: 0,
  });
  const ringInner = new THREE.Mesh(ringInnerGeo, ringInnerMat);
  manifoldGroup.add(ringInner);

  fragments.renderOrder = 10;
  preFrame.renderOrder = 10;
  postFrame.renderOrder = 10;
  arcLines.renderOrder = 10;
  convergencePrism.renderOrder = 10;
  ringOuter.renderOrder = 10;
  ringInner.renderOrder = 10;

  return {
    group,
    update(reconstructionFactor, elapsed) {
      const f = reconstructionFactor;
      group.visible = f > 0.01;
      if (!group.visible) return;

      const liftPhase = Math.min(1, f * 1.45);
      const comparePhase = Math.max(0, Math.min(1, (f - 0.22) / 0.55));

      fragMat.opacity = Math.min(0.74, f * 0.96);
      preFrameMat.opacity = comparePhase * 0.34;
      postFrameMat.opacity = comparePhase * 0.36;
      arcMat.opacity = comparePhase * 0.2;
      prismMat.opacity = comparePhase * 0.85;
      ringOuterMat.opacity = comparePhase * 0.42;
      ringInnerMat.opacity = comparePhase * 0.5;

      preFrame.position.set(-1.24 * comparePhase, 0.74 * liftPhase, 0);
      postFrame.position.set(1.24 * comparePhase, 0.74 * liftPhase, 0);

      manifoldGroup.position.y = 1.18 * liftPhase;
      manifoldGroup.scale.setScalar(0.5 + comparePhase * 0.55);

      // Slow, controlled precision motion
      convergencePrism.rotation.y = elapsed * 0.22;
      convergencePrism.rotation.x = Math.sin(elapsed * 0.4) * 0.1;

      ringOuter.rotation.x = Math.PI * 0.36 + elapsed * 0.18;
      ringOuter.rotation.y = elapsed * 0.14;
      ringInner.rotation.x = -Math.PI * 0.26 - elapsed * 0.22;
      ringInner.rotation.z = elapsed * 0.16;

      const posAttr = arcGeo.getAttribute('position') as THREE.BufferAttribute;
      let arcIdx = 0;

      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        const localLift = Math.max(0, Math.min(1, (liftPhase - s.stagger) / (1 - s.stagger)));
        const easedLift = localLift * localLift * (3 - 2 * localLift);

        const wave = 0.04 * Math.sin(elapsed * 1.4 - s.tier * 1.2 + i * 0.2) * comparePhase;
        const px = s.originX + (s.featureOffsetX - s.originX) * comparePhase;
        const py =
          0.1 +
          s.liftY * easedLift +
          Math.sin(elapsed * 0.7 + i * 0.3) * 0.01 * easedLift;
        const pz = s.originZ + (s.featureOffsetZ - s.originZ) * comparePhase;

        _dummy.position.set(px, py, pz);
        _dummy.rotation.set(0, comparePhase * 0.08 * s.pairSide, 0);
        const sScale = (0.58 + easedLift * 0.42) * (1 + wave);
        _dummy.scale.set(sScale, 1, sScale);
        _dummy.updateMatrix();
        fragments.setMatrixAt(i, _dummy.matrix);

        if (i % 3 === 0 && arcIdx < arcSampleCount) {
          const ctrlX = px * 0.42;
          const ctrlY = Math.max(py, manifoldGroup.position.y) + 0.2;
          const ctrlZ = pz * 0.42;
          const targetY = manifoldGroup.position.y;

          for (let step = 0; step < arcSteps; step++) {
            const t0 = step / arcSteps;
            const t1 = (step + 1) / arcSteps;

            const inv0 = 1 - t0;
            const x0 = inv0 * inv0 * px + 2 * inv0 * t0 * ctrlX;
            const y0 = inv0 * inv0 * py + 2 * inv0 * t0 * ctrlY + t0 * t0 * targetY;
            const z0 = inv0 * inv0 * pz + 2 * inv0 * t0 * ctrlZ;

            const inv1 = 1 - t1;
            const x1 = inv1 * inv1 * px + 2 * inv1 * t1 * ctrlX;
            const y1 = inv1 * inv1 * py + 2 * inv1 * t1 * ctrlY + t1 * t1 * targetY;
            const z1 = inv1 * inv1 * pz + 2 * inv1 * t1 * ctrlZ;

            const base = (arcIdx * arcSteps + step) * 6;
            arcPositions[base] = x0;
            arcPositions[base + 1] = y0;
            arcPositions[base + 2] = z0;
            arcPositions[base + 3] = x1;
            arcPositions[base + 4] = y1;
            arcPositions[base + 5] = z1;
          }
          arcIdx++;
        }
      }

      fragments.instanceMatrix.needsUpdate = true;
      posAttr.needsUpdate = true;
    },
    dispose() {
      fragGeo.dispose();
      fragMat.dispose();
      frameGeo.dispose();
      preFrameMat.dispose();
      postFrameMat.dispose();
      arcGeo.dispose();
      arcMat.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      ringOuterGeo.dispose();
      ringOuterMat.dispose();
      ringInnerGeo.dispose();
      ringInnerMat.dispose();
    },
  };
}
