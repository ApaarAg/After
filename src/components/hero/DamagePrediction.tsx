import { HERO_ASSETS } from '../../data/heroAssets';
import { getDamageSemanticMeta } from '../../data/heroPrediction';
import type { HeroPrediction } from '../../types/hero';
import { smoothstep } from '../../utils/heroTimeline';

interface DamagePredictionProps {
  prediction: HeroPrediction;
  progress: number;
  isCompactViewport: boolean;
}

export function DamagePrediction({
  prediction,
  progress,
  isCompactViewport,
}: DamagePredictionProps) {
  const opacity = isCompactViewport
    ? 1
    : smoothstep(0.77, 0.82, progress) * (1 - smoothstep(0.87, 0.91, progress));

  if (!isCompactViewport && opacity <= 0.02) return null;

  const semantic = getDamageSemanticMeta(prediction.damageClass);

  return (
    <div
      style={isCompactViewport ? undefined : { opacity }}
      className={
        isCompactViewport
          ? 'px-6'
          : 'pointer-events-none absolute left-6 sm:left-10 lg:left-14 bottom-12 z-20 max-w-md'
      }
    >
      <div className="border-t border-[#242421] bg-[#0B0B0A]/92 pt-3.5 pb-2.5 pr-5">
        <div className="font-mono-tabular text-[10px] tracking-[0.22em] text-[#9C9A94] uppercase">
          DAMAGE ASSESSMENT
        </div>

        <div className="mt-2.5 flex items-baseline gap-3">
          <span
            className="w-2 h-2 shrink-0 self-center"
            style={{ backgroundColor: semantic.semanticHex }}
            aria-hidden="true"
          />
          <span
            className="font-serif-display font-medium text-3xl sm:text-4xl tracking-[0.04em] uppercase"
            style={{ color: semantic.semanticHex }}
          >
            {semantic.shortLabel}
          </span>
        </div>

        {isCompactViewport && (
          <div className="mt-4 aspect-[4/3] w-full overflow-hidden bg-[#171715]">
            <img
              src={HERO_ASSETS.buildingCrop.src}
              alt={HERO_ASSETS.buildingCrop.label}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mt-3.5 pt-3 border-t border-[#242421] space-y-1.5 font-mono-tabular text-[10px] tracking-[0.16em] uppercase">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[#77756F]">RESULT</span>
            <span className="text-[#F2F0EA]">{prediction.evaluationLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[#77756F]">TARGET</span>
            <span className="text-[#9C9A94]">{prediction.targetLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[#77756F]">PAIR</span>
            <span className="text-[#9C9A94]">{prediction.analysisLabel}</span>
          </div>

          {prediction.isLiveInference && prediction.confidence !== null && (
            <div className="flex items-center justify-between gap-6 pt-1 border-t border-[#242421]/70">
              <span className="text-[#77756F]">CONFIDENCE</span>
              <span className="text-[#C6A76A]">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
