// Free geocoding via OpenStreetMap Nominatim with localStorage cache
import { Coordinates } from "./types";

const CACHE_KEY = "geocode-cache-v1";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

type Cache = Record<string, Coordinates>;

const loadCache = (): Cache => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveCache = (cache: Cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
};

// Common US cities — instant fallback, no network call
const STATIC: Record<string, Coordinates> = {
  "new york": { lat: 40.7128, lng: -74.006 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "chicago": { lat: 41.8781, lng: -87.6298 },
  "houston": { lat: 29.7604, lng: -95.3698 },
  "phoenix": { lat: 33.4484, lng: -112.074 },
  "philadelphia": { lat: 39.9526, lng: -75.1652 },
  "san antonio": { lat: 29.4241, lng: -98.4936 },
  "san diego": { lat: 32.7157, lng: -117.1611 },
  "dallas": { lat: 32.7767, lng: -96.797 },
  "austin": { lat: 30.2672, lng: -97.7431 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "seattle": { lat: 47.6062, lng: -122.3321 },
  "boston": { lat: 42.3601, lng: -71.0589 },
  "miami": { lat: 25.7617, lng: -80.1918 },
  "tampa": { lat: 27.9506, lng: -82.4572 },
  "atlanta": { lat: 33.749, lng: -84.388 },
  "denver": { lat: 39.7392, lng: -104.9903 },
  "washington": { lat: 38.9072, lng: -77.0369 },
  "baltimore": { lat: 39.2904, lng: -76.6122 },
  "charlotte": { lat: 35.2271, lng: -80.8431 },
  "cupertino": { lat: 37.322, lng: -122.0322 },
};

const fuzzyStatic = (query: string): Coordinates | null => {
  const q = query.trim().toLowerCase();
  if (STATIC[q]) return STATIC[q];
  // partial match (handles "Los angele" → "los angeles")
  const hit = Object.keys(STATIC).find(
    (k) => k.startsWith(q) || q.startsWith(k) || k.includes(q) || q.includes(k)
  );
  return hit ? STATIC[hit] : null;
};

/**
 * Geocode a free-form location string (city, address, or "City, State").
 * Returns coordinates or null when not found.
 * Cached in localStorage forever.
 */
export const geocode = async (query: string): Promise<Coordinates | null> => {
  if (!query || !query.trim()) return null;
  const key = query.trim().toLowerCase();

  // 1. Static dictionary
  const fast = fuzzyStatic(key);
  if (fast) return fast;

  // 2. localStorage cache
  const cache = loadCache();
  if (cache[key]) return cache[key];

  // 3. Nominatim
  try {
    const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data || data.length === 0) return null;
    const coords: Coordinates = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return null;
    cache[key] = coords;
    saveCache(cache);
    return coords;
  } catch (err) {
    console.warn("[geocode] failed:", err);
    return null;
  }
};

/** US center fallback */
export const US_CENTER: Coordinates = { lat: 39.8283, lng: -98.5795 };
