import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { GITHUB_REPO_URL } from '../../data/heroAssets';
import { clamp01, smoothstep } from '../../utils/heroTimeline';

interface HeroTypographyProps {
  progress: number;
  reducedMotion: boolean;
  isCompactViewport: boolean;
  onExplore: () => void;
}

export function HeroTypography({
  progress,
  reducedMotion,
  isCompactViewport,
  onExplore,
}: HeroTypographyProps) {
  const fadeOut = isCompactViewport ? 1 : 1 - smoothstep(0.05, 0.14, progress);
  const visibilityOpacity = clamp01(fadeOut);
  const isInteractive = isCompactViewport || visibilityOpacity > 0.15;
  const translateY = reducedMotion || isCompactViewport ? 0 : (1 - visibilityOpacity) * -14;

  return (
    <div
      style={
        isCompactViewport
          ? undefined
          : {
              opacity: visibilityOpacity,
              transform: `translate3d(0, ${translateY}px, 0)`,
            }
      }
      className={`${
        isCompactViewport
          ? 'relative z-20 pt-24 pb-12 px-6'
          : 'pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-6 sm:px-10 lg:px-14 pt-28 pb-10'
      }`}
    >
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tabular text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] text-[#9C9A94] uppercase mb-7 sm:mb-8">
          <span className="text-[#F2F0EA]">AFTERMATHVISION</span>
          <span aria-hidden="true" className="text-[#77756F]">
            /
          </span>
          <span>DISASTER INTELLIGENCE</span>
        </div>

        <h1 className="text-balance">
          <span className="block font-display font-light text-[2.4rem] sm:text-[3.85rem] lg:text-[4.9rem] leading-[1.02] tracking-[-0.02em] text-[#F2F0EA]">
            SEE THE DAMAGE.
          </span>
          <span className="block font-serif-display font-normal italic text-[1.9rem] sm:text-[3.05rem] lg:text-[3.85rem] leading-[1.08] tracking-[0.03em] text-[#E8E5DE]/85 mt-1.5">
            UNDERSTAND THE IMPACT.
          </span>
        </h1>

        <p className="mt-7 text-[15px] sm:text-[16px] text-[#9C9A94] max-w-[460px] leading-[1.68] font-normal">
          Pre- and post-disaster satellite imagery, analyzed with Siamese deep learning to
          understand building damage at scale.
        </p>

        <div
          className={`mt-10 flex flex-wrap items-center gap-8 ${
            isInteractive ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={onExplore}
            disabled={!isInteractive}
            className="group min-h-[44px] py-2 border-b border-[#C6A76A]/75 hover:border-[#C6A76A] text-[#F2F0EA] transition-colors font-mono-tabular text-[11px] tracking-[0.2em] uppercase whitespace-nowrap inline-flex items-center gap-2.5 cursor-pointer"
          >
            <span>EXPLORE THE SYSTEM</span>
            <ArrowRight
              className="w-3.5 h-3.5 text-[#C6A76A] transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={isInteractive ? 0 : -1}
            className="min-h-[44px] py-2 border-b border-transparent hover:border-[#77756F] text-[#9C9A94] hover:text-[#F2F0EA] transition-colors font-mono-tabular text-[11px] tracking-[0.2em] uppercase whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#77756F]" aria-hidden="true" />
          </a>
        </div>
      </div>

      {!isCompactViewport && (
        <div className="flex items-center gap-3 text-[#77756F]">
          <span className="w-[1px] h-7 bg-[#242421]" aria-hidden="true" />
          <span className="font-mono-tabular text-[10px] tracking-[0.22em] uppercase">
            Scroll to observe
          </span>
        </div>
      )}
    </div>
  );
}
