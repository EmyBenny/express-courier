import { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  Polyline,
  useAdvancedMarkerRef,
  useApiIsLoaded,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { AlertTriangle, MapPin, Navigation, Radio } from 'lucide-react';
import { LatLngCoords, ShipmentDetail, ShipmentSummary } from '../types';

function formatGpsTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function CameraAutoFocus({
  focusCoords,
  secondaryCoords,
  zoomWhenSingle,
}: {
  focusCoords: LatLngCoords;
  secondaryCoords?: LatLngCoords;
  zoomWhenSingle: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (secondaryCoords) {
      const dist =
        Math.abs(focusCoords.lat - secondaryCoords.lat) +
        Math.abs(focusCoords.lng - secondaryCoords.lng);
      if (dist > 0.005 && dist < 4) {
        map.fitBounds(
          {
            north: Math.max(focusCoords.lat, secondaryCoords.lat),
            south: Math.min(focusCoords.lat, secondaryCoords.lat),
            east: Math.max(focusCoords.lng, secondaryCoords.lng),
            west: Math.min(focusCoords.lng, secondaryCoords.lng),
          },
          { top: 44, right: 44, bottom: 44, left: 44 }
        );
        return;
      }
    }
    map.panTo(focusCoords);
    map.setZoom(zoomWhenSingle);
  }, [map, focusCoords.lat, focusCoords.lng, secondaryCoords?.lat, secondaryCoords?.lng, zoomWhenSingle]);

  return null;
}

