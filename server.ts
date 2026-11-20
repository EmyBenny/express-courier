import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  STAGE_LABELS,
  type AppNotification,
  type ContactInquiry,
  type HubLocation,
  type LatLngCoords,
  type QuoteRequest,
  type QuoteResult,
  type ServiceTier,
  type ShipmentDetail,
  type ShipmentEvent,
  type ShipmentSummary,
  type StageIndex,
  type WsServerMessage,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function maskTrackingNumber(code: string): string {
  const clean = code.replace(/^#/, '').toUpperCase();
  if (clean.length <= 6) {
    return `#${clean.slice(0, 2)}••••`;
  }
  return `#${clean.slice(0, 4)}••••${clean.slice(-2)}`;
}

function toSummary(s: ShipmentDetail): ShipmentSummary {
  return {
    id: s.id,
    maskedNumber: s.maskedNumber,
    itemName: s.itemName,
    category: s.category,
    thumbnailUrl: s.thumbnailUrl,
    originCity: s.originCity,
    originCountry: s.originCountry,
    originCode: s.originCode,
    originCoords: s.originCoords,
    destinationCity: s.destinationCity,
    destinationCountry: s.destinationCountry,
    destinationCode: s.destinationCode,
    destinationCoords: s.destinationCoords,
    currentCoords: s.currentCoords,
    hasLiveGps: s.hasLiveGps,
    courierName: s.courierName,
    gpsUpdatedAt: s.gpsUpdatedAt,
    stage: s.stage,
    statusLabel: s.statusLabel,
    serviceTier: s.serviceTier,
    weightKg: s.weightKg,
    estimatedDelivery: s.estimatedDelivery,
    isProtected: s.isProtected,
    updatedAt: s.updatedAt,
  };
}

const HUBS: HubLocation[] = [
  {
    id: 'hub-jfk',
    code: 'JFK',
    name: 'New York JFK Air Cargo Gateway',
    city: 'New York',
    country: 'United States',
    address: 'Bldg 75, North Hangar Rd, Jamaica, NY 11430',
    hours: '24/7 Cargo Operations · Drop-off 06:00–22:00',
    phone: '+1 (718) 555-0194',
    services: ['Express Air', 'Customs Brokerage', 'Cold Chain', 'Same-Day Drop-Off'],
    coords: { lat: 40.6413, lng: -73.7781 },
  },
  {
    id: 'hub-lhr',
    code: 'LHR',
    name: 'London Heathrow Distribution Hub',
    city: 'London',
    country: 'United Kingdom',
    address: 'World Cargo Centre, Unit 14, Hounslow TW6 3UA',
    hours: 'Mon–Sun 05:30–23:30 GMT',
    phone: '+44 20 7946 0821',
    services: ['Express Air', 'UK Customs Clearance', 'Courier Dispatch'],
    coords: { lat: 51.47, lng: -0.4543 },
  },
  {
    id: 'hub-sfo',
    code: 'SFO',
    name: 'San Francisco Bay Express Center',
    city: 'San Francisco',
    country: 'United States',
    address: '632 San Bruno Ave, South San Francisco, CA 94080',
    hours: 'Mon–Sat 07:00–21:00 PST',
    phone: '+1 (415) 555-0148',
    services: ['Express Air', 'High-Value Tech Handling', 'Priority Cargo'],
    coords: { lat: 37.6213, lng: -122.379 },
  },
  {
    id: 'hub-ber',
    code: 'BER',
    name: 'Berlin Brandenburg Cargo Terminal',
    city: 'Berlin',
    country: 'Germany',
    address: 'Georg-Wulf-Straße 12, 12529 Schönefeld, Germany',
    hours: 'Mon–Sat 06:00–22:00 CET',
    phone: '+49 30 5557 0910',
    services: ['EU Customs Hub', 'Express Air', 'Last-Mile Electric Fleet'],
    coords: { lat: 52.3667, lng: 13.5033 },
  },
  {
    id: 'hub-nrt',
    code: 'NRT',
    name: 'Tokyo Narita Pacific Hub',
    city: 'Tokyo',
    country: 'Japan',
    address: 'Cargo Area B, Narita International Airport, Chiba 282-0004',
    hours: '24/7 International Freight',
    phone: '+81 476-55-0182',
    services: ['Precision Optics Handling', 'Priority Cargo', 'Export Clearance'],
    coords: { lat: 35.772, lng: 140.3929 },
  },
  {
    id: 'hub-los',
    code: 'LOS',
    name: 'Lagos Ikeja Express Terminal',
    city: 'Lagos',
    country: 'Nigeria',
    address: '18 Aviation Cargo Way, Ikeja, Lagos',
    hours: 'Mon–Sat 07:30–20:00 WAT',
    phone: '+234 1 555 0167',
    services: ['Express Air', 'Cold-Chain Medical', 'Door-to-Door Courier'],
    coords: { lat: 6.5774, lng: 3.3212 },
  },
];

const EXTRA_COORDS: Record<string, LatLngCoords> = {
  YYZ: { lat: 43.6777, lng: -79.6248 },
  MAN: { lat: 53.3588, lng: -2.2727 },
  EMA: { lat: 52.8311, lng: -1.3281 },
};

function getHubCoords(code: string): LatLngCoords {
  const hub = HUBS.find((h) => h.code === code.toUpperCase());
  if (hub) return hub.coords;
  return EXTRA_COORDS[code.toUpperCase()] || { lat: 51.5074, lng: -0.1278 };
}

function interpolateCoords(a: LatLngCoords, b: LatLngCoords, ratio: number): LatLngCoords {
  return {
    lat: Number((a.lat + (b.lat - a.lat) * ratio).toFixed(5)),
    lng: Number((a.lng + (b.lng - a.lng) * ratio).toFixed(5)),
  };
}

const INITIAL_SHIPMENTS: ShipmentDetail[] = [
  {
    id: 'shp-zx91847261',
    trackingNumber: 'ZX91847261',
    maskedNumber: '#ZX91••••61',
    itemName: 'Nike Air Max',
    category: 'Footwear & Apparel',
    thumbnailUrl: '/src/assets/images/sneaker_nike_red_1795179634489.jpg',
    originCity: 'New York',
    originCountry: 'United States',
    originCode: 'JFK',
    originCoords: { lat: 40.6413, lng: -73.7781 },
    destinationCity: 'London',
    destinationCountry: 'United Kingdom',
    destinationCode: 'LHR',
    destinationCoords: { lat: 51.5074, lng: -0.1278 },
    currentCoords: { lat: 52.8311, lng: -1.3281 },
    hasLiveGps: false,
    gpsUpdatedAt: '2026-11-20T12:14:00Z',
    recipientName: 'Daniel Sterling',
    stage: 2,
    statusLabel: 'In Transit',
    serviceTier: 'Express Air',
    weightKg: 1.4,
    declaredValueUsd: 240,
    estimatedDelivery: 'Nov 20, 17:30 GMT',
    currentLocation: 'East Midlands Air Hub, United Kingdom',
    isProtected: true,
    updatedAt: '2026-11-20T12:14:00Z',
    events: [
      {
        id: 'evt-zx-1',
        stage: 0,
        status: 'Order Created',
        location: 'New York, United States',
        hubCode: 'JFK',
        detail: 'Electronic consignment manifest transmitted and customs pre-cleared.',
        timestamp: '2026-11-18T14:20:00Z',
        coords: { lat: 40.6413, lng: -73.7781 },
      },
      {
        id: 'evt-zx-2',
        stage: 1,
        status: 'Picked Up',
        location: 'New York JFK Gateway, US',
        hubCode: 'JFK',
        detail: 'Parcel scanned and loaded onto transatlantic freighter ED-402.',
        timestamp: '2026-11-19T02:45:00Z',
        coords: { lat: 40.6413, lng: -73.7781 },
      },
      {
        id: 'evt-zx-3',
        stage: 2,
        status: 'In Transit',
        location: 'East Midlands Air Hub, UK',
        hubCode: 'EMA',
        detail: 'Arrived at UK regional sort facility. Cleared HMRC automated customs.',
        timestamp: '2026-11-20T12:14:00Z',
        coords: { lat: 52.8311, lng: -1.3281 },
      },
    ],
  },
  {
    id: 'shp-edx4920184',
    trackingNumber: 'EDX4920184',
    maskedNumber: '#EDX4••••84',
    itemName: 'MacBook Pro 16" M4',
    category: 'Electronics',
    thumbnailUrl: '/src/assets/images/laptop_macbook_pro_1795179634930.jpg',
    originCity: 'San Francisco',
    originCountry: 'United States',
    originCode: 'SFO',
    originCoords: { lat: 37.6213, lng: -122.379 },
    destinationCity: 'Berlin',
    destinationCountry: 'Germany',
    destinationCode: 'BER',
    destinationCoords: { lat: 52.52, lng: 13.405 },
    currentCoords: { lat: 52.4955, lng: 13.3895 },
    hasLiveGps: true,
    courierName: 'Lukas M. · Electric Van #14',
    gpsUpdatedAt: '2026-11-20T11:40:00Z',
    recipientName: 'Elena Rostova',
    stage: 3,
    statusLabel: 'Out for Delivery',
    serviceTier: 'Express Air',
    weightKg: 2.8,
    declaredValueUsd: 3299,
    estimatedDelivery: 'Today, 14:15 CET',
    currentLocation: 'Berlin Kreuzberg / Mitte Route #14',
    isProtected: true,
    updatedAt: '2026-11-20T11:40:00Z',
    events: [
      {
        id: 'evt-edx4-1',
        stage: 0,
        status: 'Order Created',
        location: 'San Francisco, United States',
        hubCode: 'SFO',
        detail: 'High-value lithium battery manifest verified.',
        timestamp: '2026-11-17T18:05:00Z',
        coords: { lat: 37.6213, lng: -122.379 },
      },
      {
        id: 'evt-edx4-2',
        stage: 1,
        status: 'Picked Up',
        location: 'San Francisco Bay Hub, US',
        hubCode: 'SFO',
        detail: 'Sealed in tamper-evident container and departed SFO.',
        timestamp: '2026-11-18T06:30:00Z',
        coords: { lat: 37.6213, lng: -122.379 },
      },
      {
        id: 'evt-edx4-3',
        stage: 2,
        status: 'In Transit',
        location: 'Berlin Brandenburg Cargo, DE',
        hubCode: 'BER',
        detail: 'Cleared EU import customs and sorted for metro courier.',
        timestamp: '2026-11-20T06:15:00Z',
        coords: { lat: 52.3667, lng: 13.5033 },
      },
      {
        id: 'evt-edx4-4',
        stage: 3,
        status: 'Out for Delivery',
        location: 'Berlin Mitte, Germany',
        hubCode: 'BER',
        detail: 'With courier Lukas M. (Electric Van #14). Live GPS active.',
        timestamp: '2026-11-20T11:40:00Z',
        coords: { lat: 52.4955, lng: 13.3895 },
      },
    ],
  },
  {
    id: 'shp-glb7731905',
    trackingNumber: 'GLB7731905',
    maskedNumber: '#GLB7••••05',
    itemName: 'Fujifilm X-T4 Cinema Kit',
    category: 'Optical Hardware',
    thumbnailUrl: '/src/assets/images/camera_sony_alpha_1795179634542.jpg',
    originCity: 'Tokyo',
    originCountry: 'Japan',
    originCode: 'NRT',
    originCoords: { lat: 35.772, lng: 140.3929 },
    destinationCity: 'Toronto',
    destinationCountry: 'Canada',
    destinationCode: 'YYZ',
    destinationCoords: { lat: 43.6532, lng: -79.3832 },
    currentCoords: { lat: 43.6777, lng: -79.6248 },
    hasLiveGps: false,
    courierName: 'Aria K. · Van #08 (Last Known Hub)',
    gpsUpdatedAt: '2026-11-20T09:05:00Z',
    recipientName: 'Marcus Vance',
    stage: 3,
    statusLabel: 'Out for Delivery',
    serviceTier: 'Priority Cargo',
    weightKg: 3.1,
    declaredValueUsd: 2150,
    estimatedDelivery: 'Today, 16:45 EST',
    currentLocation: 'Toronto Pearson Dispatch Depot (GPS Offline)',
    isProtected: true,
    updatedAt: '2026-11-20T09:05:00Z',
    events: [
      {
        id: 'evt-glb-1',
        stage: 0,
        status: 'Order Created',
        location: 'Tokyo, Japan',
        hubCode: 'NRT',
        detail: 'Shock-sensor calibrated and export airway bill issued.',
        timestamp: '2026-11-18T22:10:00Z',
        coords: { lat: 35.772, lng: 140.3929 },
      },
      {
        id: 'evt-glb-2',
        stage: 1,
        status: 'Picked Up',
        location: 'Narita Cargo Terminal B, JP',
        hubCode: 'NRT',
        detail: 'Export security screening passed; departed on freighter ED-819.',
        timestamp: '2026-11-19T05:30:00Z',
        coords: { lat: 35.772, lng: 140.3929 },
      },
      {
        id: 'evt-glb-3',
        stage: 2,
        status: 'In Transit',
        location: 'Toronto Pearson Cargo, CA',
        hubCode: 'YYZ',
        detail: 'Cleared CBSA import customs and transferred to metro van.',
        timestamp: '2026-11-20T06:40:00Z',
        coords: { lat: 43.6777, lng: -79.6248 },
      },
      {
        id: 'evt-glb-4',
        stage: 3,
        status: 'Out for Delivery',
        location: 'Toronto Pearson Dispatch Depot, CA',
        hubCode: 'YYZ',
        detail: 'Assigned to courier van #08. Real-time GPS signal temporarily unavailable; showing last known hub scan.',
        timestamp: '2026-11-20T09:05:00Z',
        coords: { lat: 43.6777, lng: -79.6248 },
      },
    ],
  },
  {
    id: 'shp-edx1058392',
    trackingNumber: 'EDX1058392',
    maskedNumber: '#EDX1••••92',
    itemName: 'Diagnostic Lab Kit',
    category: 'Medical Supply',
    thumbnailUrl: '/src/assets/images/parcel_express_box_1795179634899.jpg',
    originCity: 'Manchester',
    originCountry: 'United Kingdom',
    originCode: 'MAN',
    originCoords: { lat: 53.3588, lng: -2.2727 },
    destinationCity: 'Lagos',
    destinationCountry: 'Nigeria',
    destinationCode: 'LOS',
    destinationCoords: { lat: 6.4281, lng: 3.4219 },
    currentCoords: { lat: 6.4281, lng: 3.4219 },
    hasLiveGps: false,
    gpsUpdatedAt: '2026-11-20T08:42:00Z',
    recipientName: 'Dr. Tunde Bakare',
    stage: 4,
    statusLabel: 'Delivered',
    serviceTier: 'Express Air',
    weightKg: 4.5,
    declaredValueUsd: 980,
    estimatedDelivery: 'Delivered Nov 20, 09:42 WAT',
    currentLocation: 'Victoria Island, Lagos — Signed by T. Bakare',
    isProtected: false,
    updatedAt: '2026-11-20T08:42:00Z',
    events: [
      {
        id: 'evt-edx1-1',
        stage: 0,
        status: 'Order Created',
        location: 'Manchester, UK',
        hubCode: 'MAN',
        detail: 'Priority temperature-controlled packaging confirmed.',
        timestamp: '2026-11-17T11:00:00Z',
        coords: { lat: 53.3588, lng: -2.2727 },
      },
      {
        id: 'evt-edx1-2',
        stage: 1,
        status: 'Picked Up',
        location: 'London Heathrow Cargo, UK',
        hubCode: 'LHR',
        detail: 'Boarded overnight express cargo flight to Lagos.',
        timestamp: '2026-11-18T21:15:00Z',
        coords: { lat: 51.47, lng: -0.4543 },
      },
      {
        id: 'evt-edx1-3',
        stage: 2,
        status: 'In Transit',
        location: 'Lagos Ikeja Hub, NG',
        hubCode: 'LOS',
        detail: 'Priority medical customs clearance completed.',
        timestamp: '2026-11-19T14:50:00Z',
        coords: { lat: 6.5774, lng: 3.3212 },
      },
      {
        id: 'evt-edx1-4',
        stage: 3,
        status: 'Out for Delivery',
        location: 'Ikoyi / Victoria Island, Lagos',
        hubCode: 'LOS',
        detail: 'Dispatched with courier Chinedu O. for morning delivery.',
        timestamp: '2026-11-20T07:20:00Z',
        coords: { lat: 6.4474, lng: 3.4126 },
      },
      {
        id: 'evt-edx1-5',
        stage: 4,
        status: 'Delivered',
        location: 'Victoria Island, Lagos',
        hubCode: 'LOS',
        detail: 'Delivered & signed at front reception by T. Bakare.',
        timestamp: '2026-11-20T08:42:00Z',
        coords: { lat: 6.4281, lng: 3.4219 },
      },
    ],
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf-1',
    shipmentId: 'shp-zx91847261',
    maskedNumber: '#ZX91••••61',
    itemName: 'Nike Air Max',
    title: 'UK Customs Cleared',
    message: 'Consignment #ZX91••••61 cleared automated customs at East Midlands Air Hub and is routing to London.',
    type: 'customs',
    timestamp: '2026-11-20T12:14:00Z',
    read: false,
  },
  {
    id: 'ntf-2',
    shipmentId: 'shp-edx4920184',
    maskedNumber: '#EDX4••••84',
    itemName: 'MacBook Pro 16" M4',
    title: 'Out for Delivery in Berlin',
    message: 'Courier Van #14 departed Berlin Brandenburg Hub with live GPS active. ETA 14:15 CET.',
    type: 'transit',
    timestamp: '2026-11-20T11:40:00Z',
    read: false,
  },
  {
    id: 'ntf-3',
    shipmentId: 'shp-edx1058392',
    maskedNumber: '#EDX1••••92',
    itemName: 'Diagnostic Lab Kit',
    title: 'Delivered & Signed',
    message: 'Recipient T. Bakare signed for Diagnostic Lab Kit at Victoria Island, Lagos.',
    type: 'delivery',
    timestamp: '2026-11-20T08:42:00Z',
    read: true,
  },
];

const INITIAL_INQUIRIES: ContactInquiry[] = [
  {
    id: 'inq-101',
    name: 'Clara Hoffman',
    email: 'c.hoffman@nordicbio.de',
    topic: 'Cold-Chain Enterprise Account',
    trackingRef: 'EDX4920184',
    message: 'Interested in weekly temperature-controlled air freight between SFO and Berlin Brandenburg.',
    createdAt: '2026-11-20T09:15:00Z',
    status: 'new',
  },
];

const shipments: ShipmentDetail[] = structuredClone(INITIAL_SHIPMENTS);
const notifications: AppNotification[] = structuredClone(INITIAL_NOTIFICATIONS);
const inquiries: ContactInquiry[] = structuredClone(INITIAL_INQUIRIES);
let autoDispatchEnabled = false;
let autoDispatchTimer: NodeJS.Timeout | null = null;

function buildNextCheckpoint(s: ShipmentDetail): {
  nextStage: StageIndex;
  event: ShipmentEvent;
  coords: LatLngCoords;
  hasLiveGps: boolean;
  courierName?: string;
  notifTitle: string;
  notifType: AppNotification['type'];
} | null {
  if (s.stage >= 4) return null;
  const nextStage = (s.stage + 1) as StageIndex;
  const nowIso = new Date().toISOString();

  if (nextStage === 1) {
    return {
      nextStage,
      coords: s.originCoords,
      hasLiveGps: false,
      notifTitle: `Picked Up at ${s.originCity}`,
      notifType: 'transit',
      event: {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 1,
        status: STAGE_LABELS[1],
        location: `${s.originCity} ${s.originCode} Gateway`,
        hubCode: s.originCode,
        detail: `Parcel collected and scanned at ${s.originCode} departure terminal.`,
        timestamp: nowIso,
        coords: s.originCoords,
      },
    };
  }

  if (nextStage === 2) {
    const midCoords = interpolateCoords(s.originCoords, s.destinationCoords, 0.72);
    return {
      nextStage,
      coords: midCoords,
      hasLiveGps: false,
      notifTitle: `Customs Cleared (${s.destinationCode})`,
      notifType: 'customs',
      event: {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 2,
        status: STAGE_LABELS[2],
        location: `${s.destinationCode} Regional Sort Hub`,
        hubCode: s.destinationCode,
        detail: `Arrived at ${s.destinationCountry} transit gateway and cleared customs inspection.`,
        timestamp: nowIso,
        coords: midCoords,
      },
    };
  }

  if (nextStage === 3) {
    // Out for delivery: active courier van GPS near destination
    const courierCoords: LatLngCoords = {
      lat: Number((s.destinationCoords.lat - 0.018).toFixed(5)),
      lng: Number((s.destinationCoords.lng - 0.024).toFixed(5)),
    };
    const courierLabel = s.courierName || 'Courier Van #21 · Live GPS';
    return {
      nextStage,
      coords: courierCoords,
      hasLiveGps: true,
      courierName: courierLabel,
      notifTitle: `Out for Delivery in ${s.destinationCity}`,
      notifType: 'transit',
      event: {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stage: 3,
        status: STAGE_LABELS[3],
        location: `${s.destinationCity} Local Courier Route`,
        hubCode: s.destinationCode,
        detail: `Loaded onto final-mile courier van (${courierLabel}) with live GPS active.`,
        timestamp: nowIso,
        coords: courierCoords,
      },
    };
  }

  return {
    nextStage: 4,
    coords: s.destinationCoords,
    hasLiveGps: false,
    notifTitle: `Delivered to ${s.recipientName}`,
    notifType: 'delivery',
    event: {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      stage: 4,
      status: STAGE_LABELS[4],
      location: `${s.destinationCity}, ${s.destinationCountry}`,
      hubCode: s.destinationCode,
      detail: `Delivered and signed electronically by ${s.recipientName}.`,
      timestamp: nowIso,
      coords: s.destinationCoords,
    },
  };
}

function selectThumbnailForCategory(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('foot') || lower.includes('apparel') || lower.includes('shoe')) {
    return '/src/assets/images/sneaker_nike_red_1795179634489.jpg';
  }
  if (lower.includes('elect') || lower.includes('laptop') || lower.includes('tech')) {
    return '/src/assets/images/laptop_macbook_pro_1795179634930.jpg';
  }
  if (lower.includes('camera') || lower.includes('optic')) {
    return '/src/assets/images/camera_sony_alpha_1795179634542.jpg';
  }
  return '/src/assets/images/parcel_express_box_1795179634899.jpg';
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcast(payload: WsServerMessage) {
    const serialized = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  function advanceShipment(shipment: ShipmentDetail): {
    shipment: ShipmentDetail;
    event: ShipmentEvent;
    notification: AppNotification;
  } | null {
    const next = buildNextCheckpoint(shipment);
    if (!next) return null;

    shipment.stage = next.nextStage;
    shipment.statusLabel = STAGE_LABELS[next.nextStage];
    shipment.currentLocation = next.event.location;
    shipment.currentCoords = next.coords;
    shipment.hasLiveGps = next.hasLiveGps;
    if (next.courierName) shipment.courierName = next.courierName;
    shipment.gpsUpdatedAt = next.event.timestamp;
    shipment.updatedAt = next.event.timestamp;
    if (next.nextStage === 4) {
      shipment.estimatedDelivery = 'Delivered';
    }
    shipment.events.push(next.event);

    const notification: AppNotification = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shipmentId: shipment.id,
      maskedNumber: shipment.maskedNumber,
      itemName: shipment.itemName,
      title: next.notifTitle,
      message: `${shipment.itemName} (${shipment.maskedNumber}) — ${next.event.detail}`,
      type: next.notifType,
      timestamp: next.event.timestamp,
      read: false,
    };
    notifications.unshift(notification);
    if (notifications.length > 40) {
      notifications.pop();
    }

    broadcast({
      type: 'shipment:updated',
      shipment: toSummary(shipment),
      latestEvent: next.event,
      adminDetail: shipment,
    });
    broadcast({
      type: 'notification:new',
      notification,
    });

    return { shipment, event: next.event, notification };
  }

  function nudgeCourierGps(shipment: ShipmentDetail) {
    const nowIso = new Date().toISOString();
    const nextCoords = interpolateCoords(shipment.currentCoords, shipment.destinationCoords, 0.32);
    shipment.currentCoords = nextCoords;
    shipment.hasLiveGps = true;
    shipment.gpsUpdatedAt = nowIso;
    shipment.updatedAt = nowIso;

    broadcast({
      type: 'shipment:updated',
      shipment: toSummary(shipment),
      adminDetail: shipment,
    });
  }

  function configureAutoDispatch(enabled: boolean) {
    autoDispatchEnabled = enabled;
    if (autoDispatchTimer) {
      clearInterval(autoDispatchTimer);
      autoDispatchTimer = null;
    }
    if (enabled) {
      autoDispatchTimer = setInterval(() => {
        const outForDeliveryWithGps = shipments.filter((s) => s.stage === 3 && s.hasLiveGps);
        if (outForDeliveryWithGps.length > 0 && Math.random() < 0.6) {
          nudgeCourierGps(outForDeliveryWithGps[0]);
          return;
        }
        const activeCandidates = shipments.filter((s) => s.stage < 4);
        if (activeCandidates.length === 0) {
          configureAutoDispatch(false);
          return;
        }
        const candidate = activeCandidates[Math.floor(Math.random() * activeCandidates.length)];
        advanceShipment(candidate);
      }, 9000);
    }
    broadcast({
      type: 'dispatch:status',
      autoDispatchEnabled,
    });
  }

  wss.on('connection', (ws) => {
    const initPayload: WsServerMessage = {
      type: 'init',
      shipments: shipments.map(toSummary),
      notifications,
      hubs: HUBS,
      autoDispatchEnabled,
      inquiries,
    };
    ws.send(JSON.stringify(initPayload));
  });

  // Public runtime Maps config
  app.get('/api/config', (_req, res) => {
    res.json({
      googleMapsApiKey:
        process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    });
  });

  // REST API Endpoints (includes public Maps API key to minimize startup roundtrips)
  app.get('/api/state', (_req, res) => {
    res.json({
      shipments: shipments.map(toSummary),
      notifications,
      hubs: HUBS,
      autoDispatchEnabled,
      googleMapsApiKey:
        process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    });
  });

  // Admin Portal full unmasked state
  app.get('/api/admin/state', (_req, res) => {
    res.json({
      shipments,
      notifications,
      hubs: HUBS,
      inquiries,
      autoDispatchEnabled,
    });
  });

  app.get('/api/shipments/track/:code', (req, res) => {
    const rawCode = String(req.params.code || '')
      .trim()
      .replace(/^#/, '')
      .toUpperCase();

    if (!rawCode) {
      return res.status(400).json({ error: 'Please enter a valid tracking number.' });
    }

    const found = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === rawCode || (!s.isProtected && s.id === rawCode)
    );

    if (!found) {
      return res.status(404).json({
        error: `No consignment found matching #${rawCode}. Verify your assigned tracking number.`,
      });
    }

    return res.json({ shipment: found });
  });

  app.get('/api/shipments/:id', (req, res) => {
    const found = shipments.find((s) => s.id === req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }
    if (found.isProtected) {
      return res.status(403).json({
        error: 'Protected consignment. Enter the assigned tracking number to unlock telematics.',
        maskedNumber: found.maskedNumber,
      });
    }
    return res.json({ shipment: found });
  });

  app.post('/api/shipments', (req, res) => {
    const {
      itemName,
      category,
      originCity,
      originCountry,
      originCode,
      destinationCity,
      destinationCountry,
      destinationCode,
      recipientName,
      weightKg,
      declaredValueUsd,
      serviceTier,
      isProtected,
    } = req.body || {};

    if (!itemName || !originCity || !destinationCity || !recipientName) {
      return res.status(400).json({
        error: 'Item name, origin, destination, and recipient name are required.',
      });
    }

    const randomDigits = Math.floor(1000000 + Math.random() * 8999999);
    const trackingNumber = `EDX${randomDigits}`;
    const nowIso = new Date().toISOString();
    const tier: ServiceTier =
      serviceTier === 'Priority Cargo' || serviceTier === 'Economy Freight'
        ? serviceTier
        : 'Express Air';

    const etaDays = tier === 'Express Air' ? 2 : tier === 'Priority Cargo' ? 4 : 8;
    const etaDate = new Date(Date.now() + etaDays * 86400000);
    const etaFormatted =
      etaDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ', 16:00 Local';

    const origCode = String(originCode || originCity.slice(0, 3)).toUpperCase();
    const destCode = String(destinationCode || destinationCity.slice(0, 3)).toUpperCase();
    const origCoords = getHubCoords(origCode);
    const destCoords = getHubCoords(destCode);

    const firstEvent: ShipmentEvent = {
      id: `evt-${Date.now()}`,
      stage: 0,
      status: 'Order Created',
      location: `${originCity}, ${originCountry || 'Global'}`,
      hubCode: origCode,
      detail: `Consignment booked (${tier}). Awaiting courier pickup at ${originCity}.`,
      timestamp: nowIso,
      coords: origCoords,
    };

    const newShipment: ShipmentDetail = {
      id: `shp-${trackingNumber.toLowerCase()}`,
      trackingNumber,
      maskedNumber: maskTrackingNumber(trackingNumber),
      itemName: String(itemName).trim(),
      category: String(category || 'General Parcel'),
      thumbnailUrl: selectThumbnailForCategory(String(category || itemName)),
      originCity: String(originCity).trim(),
      originCountry: String(originCountry || 'United States').trim(),
      originCode: origCode,
      originCoords: origCoords,
      destinationCity: String(destinationCity).trim(),
      destinationCountry: String(destinationCountry || 'United Kingdom').trim(),
      destinationCode: destCode,
      destinationCoords: destCoords,
      currentCoords: origCoords,
      hasLiveGps: false,
      gpsUpdatedAt: nowIso,
      recipientName: String(recipientName).trim(),
      stage: 0,
      statusLabel: STAGE_LABELS[0],
      serviceTier: tier,
      weightKg: Number(weightKg) > 0 ? Number(weightKg) : 1.5,
      declaredValueUsd: Number(declaredValueUsd) >= 0 ? Number(declaredValueUsd) : 150,
      estimatedDelivery: etaFormatted,
      currentLocation: `${originCity} Dispatch Origin`,
      isProtected: Boolean(isProtected),
      updatedAt: nowIso,
      events: [firstEvent],
    };

    shipments.unshift(newShipment);

    const notification: AppNotification = {
      id: `ntf-${Date.now()}`,
      shipmentId: newShipment.id,
      maskedNumber: newShipment.maskedNumber,
      itemName: newShipment.itemName,
      title: 'New Consignment Created',
      message: `${newShipment.itemName} (${newShipment.trackingNumber}) scheduled from ${newShipment.originCity} to ${newShipment.destinationCity}.`,
      type: 'created',
      timestamp: nowIso,
      read: false,
    };
    notifications.unshift(notification);

    broadcast({
      type: 'shipment:created',
      shipment: toSummary(newShipment),
      adminDetail: newShipment,
    });
    broadcast({
      type: 'notification:new',
      notification,
    });

    return res.status(201).json({ shipment: newShipment, notification });
  });

  app.post('/api/shipments/:id/advance', (req, res) => {
    const found = shipments.find((s) => s.id === req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }
    const result = advanceShipment(found);
    if (!result) {
      return res.status(400).json({ error: 'Shipment has already reached final delivery.' });
    }
    return res.json({
      shipment: result.shipment,
      event: result.event,
      notification: result.notification,
    });
  });

  // Update / toggle live GPS telemetry (used by Admin Portal or Live GPS simulation)
  app.post('/api/shipments/:id/gps', (req, res) => {
    const found = shipments.find((s) => s.id === req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }

    const { action, hasLiveGps } = req.body || {};
    const nowIso = new Date().toISOString();

    if (action === 'nudge') {
      nudgeCourierGps(found);
      return res.json({ shipment: found });
    }

    if (typeof hasLiveGps === 'boolean') {
      found.hasLiveGps = hasLiveGps;
      found.gpsUpdatedAt = nowIso;
      found.updatedAt = nowIso;
      broadcast({
        type: 'shipment:updated',
        shipment: toSummary(found),
        adminDetail: found,
      });
    }

    return res.json({ shipment: found });
  });

  app.post('/api/notifications/read', (req, res) => {
    const { id, all } = req.body || {};
    if (all) {
      for (const n of notifications) {
        n.read = true;
      }
    } else if (id) {
      const target = notifications.find((n) => n.id === id);
      if (target) target.read = true;
    }
    broadcast({
      type: 'notifications:synced',
      notifications,
    });
    return res.json({ notifications });
  });

  app.post('/api/dispatch/auto', (req, res) => {
    const enabled = Boolean(req.body?.enabled);
    configureAutoDispatch(enabled);
    return res.json({ autoDispatchEnabled });
  });

  // Contact Us inquiry submission from Visitor Landing Page
  app.post('/api/contact', (req, res) => {
    const { name, email, topic, trackingRef, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Name, email address, and message are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const inquiry: ContactInquiry = {
      id: `inq-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim(),
      topic: String(topic || 'General Freight Inquiry').trim(),
      trackingRef: trackingRef ? String(trackingRef).trim().toUpperCase() : undefined,
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    inquiries.unshift(inquiry);
    broadcast({
      type: 'inquiry:new',
      inquiry,
    });

    return res.status(201).json({ inquiry });
  });

  app.post('/api/inquiries/:id/resolve', (req, res) => {
    const found = inquiries.find((i) => i.id === req.params.id);
    if (!found) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    found.status = found.status === 'resolved' ? 'new' : 'resolved';
    broadcast({
      type: 'inquiry:updated',
      inquiry: found,
    });
    return res.json({ inquiry: found });
  });

  app.post('/api/quote', (req, res) => {
    const body = req.body as Partial<QuoteRequest>;
    const weightKg = Math.max(0.5, Number(body.weightKg) || 1);
    const lengthCm = Math.max(5, Number(body.lengthCm) || 30);
    const widthCm = Math.max(5, Number(body.widthCm) || 20);
    const heightCm = Math.max(5, Number(body.heightCm) || 15);
    const volumetricKg = (lengthCm * widthCm * heightCm) / 5000;
    const chargeableWeightKg = Number(Math.max(weightKg, volumetricKg).toFixed(2));
    const serviceTier: ServiceTier =
      body.serviceTier === 'Priority Cargo' || body.serviceTier === 'Economy Freight'
        ? body.serviceTier
        : 'Express Air';

    const originCode = String(body.originCode || 'JFK').toUpperCase();
    const destinationCode = String(body.destinationCode || 'LHR').toUpperCase();
    const isDomestic = originCode === destinationCode;

    const perKg =
      serviceTier === 'Express Air' ? 14.5 : serviceTier === 'Priority Cargo' ? 9.8 : 6.2;
    const baseFlag =
      serviceTier === 'Express Air' ? 28 : serviceTier === 'Priority Cargo' ? 19 : 12;

    const baseRateUsd = Number((baseFlag + chargeableWeightKg * perKg).toFixed(2));
    const fuelSurchargeUsd = Number((baseRateUsd * 0.12).toFixed(2));
    const customsHandlingUsd = isDomestic ? 0 : 18.5;
    const totalUsd = Number((baseRateUsd + fuelSurchargeUsd + customsHandlingUsd).toFixed(2));

    const estimatedDays =
      serviceTier === 'Express Air'
        ? '1–2 Business Days'
        : serviceTier === 'Priority Cargo'
        ? '3–5 Business Days'
        : '6–9 Business Days';

    const quote: QuoteResult = {
      originCode,
      destinationCode,
      chargeableWeightKg,
      baseRateUsd,
      fuelSurchargeUsd,
      customsHandlingUsd,
      totalUsd,
      estimatedDays,
      serviceTier,
    };

    return res.json({ quote });
  });

  // Serve static public assets (videos/images) with caching so browsers don't refetch on reload
  app.use(
    '/assets',
    express.static(path.resolve(__dirname, 'public/assets'), {
      maxAge: '1h',
    })
  );

  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`EDEX Courier Tracking server listening on http://localhost:${PORT}`);
  });
}

startServer();
