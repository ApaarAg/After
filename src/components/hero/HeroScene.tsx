import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { HERO_ASSETS } from '../../data/heroAssets';
import type { HeroTimelineState } from '../../types/hero';
import { dampScalar } from '../../utils/heroTimeline';
import { createBuildingContext } from './scene/createBuildingContext';
import { createBuildingTarget } from './scene/createBuildingTarget';
import { createEnvironmentRig } from './scene/createEnvironmentRig';
import { createFeatureVisualization } from './scene/createFeatureVisualization';
import { createTerrainLayer } from './scene/createTerrainLayer';

export interface PointerTelemetry {
  x: number;
  y: number;
  hovered: boolean;
}

interface HeroSceneProps {
  timelineRef: MutableRefObject<HeroTimelineState>;
  manualSplitRef: MutableRefObject<number | null>;
  pointerRef: MutableRefObject<PointerTelemetry>;
  reducedMotion: boolean;
  isMobile: boolean;
  onWebglError: () => void;
}

function detectSoftwareRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugExt) return false;
  const rendererStr = String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '');
  return /swiftshader|llvmpipe|softpipe|mesa/i.test(rendererStr);
}

export function HeroScene({
  timelineRef,
  manualSplitRef,
  pointerRef,
  reducedMotion,
  isMobile,
  onWebglError,
}: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let isDisposed = false;
    let rafId = 0;
    let timerId = 0;

    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const probeGl =
        probeCanvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
        probeCanvas.getContext('webgl');
      if (!probeGl) {
        onWebglError();
        return;
      }
      isSoftwareGl = detectSoftwareRenderer(probeGl);
      probeGl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      onWebglError();
      return;
    }

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: isSoftwareGl ? 'default' : 'high-performance',
        alpha: false,
      });
    } catch {
      onWebglError();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

    const initialW = container.clientWidth || window.innerWidth;
    const initialH = container.clientHeight || window.innerHeight;
    renderer.setSize(initialW, initialH, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, initialW / initialH, 0.1, 140);
    const initialTimeline = timelineRef.current;
    camera.position.set(
      initialTimeline.cameraPos.x,
      initialTimeline.cameraPos.y,
      initialTimeline.cameraPos.z,
    );
    camera.lookAt(
      initialTimeline.cameraTarget.x,
      initialTimeline.cameraTarget.y,
      initialTimeline.cameraTarget.z,
    );

    const envRig = createEnvironmentRig(scene, renderer, isMobile);
    const terrainLayer = createTerrainLayer(scene, HERO_ASSETS.satelliteOverview.uvBounds);
    const buildingContext = createBuildingContext(scene, isMobile);
    const buildingTarget = createBuildingTarget(
      scene,
      HERO_ASSETS.buildingBefore.uvBounds,
      HERO_ASSETS.buildingAfter.uvBounds,
      HERO_ASSETS.buildingCrop.uvBounds,
    );
    const featureViz = createFeatureVisualization(scene, isMobile);

    // Load clean unique semantic EO assets with maximum anisotropy and mipmap clarity
    const textureLoader = new THREE.TextureLoader();
    const loadedTextures: THREE.Texture[] = [];
    const loadedBySrc = new Map<string, THREE.Texture>();
    const pendingBySrc = new Map<string, Array<(tex: THREE.Texture) => void>>();
    const maxAniso = isSoftwareGl ? 1 : Math.min(16, renderer.capabilities.getMaxAnisotropy());

    const loadUniqueTexture = (src: string, onLoaded: (tex: THREE.Texture) => void) => {
      const cached = loadedBySrc.get(src);
      if (cached) {
        onLoaded(cached);
        return;
      }
      const existing = pendingBySrc.get(src);
      if (existing) {
        existing.push(onLoaded);
        return;
      }
      const callbacks = [onLoaded];
      pendingBySrc.set(src, callbacks);
      textureLoader.load(src, (tex) => {
        if (isDisposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = maxAniso;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        loadedTextures.push(tex);
        loadedBySrc.set(src, tex);
        pendingBySrc.delete(src);
        callbacks.forEach((cb) => cb(tex));
      });
    };

    loadUniqueTexture(HERO_ASSETS.satelliteOverview.src, (tex) => {
      terrainLayer.setSatelliteTexture(tex);
    });

    loadUniqueTexture(HERO_ASSETS.buildingBefore.src, (tex) => {
      buildingTarget.setBeforeTexture(tex);
    });

    loadUniqueTexture(HERO_ASSETS.buildingAfter.src, (tex) => {
      buildingTarget.setAfterTexture(tex);
    });

    loadUniqueTexture(HERO_ASSETS.buildingCrop.src, (tex) => {
      buildingTarget.setDamageTexture(tex);
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const damped = {
      camX: initialTimeline.cameraPos.x,
      camY: initialTimeline.cameraPos.y,
      camZ: initialTimeline.cameraPos.z,
      tgtX: initialTimeline.cameraTarget.x,
      tgtY: initialTimeline.cameraTarget.y,
      tgtZ: initialTimeline.cameraTarget.z,
      fogDensity: initialTimeline.fogDensity,
      terrainAlpha: initialTimeline.terrainAlpha,
      satelliteAlpha: initialTimeline.satelliteAlpha,
      contextDimFactor: initialTimeline.contextDimFactor,
      targetFocusAlpha: initialTimeline.targetFocusAlpha,
      comparisonVisibility: initialTimeline.comparisonVisibility,
      splitRatio: initialTimeline.comparisonAutoSplit,
      reconstructionFactor: initialTimeline.reconstructionFactor,
      classificationReveal: initialTimeline.classificationReveal,
      zoomOutFactor: initialTimeline.zoomOutFactor,
      ptrX: 0,
      ptrY: 0,
    };

    const handleResize = () => {
      if (!container || !renderer || isDisposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    const canvasEl = renderer.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) window.clearTimeout(timerId);
    };
    const onContextRestored = () => {
      if (!isDisposed) scheduleNext();
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    const glCtx = renderer.getContext();
    const afterDraw = (callback: () => void) => {
      const gl2 = glCtx as WebGL2RenderingContext;
      if (typeof gl2.fenceSync === 'function') {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        glCtx.flush();
        const poll = () => {
          if (isDisposed) {
            if (sync) gl2.deleteSync(sync);
            return;
          }
          if (sync) {
            const status = gl2.clientWaitSync(sync, 0, 0);
            if (status === gl2.TIMEOUT_EXPIRED) {
              timerId = window.setTimeout(poll, 4);
              return;
            }
            gl2.deleteSync(sync);
          }
          timerId = window.setTimeout(callback, 80);
        };
        timerId = window.setTimeout(poll, 4);
      } else {
        timerId = window.setTimeout(callback, 80);
      }
    };

    let lastTime = performance.now();
    const startTime = lastTime;

    const renderTick = () => {
      if (isDisposed || !renderer) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = (now - startTime) / 1000;

      const target = timelineRef.current;
      const ptr = pointerRef.current;
      const isReduced = reducedMotionRef.current;
      // Calm, deliberate documentary camera easing
      const lambda = isReduced ? 24 : 4.6;

      const targetSplit =
        manualSplitRef.current !== null
          ? manualSplitRef.current
          : target.comparisonAutoSplit;

      damped.camX = dampScalar(damped.camX, target.cameraPos.x, lambda, dt);
      damped.camY = dampScalar(damped.camY, target.cameraPos.y, lambda, dt);
      damped.camZ = dampScalar(damped.camZ, target.cameraPos.z, lambda, dt);
      damped.tgtX = dampScalar(damped.tgtX, target.cameraTarget.x, lambda, dt);
      damped.tgtY = dampScalar(damped.tgtY, target.cameraTarget.y, lambda, dt);
      damped.tgtZ = dampScalar(damped.tgtZ, target.cameraTarget.z, lambda, dt);

      damped.fogDensity = dampScalar(damped.fogDensity, target.fogDensity, lambda, dt);
      damped.terrainAlpha = dampScalar(damped.terrainAlpha, target.terrainAlpha, lambda, dt);
      damped.satelliteAlpha = dampScalar(damped.satelliteAlpha, target.satelliteAlpha, lambda, dt);
      damped.contextDimFactor = dampScalar(
        damped.contextDimFactor,
        target.contextDimFactor,
        lambda,
        dt,
      );
      damped.targetFocusAlpha = dampScalar(
        damped.targetFocusAlpha,
        target.targetFocusAlpha,
        lambda,
        dt,
      );
      damped.comparisonVisibility = dampScalar(
        damped.comparisonVisibility,
        target.comparisonVisibility,
        lambda,
        dt,
      );
      damped.splitRatio = dampScalar(damped.splitRatio, targetSplit, isReduced ? 24 : 11, dt);
      damped.reconstructionFactor = dampScalar(
        damped.reconstructionFactor,
        target.reconstructionFactor,
        lambda,
        dt,
      );
      damped.classificationReveal = dampScalar(
        damped.classificationReveal,
        target.classificationReveal,
        lambda,
        dt,
      );
      damped.zoomOutFactor = dampScalar(damped.zoomOutFactor, target.zoomOutFactor, lambda, dt);

      const parallaxGoalX = isReduced ? 0 : ptr.x * 0.24;
      const parallaxGoalY = isReduced ? 0 : ptr.y * 0.14;
      damped.ptrX = dampScalar(damped.ptrX, parallaxGoalX, 4.2, dt);
      damped.ptrY = dampScalar(damped.ptrY, parallaxGoalY, 4.2, dt);

      camera.position.set(
        damped.camX + damped.ptrX,
        damped.camY + damped.ptrY,
        damped.camZ,
      );
      camera.lookAt(damped.tgtX, damped.tgtY, damped.tgtZ);

      envRig.update(elapsed, damped.fogDensity, isReduced);
      terrainLayer.update(
        elapsed,
        damped.terrainAlpha,
        damped.satelliteAlpha,
        damped.contextDimFactor,
      );
      buildingContext.update(
        isReduced ? 0 : elapsed,
        damped.terrainAlpha,
        damped.contextDimFactor,
        damped.zoomOutFactor,
      );
      buildingTarget.update({
        elapsed: isReduced ? 0 : elapsed,
        targetFocusAlpha: damped.targetFocusAlpha,
        comparisonVisibility: damped.comparisonVisibility,
        splitRatio: damped.splitRatio,
        reconstructionFactor: damped.reconstructionFactor,
        classificationReveal: damped.classificationReveal,
        hovered: ptr.hovered,
      });
      featureViz.update(damped.reconstructionFactor, isReduced ? 0 : elapsed);

      renderer.render(scene, camera);
      scheduleNext();
    };

    const scheduleNext = () => {
      if (isDisposed) return;
      if (isSoftwareGl) {
        afterDraw(renderTick);
      } else {
        rafId = requestAnimationFrame(renderTick);
      }
    };

    renderTick();

    return () => {
      isDisposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

      loadedTextures.forEach((t) => t.dispose());
      envRig.dispose();
      terrainLayer.dispose();
      buildingContext.dispose();
      buildingTarget.dispose();
      featureViz.dispose();

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [isMobile, manualSplitRef, onWebglError, pointerRef, timelineRef]);

  return (
    <div
      ref={containerRef}
      data-testid="hero-webgl-stage"
      className="w-full h-full relative"
      aria-hidden="true"
    />
  );
}
