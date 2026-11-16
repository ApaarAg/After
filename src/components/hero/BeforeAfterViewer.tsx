import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { HERO_ASSETS } from '../../data/heroAssets';
import { clamp01, smoothstep } from '../../utils/heroTimeline';

interface BeforeAfterViewerProps {
  progress: number;
  isComparisonStage: boolean;
  splitRatio: number;
  onSplitChange: (nextSplit: number) => void;
  show2DFallback: boolean;
}

export function BeforeAfterViewer({
  progress,
  isComparisonStage,
  splitRatio,
  onSplitChange,
  show2DFallback,
}: BeforeAfterViewerProps) {
  const dragSurfaceRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const opacity = show2DFallback
    ? 1
    : smoothstep(0.4, 0.45, progress) * (1 - smoothstep(0.57, 0.61, progress));

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = dragSurfaceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const next = clamp01((clientX - rect.left) / rect.width);
      onSplitChange(next);
    },
    [onSplitChange],
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const splitPct = Math.round(splitRatio * 100);

  if (show2DFallback) {
    return (
      <section aria-label="Pre and post disaster imagery comparison" className="px-6">
        <div className="border-t border-[#242421] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <span className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#C6A76A] uppercase">
              04 · BEFORE / AFTER
            </span>
            <span className="font-mono-tabular text-[10px] tracking-[0.14em] text-[#9C9A94] uppercase">
              BUILDING 01842 · PRE / POST
            </span>
          </div>

          <div
            ref={dragSurfaceRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative aspect-[4/3] w-full overflow-hidden select-none touch-none cursor-ew-resize bg-[#0B0B0A]"
          >
            <img
              src={HERO_ASSETS.buildingAfter.src}
              alt={HERO_ASSETS.buildingAfter.label}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
            >
              <img
                src={HERO_ASSETS.buildingBefore.src}
                alt={HERO_ASSETS.buildingBefore.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

            <div
              style={{ left: `${splitPct}%` }}
              className="absolute inset-y-0 w-[1px] bg-[#C6A76A] pointer-events-none"
            >
              <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#F2F0EA]" />
            </div>

            <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#0B0B0A]/80 font-mono-tabular text-[10px] tracking-[0.2em] text-[#F2F0EA]">
              BEFORE
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#0B0B0A]/80 font-mono-tabular text-[10px] tracking-[0.2em] text-[#F2F0EA]">
              AFTER
            </div>
          </div>

          <div className="pt-3 flex items-center gap-4 border-t border-[#242421]/70 mt-3">
            <label
              htmlFor="before-after-range-2d"
              className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#9C9A94] uppercase shrink-0"
            >
              DIVIDER · {splitPct}%
            </label>
            <input
              id="before-after-range-2d"
              type="range"
              min={0}
              max={100}
              value={splitPct}
              onChange={(e) => onSplitChange(Number(e.target.value) / 100)}
              aria-label="Before and after imagery divider position"
              className="hairline-range w-full cursor-pointer"
            />
          </div>
        </div>
      </section>
    );
  }

  if (opacity <= 0.02) return null;

  return (
    <div
      style={{ opacity }}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-6 sm:px-10 lg:px-14"
    >
      {/* Direct drag surface aligned 1:1 with the centered 3D satellite parcel */}
      <div
        ref={dragSurfaceRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`${
          isComparisonStage ? 'pointer-events-auto' : 'pointer-events-none'
        } relative mx-auto mt-28 w-full max-w-[600px] h-[50vh] cursor-ew-resize touch-none select-none`}
      >
        <div className="absolute top-0 left-0 font-mono-tabular text-[10px] tracking-[0.22em] text-[#F2F0EA] bg-[#0B0B0A]/80 px-2 py-0.5">
          BEFORE
        </div>
        <div className="absolute top-0 right-0 font-mono-tabular text-[10px] tracking-[0.22em] text-[#F2F0EA] bg-[#0B0B0A]/80 px-2 py-0.5">
          AFTER
        </div>
      </div>

      {/* Quiet editorial footer metadata + accessible architectural divider */}
      <div
        className={`${
          isComparisonStage ? 'pointer-events-auto' : 'pointer-events-none'
        } mb-10 max-w-xl border-t border-[#242421] bg-[#0B0B0A]/90 pt-3 pb-2 pr-5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#C6A76A] uppercase">
            04 · BEFORE / AFTER
          </span>
          <span className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#9C9A94] uppercase">
            BUILDING 01842 · PRE / POST
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-4">
          <label
            htmlFor="before-after-range-3d"
            className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#E8E5DE] uppercase shrink-0"
          >
            DIVIDER · {splitPct}%
          </label>
          <input
            id="before-after-range-3d"
            type="range"
            min={0}
            max={100}
            value={splitPct}
            onChange={(e) => onSplitChange(Number(e.target.value) / 100)}
            aria-label="Before and after imagery divider position"
            className="hairline-range w-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
