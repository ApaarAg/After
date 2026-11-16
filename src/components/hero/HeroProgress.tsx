import { HERO_STAGES, SCALE_TRANSITION_STEPS } from '../../utils/heroTimeline';
import type { HeroTimelineState } from '../../types/hero';

interface HeroProgressProps {
  timeline: HeroTimelineState;
  onSelectStage: (scrollTarget: number) => void;
}

export function HeroProgress({ timeline, onSelectStage }: HeroProgressProps) {
  const currentScale =
    timeline.activeStageId === 'zoom-out'
      ? SCALE_TRANSITION_STEPS[timeline.scaleStageIndex]
      : timeline.activeStageId === 'darkness' || timeline.activeStageId === 'observation'
        ? 'DISASTER REGION'
        : 'ONE BUILDING';

  return (
    <aside
      aria-label="Investigation stage progress"
      className="pointer-events-auto hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-5"
    >
      <div className="flex flex-col items-end gap-1.5">
        {HERO_STAGES.map((stage) => {
          const isActive = stage.id === timeline.activeStageId;
          const isPassed = stage.index < timeline.activeStageIndex;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.scrollTarget)}
              aria-current={isActive ? 'step' : undefined}
              className="group min-h-[30px] py-1 flex items-center gap-3 text-right transition-opacity cursor-pointer"
            >
              <span
                className={`font-mono-tabular text-[10px] tracking-[0.18em] uppercase whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#F2F0EA]'
                    : isPassed
                      ? 'text-[#9C9A94]/65 group-hover:text-[#F2F0EA]'
                      : 'text-[#77756F]/60 group-hover:text-[#9C9A94]'
                }`}
              >
                {stage.code} {stage.label}
              </span>
              <span
                className={`block h-[1px] transition-all duration-300 ${
                  isActive
                    ? 'w-7 bg-[#C6A76A]'
                    : isPassed
                      ? 'w-3.5 bg-[#9C9A94]/40 group-hover:w-5'
                      : 'w-2.5 bg-[#242421] group-hover:w-4 group-hover:bg-[#9C9A94]/45'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#242421] pt-2.5 text-right">
        <div className="font-mono-tabular text-[9px] tracking-[0.2em] text-[#77756F] uppercase">
          SCALE
        </div>
        <div className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#9C9A94] mt-0.5">
          {currentScale}
        </div>
      </div>
    </aside>
  );
}
