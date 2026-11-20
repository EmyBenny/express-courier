import { FormEvent, RefObject } from 'react';
import { ArrowRight, Bell, Search } from 'lucide-react';

interface HeroTrackingBannerProps {
  trackingInput: string;
  onTrackingInputChange: (val: string) => void;
  onTrackSubmit: (code: string) => void;
  trackingError: string | null;
  isTrackingLoading: boolean;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

const SAMPLE_CODES = ['ZX91847261', 'EDX4920184', 'GLB7731905'];

export function HeroTrackingBanner({
  trackingInput,
  onTrackingInputChange,
  onTrackSubmit,
  trackingError,
  isTrackingLoading,
  unreadCount = 0,
  onOpenNotifications,
  inputRef,
}: HeroTrackingBannerProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    onTrackSubmit(trackingInput.trim());
  };

  return (
    <section className="relative overflow-hidden bg-[#0D1B2A] text-white rounded-3xl px-5 pt-6 pb-7 sm:px-8 sm:pt-7 sm:pb-8 shadow-[0_12px_32px_rgba(13,27,42,0.16)]">
      {/* Subtle Architectural Skyline Silhouette Backdrop matching reference */}
      <svg
        aria-hidden="true"
        viewBox="0 0 440 240"
        preserveAspectRatio="xMaxYMax slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
      >
        <defs>
          <linearGradient id="edex-sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Left mid tower */}
        <rect x="210" y="55" width="76" height="190" rx="3" fill="url(#edex-sky-grad)" />
        {/* Antenna & beacon */}
        <rect x="274" y="18" width="2.5" height="38" fill="#3B5B84" />
        <circle cx="275.25" cy="17" r="2.2" fill="#EF4444" />
        {/* Right taller tower */}
        <rect x="304" y="34" width="96" height="210" rx="4" fill="url(#edex-sky-grad)" />
        {/* Subtle window grid on towers */}
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 4 }).map((__, col) => (
            <rect
              key={`w1-${row}-${col}`}
              x={222 + col * 14}
              y={74 + row * 18}
              width="7"
              height="6"
              rx="1"
              fill="#6488B4"
              opacity={(row + col) % 3 === 0 ? 0.35 : 0.14}
            />
          ))
        )}
        {Array.from({ length: 9 }).map((_, row) =>
          Array.from({ length: 5 }).map((__, col) => (
            <rect
              key={`w2-${row}-${col}`}
              x={318 + col * 15}
              y={54 + row * 18}
              width="8"
              height="7"
              rx="1"
              fill="#6488B4"
              opacity={(row * 2 + col) % 4 === 0 ? 0.38 : 0.15}
            />
          ))
        )}
      </svg>

      <div className="relative z-10">
        {/* Top Greeting & Optional Notification Trigger */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white text-[#0D1B2A] font-display font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
              EE
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-300 leading-tight">Welcome,</p>
              <p className="text-[15px] font-display font-bold text-white truncate leading-tight mt-0.5">
                Consignment Recipient
              </p>
            </div>
          </div>

          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`Open notifications (${unreadCount} unread)`}
              className="relative w-11 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-[#13263E]"
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>

        {/* Hero Copy */}
        <div className="mt-6 sm:mt-7">
          <h1
            className="font-display text-[28px] sm:text-[34px] font-extrabold text-white tracking-tight leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            Track, Send, Receive
          </h1>
          <p className="text-sm sm:text-[15px] text-slate-300 mt-1.5 font-normal">
            Fast. Reliable. Worldwide.
          </p>
        </div>

        {/* Capsule Tracking Search Bar */}
        <form onSubmit={handleSubmit} className="mt-5">
          <div className="bg-white rounded-full p-1.5 pl-4 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.22)] focus-within:ring-2 focus-within:ring-[#FF5A1F]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={trackingInput}
              onChange={(e) => onTrackingInputChange(e.target.value)}
              placeholder="Enter tracking number"
              aria-label="Enter tracking number"
              className="w-full min-w-0 bg-transparent text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            />
            <button
              type="submit"
              disabled={isTrackingLoading}
              aria-label="Track consignment"
              className="w-11 h-11 rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] disabled:opacity-60 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Inline Sample Tracking Numbers (Zero-Pill Typography) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
          <span className="text-slate-400">Sample IDs:</span>
          {SAMPLE_CODES.map((code, idx) => (
            <span key={code} className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onTrackingInputChange(code);
                  onTrackSubmit(code);
                }}
                className="font-mono tabular-nums text-slate-200 hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-[#FF5A1F] transition-colors cursor-pointer"
              >
                {code}
              </button>
              {idx < SAMPLE_CODES.length - 1 && (
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>

        {trackingError && (
          <p
            role="alert"
            className="mt-3 text-xs text-red-200 bg-red-950/60 border border-red-400/30 rounded-xl px-3.5 py-2"
          >
            {trackingError}
          </p>
        )}
      </div>
    </section>
  );
}
