import { HERO_ASSETS } from '../../data/heroAssets';
import type { HeroTimelineState } from '../../types/hero';
import {
  FEATURE_RECONSTRUCTION_STEPS,
  SCALE_TRANSITION_STEPS,
  smoothstep,
} from '../../utils/heroTimeline';

interface HeroNarrativeProps {
  timeline: HeroTimelineState;
  isCompactViewport: boolean;
}

const SCALE_LEGEND = [
  HERO_ASSETS.damageNoDamage,
  HERO_ASSETS.damageMinor,
  HERO_ASSETS.damageMajor,
  HERO_ASSETS.damageDestroyed,
];

export function HeroNarrative({ timeline, isCompactViewport }: HeroNarrativeProps) {
  const { activeStageId, progress, featureStepIndex, scaleStageIndex } = timeline;

  const obsOpacity = isCompactViewport
    ? 1
    : smoothstep(0.11, 0.16, progress) * (1 - smoothstep(0.26, 0.3, progress));
  const isoOpacity = isCompactViewport
    ? 1
    : smoothstep(0.27, 0.32, progress) * (1 - smoothstep(0.41, 0.45, progress));
  const reconOpacity = isCompactViewport
    ? 1
    : smoothstep(0.57, 0.62, progress) * (1 - smoothstep(0.75, 0.79, progress));
  const zoomOpacity = isCompactViewport ? 1 : smoothstep(0.87, 0.91, progress);

  if (isCompactViewport) {
    return (
      <div className="space-y-10 px-6">
        <section className="border-t border-[#242421] pt-4">
          <div className="flex items-center justify-between gap-4 font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            <span>02 · SATELLITE OBSERVATION</span>
            <span className="text-[#77756F]">36.85° S · 174.76° E</span>
          </div>
          <h2 className="font-serif-display italic text-2xl text-[#E8E5DE] mt-2">
            Unknown to observed.
          </h2>
          <p className="text-sm text-[#9C9A94] mt-2 max-w-md leading-relaxed">
            Regional satellite observation resolves above terrain contours before isolating
            an individual urban parcel.
          </p>
        </section>

        <section className="border-t border-[#242421] pt-4">
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            03 · BUILDING TARGET
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <dt className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                TARGET
              </dt>
              <dd className="font-mono-tabular text-[11px] text-[#F2F0EA] mt-1">
                BUILDING 01842
              </dd>
            </div>
            <div>
              <dt className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                PAIR
              </dt>
              <dd className="font-mono-tabular text-[11px] text-[#E8E5DE] mt-1">
                PRE / POST
              </dd>
            </div>
            <div>
              <dt className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                MODE
              </dt>
              <dd className="font-mono-tabular text-[11px] text-[#C6A76A] mt-1">
                ANALYSIS
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-[#242421] pt-4">
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#C6A76A] uppercase">
            05 · AI REPRESENTATION
          </div>
          <p className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#9C9A94] uppercase mt-1.5">
            ILLUSTRATIVE FEATURE REPRESENTATION · FEATURE COMPARISON
          </p>
          <ol className="mt-4 space-y-1.5 border-t border-[#242421]/70 pt-3">
            {FEATURE_RECONSTRUCTION_STEPS.map((step, idx) => (
              <li
                key={step}
                className="font-mono-tabular text-[10px] tracking-[0.16em] text-[#9C9A94] flex items-center gap-3"
              >
                <span className="text-[#77756F]">0{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-[#242421] pt-4">
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            07 · SCALE & RETURN
          </div>
          <p className="font-mono-tabular text-xs tracking-[0.14em] text-[#F2F0EA] mt-2">
            {SCALE_TRANSITION_STEPS.join(' → ')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {SCALE_LEGEND.map((item) => (
              <div key={item.damageClass} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: item.semanticHex }}
                  aria-hidden="true"
                />
                <span className="font-mono-tabular text-[11px] text-[#9C9A94]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 px-6 sm:px-10 lg:px-14">
      {/* Stage 02: Observation */}
      {obsOpacity > 0.02 && (
        <div
          style={{ opacity: obsOpacity }}
          className="absolute left-6 sm:left-10 lg:left-14 bottom-12 max-w-md border-t border-[#242421] bg-[#0B0B0A]/90 pt-3.5 pb-2 pr-4"
        >
          <div className="flex items-center justify-between gap-6 font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            <span>02 · SATELLITE OBSERVATION</span>
            <span className="text-[#77756F]">36.85° S · 174.76° E</span>
          </div>
          <div className="font-serif-display italic text-2xl text-[#E8E5DE] mt-1.5 tracking-[0.01em]">
            Unknown to observed.
          </div>
          <p className="text-sm text-[#9C9A94] mt-1.5 leading-relaxed">
            Regional Earth observation resolves above terrain contours before parcel isolation.
          </p>
        </div>
      )}

      {/* Stage 03: Building Target */}
      {isoOpacity > 0.02 && (
        <div
          style={{ opacity: isoOpacity }}
          className="absolute left-6 sm:left-10 lg:left-14 bottom-12 max-w-md border-t border-[#242421] bg-[#0B0B0A]/90 pt-3.5 pb-2 pr-5"
        >
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            03 · BUILDING TARGET
          </div>
          <div className="mt-3 grid grid-cols-3 gap-6">
            <div>
              <div className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                TARGET
              </div>
              <div className="font-mono-tabular text-[11px] text-[#F2F0EA] mt-1">
                BUILDING 01842
              </div>
            </div>
            <div>
              <div className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                PAIR
              </div>
              <div className="font-mono-tabular text-[11px] text-[#E8E5DE] mt-1">
                PRE / POST
              </div>
            </div>
            <div>
              <div className="font-mono-tabular text-[9px] tracking-[0.18em] text-[#77756F]">
                MODE
              </div>
              <div className="font-mono-tabular text-[11px] text-[#C6A76A] mt-1">
                ANALYSIS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 05: AI Representation */}
      {reconOpacity > 0.02 && (
        <div
          style={{ opacity: reconOpacity }}
          className="absolute left-6 sm:left-10 lg:left-14 bottom-12 max-w-sm border-t border-[#242421] bg-[#0B0B0A]/90 pt-3.5 pb-2.5 pr-5"
        >
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#C6A76A] uppercase">
            05 · AI REPRESENTATION
          </div>
          <div className="font-mono-tabular text-[10px] tracking-[0.14em] text-[#9C9A94] uppercase mt-1">
            ILLUSTRATIVE FEATURE REPRESENTATION · FEATURE COMPARISON
          </div>
          <ol className="mt-3 space-y-1.5 border-t border-[#242421] pt-3">
            {FEATURE_RECONSTRUCTION_STEPS.map((step, idx) => {
              const active = activeStageId === 'reconstruction' && idx === featureStepIndex;
              const passed = idx < featureStepIndex;
              return (
                <li
                  key={step}
                  className={`font-mono-tabular text-[10px] tracking-[0.16em] flex items-center gap-2.5 transition-colors ${
                    active
                      ? 'text-[#F2F0EA] font-medium'
                      : passed
                        ? 'text-[#9C9A94]'
                        : 'text-[#77756F]/60'
                  }`}
                >
                  <span
                    className={`h-[1px] shrink-0 ${
                      active
                        ? 'w-3.5 bg-[#C6A76A]'
                        : passed
                          ? 'w-2 bg-[#9C9A94]'
                          : 'w-1.5 bg-[#242421]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{step}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Stage 07: Scale & Return */}
      {zoomOpacity > 0.02 && (
        <div
          style={{ opacity: zoomOpacity }}
          className="absolute left-6 sm:left-10 lg:left-14 bottom-12 max-w-xl border-t border-[#242421] bg-[#0B0B0A]/90 pt-3.5 pb-2.5 pr-5"
        >
          <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#9C9A94] uppercase">
            07 · SCALE & RETURN
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {SCALE_TRANSITION_STEPS.map((label, idx) => {
              const isCurrent = idx === scaleStageIndex;
              return (
                <span key={label} className="inline-flex items-center gap-2">
                  <span
                    className={`font-mono-tabular text-[11px] tracking-[0.15em] ${
                      isCurrent ? 'text-[#F2F0EA] font-medium' : 'text-[#77756F]'
                    }`}
                  >
                    {label}
                  </span>
                  {idx < SCALE_TRANSITION_STEPS.length - 1 && (
                    <span className="text-[#242421] font-mono-tabular text-[11px]">→</span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#242421] flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {SCALE_LEGEND.map((item) => (
              <div key={item.damageClass} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ backgroundColor: item.semanticHex }}
                  aria-hidden="true"
                />
                <span className="font-mono-tabular text-[10px] tracking-[0.12em] text-[#9C9A94] uppercase">
                  {item.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
