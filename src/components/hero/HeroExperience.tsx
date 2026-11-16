import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { HERO_ASSETS } from '../../data/heroAssets';
import { DEFAULT_HERO_PREDICTION } from '../../data/heroPrediction';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { HeroTimelineState } from '../../types/hero';
import { clamp01, computeHeroTimeline } from '../../utils/heroTimeline';
import { BeforeAfterViewer } from './BeforeAfterViewer';
import { DamagePrediction } from './DamagePrediction';
import { HeroNarrative } from './HeroNarrative';
import { HeroNavigation } from './HeroNavigation';
import { HeroProgress } from './HeroProgress';
import { HeroScene, type PointerTelemetry } from './HeroScene';
import { HeroTypography } from './HeroTypography';
import { TransitionStub } from './TransitionStub';

interface SceneBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

class SceneErrorBoundary extends Component<SceneBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AftermathVision WebGL fallback activated:', error, info);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function useIsCompactViewport(): boolean {
  const [compact, setCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setCompact(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}

function StaticEnvironmentalBackdrop() {
  return (
    <div className="relative w-full h-full bg-[#0B0B0A] overflow-hidden" aria-hidden="true">
      <img
        src={HERO_ASSETS.environmentalFallback.src}
        alt=""
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0A]/75 via-[#0B0B0A]/45 to-[#0B0B0A]" />
      <div className="absolute inset-0 bg-orbital-grid opacity-45" />
    </div>
  );
}

export function HeroExperience() {
  const reducedMotion = useReducedMotion();
  const isCompactViewport = useIsCompactViewport();
  const useStackedLayout = isCompactViewport || reducedMotion;

  const [webglError, setWebglError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [timeline, setTimeline] = useState<HeroTimelineState>(() => computeHeroTimeline(0));
  const [manualSplit, setManualSplit] = useState<number | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const timelineRef = useRef<HeroTimelineState>(timeline);
  const manualSplitRef = useRef<number | null>(manualSplit);
  const pointerRef = useRef<PointerTelemetry>({ x: 0, y: 0, hovered: false });

  timelineRef.current = timeline;
  manualSplitRef.current = manualSplit;

  const handleWebglError = useCallback(() => {
    setWebglError(true);
  }, []);

  useEffect(() => {
    const computeProgressFromScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 36);

      if (useStackedLayout || !trackRef.current) {
        return;
      }

      const maxScroll = Math.max(1, trackRef.current.offsetHeight - window.innerHeight);
      const nextProgress = clamp01(y / maxScroll);
      const nextState = computeHeroTimeline(nextProgress);
      timelineRef.current = nextState;
      setTimeline(nextState);

      if (nextState.activeStageId !== 'comparison') {
        setManualSplit((prev) => (prev !== null ? null : prev));
      }
    };

    computeProgressFromScroll();

    if (useStackedLayout) {
      window.addEventListener('scroll', computeProgressFromScroll, { passive: true });
      return () => window.removeEventListener('scroll', computeProgressFromScroll);
    }

    const lenis = new Lenis({
      lerp: 0.07,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', computeProgressFromScroll);
    window.addEventListener('scroll', computeProgressFromScroll, { passive: true });
    window.addEventListener('resize', computeProgressFromScroll);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', computeProgressFromScroll);
      window.removeEventListener('resize', computeProgressFromScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [useStackedLayout]);

  const scrollToStage = useCallback(
    (scrollTarget: number) => {
      if (useStackedLayout || !trackRef.current) {
        const el = document.getElementById('compact-analysis-section');
        if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        return;
      }
      const maxScroll = Math.max(1, trackRef.current.offsetHeight - window.innerHeight);
      const targetY = clamp01(scrollTarget) * maxScroll;

      if (lenisRef.current) {
        lenisRef.current.scrollTo(targetY);
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    },
    [reducedMotion, useStackedLayout],
  );

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [reducedMotion]);

  const scrollToStub = useCallback(() => {
    const stub = document.getElementById('transition-stub');
    if (!stub) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(stub);
    } else {
      stub.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [reducedMotion]);

  const handleStagePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = -(((e.clientY - rect.top) / rect.height - 0.5) * 2);
    pointerRef.current.x = nx;
    pointerRef.current.y = ny;
    pointerRef.current.hovered = Math.abs(nx) < 0.36 && Math.abs(ny) < 0.36;
  }, []);

  const handleStagePointerLeave = useCallback(() => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
    pointerRef.current.hovered = false;
  }, []);

  const activeSplitRatio =
    manualSplit !== null ? manualSplit : timeline.comparisonAutoSplit;

  if (useStackedLayout) {
    const staticTimeline = computeHeroTimeline(0.35);
    timelineRef.current = staticTimeline;

    return (
      <div className="min-h-screen bg-[#0B0B0A] text-[#F2F0EA]">
        <HeroNavigation
          scrolled={scrolled}
          onResetTop={scrollToTop}
          onSelectStage={scrollToStage}
          onJumpToStub={scrollToStub}
        />

        <main data-active-stage="compact">
          <section className="relative bg-[#0B0B0A] border-b border-[#242421]">
            <HeroTypography
              progress={0}
              reducedMotion={reducedMotion}
              isCompactViewport
              onExplore={() => scrollToStage(0.21)}
            />

            <div className="px-6 pb-10">
              <div className="relative aspect-[16/9] max-h-[340px] w-full border border-[#242421] overflow-hidden bg-[#0B0B0A]">
                {!webglError ? (
                  <SceneErrorBoundary onError={handleWebglError}>
                    <HeroScene
                      timelineRef={timelineRef}
                      manualSplitRef={manualSplitRef}
                      pointerRef={pointerRef}
                      reducedMotion
                      isMobile={isCompactViewport}
                      onWebglError={handleWebglError}
                    />
                  </SceneErrorBoundary>
                ) : (
                  <StaticEnvironmentalBackdrop />
                )}
              </div>
            </div>
          </section>

          <div id="compact-analysis-section" className="py-14 space-y-14 max-w-3xl mx-auto">
            <BeforeAfterViewer
              progress={0.5}
              isComparisonStage
              splitRatio={manualSplit !== null ? manualSplit : 0.52}
              onSplitChange={setManualSplit}
              show2DFallback
            />

            <HeroNarrative timeline={staticTimeline} isCompactViewport />

            <DamagePrediction
              prediction={DEFAULT_HERO_PREDICTION}
              progress={0.82}
              isCompactViewport
            />
          </div>

          <TransitionStub onReturnTop={scrollToTop} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0A] text-[#F2F0EA]">
      <HeroNavigation
        scrolled={scrolled}
        onResetTop={scrollToTop}
        onSelectStage={scrollToStage}
        onJumpToStub={scrollToStub}
      />

      <main data-active-stage={timeline.activeStageId}>
        <div ref={trackRef} className="relative h-[650vh]">
          <div
            onPointerMove={handleStagePointerMove}
            onPointerLeave={handleStagePointerLeave}
            className="sticky top-0 h-screen w-full overflow-hidden bg-[#0B0B0A]"
          >
            <div className="absolute inset-0 z-0">
              {!webglError ? (
                <SceneErrorBoundary onError={handleWebglError}>
                  <HeroScene
                    timelineRef={timelineRef}
                    manualSplitRef={manualSplitRef}
                    pointerRef={pointerRef}
                    reducedMotion={reducedMotion}
                    isMobile={false}
                    onWebglError={handleWebglError}
                  />
                </SceneErrorBoundary>
              ) : (
                <StaticEnvironmentalBackdrop />
              )}
            </div>

            {/* Subtle editorial contrast scrim keeping ivory typography crisp */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0B0B0A]/82 via-[#0B0B0A]/25 to-transparent"
            />

            <HeroTypography
              progress={timeline.progress}
              reducedMotion={reducedMotion}
              isCompactViewport={false}
              onExplore={() => scrollToStage(0.21)}
            />

            <HeroNarrative timeline={timeline} isCompactViewport={false} />

            <BeforeAfterViewer
              progress={timeline.progress}
              isComparisonStage={timeline.activeStageId === 'comparison'}
              splitRatio={activeSplitRatio}
              onSplitChange={setManualSplit}
              show2DFallback={webglError}
            />

            <DamagePrediction
              prediction={DEFAULT_HERO_PREDICTION}
              progress={timeline.progress}
              isCompactViewport={false}
            />

            <HeroProgress timeline={timeline} onSelectStage={scrollToStage} />
          </div>
        </div>

        <TransitionStub onReturnTop={scrollToTop} />
      </main>
    </div>
  );
}
