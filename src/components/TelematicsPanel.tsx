import { FormEvent, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Lock,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { ShipmentDetail, ShipmentSummary, STAGE_LABELS, StageIndex } from '../types';
import { ThumbnailImage } from './ThumbnailImage';
import { ShipmentLocationMap } from './ShipmentLocationMap';

interface TelematicsPanelProps {
  selectedSummary: ShipmentSummary | null;
  unlockedDetail: ShipmentDetail | null;
  onUnlockWithCode: (code: string) => Promise<void>;
  onAdvanceCheckpoint?: (shipmentId: string) => Promise<void>;
  onCloseMobile?: () => void;
  unlockError: string | null;
  isUnlocking: boolean;
  isAdvancing: boolean;
  wsConnected: boolean;
  mapsReady: boolean;
}

const DEMO_CODE_HINTS: Record<string, string> = {
  'shp-zx91847261': 'ZX91847261',
  'shp-edx4920184': 'EDX4920184',
  'shp-glb7731905': 'GLB7731905',
  'shp-edx1058392': 'EDX1058392',
};

function formatEventTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function TelematicsPanel({
  selectedSummary,
  unlockedDetail,
  onUnlockWithCode,
  onAdvanceCheckpoint,
  onCloseMobile,
  unlockError,
  isUnlocking,
  isAdvancing,
  wsConnected,
  mapsReady,
}: TelematicsPanelProps) {
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!selectedSummary) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/70">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EBF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Live Consignment Telematics
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Enter an assigned tracking number in the search bar or select any shipment card to
              inspect live Google Map coordinates, courier GPS status, and checkpoint logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Protected consignment verification state
  if (!unlockedDetail) {
    const demoHint = DEMO_CODE_HINTS[selectedSummary.id];
    const handleVerifySubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!verifyCode.trim()) return;
      await onUnlockWithCode(verifyCode.trim());
    };

    return (
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(13,27,42,0.06)] border border-slate-200/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ThumbnailImage
              src={selectedSummary.thumbnailUrl}
              alt={selectedSummary.itemName}
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <p className="font-mono tabular-nums text-sm font-bold text-slate-900">
                {selectedSummary.maskedNumber}
              </p>
              <p className="text-sm font-semibold text-slate-700">{selectedSummary.itemName}</p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close telematics panel"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">Client Data Privacy Protected:</span>{' '}
              Full tracking numbers, recipient details, live GPS maps, and route histories are
              confidential. Confirm your assigned tracking number to unlock telematics.
            </div>
          </div>
        </div>

        <form onSubmit={handleVerifySubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="verify-tracking-input"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Assigned Tracking Number
            </label>
            <input
              id="verify-tracking-input"
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              placeholder="e.g. ZX91847261"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] focus:border-transparent"
            />
          </div>

          {unlockError && (
            <p role="alert" className="text-xs text-red-600 font-medium">
              {unlockError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={isUnlocking}
              className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-[#0D1B2A] hover:bg-[#162B42] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {isUnlocking ? 'Verifying...' : 'Unlock Telematics'}
            </button>
            {demoHint && (
              <button
                type="button"
                onClick={() => {
                  setVerifyCode(demoHint);
                  onUnlockWithCode(demoHint);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Use Sample ({demoHint})
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // Unlocked full live consignment telematics view
  const handleCopy = () => {
    navigator.clipboard?.writeText(unlockedDetail.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const stages: StageIndex[] = [0, 1, 2, 3, 4];
  const isDelivered = unlockedDetail.stage >= 4;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(13,27,42,0.06)] border border-slate-200/80 space-y-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <ThumbnailImage
            src={unlockedDetail.thumbnailUrl}
            alt={unlockedDetail.itemName}
            className="w-14 h-14 rounded-xl"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                #{unlockedDetail.trackingNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy tracking number"
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 truncate">
              {unlockedDetail.itemName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {unlockedDetail.serviceTier} · {unlockedDetail.weightKg} kg · Recipient:{' '}
              {unlockedDetail.recipientName}
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close telematics panel"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Live Google Map View (Courier GPS for Out for Delivery / Last Known fallback) */}
      <ShipmentLocationMap shipment={unlockedDetail} mapsReady={mapsReady} />

      {/* Live Route Corridor Bar */}
      <div className="p-4 rounded-xl bg-[#0D1B2A] text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Origin</p>
            <p className="font-mono text-base font-bold">{unlockedDetail.originCode}</p>
            <p className="text-xs text-slate-300 truncate">{unlockedDetail.originCity}</p>
          </div>

          <div className="flex-1 px-3 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{unlockedDetail.statusLabel}</span>
            </div>
            <div className="w-full h-[2px] bg-white/15 rounded-full mt-2 relative overflow-hidden">
              <div
                className="h-full bg-[#FF5A1F] transition-all duration-300"
                style={{ width: `${(unlockedDetail.stage / 4) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
              ETA {unlockedDetail.estimatedDelivery}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-slate-400 font-medium">Destination</p>
            <p className="font-mono text-base font-bold">{unlockedDetail.destinationCode}</p>
            <p className="text-xs text-slate-300 truncate">{unlockedDetail.destinationCity}</p>
          </div>
        </div>
      </div>

      {/* Current Hub Location & Live Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
          <MapPin className="w-4 h-4 text-[#FF5A1F] shrink-0" />
          <span className="truncate font-medium">{unlockedDetail.currentLocation}</span>
        </div>

        {!isDelivered && onAdvanceCheckpoint ? (
          <button
            type="button"
            disabled={isAdvancing}
            onClick={() => onAdvanceCheckpoint(unlockedDetail.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E84E15] disabled:opacity-60 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{isAdvancing ? 'Scanning...' : 'Push Live Scan'}</span>
          </button>
        ) : isDelivered ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed</span>
          </span>
        ) : null}
      </div>

      {/* 5-Stage Horizontal Milestone Strip */}
      <div className="mt-4 grid grid-cols-5 gap-1 text-center">
        {stages.map((st) => {
          const active = st <= unlockedDetail.stage;
          const current = st === unlockedDetail.stage;
          return (
            <div key={st} className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  active
                    ? current
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {active && !current ? '✓' : st + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] leading-tight ${
                  active ? 'font-semibold text-slate-800' : 'text-slate-400'
                }`}
              >
                {STAGE_LABELS[st]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Chronological Scan History */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-900">Route Checkpoint Log</h4>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Feed
          </span>
        </div>

        <ol className="space-y-3.5">
          {[...unlockedDetail.events].reverse().map((ev, idx) => (
            <li key={ev.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    idx === 0 ? 'bg-[#FF5A1F]' : 'bg-[#2563EB]'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {ev.status} · {ev.hubCode}
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                    {formatEventTime(ev.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{ev.location}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ev.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
