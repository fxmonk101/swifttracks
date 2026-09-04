// Free geocoding via OpenStreetMap Nominatim with localStorage cache
import { Coordinates } from "./types";

export const COUNTRY_OPTIONS = [
  { value: "US", label: "United States", lat: 37.0902, lng: -95.7129 },
  { value: "AE", label: "United Arab Emirates", lat: 23.4241, lng: 53.8478 },
  { value: "CA", label: "Canada", lat: 56.1304, lng: -106.3468 },
  { value: "GB", label: "United Kingdom", lat: 55.3781, lng: -3.436 },
  { value: "SA", label: "Saudi Arabia", lat: 23.8859, lng: 45.0792 },
  { value: "QA", label: "Qatar", lat: 25.3548, lng: 51.1839 },
  { value: "KW", label: "Kuwait", lat: 29.3117, lng: 47.4818 },
  { value: "OM", label: "Oman", lat: 21.4735, lng: 55.9754 },
  { value: "BH", label: "Bahrain", lat: 25.9304, lng: 50.6378 },
  { value: "IN", label: "India", lat: 20.5937, lng: 78.9629 },
  { value: "CN", label: "China", lat: 35.8617, lng: 104.1954 },
  { value: "AU", label: "Australia", lat: -25.2744, lng: 133.7751 },
  { value: "DE", label: "Germany", lat: 51.1657, lng: 10.4515 },
  { value: "FR", label: "France", lat: 46.2276, lng: 2.2137 },
  { value: "AF", label: "Afghanistan", lat: 33.9391, lng: 67.71 },
  { value: "AL", label: "Albania", lat: 41.1533, lng: 20.1683 },
  { value: "DZ", label: "Algeria", lat: 28.0339, lng: 1.6596 },
  { value: "AR", label: "Argentina", lat: -38.4161, lng: -63.6167 },
  { value: "AM", label: "Armenia", lat: 40.0691, lng: 45.0382 },
  { value: "AT", label: "Austria", lat: 47.5162, lng: 14.5501 },
  { value: "AZ", label: "Azerbaijan", lat: 40.1431, lng: 47.5769 },
  { value: "BD", label: "Bangladesh", lat: 23.685, lng: 90.3563 },
  { value: "BY", label: "Belarus", lat: 53.7098, lng: 27.9534 },
  { value: "BE", label: "Belgium", lat: 50.5039, lng: 4.4699 },
  { value: "BJ", label: "Benin", lat: 9.3077, lng: 2.3158 },
  { value: "BO", label: "Bolivia", lat: -16.2902, lng: -63.5887 },
  { value: "BA", label: "Bosnia and Herzegovina", lat: 43.9159, lng: 17.6791 },
  { value: "BW", label: "Botswana", lat: -22.3285, lng: 24.6849 },
  { value: "BR", label: "Brazil", lat: -14.235, lng: -51.9253 },
  { value: "BG", label: "Bulgaria", lat: 42.7339, lng: 25.4858 },
  { value: "BF", label: "Burkina Faso", lat: 12.2383, lng: -1.5616 },
  { value: "KH", label: "Cambodia", lat: 12.5657, lng: 104.991 },
  { value: "CM", label: "Cameroon", lat: 7.3697, lng: 12.3547 },
  { value: "CL", label: "Chile", lat: -35.6751, lng: -71.543 },
  { value: "CO", label: "Colombia", lat: 4.5709, lng: -74.2973 },
  { value: "CR", label: "Costa Rica", lat: 9.7489, lng: -83.7534 },
  { value: "HR", label: "Croatia", lat: 45.1, lng: 15.2 },
  { value: "CU", label: "Cuba", lat: 21.5218, lng: -77.7812 },
  { value: "CY", label: "Cyprus", lat: 35.1264, lng: 33.4299 },
  { value: "CZ", label: "Czechia", lat: 49.8175, lng: 15.473 },
  { value: "DK", label: "Denmark", lat: 56.2639, lng: 9.5018 },
  { value: "DO", label: "Dominican Republic", lat: 18.7357, lng: -70.1627 },
  { value: "EC", label: "Ecuador", lat: -1.8312, lng: -78.1834 },
  { value: "EG", label: "Egypt", lat: 26.8206, lng: 30.8025 },
  { value: "SV", label: "El Salvador", lat: 13.7942, lng: -88.8965 },
  { value: "EE", label: "Estonia", lat: 58.5953, lng: 25.0136 },
  { value: "ET", label: "Ethiopia", lat: 9.145, lng: 40.4897 },
  { value: "FI", label: "Finland", lat: 61.9241, lng: 25.7482 },
  { value: "GA", label: "Gabon", lat: -0.8037, lng: 11.6094 },
  { value: "GE", label: "Georgia", lat: 42.3154, lng: 43.3569 },
  { value: "GH", label: "Ghana", lat: 7.9465, lng: -1.0232 },
  { value: "GR", label: "Greece", lat: 39.0742, lng: 21.8243 },
  { value: "GT", label: "Guatemala", lat: 15.7835, lng: -90.2308 },
  { value: "HN", label: "Honduras", lat: 15.2, lng: -86.2419 },
  { value: "HK", label: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  { value: "HU", label: "Hungary", lat: 47.1625, lng: 19.5033 },
  { value: "IS", label: "Iceland", lat: 64.9631, lng: -19.0208 },
  { value: "ID", label: "Indonesia", lat: -0.7893, lng: 113.9213 },
  { value: "IR", label: "Iran", lat: 32.4279, lng: 53.688 },
  { value: "IQ", label: "Iraq", lat: 33.2232, lng: 43.6793 },
  { value: "IE", label: "Ireland", lat: 53.1424, lng: -7.6921 },
  { value: "IL", label: "Israel", lat: 31.0461, lng: 34.8516 },
  { value: "IT", label: "Italy", lat: 41.8719, lng: 12.5674 },
  { value: "CI", label: "Ivory Coast", lat: 7.54, lng: -5.5471 },
  { value: "JM", label: "Jamaica", lat: 18.1096, lng: -77.2975 },
  { value: "JP", label: "Japan", lat: 36.2048, lng: 138.2529 },
  { value: "JO", label: "Jordan", lat: 30.5852, lng: 36.2384 },
  { value: "KZ", label: "Kazakhstan", lat: 48.0196, lng: 66.9237 },
  { value: "KE", label: "Kenya", lat: -0.0236, lng: 37.9062 },
  { value: "LV", label: "Latvia", lat: 56.8796, lng: 24.6032 },
  { value: "LB", label: "Lebanon", lat: 33.8547, lng: 35.8623 },
  { value: "LY", label: "Libya", lat: 26.3351, lng: 17.2283 },
  { value: "LT", label: "Lithuania", lat: 55.1694, lng: 23.8813 },
  { value: "LU", label: "Luxembourg", lat: 49.8153, lng: 6.1296 },
  { value: "MY", label: "Malaysia", lat: 4.2105, lng: 101.9758 },
  { value: "MT", label: "Malta", lat: 35.9375, lng: 14.3754 },
  { value: "MX", label: "Mexico", lat: 23.6345, lng: -102.5528 },
  { value: "MD", label: "Moldova", lat: 47.4116, lng: 28.3699 },
  { value: "MA", label: "Morocco", lat: 31.7917, lng: -7.0926 },
  { value: "MZ", label: "Mozambique", lat: -18.6657, lng: 35.5296 },
  { value: "MM", label: "Myanmar", lat: 21.9162, lng: 95.956 },
  { value: "NA", label: "Namibia", lat: -22.9576, lng: 18.4904 },
  { value: "NP", label: "Nepal", lat: 28.3949, lng: 84.124 },
  { value: "NL", label: "Netherlands", lat: 52.1326, lng: 5.2913 },
  { value: "NZ", label: "New Zealand", lat: -40.9006, lng: 174.886 },
  { value: "NI", label: "Nicaragua", lat: 12.8654, lng: -85.2072 },
  { value: "NG", label: "Nigeria", lat: 9.082, lng: 8.6753 },
  { value: "NO", label: "Norway", lat: 60.472, lng: 8.4689 },
  { value: "PK", label: "Pakistan", lat: 30.3753, lng: 69.3451 },
  { value: "PA", label: "Panama", lat: 8.538, lng: -80.7821 },
  { value: "PY", label: "Paraguay", lat: -23.4425, lng: -58.4438 },
  { value: "PE", label: "Peru", lat: -9.19, lng: -75.0152 },
  { value: "PH", label: "Philippines", lat: 12.8797, lng: 121.774 },
  { value: "PL", label: "Poland", lat: 51.9194, lng: 19.1451 },
  { value: "PT", label: "Portugal", lat: 39.3999, lng: -8.2245 },
  { value: "RO", label: "Romania", lat: 45.9432, lng: 24.9668 },
  { value: "RU", label: "Russia", lat: 61.524, lng: 105.3188 },
  { value: "SN", label: "Senegal", lat: 14.4974, lng: -14.4524 },
  { value: "RS", label: "Serbia", lat: 44.0165, lng: 21.0059 },
  { value: "SG", label: "Singapore", lat: 1.3521, lng: 103.8198 },
  { value: "SK", label: "Slovakia", lat: 48.669, lng: 19.699 },
  { value: "SI", label: "Slovenia", lat: 46.1512, lng: 14.9955 },
  { value: "ZA", label: "South Africa", lat: -30.5595, lng: 22.9375 },
  { value: "KR", label: "South Korea", lat: 35.9078, lng: 127.7669 },
  { value: "ES", label: "Spain", lat: 40.4637, lng: -3.7492 },
  { value: "LK", label: "Sri Lanka", lat: 7.8731, lng: 80.7718 },
  { value: "SE", label: "Sweden", lat: 60.1282, lng: 18.6435 },
  { value: "CH", label: "Switzerland", lat: 46.8182, lng: 8.2275 },
  { value: "TW", label: "Taiwan", lat: 23.6978, lng: 120.9605 },
  { value: "TZ", label: "Tanzania", lat: -6.369, lng: 34.8888 },
  { value: "TH", label: "Thailand", lat: 15.87, lng: 100.9925 },
  { value: "TN", label: "Tunisia", lat: 33.8869, lng: 9.5375 },
  { value: "TR", label: "Turkiye", lat: 38.9637, lng: 35.2433 },
  { value: "UG", label: "Uganda", lat: 1.3733, lng: 32.2903 },
  { value: "UA", label: "Ukraine", lat: 48.3794, lng: 31.1656 },
  { value: "UY", label: "Uruguay", lat: -32.5228, lng: -55.7658 },
  { value: "UZ", label: "Uzbekistan", lat: 41.3775, lng: 64.5853 },
  { value: "VE", label: "Venezuela", lat: 6.4238, lng: -66.5897 },
  { value: "VN", label: "Vietnam", lat: 14.0583, lng: 108.2772 },
  { value: "YE", label: "Yemen", lat: 15.5527, lng: 48.5164 },
  { value: "ZM", label: "Zambia", lat: -13.1339, lng: 27.8493 },
  { value: "ZW", label: "Zimbabwe", lat: -19.0154, lng: 29.1549 },
] as const;

export type CountryOption = (typeof COUNTRY_OPTIONS)[number];

export const getCountryName = (country?: string | null) => {
  const normalized = country?.trim();
  if (!normalized) return "United States";
  const upper = normalized.toUpperCase();
  return (
    COUNTRY_OPTIONS.find((option) => option.value === upper)?.label ||
    COUNTRY_OPTIONS.find((option) => option.label.toLowerCase() === normalized.toLowerCase())?.label ||
    normalized
  );
};

/** Centroid of a country — used as a last-resort fallback so any country is mappable. */
export const getCountryCenter = (country?: string | null): Coordinates | null => {
  const normalized = country?.trim();
  if (!normalized) return null;
  const upper = normalized.toUpperCase();
  const match =
    COUNTRY_OPTIONS.find((option) => option.value === upper) ||
    COUNTRY_OPTIONS.find((option) => option.label.toLowerCase() === normalized.toLowerCase());
  return match ? { lat: match.lat, lng: match.lng } : null;
};

export const buildLocationQuery = (address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string | null;
}) => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    getCountryName(address.country),
  ].filter(Boolean);

  return parts.join(", ");
};

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
  // Canadian cities
  "55-383 columbia street west kamloops bc": { lat: 50.6764, lng: -120.3396 },
  "55-383 columbia street west kamloops": { lat: 50.6764, lng: -120.3396 },
  "55-383 columbia st w kamloops bc": { lat: 50.6764, lng: -120.3396 },
  "kamloops": { lat: 50.6745, lng: -120.3273 },
  "kamloops bc": { lat: 50.6745, lng: -120.3273 },
  "kamloops, bc": { lat: 50.6745, lng: -120.3273 },
  "kamloops, british columbia": { lat: 50.6745, lng: -120.3273 },
  "burnaby": { lat: 49.2827, lng: -122.9955 },
  "burnaby bc": { lat: 49.2827, lng: -122.9955 },
  "burnaby, bc": { lat: 49.2827, lng: -122.9955 },
  "burnaby, british columbia": { lat: 49.2827, lng: -122.9955 },
  "7552 chutter st burnaby bc": { lat: 49.2827, lng: -122.9955 },
  "7552 chutter st burnaby": { lat: 49.2827, lng: -122.9955 },
  "7552 chutter street burnaby bc": { lat: 49.2827, lng: -122.9955 },
  "7552 chutter street burnaby": { lat: 49.2827, lng: -122.9955 },
  "calgary": { lat: 51.0537, lng: -114.0823 },
  "calgary ab": { lat: 51.0537, lng: -114.0823 },
  "calgary, ab": { lat: 51.0537, lng: -114.0823 },
  "calgary, alberta": { lat: 51.0537, lng: -114.0823 },
  "309-525 3 ave sw calgary ab": { lat: 51.0537, lng: -114.0823 },
  "309-525 3 ave sw calgary": { lat: 51.0537, lng: -114.0823 },
  "309-525 3 avenue sw calgary ab": { lat: 51.0537, lng: -114.0823 },
  "309-525 3 avenue sw calgary": { lat: 51.0537, lng: -114.0823 },
  "vancouver": { lat: 49.2827, lng: -123.1207 },
  "vancouver bc": { lat: 49.2827, lng: -123.1207 },
  "vancouver, bc": { lat: 49.2827, lng: -123.1207 },
  "vancouver, british columbia": { lat: 49.2827, lng: -123.1207 },
  "toronto": { lat: 43.6629, lng: -79.3957 },
  "toronto on": { lat: 43.6629, lng: -79.3957 },
  "toronto, on": { lat: 43.6629, lng: -79.3957 },
  "toronto, ontario": { lat: 43.6629, lng: -79.3957 },
  "montreal": { lat: 45.5017, lng: -73.5673 },
  "montreal qc": { lat: 45.5017, lng: -73.5673 },
  "montreal, qc": { lat: 45.5017, lng: -73.5673 },
  "montreal, quebec": { lat: 45.5017, lng: -73.5673 },
  // Virginia locations
  "chesapeake": { lat: 36.8629, lng: -76.2775 },
  "chesapeake va": { lat: 36.8629, lng: -76.2775 },
  "chesapeake, va": { lat: 36.8629, lng: -76.2775 },
  "chesapeake, virginia": { lat: 36.8629, lng: -76.2775 },
  "3920 dismal swamp trail chesapeake va": { lat: 36.8629, lng: -76.2775 },
  "3920 dismal swamp trail chesapeake": { lat: 36.8629, lng: -76.2775 },
  "huddleston": { lat: 37.5204, lng: -78.9667 },
  "huddleston va": { lat: 37.5204, lng: -78.9667 },
  "huddleston, va": { lat: 37.5204, lng: -78.9667 },
  "huddleston, virginia": { lat: 37.5204, lng: -78.9667 },
  "3247 island cree rd huddleston va": { lat: 37.5204, lng: -78.9667 },
  "3247 island cree rd huddleston": { lat: 37.5204, lng: -78.9667 },
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
