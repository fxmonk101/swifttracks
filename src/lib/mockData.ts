import { Shipment, Driver, Coordinates } from "./types";

const routePoints: Coordinates[] = [
  { lat: 40.7128, lng: -74.006 },   // NYC
  { lat: 40.2206, lng: -74.7642 },  // Trenton
  { lat: 39.9526, lng: -75.1652 },  // Philadelphia
  { lat: 39.2904, lng: -76.6122 },  // Baltimore
  { lat: 38.9072, lng: -77.0369 },  // Washington DC
];

export const mockShipments: Shipment[] = [
  {
    id: "1",
    trackingId: "ST-2024-AB3F7K9M",
    serviceType: "EXPRESS",
    status: "OUT_FOR_DELIVERY",
    sender: { name: "TechCorp Inc", street: "350 5th Ave", city: "New York", state: "NY", zip: "10118", country: "US" },
    receiver: { name: "Jane Smith", street: "1600 Pennsylvania Ave", city: "Washington", state: "DC", zip: "20500", country: "US" },
    weight: 2.5,
    dimensions: { length: 30, width: 20, height: 15 },
    requiresSignature: true,
    estimatedDeliveryDate: "2024-12-20T18:00:00Z",
    currentLocation: { lat: 39.2904, lng: -76.6122 },
    assignedDriver: "d1",
    events: [
      { status: "LABEL_CREATED", description: "Shipping label created", location: "New York, NY", timestamp: "2024-12-17T09:00:00Z" },
      { status: "PICKED_UP", description: "Package picked up by courier", location: "New York, NY", timestamp: "2024-12-17T14:30:00Z" },
      { status: "IN_TRANSIT", description: "Package departed origin facility", location: "New York, NY", timestamp: "2024-12-17T18:00:00Z" },
      { status: "AT_FACILITY", description: "Arrived at sorting facility", location: "Philadelphia, PA", timestamp: "2024-12-18T06:00:00Z" },
      { status: "IN_TRANSIT", description: "Package in transit to destination", location: "Philadelphia, PA", timestamp: "2024-12-18T10:00:00Z" },
      { status: "AT_FACILITY", description: "Arrived at local delivery facility", location: "Baltimore, MD", timestamp: "2024-12-19T05:00:00Z" },
      { status: "OUT_FOR_DELIVERY", description: "Out for delivery", location: "Baltimore, MD", timestamp: "2024-12-19T08:00:00Z" },
    ],
    createdAt: "2024-12-17T09:00:00Z",
  },
  {
    id: "2",
    trackingId: "ST-2024-XK9P2L4N",
    serviceType: "STANDARD",
    status: "IN_TRANSIT",
    sender: { name: "BookWorld", street: "100 Market St", city: "San Francisco", state: "CA", zip: "94105", country: "US" },
    receiver: { name: "John Doe", street: "233 S Wacker Dr", city: "Chicago", state: "IL", zip: "60606", country: "US" },
    weight: 1.2,
    dimensions: { length: 25, width: 18, height: 5 },
    requiresSignature: false,
    estimatedDeliveryDate: "2024-12-22T18:00:00Z",
    currentLocation: { lat: 39.7392, lng: -104.9903 },
    assignedDriver: "d2",
    events: [
      { status: "LABEL_CREATED", description: "Shipping label created", location: "San Francisco, CA", timestamp: "2024-12-18T10:00:00Z" },
      { status: "PICKED_UP", description: "Package picked up", location: "San Francisco, CA", timestamp: "2024-12-18T15:00:00Z" },
      { status: "IN_TRANSIT", description: "In transit", location: "Denver, CO", timestamp: "2024-12-19T12:00:00Z" },
    ],
    createdAt: "2024-12-18T10:00:00Z",
  },
  {
    id: "3",
    trackingId: "ST-2024-MN7Q8R2T",
    serviceType: "OVERNIGHT",
    status: "DELIVERED",
    sender: { name: "ElectroParts", street: "1 Infinite Loop", city: "Cupertino", state: "CA", zip: "95014", country: "US" },
    receiver: { name: "Alex Johnson", street: "200 E Randolph St", city: "Chicago", state: "IL", zip: "60601", country: "US" },
    weight: 0.5,
    dimensions: { length: 15, width: 10, height: 5 },
    requiresSignature: false,
    estimatedDeliveryDate: "2024-12-18T12:00:00Z",
    actualDeliveryDate: "2024-12-18T10:30:00Z",
    currentLocation: { lat: 41.8827, lng: -87.6233 },
    events: [
      { status: "LABEL_CREATED", description: "Shipping label created", location: "Cupertino, CA", timestamp: "2024-12-17T08:00:00Z" },
      { status: "PICKED_UP", description: "Picked up", location: "Cupertino, CA", timestamp: "2024-12-17T10:00:00Z" },
      { status: "IN_TRANSIT", description: "In transit", location: "Cupertino, CA", timestamp: "2024-12-17T14:00:00Z" },
      { status: "AT_FACILITY", description: "At facility", location: "Denver, CO", timestamp: "2024-12-17T22:00:00Z" },
      { status: "OUT_FOR_DELIVERY", description: "Out for delivery", location: "Chicago, IL", timestamp: "2024-12-18T07:00:00Z" },
      { status: "DELIVERED", description: "Delivered - Left at front door", location: "Chicago, IL", timestamp: "2024-12-18T10:30:00Z" },
    ],
    createdAt: "2024-12-17T08:00:00Z",
  },
  {
    id: "4",
    trackingId: "ST-2024-PL5W3Y8Z",
    serviceType: "ECONOMY",
    status: "EXCEPTION",
    sender: { name: "FashionHub", street: "770 Broadway", city: "New York", state: "NY", zip: "10003", country: "US" },
    receiver: { name: "Maria Garcia", street: "500 S Grand Ave", city: "Los Angeles", state: "CA", zip: "90071", country: "US" },
    weight: 3.0,
    dimensions: { length: 40, width: 30, height: 20 },
    requiresSignature: true,
    estimatedDeliveryDate: "2024-12-25T18:00:00Z",
    currentLocation: { lat: 35.2271, lng: -80.8431 },
    assignedDriver: "d3",
    events: [
      { status: "LABEL_CREATED", description: "Shipping label created", location: "New York, NY", timestamp: "2024-12-16T09:00:00Z" },
      { status: "PICKED_UP", description: "Picked up", location: "New York, NY", timestamp: "2024-12-16T14:00:00Z" },
      { status: "IN_TRANSIT", description: "In transit", location: "Charlotte, NC", timestamp: "2024-12-18T06:00:00Z" },
      { status: "EXCEPTION", description: "Address issue - recipient not found", location: "Charlotte, NC", timestamp: "2024-12-18T14:00:00Z" },
    ],
    createdAt: "2024-12-16T09:00:00Z",
  },
  {
    id: "5",
    trackingId: "TH-2026-R9PZ36QK",
    serviceType: "EXPRESS",
    status: "IN_TRANSIT",
    sender: { name: "Sender", street: "7552 Chutter St", city: "Burnaby", state: "BC", zip: "V5A 2A3", country: "Canada" },
    receiver: { name: "Recipient", street: "309-525 3 Ave SW", city: "Calgary", state: "AB", zip: "T2P 0G4", country: "Canada" },
    weight: 2.0,
    dimensions: { length: 30, width: 20, height: 15 },
    requiresSignature: false,
    estimatedDeliveryDate: "2026-05-26T18:00:00Z",
    currentLocation: { lat: 50.5, lng: -118.5 },
    assignedDriver: "d2",
    events: [
      { status: "LABEL_CREATED", description: "Shipping label created", location: "Burnaby, BC", timestamp: "2026-05-23T09:00:00Z" },
      { status: "PICKED_UP", description: "Package picked up by courier", location: "Burnaby, BC", timestamp: "2026-05-23T14:30:00Z" },
      { status: "IN_TRANSIT", description: "Package in transit from Burnaby to Calgary", location: "Burnaby, BC", timestamp: "2026-05-23T18:00:00Z" },
    ],
    createdAt: "2026-05-23T09:00:00Z",
  },
];

export const mockDrivers: Driver[] = [
  { id: "d1", name: "Marcus Johnson", email: "marcus@transporthaven.com", phone: "+1555-0101", onDuty: true, currentLocation: { lat: 39.2904, lng: -76.6122 }, accuracy: 12, speed: 45, heading: 210, activeShipments: ["ST-2024-AB3F7K9M"] },
  { id: "d2", name: "Sarah Chen", email: "sarah@transporthaven.com", phone: "+1555-0102", onDuty: true, currentLocation: { lat: 39.7392, lng: -104.9903 }, accuracy: 8, speed: 72, heading: 90, activeShipments: ["ST-2024-XK9P2L4N"] },
  { id: "d3", name: "David Williams", email: "david@transporthaven.com", phone: "+1555-0103", onDuty: false, currentLocation: { lat: 35.2271, lng: -80.8431 }, accuracy: 150, speed: 0, heading: 0, activeShipments: ["ST-2024-PL5W3Y8Z"] },
];

export const routeHistory = routePoints;

export function getShipmentByTrackingId(trackingId: string): Shipment | undefined {
  return mockShipments.find((s) => s.trackingId.toLowerCase() === trackingId.toLowerCase());
}
