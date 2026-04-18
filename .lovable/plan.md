
## Root cause

The tracking page goes blank because **`react-leaflet@5.0.0` requires React 19**, but this project uses React 18. That mismatch crashes `MapContainerComponent` with `render2 is not a function` at the `Context.Consumer`. Once the map throws, the whole `<TrackPage>` unmounts → blank screen. The shipment data itself loads fine (Supabase returns 200, realtime is enabled).

## Fix plan

### 1. Downgrade react-leaflet to v4 (compatible with React 18)
- `react-leaflet`: `^5.0.0` → `^4.2.1`
- Keep `leaflet@^1.9.4` as is.
- No API changes needed — `MapContainer`, `TileLayer`, `Marker`, `Polyline`, `Popup`, `useMap` work identically.

### 2. Add an error boundary around the map (`src/components/TrackingMap.tsx`)
Wrap the map body in a small error boundary so any future Leaflet hiccup never blanks the page again — instead it shows a "Map unavailable" fallback while shipment details still render.

### 3. Make TrackPage crash-proof
- Guarantee `currentLocation`, `origin`, `destination` are always finite numbers before mounting `<TrackingMap>`.
- If coordinates can't be resolved, show the details panel + a "Map will appear once GPS is set" placeholder instead of mounting Leaflet at all.
- Improve `getCoords` to also handle the typo "Los angele" → matches "Los Angeles".

### 4. Confirm realtime + status updates flow
Realtime is already enabled (migration `20260417010658`) and `TrackPage` already subscribes to `UPDATE` on `shipments` and `INSERT` on `shipment_events`. Once the crash is gone, admin status changes from `/admin` will flow live to `/track/:id` automatically. I'll smoke-test this end-to-end with the existing tracking ID `ST-2026-KWNVA1VQ`.

### 5. End-to-end test
1. Open `/track/ST-2026-KWNVA1VQ` → confirm details + map render.
2. From `/admin`, set GPS to a NYC preset → confirm truck animates on the tracking tab.
3. From `/admin`, change status to `IN_TRANSIT` with a description → confirm timeline + status badge update live (no refresh).

## Files to change
- `package.json` — pin `react-leaflet@^4.2.1`
- `src/components/TrackingMap.tsx` — add error boundary, no API changes
- `src/pages/TrackPage.tsx` — guard coordinates before mounting map, improve `getCoords`

No DB migrations needed.
