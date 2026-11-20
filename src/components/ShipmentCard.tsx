import { ChevronRight, Lock, Unlock } from 'lucide-react';
import { ShipmentDetail, ShipmentSummary } from '../types';
import { ThumbnailImage } from './ThumbnailImage';

interface ShipmentCardProps {
  shipment: ShipmentSummary;
  unlockedDetail?: ShipmentDetail;
  isSelected?: boolean;
  onSelect: (shipment: ShipmentSummary) => void;
}

export function ShipmentCard({
  shipment,
  unlockedDetail,
  isSelected = false,
  onSelect,
}: ShipmentCardProps) {
  const isUnlocked = !shipment.isProtected || Boolean(unlockedDetail);
  const displayTracking = unlockedDetail
    ? `#${unlockedDetail.trackingNumber}`
    : shipment.maskedNumber;

  return (
    <button
      type="button"
      onClick={() => onSelect(shipment)}
      className={`w-full text-left bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F] ${
        isSelected
          ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20'
          : 'border-slate-200/70 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <ThumbnailImage
          src={shipment.thumbnailUrl}
          alt={shipment.itemName}
          className="w-16 h-16 rounded-xl"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono tabular-nums text-[15px] font-bold text-slate-900 tracking-tight truncate">
              {displayTracking}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          <h3 className="font-display font-bold text-[15px] text-slate-900 truncate mt-0.5">
            {shipment.itemName}
          </h3>

          <p className="text-xs text-slate-500 truncate mt-0.5">
            {shipment.originCity}, {shipment.originCountry} → {shipment.destinationCity},{' '}
            {shipment.destinationCountry}
          </p>

          {/* 5-node Progress Stepper + Status */}
          <div className="flex items-center mt-2.5 gap-2.5">
            <div className="flex items-center flex-1 max-w-[140px]" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((node, index) => {
                const filled = node <= shipment.stage;
                const lineFilled = node < shipment.stage;
                return (
                  <div
                    key={node}
                    className={`flex items-center ${index < 4 ? 'flex-1' : ''}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        filled ? 'bg-[#2563EB]' : 'bg-slate-200'
                      }`}
                    />
                    {index < 4 && (
                      <span
                        className={`h-[2px] flex-1 ${
                          lineFilled ? 'bg-[#2563EB]' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-slate-800 whitespace-nowrap shrink-0">
              {shipment.statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Inline Privacy / Telemetry Metadata (Zero-Pill Typography) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {isUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Live Telematics Unlocked</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Protected</span>
            </>
          )}
        </span>
        <span className="tabular-nums truncate">
          {shipment.serviceTier} · ETA {shipment.estimatedDelivery}
        </span>
      </div>
    </button>
  );
}
