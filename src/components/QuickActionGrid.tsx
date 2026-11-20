import { Calculator, Crosshair, MapPin, Package } from 'lucide-react';

interface QuickActionGridProps {
  onSendParcel: () => void;
  onTrackParcel: () => void;
  onOpenQuote: () => void;
  onOpenLocations: () => void;
}

export function QuickActionGrid({
  onSendParcel,
  onTrackParcel,
  onOpenQuote,
  onOpenLocations,
}: QuickActionGridProps) {
  const actions = [
    {
      label: 'Send Parcel',
      icon: Package,
      tileBg: 'bg-[#EEF0FF]',
      iconColor: 'text-[#4F46E5]',
      onClick: onSendParcel,
    },
    {
      label: 'Track Parcel',
      icon: Crosshair,
      tileBg: 'bg-[#FFF3EB]',
      iconColor: 'text-[#FF5A1F]',
      onClick: onTrackParcel,
    },
    {
      label: 'Get a Quote',
      icon: Calculator,
      tileBg: 'bg-[#EBF4FF]',
      iconColor: 'text-[#2563EB]',
      onClick: onOpenQuote,
    },
    {
      label: 'Find Location',
      icon: MapPin,
      tileBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#10B981]',
      onClick: onOpenLocations,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="bg-white rounded-2xl px-2 py-3.5 sm:p-4 flex flex-col items-center justify-center gap-2.5 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/60 hover:border-slate-300 hover:-translate-y-0.5 transition-all cursor-pointer min-h-[92px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F]"
          >
            <div
              className={`w-10 h-10 rounded-xl ${action.tileBg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-5 h-5 ${action.iconColor}`} />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-slate-700 whitespace-nowrap truncate max-w-full">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
