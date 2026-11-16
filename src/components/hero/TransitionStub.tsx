import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { GITHUB_REPO_URL } from '../../data/heroAssets';

interface TransitionStubProps {
  onReturnTop: () => void;
}

const UPCOMING_MODULES = [
  {
    code: '01',
    title: 'System Architecture',
    summary: 'Siamese dual-encoder pipeline, paired EO registration, and inference workflow.',
  },
  {
    code: '02',
    title: 'Interactive Damage Analysis',
    summary: 'Full-swath building footprint inspection and multi-class structural overlays.',
  },
  {
    code: '03',
    title: 'Research & Model Evaluation',
    summary: 'Representation comparisons, failure-mode diagnostics, and ablation findings.',
  },
  {
    code: '04',
    title: 'xBD Benchmark & Deployment',
    summary: 'Regional evaluation metrics and FastAPI live inference integration.',
  },
];

export function TransitionStub({ onReturnTop }: TransitionStubProps) {
  return (
    <section
      id="transition-stub"
      aria-label="Upcoming AftermathVision modules"
      className="relative z-20 bg-[#0B0B0A] border-t border-[#242421] py-20 sm:py-28 px-6 sm:px-10 lg:px-14"
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-[#242421]">
          <div className="max-w-2xl">
            <p className="font-mono-tabular text-[11px] tracking-[0.22em] text-[#9C9A94] uppercase">
              AFTERMATHVISION · CONTINUING ARCHITECTURE
            </p>
            <h2 className="font-display font-light text-2xl sm:text-4xl tracking-tight text-[#F2F0EA] mt-3 text-balance">
              From a single structure to{' '}
              <span className="font-serif-display italic text-[#E8E5DE]">
                regional disaster intelligence.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#9C9A94] leading-relaxed max-w-xl">
              This opening sequence establishes the visual and analytical foundation for
              AftermathVision. Full interactive system modules continue below as
              development progresses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 shrink-0">
            <button
              type="button"
              onClick={onReturnTop}
              className="min-h-[44px] py-2 border-b border-[#C6A76A]/75 hover:border-[#C6A76A] text-[#F2F0EA] transition-colors font-mono-tabular text-[11px] tracking-[0.2em] uppercase whitespace-nowrap inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#C6A76A]" aria-hidden="true" />
              <span>REPLAY HERO</span>
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] py-2 border-b border-transparent hover:border-[#77756F] text-[#9C9A94] hover:text-[#F2F0EA] transition-colors font-mono-tabular text-[11px] tracking-[0.2em] uppercase whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <span>GITHUB</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#77756F]" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-10">
          {UPCOMING_MODULES.map((mod) => (
            <div key={mod.code} className="border-t border-[#242421] pt-4">
              <div className="flex items-center justify-between font-mono-tabular text-[10px] tracking-[0.18em]">
                <span className="text-[#C6A76A]">{mod.code}</span>
                <span className="text-[#77756F] uppercase">FORTHCOMING</span>
              </div>
              <h3 className="font-display text-base font-medium text-[#F2F0EA] mt-2.5">
                {mod.title}
              </h3>
              <p className="mt-1.5 text-sm text-[#9C9A94] leading-relaxed">{mod.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
