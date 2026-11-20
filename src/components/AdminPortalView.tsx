import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Mail,
  Navigation,
  Radio,
  Search,
  Shield,
  Truck,
} from 'lucide-react';
import {
  AppNotification,
  ContactInquiry,
  HubLocation,
  PortalView,
  ServiceTier,
  ShipmentDetail,
  ShipmentSummary,
} from '../types';
import { FleetOverviewMap } from './ShipmentLocationMap';
import { SendParcelView } from './SendParcelView';
import { QuickActionGrid } from './QuickActionGrid';
import { TelematicsPanel } from './TelematicsPanel';
import { AppSettingsView } from './AppSettingsView';

export type AdminTabKey = 'fleet' | 'dispatch' | 'inquiries' | 'settings';

interface AdminPortalViewProps {
  hubs: HubLocation[];
  mapsReady: boolean;
  wsConnected: boolean;
  autoDispatchEnabled: boolean;
  onToggleAutoDispatch: (enabled: boolean) => void;
  onNavigatePortal: (view: PortalView) => void;
  onAdvanceCheckpoint: (shipmentId: string) => Promise<void>;
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
  inquiries: ContactInquiry[];
  onToggleResolveInquiry: (id: string) => Promise<void>;
  latestAdminUpdate?: ShipmentDetail | null;
  notifications: AppNotification[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onOpenQuote: () => void;
  onOpenLocations: () => void;
  browserAlertsEnabled: boolean;
  onRequestBrowserAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onSyncNow: () => void;
  adminTab: AdminTabKey;
  onChangeAdminTab: (tab: AdminTabKey) => void;
  sendPreset: {
    originCode?: string;
    destinationCode?: string;
    tier?: ServiceTier;
    weightKg?: number;
  };
  focusedShipmentId: string | null;
  onFocusShipmentId: (id: string | null) => void;
}

export function AdminPortalView({
  hubs,
  mapsReady,
  wsConnected,
  autoDispatchEnabled,
  onToggleAutoDispatch,
  onNavigatePortal,
  onAdvanceCheckpoint,
  onCreateShipment,
  inquiries,
  onToggleResolveInquiry,
  latestAdminUpdate,
  notifications,
  unreadCount,
  onOpenNotifications,
  onSelectNotification,
  onOpenQuote,
  onOpenLocations,
  browserAlertsEnabled,
  onRequestBrowserAlerts,
  soundEnabled,
  onToggleSound,
  onSyncNow,
  adminTab,
  onChangeAdminTab,
  sendPreset,
  focusedShipmentId,
  onFocusShipmentId,
}: AdminPortalViewProps) {
  const [adminShipments, setAdminShipments] = useState<ShipmentDetail[]>([]);
  const [shipmentFilter, setShipmentFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const lookupInputRef = useRef<HTMLInputElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  const loadAdminState = async () => {
    const res = await fetch('/api/admin/state');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.shipments)) {
      setAdminShipments(data.shipments);
    }
  };

  useEffect(() => {
    loadAdminState();
  }, []);

  // Apply real-time WebSocket updates without polling
  useEffect(() => {
    if (!latestAdminUpdate) return;
    setAdminShipments((prev) => {
      const exists = prev.some((s) => s.id === latestAdminUpdate.id);
      if (exists) {
        return prev.map((s) => (s.id === latestAdminUpdate.id ? latestAdminUpdate : s));
      }
      return [latestAdminUpdate, ...prev];
    });
  }, [latestAdminUpdate]);

