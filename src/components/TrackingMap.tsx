import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Coordinates } from "@/lib/types";

// Truck SVG icon
const createTruckIcon = (heading: number = 0) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <g transform="rotate(${heading}, 20, 20)">
      <circle cx="20" cy="20" r="18" fill="#0A2F6B" stroke="white" stroke-width="2"/>
      <path d="M14 28V14l12 7-12 7z" fill="#FFCC00"/>
    </g>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const destinationIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-4 h-4 rounded-full bg-[hsl(357,95%,42%)] border-2 border-white shadow-lg z-10"></div>
    <div class="absolute w-4 h-4 rounded-full bg-[hsl(357,95%,42%)] opacity-40 animate-ping"></div>
  </div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const originIcon = L.divIcon({
  html: `<div class="w-3 h-3 rounded-full bg-[hsl(217,82%,23%)] border-2 border-white shadow"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
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
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
      fitted.current = true;
    }
  }, [points, map]);

  return null;
};

interface TrackingMapProps {
  routeHistory: Coordinates[];
  currentLocation: Coordinates;
  destination: Coordinates;
  origin: Coordinates;
  heading?: number;
}

const TrackingMap = ({ routeHistory, currentLocation, destination, origin, heading = 0 }: TrackingMapProps) => {
  const allPoints = [origin, ...routeHistory, currentLocation];
  const polylinePositions = allPoints.map((p): [number, number] => [p.lat, p.lng]);

  return (
    <MapContainer
      center={[currentLocation.lat, currentLocation.lng]}
      zoom={7}
      className="h-full w-full rounded-lg"
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={polylinePositions} pathOptions={{ color: "#0A2F6B", weight: 3, opacity: 0.8 }} />
      <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
        <Popup>Origin</Popup>
      </Marker>
      <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
        <Popup>Destination</Popup>
      </Marker>
      <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createTruckIcon(heading)}>
        <Popup>Current Location</Popup>
      </Marker>
      <MapAutoFit points={allPoints} />
    </MapContainer>
  );
};

export default TrackingMap;
