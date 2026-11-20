import { Component, ErrorInfo, lazy, ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, X } from 'lucide-react';
import {
  AppNotification,
  ContactInquiry,
  HubLocation,
  PortalView,
  QuoteResult,
  ServiceTier,
  ShipmentDetail,
  ShipmentSummary,
  WsServerMessage,
} from './types';
import { LandingPage } from './components/LandingPage';
import type { AdminTabKey } from './components/AdminPortalView';

const MapsProviderGate = lazy(() =>
  import('./components/MapsProviderGate').then((m) => ({ default: m.MapsProviderGate }))
);
const AdminPortalView = lazy(() =>
  import('./components/AdminPortalView').then((m) => ({ default: m.AdminPortalView }))
);
const HeroTrackingBanner = lazy(() =>
  import('./components/HeroTrackingBanner').then((m) => ({ default: m.HeroTrackingBanner }))
);
const TelematicsPanel = lazy(() =>
  import('./components/TelematicsPanel').then((m) => ({ default: m.TelematicsPanel }))
);
const QuoteModal = lazy(() =>
  import('./components/QuoteModal').then((m) => ({ default: m.QuoteModal }))
);
const LocationsModal = lazy(() =>
  import('./components/LocationsModal').then((m) => ({ default: m.LocationsModal }))
);
const NotificationsDrawer = lazy(() =>
  import('./components/NotificationsDrawer').then((m) => ({ default: m.NotificationsDrawer }))
);

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EDEX UI ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-center space-y-3">
            <h1 className="font-display font-bold text-lg text-slate-900">
              Unable to render view
            </h1>
            <p className="text-xs text-slate-600">{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#0D1B2A] text-white text-xs font-semibold cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function playSoftChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  } catch {
    // Ignore audio context restrictions
  }
}

function getInitialPortalView(): PortalView {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/track')) return 'tracker';
  return 'landing';
}

