import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface EnvironmentRig {
  envTexture: THREE.Texture;
  particles: THREE.InstancedMesh;
  particleMaterial: THREE.MeshBasicMaterial;
  update: (elapsed: number, fogDensity: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

const _dummy = new THREE.Object3D();

export function createEnvironmentRig(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isMobile: boolean,
): EnvironmentRig {
  // Warm-black charcoal atmosphere (eliminates blue/cyan cast)
  scene.background = new THREE.Color(0x0b0b0a);
  scene.fog = new THREE.FogExp2(0x0b0b0a, 0.068);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmrem.dispose();

  // Restrained documentary studio lighting: soft directional key + neutral sky/ground fill + subtle neutral rim
  const keyLight = new THREE.DirectionalLight(0xf6f3ea, 1.65);
  keyLight.position.set(8, 13, 6);
  scene.add(keyLight);

  const hemiFill = new THREE.HemisphereLight(0xb2bac7, 0x161614, 0.44);
  scene.add(hemiFill);

  const rimLight = new THREE.DirectionalLight(0xdcd9d0, 0.48);
  rimLight.position.set(-8, 4, -7);
  scene.add(rimLight);

  // Sparse, whisper-quiet altitude dust specks (minimal visual noise)
  const count = isMobile ? 18 : 44;
  const particleGeo = new THREE.OctahedronGeometry(0.015, 0);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2f0ea,
    transparent: true,
    opacity: 0.06,
    depthWrite: false,
  });

  const particles = new THREE.InstancedMesh(particleGeo, particleMaterial, count);
  for (let i = 0; i < count; i++) {
    const angle = (i * 2.39996) % (Math.PI * 2);
    const radius = 3.2 + ((i * 73) % 100) * 0.15;
    const height = 0.8 + ((i * 37) % 100) * 0.11;
    _dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    _dummy.scale.setScalar(0.55 + ((i * 19) % 10) * 0.06);
    _dummy.updateMatrix();
    particles.setMatrixAt(i, _dummy.matrix);
  }
  particles.instanceMatrix.needsUpdate = true;
  particles.computeBoundingSphere();
  scene.add(particles);

  return {
    envTexture,
    particles,
    particleMaterial,
    update(elapsed, fogDensity, reducedMotion) {
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = fogDensity;
      }
      if (!reducedMotion) {
        particles.rotation.y = elapsed * 0.003;
      }
    },
    dispose() {
      envTexture.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
    },
  };
}
