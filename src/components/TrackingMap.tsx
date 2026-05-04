import { Component, forwardRef, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Coordinates } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Crosshair, MapPinned, Maximize2, Share2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Error boundary so any Leaflet hiccup never blanks the entire tracking page
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[TrackingMap] error:", error);
  }
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

const useAnimatedPosition = (target: Coordinates, durationMs: number) => {
  const [pos, setPos] = useState<Coordinates>(target);
  const [heading, setHeading] = useState(0);
  const fromRef = useRef<Coordinates>(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (fromRef.current.lat === target.lat && fromRef.current.lng === target.lng) {
      setPos(target);
      return;
    }

    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const bearingBetween = (a: Coordinates, b: Coordinates) => {
      const φ1 = toRad(a.lat);
      const φ2 = toRad(b.lat);
      const Δλ = toRad(b.lng - a.lng);
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    const from = { ...pos };
    fromRef.current = from;
    setHeading(bearingBetween(from, target));

    if (durationMs <= 0) {
      setPos(target);
      fromRef.current = { ...target };
      return;
    }

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setPos({
        lat: from.lat + (target.lat - from.lat) * eased,
        lng: from.lng + (target.lng - from.lng) * eased,
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = { ...target };
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

const holdIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-9 h-9 rounded-full bg-[hsl(217,82%,28%)] border-[3px] border-white shadow-lg flex items-center justify-center text-lg leading-none">📦</div>
  </div>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

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

export type BasemapId = "road" | "terrain" | "streets" | "satellite";

const BASEMAPS: Record<
  BasemapId,
  { url: string; attribution: string; label: string }
> = {
  road: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Road map",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    label: "Terrain",
  },
  streets: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: "Streets",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    label: "Satellite",
  },
};

interface MapAutoFitProps {
  points: Coordinates[];
  trackingIdForFit: string;
  mapFitNonce: number;
  manualFitNonce: number;
  basemap: BasemapId;
}

const MapAutoFit = ({ points, trackingIdForFit, mapFitNonce, manualFitNonce, basemap }: MapAutoFitProps) => {
  const map = useMap();
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const pts = pointsRef.current;
    if (pts.length === 0) return;
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [56, 56], animate: true, duration: 0.45 });
  }, [map, trackingIdForFit, mapFitNonce, manualFitNonce, basemap]);

  return null;
};

const MapFollowTruck = ({ location, follow }: { location: Coordinates; follow: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.panTo([location.lat, location.lng], { animate: true, duration: 0.75 });
    }
  }, [location.lat, location.lng, follow, map]);
  return null;
};

// Auto-open the truck popup so the current-location label is visible without hover.
const PopupAutoOpener = (_: { position: [number, number]; signature: string }) => null;