function InteractivePin({
  position,
  title,
  subtitle,
  meta,
  background,
  borderColor,
  glyphColor,
  glyphText,
}: {
  position: LatLngCoords;
  title: string;
  subtitle: string;
  meta?: string;
  background: string;
  borderColor: string;
  glyphColor: string;
  glyphText?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        title={title}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Pin
          background={background}
          borderColor={borderColor}
          glyphColor={glyphColor}
          glyphText={glyphText}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} maxWidth={240} onCloseClick={() => setOpen(false)}>
          <div className="p-1 text-slate-900">
            <p className="font-bold text-xs">{title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>
            {meta && <p className="text-[11px] font-mono text-slate-500 mt-1">{meta}</p>}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface ShipmentLocationMapProps {
  shipment: ShipmentDetail;
  mapsReady: boolean;
}

export function ShipmentLocationMap({ shipment, mapsReady }: ShipmentLocationMapProps) {
  const apiLoaded = useApiIsLoaded();
  const apiStatus = useApiLoadingStatus();

  const isOutForDelivery = shipment.stage === 3;
  const showLiveCourier = isOutForDelivery && shipment.hasLiveGps;
  const isDelivered = shipment.stage === 4;

  const mapZoom = isOutForDelivery ? 13 : isDelivered ? 12 : 5;
  const secondaryTarget = isOutForDelivery ? shipment.destinationCoords : undefined;

  const polylinePath: LatLngCoords[] = isOutForDelivery
    ? [shipment.currentCoords, shipment.destinationCoords]
    : [shipment.originCoords, shipment.currentCoords, shipment.destinationCoords];

  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50">
      {/* Live GPS vs. Last Known Location Status Strip */}
      <div
        className={`px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b ${
          showLiveCourier
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            : isOutForDelivery
            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
            : 'bg-slate-100/90 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {showLiveCourier ? (
            <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : isOutForDelivery ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
          )}
          <span className="font-semibold truncate">
            {showLiveCourier
              ? `Live Courier GPS Active${shipment.courierName ? ` · ${shipment.courierName}` : ''}`
              : isOutForDelivery
              ? 'Real-time GPS unavailable — showing last known location'
              : isDelivered
              ? 'Delivered Destination Pin'
              : 'Last Known Checkpoint Location'}
          </span>
        </div>

        <span className="font-mono tabular-nums text-[11px] opacity-80 shrink-0">
          {shipment.currentCoords.lat.toFixed(4)}, {shipment.currentCoords.lng.toFixed(4)} ·{' '}
          {formatGpsTime(shipment.gpsUpdatedAt)}
        </span>
      </div>

      {/* Explicit Sized Map Container (prevents 0x0 collapse) */}
      <div className="relative w-full h-[250px] sm:h-[280px] bg-slate-200">
        {!mapsReady ||
        apiStatus === APILoadingStatus.FAILED ||
        apiStatus === APILoadingStatus.AUTH_FAILURE ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-slate-100 text-slate-700">
            <Navigation className="w-6 h-6 text-[#FF5A1F] mb-2" />
            <p className="text-xs font-bold text-slate-900">
              {showLiveCourier ? 'Live Courier Position' : 'Last Known Location'}
            </p>
            <p className="text-xs text-slate-600 mt-1">{shipment.currentLocation}</p>
            <p className="font-mono tabular-nums text-[11px] text-slate-500 mt-1">
              {shipment.currentCoords.lat.toFixed(5)}, {shipment.currentCoords.lng.toFixed(5)}
            </p>
          </div>
        ) : !apiLoaded ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Loading live Google Map...
          </div>
        ) : (
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={shipment.currentCoords}
            defaultZoom={mapZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <CameraAutoFocus
              focusCoords={shipment.currentCoords}
              secondaryCoords={secondaryTarget}
              zoomWhenSingle={mapZoom}
            />

            <Polyline
              path={polylinePath}
              strokeColor={showLiveCourier ? '#FF5A1F' : '#2563EB'}
              strokeOpacity={0.85}
              strokeWeight={3.5}
              geodesic={!isOutForDelivery}
            />

            {!isOutForDelivery && (
              <InteractivePin
                position={shipment.originCoords}
                title={`Origin · ${shipment.originCode}`}
                subtitle={`${shipment.originCity}, ${shipment.originCountry}`}
                background="#0D1B2A"
                borderColor="#020617"
                glyphColor="#FFFFFF"
                glyphText="O"
              />
            )}

            <InteractivePin
              position={shipment.currentCoords}
              title={
                showLiveCourier
                  ? `Courier Van (${shipment.courierName || 'Active'})`
                  : isDelivered
                  ? 'Delivered Location'
                  : 'Last Known Location'
              }
              subtitle={shipment.currentLocation}
              meta={`GPS ${shipment.currentCoords.lat.toFixed(4)}, ${shipment.currentCoords.lng.toFixed(4)}`}
              background={showLiveCourier ? '#FF5A1F' : isDelivered ? '#16A34A' : '#D97706'}
              borderColor={showLiveCourier ? '#C2410C' : isDelivered ? '#14532D' : '#92400E'}
              glyphColor="#FFFFFF"
              glyphText={showLiveCourier ? 'V' : isDelivered ? '✓' : 'L'}
            />

            {!isDelivered && (
              <InteractivePin
                position={shipment.destinationCoords}
                title={`Destination · ${shipment.destinationCode}`}
                subtitle={`${shipment.destinationCity}, ${shipment.destinationCountry}`}
                meta={`ETA ${shipment.estimatedDelivery}`}
                background="#2563EB"
                borderColor="#1E40AF"
                glyphColor="#FFFFFF"
                glyphText="D"
              />
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

export function FleetOverviewMap({
  shipments,
  selectedId,
  onSelectShipment,
  mapsReady,
}: {
  shipments: ShipmentSummary[];
  selectedId: string | null;
  onSelectShipment: (id: string) => void;
  mapsReady: boolean;
}) {
  const apiLoaded = useApiIsLoaded();
  const apiStatus = useApiLoadingStatus();
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

  const activeShipment = shipments.find((s) => s.id === selectedId) || shipments[0];
  const center: LatLngCoords = activeShipment?.currentCoords || { lat: 48.8566, lng: 2.3522 };

  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900">
            Global Fleet &amp; Shipment Live Map
          </h3>
          <p className="text-xs text-slate-500">
            Orange pins = Out for Delivery (Live GPS) · Amber = Last Known Location · Green = Delivered
          </p>
        </div>
        <span className="font-mono tabular-nums text-xs text-slate-500">
          {shipments.length} tracked assets
        </span>
      </div>

      <div className="w-full h-[340px] bg-slate-100">
        {!mapsReady ||
        apiStatus === APILoadingStatus.FAILED ||
        apiStatus === APILoadingStatus.AUTH_FAILURE ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 p-6 text-center">
            Google Maps API key unavailable. Configure Maps Platform to inspect fleet pins.
          </div>
        ) : !apiLoaded ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            Loading live fleet map...
          </div>
        ) : (
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={center}
            defaultZoom={2}
            gestureHandling="greedy"
            streetViewControl={false}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {shipments.map((s) => {
              const isLiveOut = s.stage === 3 && s.hasLiveGps;
              const isDel = s.stage === 4;
              const bg = isLiveOut ? '#FF5A1F' : isDel ? '#16A34A' : s.stage === 3 ? '#D97706' : '#2563EB';
              const border = isLiveOut ? '#C2410C' : isDel ? '#14532D' : s.stage === 3 ? '#92400E' : '#1E40AF';

              return (
                <FleetMarker
                  key={s.id}
                  shipment={s}
                  background={bg}
                  borderColor={border}
                  isOpen={activeInfoId === s.id}
                  onToggle={() => {
                    setActiveInfoId(activeInfoId === s.id ? null : s.id);
                    onSelectShipment(s.id);
                  }}
                />
              );
            })}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}

function FleetMarker({
  shipment,
  background,
  borderColor,
  isOpen,
  onToggle,
}: {
  shipment: ShipmentSummary;
  background: string;
  borderColor: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={shipment.currentCoords}
        title={`${shipment.maskedNumber} · ${shipment.itemName}`}
        onClick={onToggle}
      >
        <Pin background={background} borderColor={borderColor} glyphColor="#FFFFFF" />
      </AdvancedMarker>
      {isOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={250} onCloseClick={onToggle}>
          <div className="p-1 text-slate-900">
            <p className="font-mono text-xs font-bold">{shipment.maskedNumber}</p>
            <p className="text-xs font-semibold mt-0.5">{shipment.itemName}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {shipment.statusLabel} · {shipment.originCode} → {shipment.destinationCode}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {shipment.stage === 3 && shipment.hasLiveGps
                ? `Live GPS: ${shipment.courierName || 'Active Courier'}`
                : 'Last Known Checkpoint Location'}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