export default function App() {
  const [portalView, setPortalView] = useState<PortalView>(getInitialPortalView);
  const [adminTab, setAdminTab] = useState<AdminTabKey>('fleet');
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, ShipmentDetail>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [hubs, setHubs] = useState<HubLocation[]>([]);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [latestAdminUpdate, setLatestAdminUpdate] = useState<ShipmentDetail | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminFocusedId, setAdminFocusedId] = useState<string | null>(null);

  const [trackingInput, setTrackingInput] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [locationsModalOpen, setLocationsModalOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AppNotification | null>(null);

  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [sendPreset, setSendPreset] = useState<{
    originCode?: string;
    destinationCode?: string;
    tier?: ServiceTier;
    weightKg?: number;
  }>({});

  const soundEnabledRef = { current: soundEnabled };
  const browserAlertsRef = { current: browserAlertsEnabled };

  // Listen for Google Maps Platform quota events
  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const fetchFullState = useCallback(async () => {
    const res = await fetch('/api/state');
    if (!res.ok) return;
    const data = await res.json();
    setShipments(data.shipments || []);
    setNotifications(data.notifications || []);
    setHubs(data.hubs || []);
    setAutoDispatchEnabled(Boolean(data.autoDispatchEnabled));
    if (data.googleMapsApiKey) {
      setMapsApiKey((prev) => prev || data.googleMapsApiKey);
    }
  }, []);

  // Sync browser history navigation between Landing, Tracking Page, and Admin Portal
  const navigatePortal = useCallback((view: PortalView) => {
    setPortalView(view);
    const nextPath = view === 'landing' ? '/' : view === 'tracker' ? '/track' : '/admin';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPortalView(getInitialPortalView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Real-time WebSocket connection with bounded exponential backoff
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isDisposed = false;
    let consecutiveFailures = 0;

    fetchFullState();

    function connect() {
      if (isDisposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        consecutiveFailures = 0;
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsServerMessage;
          if (msg.type === 'init') {
            setShipments(msg.shipments);
            setNotifications(msg.notifications);
            setHubs(msg.hubs);
            setInquiries(msg.inquiries || []);
            setAutoDispatchEnabled(msg.autoDispatchEnabled);
          } else if (msg.type === 'shipment:created') {
            if (msg.adminDetail) setLatestAdminUpdate(msg.adminDetail);
            setShipments((prev) => {
              if (prev.some((s) => s.id === msg.shipment.id)) return prev;
              return [msg.shipment, ...prev];
            });
          } else if (msg.type === 'shipment:updated') {
            if (msg.adminDetail) setLatestAdminUpdate(msg.adminDetail);
            setShipments((prev) =>
              prev.map((s) => (s.id === msg.shipment.id ? msg.shipment : s))
            );
            setUnlockedMap((prev) => {
              const existing = prev[msg.shipment.id];
              if (!existing) return prev;
              const newEvt = msg.latestEvent;
              const hasEvent = newEvt ? existing.events.some((e) => e.id === newEvt.id) : true;
              return {
                ...prev,
                [msg.shipment.id]: {
                  ...existing,
                  ...msg.shipment,
                  currentLocation: newEvt ? newEvt.location : existing.currentLocation,
                  events:
                    newEvt && !hasEvent ? [...existing.events, newEvt] : existing.events,
                },
              };
            });
          } else if (msg.type === 'notification:new') {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === msg.notification.id)) return prev;
              return [msg.notification, ...prev];
            });
            setLiveToast(msg.notification);
            if (soundEnabledRef.current) {
              playSoftChime();
            }
            if (
              browserAlertsRef.current &&
              typeof Notification !== 'undefined' &&
              Notification.permission === 'granted'
            ) {
              new Notification(`EDEX: ${msg.notification.title}`, {
                body: msg.notification.message,
              });
            }
          } else if (msg.type === 'notifications:synced') {
            setNotifications(msg.notifications);
          } else if (msg.type === 'dispatch:status') {
            setAutoDispatchEnabled(msg.autoDispatchEnabled);
          } else if (msg.type === 'inquiry:new') {
            setInquiries((prev) => {
              if (prev.some((i) => i.id === msg.inquiry.id)) return prev;
              return [msg.inquiry, ...prev];
            });
          } else if (msg.type === 'inquiry:updated') {
            setInquiries((prev) =>
              prev.map((i) => (i.id === msg.inquiry.id ? msg.inquiry : i))
            );
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!isDisposed && consecutiveFailures < 5) {
          consecutiveFailures += 1;
          const delayMs = Math.min(3000 * 2 ** (consecutiveFailures - 1), 30000);
          reconnectTimer = window.setTimeout(connect, delayMs);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [fetchFullState]);

  useEffect(() => {
    if (!liveToast) return;
    const t = window.setTimeout(() => setLiveToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [liveToast]);

  const trackByCode = async (rawCode: string) => {
    const clean = rawCode.trim().replace(/^#/, '').toUpperCase();
    if (!clean) return;

    setTrackingError(null);
    setIsTrackingLoading(true);

    try {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setTrackingError(data.error || 'Tracking number not found.');
        return;
      }

      const detail = data.shipment as ShipmentDetail;
      setUnlockedMap((prev) => ({ ...prev, [detail.id]: detail }));
      setSelectedId(detail.id);
      setTrackingError(null);
      navigatePortal('tracker');
    } catch {
      setTrackingError('Network error while verifying tracking number.');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleAdvanceCheckpoint = async (shipmentId: string) => {
    const res = await fetch(`/api/shipments/${shipmentId}/advance`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.shipment) {
        setUnlockedMap((prev) => ({ ...prev, [shipmentId]: data.shipment }));
      }
    }
  };

  const handleCreateShipment = async (payload: {
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
  }) => {
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create shipment.');
    }
    const created = data.shipment as ShipmentDetail;
    setUnlockedMap((prev) => ({ ...prev, [created.id]: created }));
    setAdminFocusedId(created.id);
    return created;
  };

  const handleToggleAutoDispatch = async (enabled: boolean) => {
    setAutoDispatchEnabled(enabled);
    await fetch('/api/dispatch/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
  };

  const handleSelectNotification = async (n: AppNotification) => {
    if (!n.read) {
      fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
    }
    setNotificationsOpen(false);
    setAdminFocusedId(n.shipmentId);
    setAdminTab('fleet');
    navigatePortal('admin');
  };

  const handleRequestBrowserAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setBrowserAlertsEnabled(perm === 'granted');
  };

  const handleBookWithQuote = (quote: QuoteResult) => {
    setSendPreset({
      originCode: quote.originCode,
      destinationCode: quote.destinationCode,
      tier: quote.serviceTier,
      weightKg: quote.chargeableWeightKg,
    });
    setQuoteModalOpen(false);
    setAdminTab('dispatch');
  };

  const handleSelectHubAsOrigin = (hubCode: string) => {
    setSendPreset((prev) => ({ ...prev, originCode: hubCode }));
    setLocationsModalOpen(false);
    setAdminTab('dispatch');
  };

  const handleSubmitContact = async (payload: {
    name: string;
    email: string;
    topic: string;
    trackingRef?: string;
    message: string;
  }) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send inquiry.');
    }
  };

  const handleToggleResolveInquiry = async (id: string) => {
    await fetch(`/api/inquiries/${id}/resolve`, { method: 'POST' });
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const selectedSummary = useMemo(
    () => shipments.find((s) => s.id === selectedId) || null,
    [shipments, selectedId]
  );

  const unlockedTrackerDetail = selectedSummary ? unlockedMap[selectedSummary.id] || null : null;

  const mapsReady = Boolean(mapsApiKey);

  const content = (
    <>
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Live WebSocket Incoming Notification Toast (Admin Portal) */}
      {portalView === 'admin' && liveToast && (
        <div
          role="status"
          className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-[#0D1B2A] text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FF5A1F] text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold truncate">{liveToast.title}</p>
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{liveToast.message}</p>
            <button
              type="button"
              onClick={() => {
                handleSelectNotification(liveToast);
                setLiveToast(null);
              }}
              className="mt-1.5 text-[11px] font-semibold text-[#FF5A1F] hover:underline cursor-pointer"
            >
              Inspect consignment →
            </button>
          </div>
        </div>
      )}

      {portalView === 'landing' && (
        <LandingPage
          hubs={hubs}
          onNavigatePortal={navigatePortal}
          onTrackFromLanding={(code) => {
            setTrackingInput(code);
            trackByCode(code);
          }}
          onSubmitContact={handleSubmitContact}
        />
      )}

      {portalView === 'admin' && (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center text-sm text-slate-600">
              Loading EDEX Admin Portal...
            </div>
          }
        >
          <AdminPortalView
            hubs={hubs}
            mapsReady={mapsReady}
            wsConnected={wsConnected}
            autoDispatchEnabled={autoDispatchEnabled}
            onToggleAutoDispatch={handleToggleAutoDispatch}
            onNavigatePortal={navigatePortal}
            onAdvanceCheckpoint={handleAdvanceCheckpoint}
            onCreateShipment={handleCreateShipment}
            inquiries={inquiries}
            onToggleResolveInquiry={handleToggleResolveInquiry}
            latestAdminUpdate={latestAdminUpdate}
            notifications={notifications}
            unreadCount={unreadCount}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onSelectNotification={handleSelectNotification}
            onOpenQuote={() => setQuoteModalOpen(true)}
            onOpenLocations={() => setLocationsModalOpen(true)}
            browserAlertsEnabled={browserAlertsEnabled}
            onRequestBrowserAlerts={handleRequestBrowserAlerts}
            soundEnabled={soundEnabled}
            onToggleSound={setSoundEnabled}
            onSyncNow={fetchFullState}
            adminTab={adminTab}
            onChangeAdminTab={setAdminTab}
            sendPreset={sendPreset}
            focusedShipmentId={adminFocusedId}
            onFocusShipmentId={setAdminFocusedId}
          />
        </Suspense>
      )}

      {portalView === 'tracker' && (
        <div className="min-h-screen bg-[#F3F5F8] text-slate-900 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-2xl space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  navigatePortal('landing');
                }}
                className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-[#0D1B2A] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Visitor Site</span>
              </button>
              {unlockedTrackerDetail && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setTrackingInput('');
                  }}
                  className="font-semibold text-[#FF5A1F] hover:underline cursor-pointer"
                >
                  Clear Tracking Result
                </button>
              )}
            </div>

            <HeroTrackingBanner
              trackingInput={trackingInput}
              onTrackingInputChange={setTrackingInput}
              onTrackSubmit={trackByCode}
              trackingError={trackingError}
              isTrackingLoading={isTrackingLoading}
            />

            {selectedSummary && unlockedTrackerDetail && (
              <TelematicsPanel
                selectedSummary={selectedSummary}
                unlockedDetail={unlockedTrackerDetail}
                onUnlockWithCode={trackByCode}
                onCloseMobile={() => setSelectedId(null)}
                unlockError={null}
                isUnlocking={false}
                isAdvancing={false}
                wsConnected={wsConnected}
                mapsReady={mapsReady}
              />
            )}
          </div>
        </div>
      )}

      {/* Admin Portal Modals & Drawers */}
      {portalView === 'admin' && (
        <Suspense fallback={null}>
          <NotificationsDrawer
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            autoDispatchEnabled={autoDispatchEnabled}
            onToggleAutoDispatch={handleToggleAutoDispatch}
            onMarkAllRead={handleMarkAllRead}
            onSelectNotification={handleSelectNotification}
          />

          <QuoteModal
            isOpen={quoteModalOpen}
            onClose={() => setQuoteModalOpen(false)}
            hubs={hubs}
            onBookWithQuote={handleBookWithQuote}
          />

          <LocationsModal
            isOpen={locationsModalOpen}
            onClose={() => setLocationsModalOpen(false)}
            hubs={hubs}
            onSelectHubAsOrigin={handleSelectHubAsOrigin}
          />
        </Suspense>
      )}
    </>
  );

  const trackerFallback = (
    <div className="min-h-screen bg-[#F3F5F8] flex items-center justify-center text-sm text-slate-600">
      Loading EDEX Express...
    </div>
  );

  return (
    <AppErrorBoundary>
      {portalView === 'landing' ? (
        content
      ) : (
        <Suspense fallback={trackerFallback}>
          <MapsProviderGate apiKey={mapsApiKey}>{content}</MapsProviderGate>
        </Suspense>
      )}
    </AppErrorBoundary>
  );
}
