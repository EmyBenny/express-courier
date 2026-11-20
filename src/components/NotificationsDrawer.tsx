import { Bell, CheckCheck, PackageCheck, Radio, ShieldAlert, Truck, X } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  autoDispatchEnabled: boolean;
  onToggleAutoDispatch: (enabled: boolean) => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notification: AppNotification) => void;
}

function formatNotifTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  switch (type) {
    case 'delivery':
      return <PackageCheck className="w-4 h-4 text-emerald-600" />;
    case 'customs':
      return <ShieldAlert className="w-4 h-4 text-[#2563EB]" />;
    case 'created':
      return <Bell className="w-4 h-4 text-[#4F46E5]" />;
    default:
      return <Truck className="w-4 h-4 text-[#FF5A1F]" />;
  }
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  autoDispatchEnabled,
  onToggleAutoDispatch,
  onMarkAllRead,
  onSelectNotification,
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Live Shipment Notifications"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0D1B2A] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Live Shipment Alerts
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {unreadCount} unread · Real-time WebSocket stream
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications drawer"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-Dispatch & Mark Read Controls */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleAutoDispatch(!autoDispatchEnabled)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              autoDispatchEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{autoDispatchEnabled ? 'Live Auto-Scan: ON' : 'Live Auto-Scan: OFF'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-800 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No notifications yet. Shipments and transit scan alerts will stream here in real time.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNotification(n)}
                className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                  n.read ? 'bg-white' : 'bg-blue-50/35'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <NotificationIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                      {formatNotifTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] font-semibold text-[#2563EB] mt-0.5">
                    {n.maskedNumber} · {n.itemName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
                {!n.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#FF5A1F] shrink-0 mt-2"
                    aria-label="Unread notification"
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
