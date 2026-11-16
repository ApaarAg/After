import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { GITHUB_REPO_URL } from '../../data/heroAssets';

interface HeroNavigationProps {
  scrolled: boolean;
  onResetTop: () => void;
  onSelectStage: (scrollTarget: number) => void;
  onJumpToStub: () => void;
}

const NAV_LINKS = [
  { label: 'SYSTEM', action: 'stage' as const, target: 0.21 },
  { label: 'ANALYSIS', action: 'stage' as const, target: 0.5 },
  { label: 'RESEARCH', action: 'stub' as const, target: 1 },
  { label: 'BENCHMARK', action: 'stub' as const, target: 1 },
];

export function HeroNavigation({
  scrolled,
  onResetTop,
  onSelectStage,
  onJumpToStub,
}: HeroNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (item: (typeof NAV_LINKS)[number]) => {
    setMobileOpen(false);
    if (item.action === 'stage') {
      onSelectStage(item.target);
    } else {
      onJumpToStub();
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0B0A]/92 border-b border-[#242421]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onResetTop();
          }}
          className={`min-h-[44px] flex items-center text-left whitespace-nowrap shrink-0 transition-opacity duration-300 cursor-pointer ${
            scrolled ? 'opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <span className="font-sans text-[11px] tracking-[0.22em] text-[#F2F0EA] font-normal">
            AFTERMATHVISION
          </span>
        </button>

        <nav
          aria-label="Primary navigation"
          className={`hidden md:flex items-center gap-8 transition-opacity duration-300 ${
            scrolled ? 'opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleLinkClick(item)}
              className="min-h-[44px] font-sans font-normal text-[11px] tracking-[0.2em] whitespace-nowrap shrink-0 text-[#9C9A94] hover:text-[#F2F0EA] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div
          className={`hidden md:flex items-center shrink-0 transition-opacity duration-300 ${
            scrolled ? 'opacity-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1.5 font-sans font-normal text-[11px] tracking-[0.2em] whitespace-nowrap shrink-0 text-[#9C9A94] hover:text-[#C6A76A] transition-colors"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#9C9A94] hover:text-[#F2F0EA]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0B0B0A] border-b border-[#242421] px-6 py-4 space-y-1">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleLinkClick(item)}
              className="w-full min-h-[44px] flex items-center font-sans text-xs tracking-[0.2em] text-[#9C9A94] hover:text-[#F2F0EA] border-b border-[#242421]/60"
            >
              {item.label}
            </button>
          ))}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="w-full min-h-[44px] flex items-center justify-between font-sans text-xs tracking-[0.2em] text-[#F2F0EA] hover:text-[#C6A76A] pt-1"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </header>
  );
}
