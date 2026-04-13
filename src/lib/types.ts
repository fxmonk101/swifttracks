export type ShipmentStatus =
  | "LABEL_CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "AT_FACILITY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_ATTEMPTED"
  | "EXCEPTION"
  | "RETURNED";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ShipmentEvent {
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Shipment {
  id: string;
  trackingId: string;
  serviceType: "EXPRESS" | "STANDARD" | "ECONOMY" | "OVERNIGHT";
  status: ShipmentStatus;
  sender: Address;
  receiver: Address;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  requiresSignature: boolean;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  currentLocation: Coordinates;
  assignedDriver?: string;
  events: ShipmentEvent[];
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  onDuty: boolean;
  currentLocation?: Coordinates;
  accuracy?: number;
  speed?: number;
  heading?: number;
  activeShipments: string[];
}

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  LABEL_CREATED: "Label Created",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  AT_FACILITY: "At Facility",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  DELIVERY_ATTEMPTED: "Delivery Attempted",
  EXCEPTION: "Exception",
  RETURNED: "Returned",
};

export const STATUS_ORDER: ShipmentStatus[] = [
  "LABEL_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_FACILITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
