import { FormEvent, useState } from 'react';
import { Calculator, ArrowRight, X } from 'lucide-react';
import { HubLocation, QuoteResult, ServiceTier } from '../types';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubs: HubLocation[];
  onBookWithQuote: (quote: QuoteResult) => void;
}

export function QuoteModal({ isOpen, onClose, hubs, onBookWithQuote }: QuoteModalProps) {
  const [originCode, setOriginCode] = useState(hubs[0]?.code || 'JFK');
  const [destinationCode, setDestinationCode] = useState(hubs[1]?.code || 'LHR');
  const [weightKg, setWeightKg] = useState('2.5');
  const [lengthCm, setLengthCm] = useState('35');
  const [widthCm, setWidthCm] = useState('25');
  const [heightCm, setHeightCm] = useState('18');
  const [serviceTier, setServiceTier] = useState<ServiceTier>('Express Air');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCalculate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCode,
          destinationCode,
          weightKg: Number(weightKg) || 1,
          lengthCm: Number(lengthCm) || 30,
          widthCm: Number(widthCm) || 20,
          heightCm: Number(heightCm) || 15,
          serviceTier,
        }),
      });
      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shipping Rate Quote Calculator"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm sm:p-4"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4FF] text-[#2563EB] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">Get a Rate Quote</h2>
              <p className="text-xs text-slate-500">Live volumetric weight &amp; customs estimate</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quote modal"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCalculate} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="q-orig" className="block text-xs font-semibold text-slate-700 mb-1">
                Origin Hub
              </label>
              <select
                id="q-orig"
                value={originCode}
                onChange={(e) => setOriginCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                {hubs.map((h) => (
                  <option key={h.code} value={h.code}>
                    {h.city} ({h.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-dest" className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Hub
              </label>
              <select
                id="q-dest"
                value={destinationCode}
                onChange={(e) => setDestinationCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                {hubs.map((h) => (
                  <option key={h.code} value={h.code}>
                    {h.city} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label htmlFor="q-wt" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Weight (kg)
              </label>
              <input
                id="q-wt"
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="q-l" className="block text-[11px] font-semibold text-slate-600 mb-1">
                L (cm)
              </label>
              <input
                id="q-l"
                type="number"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="q-w" className="block text-[11px] font-semibold text-slate-600 mb-1">
                W (cm)
              </label>
              <input
                id="q-w"
                type="number"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="q-h" className="block text-[11px] font-semibold text-slate-600 mb-1">
                H (cm)
              </label>
              <input
                id="q-h"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Express Air', 'Priority Cargo', 'Economy Freight'] as ServiceTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setServiceTier(tier)}
                className={`py-2 px-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  serviceTier === tier
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0D1B2A] hover:bg-[#162B42] text-white text-sm font-bold cursor-pointer"
          >
            {loading ? 'Calculating...' : 'Calculate Shipping Rate'}
          </button>
        </form>

        {quote && (
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Chargeable Weight</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {quote.chargeableWeightKg} kg
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Base Freight ({quote.serviceTier})</span>
              <span className="font-mono tabular-nums">${quote.baseRateUsd.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Fuel Surcharge (12%)</span>
              <span className="font-mono tabular-nums">${quote.fuelSurchargeUsd.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Customs Brokerage</span>
              <span className="font-mono tabular-nums">${quote.customsHandlingUsd.toFixed(2)}</span>
            </div>
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Transit Window: {quote.estimatedDays}</p>
                <p className="font-display text-xl font-extrabold text-slate-900 tabular-nums">
                  ${quote.totalUsd.toFixed(2)} USD
                </p>
              </div>
              <button
                type="button"
                onClick={() => onBookWithQuote(quote)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E84E15] text-white text-xs font-bold cursor-pointer"
              >
                <span>Ship Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