const TruckMarkerWithOpenPopup = ({
  position,
  icon,
  stationaryAtHold,
  currentLocationLabel,
  accuracyMeters,
  signalLabel,
}: {
  position: [number, number];
  icon: L.DivIcon;
  stationaryAtHold: boolean;
  currentLocationLabel?: string;
  accuracyMeters?: number | null;
  signalLabel?: string;
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  useEffect(() => {
    const m = markerRef.current;
    if (m) {
      // Defer to next tick so leaflet has wired up the popup
      const t = setTimeout(() => m.openPopup(), 50);
      return () => clearTimeout(t);
    }
  }, [position[0], position[1]]);
  return (
    <Marker position={position} icon={icon} ref={(r) => { markerRef.current = r; }}>
      <Popup className="tracking-popup" autoClose={false} closeOnClick={false} closeButton={false}>
        <div className="space-y-0.5 min-w-[170px]">
          <div className="font-semibold text-xs">
            {stationaryAtHold ? "📦 Package on hold" : "🚚 Current location"}
          </div>
          {currentLocationLabel && (
            <div className="text-[11px] text-slate-700">{currentLocationLabel}</div>
          )}
          <div className="text-[10px] font-mono text-slate-500">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {(signalLabel || accuracyMeters) && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 mt-1 text-[10px] text-slate-600">
              {signalLabel && <span>📡 {signalLabel}</span>}
              {accuracyMeters != null && <span>±{accuracyMeters} m</span>}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export interface TrackingMapProps {
  routeHistory: Coordinates[];
  currentLocation: Coordinates;
  destination: Coordinates;
  origin: Coordinates;
  heading?: number;
  followTruck?: boolean;
  onFollowTruckChange?: (v: boolean) => void;
  /** When true, marker snaps (no travel animation) and uses hold/facility styling */
  stationaryAtHold?: boolean;
  /** Bump when the route should be re-framed (e.g. tracking id or large GPS jump) */
  mapFitNonce?: number;
  trackingIdForFit?: string;
  shareTrackingUrl?: string;
  showMapControls?: boolean;
  /** Human-readable label for the current location popup, e.g. "Memphis, TN — At Facility" */
  currentLocationLabel?: string;
  /** Optional GPS accuracy radius in meters */
  accuracyMeters?: number | null;
  /** Optional signal label for overlay (e.g. "Strong", "Weak") */
  signalLabel?: string;
  signalBars?: number;
  /** When true, draws debug overlays: origin→destination axis, raw vs filtered history points. */
  debug?: boolean;
}

const isFiniteCoord = (p: Coordinates | undefined | null): p is Coordinates =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);

const TrackingMap = forwardRef<HTMLDivElement, TrackingMapProps>(({
  routeHistory,
  currentLocation,
  destination,
  origin,
  heading,
  followTruck = false,
  onFollowTruckChange,
  stationaryAtHold = false,
  mapFitNonce = 0,
  trackingIdForFit = "",
  shareTrackingUrl,
  showMapControls = true,
  currentLocationLabel,
  accuracyMeters = null,
  signalLabel,
  signalBars = 0,
  debug: debugProp = false,
}, _ref) => {
  const [debugOn, setDebugOn] = useState(debugProp);
  useEffect(() => setDebugOn(debugProp), [debugProp]);
  const safeOrigin = isFiniteCoord(origin) ? origin : { lat: 39.8283, lng: -98.5795 };
  const safeDestination = isFiniteCoord(destination) ? destination : safeOrigin;
  const safeCurrent = isFiniteCoord(currentLocation) ? currentLocation : safeOrigin;
  const safeHistory = (routeHistory || []).filter(isFiniteCoord);

  const animMs = stationaryAtHold ? 0 : 1500;
  const { pos: animatedLoc, heading: computedHeading } = useAnimatedPosition(safeCurrent, animMs);
  const effectiveHeading = heading ?? computedHeading;

  const [basemap, setBasemap] = useState<BasemapId>("road");
  const [manualFitNonce, setManualFitNonce] = useState(0);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  // Build a clean traveled route: origin -> de-duplicated history -> current.
  // We collapse points within ~300m and DROP any stale history point whose
  // progress along the origin→destination axis is *past* the current position
  // — this prevents leftover routes from previous destinations showing up
  // when an admin updates the location.
  const projectProgress = useCallback(
    (p: Coordinates) => {
      const dx = safeDestination.lng - safeOrigin.lng;
      const dy = safeDestination.lat - safeOrigin.lat;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1e-12) return 0;
      return ((p.lng - safeOrigin.lng) * dx + (p.lat - safeOrigin.lat) * dy) / len2;
    },
    [safeOrigin.lat, safeOrigin.lng, safeDestination.lat, safeDestination.lng]
  );

  const traveledRoute = useMemo<[number, number][]>(() => {
    const currentT = projectProgress(animatedLoc);
    // Keep only history points that lie between origin and current position
    const filteredHistory = safeHistory.filter((p) => {
      const t = projectProgress(p);
      return t >= -0.05 && t <= currentT + 0.02;
    });
    const raw: Coordinates[] = [safeOrigin, ...filteredHistory, animatedLoc];
    const out: Coordinates[] = [];
    const MIN_M = 300;
    for (const p of raw) {
      if (out.length === 0) {
        out.push(p);
        continue;
      }
      const last = out[out.length - 1];
      const R = 6371008;
      const dLat = ((p.lat - last.lat) * Math.PI) / 180;
      const dLng = ((p.lng - last.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((last.lat * Math.PI) / 180) *
          Math.cos((p.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const dist = 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
      if (dist >= MIN_M) out.push(p);
    }
    const lastOut = out[out.length - 1];
    if (lastOut.lat !== animatedLoc.lat || lastOut.lng !== animatedLoc.lng) {
      out.push(animatedLoc);
    }
    return out.map((p): [number, number] => [p.lat, p.lng]);
  }, [safeOrigin, safeHistory, animatedLoc, projectProgress]);

  // Remaining route: always anchored to the (live) destination coords.
  const remainingRoute: [number, number][] = useMemo(
    () => [
      [animatedLoc.lat, animatedLoc.lng],
      [safeDestination.lat, safeDestination.lng],
    ],
    [animatedLoc.lat, animatedLoc.lng, safeDestination.lat, safeDestination.lng]
  );

  const fitPoints = useMemo(
    () => [safeOrigin, ...safeHistory, safeCurrent, safeDestination].filter(isFiniteCoord),
    [safeOrigin, safeHistory, safeCurrent, safeDestination]
  );

  const tile = BASEMAPS[basemap];

  const handleFullscreen = useCallback(() => {
    const el = mapWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  const handleShare = useCallback(() => {
    if (!shareTrackingUrl) return;
    void navigator.clipboard
      .writeText(shareTrackingUrl)
      .then(() => toast({ title: "Link copied", description: "Tracking page URL is on your clipboard." }))
      .catch(() => toast({ title: "Copy failed", description: "Could not access the clipboard.", variant: "destructive" }));
  }, [shareTrackingUrl]);

  // Shared button classes — explicit foreground / border so controls stay
  // legible on both light and dark map tiles.
  const ctrlBtn =
    "h-8 text-xs gap-1 bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 shadow-sm";

  return (
    <MapErrorBoundary>
      <div ref={mapWrapRef} className="relative h-full w-full">
        {showMapControls && (
          <div className="absolute top-2 left-2 right-2 z-[500] flex flex-wrap items-center gap-2 pointer-events-none">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              <Select value={basemap} onValueChange={(v) => setBasemap(v as BasemapId)}>
                <SelectTrigger className="h-8 w-[140px] text-xs bg-white text-slate-900 border border-slate-300 shadow-sm">
                  <SelectValue placeholder="Map" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road">Road map</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="streets">Streets</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                className={ctrlBtn}
                onClick={() => setManualFitNonce((n) => n + 1)}
              >
                <Crosshair className="h-3.5 w-3.5" />
                Recenter
              </Button>
              {onFollowTruckChange && (
                <Button
                  type="button"
                  size="sm"
                  className={
                    followTruck
                      ? "h-8 text-xs gap-1 bg-primary text-primary-foreground border border-primary shadow-sm hover:bg-primary/90"
                      : ctrlBtn
                  }
                  onClick={() => onFollowTruckChange(!followTruck)}
                  aria-pressed={followTruck}
                >
                  <MapPinned className="h-3.5 w-3.5" />
                  Follow
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                className={ctrlBtn + " px-2"}
                onClick={handleFullscreen}
                title="Expand map"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              {shareTrackingUrl && (
                <Button
                  type="button"
                  size="sm"
                  className={ctrlBtn + " px-2"}
                  onClick={handleShare}
                  title="Copy tracking link"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

        <MapContainer
          center={[animatedLoc.lat, animatedLoc.lng]}
          zoom={7}
          className="h-full w-full"
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ background: "#e8e4dc" }}
        >
          <TileLayer key={basemap} attribution={tile.attribution} url={tile.url} />

          <Polyline
            positions={traveledRoute}
            pathOptions={{ color: "#0A2F6B", weight: 4, opacity: 0.9, lineJoin: "round", lineCap: "round" }}
          />

          <Polyline
            positions={remainingRoute}
            pathOptions={{ color: "#0A2F6B", weight: 3, opacity: 0.45, dashArray: "8, 8", lineCap: "round" }}
          />

          <Marker position={[safeOrigin.lat, safeOrigin.lng]} icon={originIcon}>
            <Popup className="tracking-popup">
              <div className="font-semibold text-xs">Origin</div>
            </Popup>
          </Marker>

          <Marker
            key={`dest-${safeDestination.lat.toFixed(5)}-${safeDestination.lng.toFixed(5)}`}
            position={[safeDestination.lat, safeDestination.lng]}
            icon={destinationIcon}
          >
            <Popup className="tracking-popup">
              <div className="font-semibold text-xs">Destination</div>
            </Popup>
          </Marker>

          {accuracyMeters && accuracyMeters > 0 && (
            <Circle
              center={[animatedLoc.lat, animatedLoc.lng]}
              radius={accuracyMeters}
              pathOptions={{ color: "#0A2F6B", fillColor: "#0A2F6B", fillOpacity: 0.08, weight: 1, opacity: 0.4 }}
            />
          )}

          <TruckMarkerWithOpenPopup
            position={[animatedLoc.lat, animatedLoc.lng]}
            icon={stationaryAtHold ? holdIcon : createTruckIcon(effectiveHeading)}
            stationaryAtHold={stationaryAtHold}
            currentLocationLabel={currentLocationLabel}
            accuracyMeters={accuracyMeters}
            signalLabel={signalLabel}
          />

          <MapAutoFit
            points={fitPoints}
            trackingIdForFit={trackingIdForFit}
            mapFitNonce={mapFitNonce}
            manualFitNonce={manualFitNonce}
            basemap={basemap}
          />
          <MapFollowTruck location={animatedLoc} follow={followTruck} />
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
});

TrackingMap.displayName = "TrackingMap";

export default TrackingMap;
