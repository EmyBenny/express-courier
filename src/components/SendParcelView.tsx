import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, Check, PackagePlus, Shield } from 'lucide-react';
import { HubLocation, ServiceTier, ShipmentDetail } from '../types';

interface SendParcelViewProps {
  hubs: HubLocation[];
  initialOriginCode?: string;
  initialDestinationCode?: string;
  initialTier?: ServiceTier;
  initialWeightKg?: number;
  onCreateShipment: (payload: {
    itemName: string;
    category: string;
    originCity: string;
    originCountry: string;
    originCode: string;
    destinationCity: string;
    destinationCountry: string;
    destinationCode: string;
    recipientName: string;
    weightKg: number;
    declaredValueUsd: number;
    serviceTier: ServiceTier;
    isProtected: boolean;
  }) => Promise<ShipmentDetail | null>;
}

const CATEGORIES = [
  'Electronics',
  'Footwear & Apparel',
  'Optical Hardware',
  'Medical Supply',
  'General Parcel',
];

export function SendParcelView({
  hubs,
  initialOriginCode = 'JFK',
  initialDestinationCode = 'LHR',
  initialTier = 'Express Air',
  initialWeightKg = 1.8,
  onCreateShipment,
}: SendParcelViewProps) {
  const defaultOrigin = hubs.find((h) => h.code === initialOriginCode) || hubs[0];
  const defaultDest = hubs.find((h) => h.code === initialDestinationCode) || hubs[1] || hubs[0];

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [originCode, setOriginCode] = useState(defaultOrigin?.code || 'JFK');
  const [destinationCode, setDestinationCode] = useState(defaultDest?.code || 'LHR');
  const [weightKg, setWeightKg] = useState(String(initialWeightKg));
  const [declaredValueUsd, setDeclaredValueUsd] = useState('350');
  const [serviceTier, setServiceTier] = useState<ServiceTier>(initialTier);
  const [isProtected, setIsProtected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<ShipmentDetail | null>(null);

  const estimatedFee = useMemo(() => {
    const w = Math.max(0.5, Number(weightKg) || 1);
    const base = serviceTier === 'Express Air' ? 28 : serviceTier === 'Priority Cargo' ? 19 : 12;
    const perKg = serviceTier === 'Express Air' ? 14.5 : serviceTier === 'Priority Cargo' ? 9.8 : 6.2;
    return (base + w * perKg + 18.5).toFixed(2);
  }, [weightKg, serviceTier]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!itemName.trim() || !recipientName.trim()) {
      setError('Please enter both an item description and recipient full name.');
      return;
    }

    const origHub = hubs.find((h) => h.code === originCode) || hubs[0];
    const destHub = hubs.find((h) => h.code === destinationCode) || hubs[1];

    setIsSubmitting(true);
    try {
      const created = await onCreateShipment({
        itemName: itemName.trim(),
        category,
        originCity: origHub?.city || 'New York',
        originCountry: origHub?.country || 'United States',
        originCode: origHub?.code || 'JFK',
        destinationCity: destHub?.city || 'London',
        destinationCountry: destHub?.country || 'United Kingdom',
        destinationCode: destHub?.code || 'LHR',
        recipientName: recipientName.trim(),
        weightKg: Number(weightKg) || 1.5,
        declaredValueUsd: Number(declaredValueUsd) || 150,
        serviceTier,
        isProtected,
      });

      if (created) {
        setCreatedShipment(created);
        setItemName('');
        setRecipientName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to book shipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/70">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] text-[#4F46E5] flex items-center justify-center">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Dispatch New Parcel</h2>
            <p className="text-xs text-slate-500">
              Instant airway bill generation &amp; real-time WebSocket tracking
            </p>
          </div>
        </div>
      </div>

      {createdShipment && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <p className="font-bold text-sm">
              Booked! Tracking ID:{' '}
              <span className="font-mono">#{createdShipment.trackingNumber}</span>
            </p>
            <p className="mt-0.5">
              {createdShipment.itemName} is scheduled from {createdShipment.originCity} to{' '}
              {createdShipment.destinationCity}. Live telematics is now open.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="send-item" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Item / Parcel Description
            </label>
            <input
              id="send-item"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>

          <div>
            <label
              htmlFor="send-recipient"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Recipient Full Name
            </label>
            <input
              id="send-recipient"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Olivia Bennett"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="send-origin" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Origin Hub
            </label>
            <select
              id="send-origin"
              value={originCode}
              onChange={(e) => setOriginCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            >
              {hubs.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.city}, {h.country} ({h.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="send-dest" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination Hub
            </label>
            <select
              id="send-dest"
              value={destinationCode}
              onChange={(e) => setDestinationCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            >
              {hubs.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.city}, {h.country} ({h.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="send-cat" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <select
              id="send-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="send-weight" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Weight (kg)
            </label>
            <input
              id="send-weight"
              type="number"
              min="0.2"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>

          <div>
            <label htmlFor="send-val" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Declared Value ($)
            </label>
            <input
              id="send-val"
              type="number"
              min="10"
              step="10"
              value={declaredValueUsd}
              onChange={(e) => setDeclaredValueUsd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>
        </div>

        {/* Service Tier Segmented Selector */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">Service Tier</span>
          <div className="grid grid-cols-3 gap-2">
            {(['Express Air', 'Priority Cargo', 'Economy Freight'] as ServiceTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setServiceTier(tier)}
                className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  serviceTier === tier
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Protection Option */}
        <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <div>
              <p className="text-xs font-semibold text-slate-900">Mask Public Tracking ID</p>
              <p className="text-[11px] text-slate-500">
                Requires full tracking code to view recipient &amp; route log
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isProtected}
            onChange={(e) => setIsProtected(e.target.checked)}
            className="w-4 h-4 accent-[#FF5A1F] rounded"
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Estimated Shipping Tariff</p>
            <p className="font-display font-extrabold text-xl text-slate-900 tabular-nums">
              ${estimatedFee} <span className="text-xs font-normal text-slate-500">USD</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E84E15] disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Consignment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
