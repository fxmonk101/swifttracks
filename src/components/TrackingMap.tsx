import { Component, ReactNode, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Coordinates } from "@/lib/types";

// Error boundary so any Leaflet hiccup never blanks the entire tracking page
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error("[TrackingMap] error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-muted/30 text-muted-foreground text-sm p-6 text-center">
          Map unavailable. Shipment details are still shown on the right.
        </div>
      );
    }
    return this.props.children;
  }
}

// Smoothly interpolate between two coordinates over a duration
const useAnimatedPosition = (target: Coordinates, durationMs = 1500) => {
  const [pos, setPos] = useState<Coordinates>(target);
  const [heading, setHeading] = useState(0);
  const fromRef = useRef<Coordinates>(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // If first run or no movement, just snap
    if (fromRef.current.lat === target.lat && fromRef.current.lng === target.lng) {
      setPos(target);
      return;
    }

    const from = { ...pos };
    fromRef.current = from;
    startRef.current = performance.now();

    // Compute bearing for heading (degrees)
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const φ1 = toRad(from.lat);
    const φ2 = toRad(target.lat);
    const Δλ = toRad(target.lng - from.lng);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    setHeading(bearing);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // Ease in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setPos({
        lat: from.lat + (target.lat - from.lat) * eased,
        lng: from.lng + (target.lng - from.lng) * eased,
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.lat, target.lng, durationMs]);

  return { pos, heading };
};

// Animated truck SVG icon with heading rotation
const createTruckIcon = (heading: number = 0) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    <g transform="rotate(${heading}, 24, 24)" filter="url(#shadow)">
      <circle cx="24" cy="24" r="20" fill="#0A2F6B" stroke="white" stroke-width="2.5"/>
      <path d="M16 32V16l16 8-16 8z" fill="#FFCC00"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const destinationIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-5 h-5 rounded-full bg-[hsl(357,95%,42%)] border-[3px] border-white shadow-lg z-10"></div>
    <div class="absolute w-8 h-8 rounded-full bg-[hsl(357,95%,42%)] opacity-30 animate-ping"></div>
    <div class="absolute w-12 h-12 rounded-full bg-[hsl(357,95%,42%)] opacity-10 animate-pulse"></div>
  </div>`,
  className: "",
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const originIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-4 h-4 rounded-full bg-[hsl(217,82%,23%)] border-[3px] border-white shadow-md"></div>
  </div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapAutoFitProps {
  points: Coordinates[];
}

const MapAutoFit = ({ points }: MapAutoFitProps) => {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
      fitted.current = true;
    }
  }, [points, map]);

  return null;
};

// Component to keep map centered on truck
const MapFollowTruck = ({ location, follow }: { location: Coordinates; follow: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.panTo([location.lat, location.lng], { animate: true, duration: 0.8 });
    }
  }, [location, follow, map]);
  return null;
};

interface TrackingMapProps {
  routeHistory: Coordinates[];
  currentLocation: Coordinates;
  destination: Coordinates;
  origin: Coordinates;
  heading?: number;
  followTruck?: boolean;
}

const isFiniteCoord = (p: Coordinates | undefined | null): p is Coordinates =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);

const TrackingMap = ({ routeHistory, currentLocation, destination, origin, heading, followTruck = false }: TrackingMapProps) => {
  // Guard inputs - if any are bad, fall back so Leaflet never receives NaN
  const safeOrigin = isFiniteCoord(origin) ? origin : { lat: 39.8283, lng: -98.5795 };
  const safeDestination = isFiniteCoord(destination) ? destination : safeOrigin;
  const safeCurrent = isFiniteCoord(currentLocation) ? currentLocation : safeOrigin;
  const safeHistory = (routeHistory || []).filter(isFiniteCoord);

  const { pos: animatedLoc, heading: computedHeading } = useAnimatedPosition(safeCurrent, 1500);
  const effectiveHeading = heading ?? computedHeading;

  const allPoints = [safeOrigin, ...safeHistory, animatedLoc];
  const polylinePositions = allPoints.map((p): [number, number] => [p.lat, p.lng]);

  // Dashed line from current location to destination (remaining route)
  const remainingRoute: [number, number][] = [
    [animatedLoc.lat, animatedLoc.lng],
    [safeDestination.lat, safeDestination.lng],
  ];

  return (
    <MapErrorBoundary>
      <MapContainer
        center={[animatedLoc.lat, animatedLoc.lng]}
        zoom={7}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ background: "#e8e4dc" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Completed route - solid line */}
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: "#0A2F6B", weight: 4, opacity: 0.9 }}
        />

        {/* Remaining route - dashed */}
        <Polyline
          positions={remainingRoute}
          pathOptions={{ color: "#0A2F6B", weight: 3, opacity: 0.4, dashArray: "10, 8" }}
        />

        {/* Origin */}
        <Marker position={[safeOrigin.lat, safeOrigin.lng]} icon={originIcon}>
          <Popup className="tracking-popup">
            <div className="font-semibold text-xs">📍 Origin</div>
          </Popup>
        </Marker>

        {/* Destination */}
        <Marker position={[safeDestination.lat, safeDestination.lng]} icon={destinationIcon}>
          <Popup className="tracking-popup">
            <div className="font-semibold text-xs">🏁 Destination</div>
          </Popup>
        </Marker>

        {/* Truck (animated) */}
        <Marker position={[animatedLoc.lat, animatedLoc.lng]} icon={createTruckIcon(effectiveHeading)}>
          <Popup className="tracking-popup">
            <div className="font-semibold text-xs">🚚 Current Location</div>
          </Popup>
        </Marker>

        <MapAutoFit points={[safeOrigin, ...safeHistory, safeCurrent, safeDestination]} />
        <MapFollowTruck location={animatedLoc} follow={followTruck} />
      </MapContainer>
    </MapErrorBoundary>
  );
};

export default TrackingMap;
