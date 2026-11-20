import { BellRing, Radio, RefreshCw, ShieldCheck, Smartphone, Volume2 } from 'lucide-react';

interface AppSettingsViewProps {
  wsConnected: boolean;
  autoDispatchEnabled: boolean;
  onToggleAutoDispatch: (enabled: boolean) => void;
  browserAlertsEnabled: boolean;
  onRequestBrowserAlerts: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onSyncNow: () => void;
  totalShipments: number;
  unreadCount: number;
}

export function AppSettingsView({
  wsConnected,
  autoDispatchEnabled,
  onToggleAutoDispatch,
  browserAlertsEnabled,
  onRequestBrowserAlerts,
  soundEnabled,
  onToggleSound,
  onSyncNow,
  totalShipments,
  unreadCount,
}: AppSettingsViewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/70">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3EB] text-[#FF5A1F] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              EDEX Mobile &amp; Alert Settings
            </h2>
            <p className="text-xs text-slate-500">
              Configure real-time WebSocket notifications and courier scan feeds
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Radio className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Live Auto-Scan Dispatch Feed</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically broadcast server-authoritative courier checkpoint scans every 12s
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoDispatchEnabled}
              onClick={() => onToggleAutoDispatch(!autoDispatchEnabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                autoDispatchEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {autoDispatchEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <BellRing className="w-4 h-4 text-[#FF5A1F] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Desktop &amp; Mobile Push Alerts</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receive OS notifications when consignment status changes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRequestBrowserAlerts}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                browserAlertsEnabled
                  ? 'bg-[#0D1B2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {browserAlertsEnabled ? 'Active' : 'Enable'}
            </button>
          </div>

          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Volume2 className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Scan Chime Alert</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Play a subtle acoustic tone on incoming shipment updates
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => onToggleSound(!soundEnabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                soundEnabled
                  ? 'bg-[#0D1B2A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {soundEnabled ? 'On' : 'Muted'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Sync Health Card */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(13,27,42,0.04)] border border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck
            className={`w-5 h-5 ${wsConnected ? 'text-emerald-600' : 'text-amber-600'}`}
          />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {wsConnected ? 'Real-Time Stream Connected' : 'Reconnecting Stream...'}
            </p>
            <p className="text-xs text-slate-500 tabular-nums">
              {totalShipments} tracked consignments · {unreadCount} unread alerts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSyncNow}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>
    </div>
  );
}
