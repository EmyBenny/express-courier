import { useMemo, useState } from 'react';
import { Clock, MapPin, Phone, Search, X } from 'lucide-react';
import { HubLocation } from '../types';

interface LocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubs: HubLocation[];
  onSelectHubAsOrigin: (hubCode: string) => void;
}

export function LocationsModal({
  isOpen,
  onClose,
  hubs,
  onSelectHubAsOrigin,
}: LocationsModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hubs;
    return hubs.filter(
      (h) =>
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q)
    );
  }, [hubs, query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Find EDEX Express Hub Locations"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm sm:p-4"
    >
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[88vh] flex flex-col">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Global Hubs &amp; Drop-Offs
              </h2>
              <p className="text-xs text-slate-500">
                {hubs.length} international gateways available
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close locations modal"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, country, or hub code (e.g. LHR, Lagos)"
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          />
        </div>

        <div className="mt-4 space-y-3 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No EDEX hub matched &ldquo;{query}&rdquo;.
            </p>
          ) : (
            filtered.map((hub) => (
              <div
                key={hub.id}
                className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-[#2563EB]">
                      {hub.code} · {hub.city}, {hub.country}
                    </p>
                    <h3 className="font-display font-bold text-sm text-slate-900 mt-0.5">
                      {hub.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectHubAsOrigin(hub.code)}
                    className="px-3 py-1.5 rounded-lg bg-[#0D1B2A] hover:bg-[#17304A] text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Ship From Here
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-2">{hub.address}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {hub.hours}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {hub.phone}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  {hub.services.join(' · ')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
