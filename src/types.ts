export type StageIndex = 0 | 1 | 2 | 3 | 4;

export const STAGE_LABELS: Record<StageIndex, string> = {
  0: 'Order Created',
  1: 'Picked Up',
  2: 'In Transit',
  3: 'Out for Delivery',
  4: 'Delivered',
};

export type ServiceTier = 'Express Air' | 'Priority Cargo' | 'Economy Freight';

export type PortalView = 'landing' | 'tracker' | 'admin';

export interface LatLngCoords {
  lat: number;
  lng: number;
}

export interface ShipmentEvent {
  id: string;
  stage: StageIndex;
  status: string;
  location: string;
  hubCode: string;
  detail: string;
  timestamp: string;
  coords?: LatLngCoords;
}

export interface ShipmentSummary {
  id: string;
  maskedNumber: string;
  itemName: string;
  category: string;
  thumbnailUrl: string;
  originCity: string;
  originCountry: string;
  originCode: string;
  originCoords: LatLngCoords;
  destinationCity: string;
  destinationCountry: string;
  destinationCode: string;
  destinationCoords: LatLngCoords;
  currentCoords: LatLngCoords;
  hasLiveGps: boolean;
  courierName?: string;
  gpsUpdatedAt: string;
  stage: StageIndex;
  statusLabel: string;
  serviceTier: ServiceTier;
  weightKg: number;
  estimatedDelivery: string;
  isProtected: boolean;
  updatedAt: string;
}

export interface ShipmentDetail extends ShipmentSummary {
  trackingNumber: string;
  recipientName: string;
  currentLocation: string;
  declaredValueUsd: number;
  temperatureC?: number;
  events: ShipmentEvent[];
}

export interface AppNotification {
  id: string;
  shipmentId: string;
  maskedNumber: string;
  itemName: string;
  title: string;
  message: string;
  type: 'transit' | 'customs' | 'delivery' | 'created' | 'alert';
  timestamp: string;
  read: boolean;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  topic: string;
  trackingRef?: string;
  message: string;
  createdAt: string;
  status: 'new' | 'resolved';
}

export interface HubLocation {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  address: string;
  hours: string;
  phone: string;
  services: string[];
  coords: LatLngCoords;
}

export interface QuoteRequest {
  originCode: string;
  destinationCode: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  serviceTier: ServiceTier;
}

export interface QuoteResult {
  originCode: string;
  destinationCode: string;
  chargeableWeightKg: number;
  baseRateUsd: number;
  fuelSurchargeUsd: number;
  customsHandlingUsd: number;
  totalUsd: number;
  estimatedDays: string;
  serviceTier: ServiceTier;
}

export type TabKey = 'home' | 'track' | 'send' | 'shipments' | 'app';

export type WsServerMessage =
  | {
      type: 'init';
      shipments: ShipmentSummary[];
      notifications: AppNotification[];
      hubs: HubLocation[];
      autoDispatchEnabled: boolean;
      inquiries: ContactInquiry[];
    }
  | {
      type: 'shipment:created';
      shipment: ShipmentSummary;
      adminDetail: ShipmentDetail;
    }
  | {
      type: 'shipment:updated';
      shipment: ShipmentSummary;
      latestEvent?: ShipmentEvent;
      adminDetail: ShipmentDetail;
    }
  | {
      type: 'notification:new';
      notification: AppNotification;
    }
  | {
      type: 'notifications:synced';
      notifications: AppNotification[];
    }
  | {
      type: 'dispatch:status';
      autoDispatchEnabled: boolean;
    }
  | {
      type: 'inquiry:new';
      inquiry: ContactInquiry;
    }
  | {
      type: 'inquiry:updated';
      inquiry: ContactInquiry;
    };