  const handleToggleGps = async (shipment: ShipmentDetail) => {
    setBusyId(shipment.id);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasLiveGps: !shipment.hasLiveGps }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminShipments((prev) =>
          prev.map((s) => (s.id === shipment.id ? data.shipment : s))
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleNudgeGps = async (shipmentId: string) => {
    setBusyId(shipmentId);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'nudge' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminShipments((prev) =>
          prev.map((s) => (s.id === shipmentId ? data.shipment : s))
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAdminAdvance = async (shipmentId: string) => {
    setBusyId(shipmentId);
    setIsAdvancing(true);
    try {
      await onAdvanceCheckpoint(shipmentId);
      await loadAdminState();
    } finally {
      setBusyId(null);
      setIsAdvancing(false);
    }
  };

  const handleLookupSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const clean = lookupInput.trim().replace(/^#/, '').toUpperCase();
    if (!clean) return;
    const match = adminShipments.find(
      (s) => s.trackingNumber.toUpperCase() === clean || s.id.toUpperCase() === clean
    );
    if (!match) {
      setLookupError(`No consignment found for tracking ID "${clean}".`);
      return;
    }
    onFocusShipmentId(match.id);
    inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const selectedShipment = useMemo(
    () =>
      focusedShipmentId
        ? adminShipments.find((s) => s.id === focusedShipmentId) || null
        : null,
    [adminShipments, focusedShipmentId]
  );

  const filteredShipments = useMemo(() => {
    if (shipmentFilter === 'active') return adminShipments.filter((s) => s.stage < 4);
    if (shipmentFilter === 'delivered') return adminShipments.filter((s) => s.stage === 4);
    return adminShipments;
  }, [adminShipments, shipmentFilter]);

  const inTransitCount = useMemo(
    () => adminShipments.filter((s) => s.stage < 4).length,
    [adminShipments]
  );
  const outForDeliveryCount = useMemo(
    () => adminShipments.filter((s) => s.stage === 3).length,
    [adminShipments]
  );
  const liveGpsCount = useMemo(
    () => adminShipments.filter((s) => s.stage === 3 && s.hasLiveGps).length,
    [adminShipments]
  );
  const deliveredCount = useMemo(
    () => adminShipments.filter((s) => s.stage === 4).length,
    [adminShipments]
  );
  const openInquiriesCount = useMemo(
    () => inquiries.filter((i) => i.status === 'new').length,
    [inquiries]
  );

  const summaryList: ShipmentSummary[] = adminShipments;

  return (
    <div className="min-h-screen bg-[#F3F5F8] text-slate-900">
      {/* Admin Portal Header */}
      <header className="sticky top-0 z-40 bg-[#0D1B2A] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white font-display font-extrabold text-xs flex items-center justify-center shrink-0">
              OPS
            </div>
            <span className="font-display font-bold text-base tracking-tight whitespace-nowrap truncate">
              EDEX Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleAutoDispatch(!autoDispatchEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                autoDispatchEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {autoDispatchEnabled ? 'Auto-Scan: ON' : 'Auto-Scan: OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`Open notifications (${unreadCount} unread)`}
              className="relative w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-[#0D1B2A]"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigatePortal('tracker')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
            >
              Track Page
            </button>

            <button
              type="button"
              onClick={() => onNavigatePortal('landing')}
              className="px-3 py-1.5 rounded-lg bg-white text-[#0D1B2A] hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Visitor Site</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Operations & Consignment Overview KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">Total Consignments</p>
            <p className="font-display font-extrabold text-2xl text-slate-900 tabular-nums mt-1">
              {adminShipments.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">In Transit</p>
            <p className="font-display font-extrabold text-2xl text-[#2563EB] tabular-nums mt-1">
              {inTransitCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">Out for Delivery</p>
            <p className="font-display font-extrabold text-2xl text-[#FF5A1F] tabular-nums mt-1">
              {outForDeliveryCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">Live Courier GPS</p>
            <p className="font-display font-extrabold text-2xl text-emerald-700 tabular-nums mt-1">
              {liveGpsCount} / {outForDeliveryCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">Delivered</p>
            <p className="font-display font-extrabold text-2xl text-emerald-700 tabular-nums mt-1">
              {deliveredCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <p className="text-xs text-slate-500">Open Inquiries</p>
            <p className="font-display font-extrabold text-2xl text-slate-900 tabular-nums mt-1">
              {openInquiriesCount}
            </p>
          </div>
        </div>

        {/* Quick Actions Grid (Send Parcel, Track Parcel, Get a Quote, Find Location) */}
        <QuickActionGrid
          onSendParcel={() => onChangeAdminTab('dispatch')}
          onTrackParcel={() => {
            onChangeAdminTab('fleet');
            window.setTimeout(() => {
              lookupInputRef.current?.focus();
              lookupInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 60);
          }}
          onOpenQuote={onOpenQuote}
          onOpenLocations={onOpenLocations}
        />

        {/* Admin Sub-Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => onChangeAdminTab('fleet')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                adminTab === 'fleet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fleet Map &amp; Shipments ({adminShipments.length})
            </button>
            <button
              type="button"
              onClick={() => onChangeAdminTab('dispatch')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                adminTab === 'dispatch'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Send / Create Parcel
            </button>
            <button
              type="button"
              onClick={() => onChangeAdminTab('inquiries')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                adminTab === 'inquiries'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact Inquiries ({inquiries.length})
            </button>
            <button
              type="button"
              onClick={() => onChangeAdminTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                adminTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              App &amp; Alert Settings
            </button>
          </div>

          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <Radio
              className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-600' : 'text-amber-600'}`}
            />
            {wsConnected ? 'Operator WebSocket Connected' : 'Reconnecting...'}
          </span>
        </div>

        {adminTab === 'fleet' && (
          <div className="space-y-6">
            {/* Operator Tracking Lookup Bar */}
            <form
              onSubmit={handleLookupSubmit}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-[#FF5A1F]">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={lookupInputRef}
                  type="text"
                  value={lookupInput}
                  onChange={(e) => {
                    setLookupInput(e.target.value);
                    setLookupError(null);
                  }}
                  placeholder="Lookup consignment by tracking ID (e.g. ZX91847261, EDX4920184, GLB7731905)"
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0D1B2A] hover:bg-[#17304A] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Inspect Shipment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {lookupError && (
              <p
                role="alert"
                className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
              >
                {lookupError}
              </p>
            )}

            {/* Global Fleet Map */}
            <FleetOverviewMap
              shipments={summaryList}
              selectedId={selectedShipment?.id || null}
              onSelectShipment={(id) => onFocusShipmentId(id)}
              mapsReady={mapsReady}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Unmasked Admin Shipments Table + All / In Transit / Delivered Filter */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-base text-slate-900">
                      All Consignments ({filteredShipments.length})
                    </h2>
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-[#2563EB]" />
                      Full Operator Telemetry &amp; Unmasked IDs
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'active', label: 'In Transit' },
                        { id: 'delivered', label: 'Delivered' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setShipmentFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          shipmentFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredShipments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No consignments match this status filter.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredShipments.map((s) => {
                      const isSelected = selectedShipment?.id === s.id;
                      const isBusy = busyId === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`p-4 transition-colors ${
                            isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => onFocusShipmentId(s.id)}
                              className="text-left min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                                  #{s.trackingNumber}
                                </span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs font-semibold text-[#2563EB]">
                                  {s.statusLabel}
                                </span>
                              </div>
                              <p className="font-display font-bold text-sm text-slate-900 mt-0.5">
                                {s.itemName} — {s.recipientName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {s.originCode} → {s.destinationCode} · {s.currentLocation}
                              </p>
                            </button>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleGps(s)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                  s.hasLiveGps
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {s.hasLiveGps ? 'Live GPS: ON' : 'GPS: Offline'}
                              </button>

                              {s.stage === 3 && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleNudgeGps(s.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0D1B2A] hover:bg-[#17304A] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Navigation className="w-3 h-3" />
                                  <span>Move Van</span>
                                </button>
                              )}

                              {s.stage < 4 && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAdminAdvance(s.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E84E15] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Advance</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Inspector Column: Live Consignment Telematics + Recent Real-Time Updates */}
              <div ref={inspectorRef} className="lg:col-span-5 space-y-5">
                <TelematicsPanel
                  selectedSummary={selectedShipment}
                  unlockedDetail={selectedShipment}
                  onUnlockWithCode={async () => {}}
                  onAdvanceCheckpoint={handleAdminAdvance}
                  unlockError={null}
                  isUnlocking={false}
                  isAdvancing={isAdvancing}
                  wsConnected={wsConnected}
                  mapsReady={mapsReady}
                />

                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/70">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Recent Real-Time Updates
                    </h3>
                    <button
                      type="button"
                      onClick={onOpenNotifications}
                      className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Open Feed ({notifications.length})
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {notifications.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => onSelectNotification(n)}
                        className="w-full text-left flex items-start gap-2.5 hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.read ? 'bg-slate-300' : 'bg-[#FF5A1F]'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {n.title} ·{' '}
                            <span className="font-mono text-[#2563EB]">{n.maskedNumber}</span>
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'dispatch' && (
          <div className="max-w-2xl">
            <SendParcelView
              key={`${sendPreset.originCode || 'JFK'}-${sendPreset.destinationCode || 'LHR'}-${sendPreset.tier || 'Express Air'}-${sendPreset.weightKg || 1.8}`}
              hubs={hubs}
              initialOriginCode={sendPreset.originCode}
              initialDestinationCode={sendPreset.destinationCode}
              initialTier={sendPreset.tier}
              initialWeightKg={sendPreset.weightKg}
              onCreateShipment={async (payload) => {
                const created = await onCreateShipment(payload);
                if (created) {
                  await loadAdminState();
                  onFocusShipmentId(created.id);
                }
                return created;
              }}
            />
          </div>
        )}

        {adminTab === 'inquiries' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF5A1F]" />
                <h2 className="font-display font-bold text-base text-slate-900">
                  Visitor Contact Us Submissions
                </h2>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">
                {openInquiriesCount} awaiting response
              </span>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No contact inquiries submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{inq.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{inq.email}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-[#2563EB]">{inq.topic}</span>
                        {inq.trackingRef && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-800">#{inq.trackingRef}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{inq.message}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleResolveInquiry(inq.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        inq.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#0D1B2A] text-white hover:bg-[#17304A]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{inq.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === 'settings' && (
          <div className="max-w-3xl">
            <AppSettingsView
              wsConnected={wsConnected}
              autoDispatchEnabled={autoDispatchEnabled}
              onToggleAutoDispatch={onToggleAutoDispatch}
              browserAlertsEnabled={browserAlertsEnabled}
              onRequestBrowserAlerts={onRequestBrowserAlerts}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              onSyncNow={onSyncNow}
              totalShipments={adminShipments.length}
              unreadCount={unreadCount}
            />
          </div>
        )}
      </main>
    </div>
  );
}
