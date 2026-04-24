<?php
/**
 * CargoMasters — Professional Shipment Tracker
 * Hooked into wp_footer, only loads on the 'track-form' page.
 *
 * BUGS FIXED:
 *  1. lat/lng stored as strings → cast to float before arithmetic & JSON encoding
 *  2. $lat="0" falsely triggered fallback (empty-string check replaced with is_numeric)
 *  3. leaflet-ant-path CDN URL was wrong/unused → removed; replaced with native L.polyline
 *  4. <style>/@keyframes injected inside divIcon HTML → moved to page <style> block
 *  5. marker.openPopup() called inside every geocode callback → re-opened popup even
 *     when user deliberately closed it; fixed with a popupUserClosed flag
 *  6. map.panTo() fired every animation frame → jittery on mobile; now only on step start
 *  7. completedIdx hard-coded to 3 in JS but derived from PHP $steps_done → now passed
 *     as a JS constant so they are always in sync
 *  8. XSS: popup content built with raw template-literal string injection → addr/time
 *     now sanitised via escapeHtml() helper
 *  9. No null-guard on DOM elements → getElementById calls now guarded throughout
 * 10. $steps_done could equal route.length-1 on short routes → clamped in PHP & JS
 *
 * NEW FEATURES:
 *  A. Dark / Light / Satellite tile switcher (preserved from v2)
 *  B. Share-tracking button — copies page URL to clipboard with toast feedback
 *  C. Fullscreen toggle (Fullscreen API with graceful emoji fallback)
 *  D. Re-center / "Follow Truck" toggle with ARIA pressed state
 *  E. Offline / network-error banner — detects navigator.onLine and fetch failures
 *  F. Delivered state — truck icon swaps, progress hits 100%, final timeline row goes
 *     green, and a delivery toast fires
 *  G. ETA countdown — live ticking "Xh Ym remaining" computed from $eta_iso
 *  H. Print / export summary button (uses window.print + @media print styles)
 *  I. Accessibility: ARIA labels, roles, aria-live on dynamic regions, focus-visible rings
 *  J. Reduced-motion: @media (prefers-reduced-motion) collapses all animations
 *  K. IIFE wrapper — all JS is scoped; no globals pollute the page
 *  L. beforeunload cleanup — cancels pending rAF to avoid console errors in SPAs
 */

add_action('wp_footer', function () {
    if (!is_page('track-form')) return;

    /* ── Pull meta ──────────────────────────────────────────────────────── */
    $post_id     = get_the_ID();
    $lat_raw     = get_post_meta($post_id, 'shipment_lat',          true);
    $lng_raw     = get_post_meta($post_id, 'shipment_lng',          true);
    $status      = get_post_meta($post_id, 'shipment_status',       true);
    $tracking_no = get_post_meta($post_id, 'shipment_tracking_no',  true);
    $origin      = get_post_meta($post_id, 'shipment_origin',       true);
    $destination = get_post_meta($post_id, 'shipment_destination',  true);
    $eta_raw     = get_post_meta($post_id, 'shipment_eta',          true); // e.g. "2025-08-10"
    $weight      = get_post_meta($post_id, 'shipment_weight',       true);
    $steps_done  = (int) get_post_meta($post_id, 'shipment_steps_done', true);

    /* ── BUG FIX 1 & 2: cast to float; is_numeric so "0" won't fall back ── */
    $lat = is_numeric($lat_raw) ? (float) $lat_raw : 25.9395;
    $lng = is_numeric($lng_raw) ? (float) $lng_raw : -97.5167;

    if (!$status)       $status      = 'In Transit';
    if (!$tracking_no)  $tracking_no = 'N/A';
    if (!$origin)       $origin      = 'Houston, TX';
    if (!$destination)  $destination = 'Dallas, TX';
    if (!$weight)       $weight      = '3.2 kg';

    /* ── ETA ────────────────────────────────────────────────────────────── */
    $eta_ts      = $eta_raw ? strtotime($eta_raw) : strtotime('+2 days');
    if (!$eta_ts) $eta_ts = strtotime('+2 days');   // guard strtotime failure
    $eta_display = date('D, M j', $eta_ts);
    $eta_iso     = date('c', $eta_ts);              // ISO 8601 for JS Date()

    /* ── Route ─────────────────────────────────────────────────────────── */
    $route = [
        [$lat,          $lng],
        [$lat + 0.0015, $lng + 0.002],
        [$lat + 0.003,  $lng + 0.004],
        [$lat + 0.0045, $lng + 0.006],
        [$lat + 0.006,  $lng + 0.008],
        [$lat + 0.0075, $lng + 0.010],
        [$lat + 0.009,  $lng + 0.012],
    ];
    $route_len = count($route);

    /* ── BUG FIX 10: clamp steps_done ──────────────────────────────────── */
    if ($steps_done <= 0)               $steps_done = 3;
    if ($steps_done >= $route_len - 1)  $steps_done = $route_len - 2;

    /* ── Status → colour mapping ─────────────────────────────────────── */
    $status_map = [
        'In Transit'        => ['#0d2e1a', '#34d678', '#1a5c32'],
        'Out for Delivery'  => ['#0a2040', '#1a8cff', '#1a4080'],
        'Delivered'         => ['#1a2040', '#a0aad0', '#2a3260'],
        'Delayed'           => ['#2e1a0a', '#ff8c34', '#7a3a10'],
        'Exception'         => ['#2e0a0a', '#ff4040', '#7a1010'],
    ];
    [$ss_bg, $ss_color, $ss_border] = $status_map[$status] ?? $status_map['In Transit'];
    ?>

<!-- ── Leaflet (pinned, integrity hashes) ──────────────────────────────── -->
<link rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLEo="
        crossorigin=""></script>

<!-- ── BUG FIX 4: ALL keyframes live here, never inside innerHTML ──────── -->
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* FEATURE J: respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration:.01ms!important; transition-duration:.01ms!important }
}

@keyframes pulse-dot  { 0%,100%{box-shadow:0 0 0 3px rgba(52,214,120,.25)} 50%{box-shadow:0 0 0 6px rgba(52,214,120,.06)} }
@keyframes pulse-icon { 0%,100%{box-shadow:0 0 0 0   rgba(26,140,255,.3)}  50%{box-shadow:0 0 0 8px rgba(26,140,255,0)} }
@keyframes ripple     { 0%{transform:scale(.8);opacity:1} 100%{transform:scale(2);opacity:0} }
@keyframes slide-in   { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fade-out   { from{opacity:1} to{opacity:0} }

*{box-sizing:border-box;margin:0;padding:0}

/* ── Shell ── */
#cm-tracker-shell{
    font-family:'DM Sans',sans-serif;
    background:#0b0f1a;color:#e8eaf0;
    border-radius:16px;overflow:hidden;
    box-shadow:0 24px 80px rgba(0,0,0,.6);
    max-width:960px;margin:24px auto;
}

/* ── Header ── */
#cm-header{
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
    padding:16px 22px;background:#111627;border-bottom:1px solid #1e2540;
}
.cm-brand{font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff;display:flex;align-items:center;gap:8px}
.cm-track-num{font-family:'JetBrains Mono',monospace;font-size:12px;color:#6b7ab5;background:#1a2040;padding:6px 12px;border-radius:6px;letter-spacing:.04em}
.cm-status-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:6px 14px;border-radius:99px;
    background:<?php echo esc_attr($ss_bg); ?>;color:<?php echo esc_attr($ss_color); ?>;border:1px solid <?php echo esc_attr($ss_border); ?>}
.cm-dot{width:7px;height:7px;border-radius:50%;background:currentColor;animation:pulse-dot 1.8s ease-in-out infinite}

/* Header action buttons */
.cm-hdr-actions{display:flex;gap:8px;align-items:center}
.cm-hdr-btn{
    display:inline-flex;align-items:center;gap:5px;
    background:#1a2040;border:1px solid #2a3260;color:#8892c0;
    font-size:11px;font-weight:600;padding:6px 11px;border-radius:7px;cursor:pointer;
    transition:background .15s,color .15s;font-family:inherit;
}
.cm-hdr-btn:hover{background:#222c54;color:#fff}
.cm-hdr-btn:focus-visible{outline:2px solid #1a8cff;outline-offset:2px}

/* ── Info strip ── */
#cm-info-strip{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #1e2540}
.cm-info-cell{padding:13px 18px;border-right:1px solid #1e2540}
.cm-info-cell:last-child{border-right:none}
.cm-info-cell .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#4a5480;font-weight:600;margin-bottom:3px}
.cm-info-cell .val{font-size:13px;font-weight:600;color:#c8ccde}
#cm-eta-countdown{font-size:11px;color:#1a8cff;font-weight:600;margin-top:2px;font-family:'JetBrains Mono',monospace}

/* ── Map ── */
#cm-map-wrap{position:relative}
#map{width:100%;height:420px;background:#141929}

/* Leaflet theming */
.leaflet-control-zoom a               {background:#1a2040!important;color:#8892c0!important;border-color:#2a3260!important}
.leaflet-control-zoom a:hover         {background:#222c54!important;color:#fff!important}
.leaflet-control-layers               {background:#1a2040!important;border-color:#2a3260!important;color:#c8ccde!important}
.leaflet-control-layers label         {color:#c8ccde!important}
.leaflet-control-attribution          {background:rgba(11,15,26,.75)!important;color:#3a4470!important;font-size:9px!important}
.leaflet-control-attribution a        {color:#4a5a90!important}
.leaflet-popup-content-wrapper        {background:#111627!important;color:#e8eaf0!important;border:1px solid #2a3260!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,.6)!important;padding:0!important}
.leaflet-popup-tip                    {background:#111627!important}
.leaflet-popup-content               {margin:0!important}

/* Custom popup */
.cm-popup{padding:14px 18px;min-width:220px}
.cm-popup .ptitle{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#4a5480;font-weight:700;margin-bottom:10px}
.cm-popup .prow{display:flex;gap:8px;margin-bottom:7px;font-size:12px;align-items:flex-start}
.cm-popup .pk{color:#5a6a9a;min-width:58px;font-weight:500;flex-shrink:0}
.cm-popup .pv{color:#d0d4e8;font-weight:500;line-height:1.4}
.cm-popup .pgps{margin-top:10px;padding:6px 10px;background:#0d2e1a;border-radius:6px;color:#34d678;font-size:11px;font-weight:600;text-align:center}

/* Map overlays */
#cm-live-badge{
    position:absolute;top:14px;left:14px;z-index:999;
    display:flex;align-items:center;gap:6px;
    background:rgba(11,15,26,.82);backdrop-filter:blur(6px);
    border:1px solid #2a3260;border-radius:8px;padding:7px 13px;
    font-size:11px;font-weight:700;color:#34d678;letter-spacing:.08em;text-transform:uppercase
}
#cm-live-badge .dot{width:6px;height:6px;border-radius:50%;background:#34d678;animation:pulse-dot 1.4s ease-in-out infinite}

#cm-speed-badge{
    position:absolute;top:14px;right:54px;z-index:999;
    background:rgba(11,15,26,.82);backdrop-filter:blur(6px);
    border:1px solid #2a3260;border-radius:8px;padding:7px 13px;
    font-size:11px;color:#8892c0;font-weight:500
}
#cm-speed-badge span{color:#fff;font-weight:700}

#cm-fs-btn{
    position:absolute;top:14px;right:10px;z-index:999;
    background:rgba(11,15,26,.82);backdrop-filter:blur(6px);
    border:1px solid #2a3260;border-radius:8px;padding:7px 9px;
    font-size:14px;cursor:pointer;color:#8892c0;line-height:1;
}
#cm-fs-btn:hover{background:rgba(26,44,84,.9);color:#fff}
#cm-fs-btn:focus-visible{outline:2px solid #1a8cff;outline-offset:2px}

/* Map controls group */
.cm-map-btn-group{position:absolute;bottom:14px;left:14px;z-index:999;display:flex;flex-direction:column;gap:6px}
.cm-map-btn{
    display:inline-flex;align-items:center;gap:6px;
    background:rgba(11,15,26,.85);backdrop-filter:blur(6px);
    border:1px solid #2a3260;color:#c8ccde;
    font-size:11px;font-weight:600;padding:7px 13px;border-radius:8px;cursor:pointer;
    transition:background .15s,color .15s;white-space:nowrap;font-family:inherit;
}
.cm-map-btn:hover{background:rgba(26,44,84,.9);color:#fff}
.cm-map-btn.active{background:rgba(26,140,255,.18);border-color:#1a8cff;color:#1a8cff}
.cm-map-btn:focus-visible{outline:2px solid #1a8cff;outline-offset:2px}

/* FEATURE E: Offline banner */
#cm-offline-banner{
    display:none;align-items:center;gap:10px;
    padding:10px 20px;background:#2e1a0a;border-top:1px solid #7a3a10;
    font-size:12px;font-weight:600;color:#ff8c34;
}

/* Address bar */
#cm-address-bar{
    padding:11px 22px;background:#0b0f1a;border-top:1px solid #1e2540;
    font-size:12px;color:#4a5480;display:flex;align-items:center;gap:8px
}
#cm-current-addr{color:#8892c0;font-weight:500}

/* ── Progress ── */
#cm-progress-section{padding:18px 22px;background:#0e1320;border-top:1px solid #1e2540}
#cm-progress-header {display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
#cm-progress-label  {font-size:11px;color:#5a6a9a;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
#cm-progress-pct    {font-family:'JetBrains Mono',monospace;font-size:13px;color:#34d678;font-weight:600}
#cm-progress-track  {width:100%;height:6px;background:#1a2040;border-radius:99px;overflow:hidden}
#cm-progress-fill   {height:100%;width:0%;background:linear-gradient(90deg,#1a8cff,#34d678);border-radius:99px;transition:width .35s ease;position:relative}
#cm-progress-fill::after{content:'';position:absolute;right:-1px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:#34d678;box-shadow:0 0 0 3px rgba(52,214,120,.25)}

/* ── Timeline ── */
#cm-timeline   {padding:0 22px 18px;background:#0e1320}
.cm-tl-row     {display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid #161c30;font-size:13px}
.cm-tl-row:last-child{border-bottom:none}
.cm-tl-icon    {width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px}
.cm-tl-icon.done   {background:#0d2e1a;color:#34d678}
.cm-tl-icon.active {background:#0a1e3a;color:#1a8cff;animation:pulse-icon 1.8s ease-in-out infinite}
.cm-tl-icon.pending{background:#141929;color:#3a4470}
.cm-tl-body    {flex:1}
.cm-tl-title   {font-weight:600;color:#c8ccde;margin-bottom:2px}
.cm-tl-title.pending{color:#3a4470}
.cm-tl-meta    {font-size:11px;color:#4a5480}
.cm-tl-time    {font-family:'JetBrains Mono',monospace;font-size:11px;color:#4a5480;white-space:nowrap;margin-top:4px}

/* ── Toast ── */
#cm-toast{
    position:fixed;bottom:30px;left:50%;transform:translateX(-50%);z-index:99999;
    background:#111627;border:1px solid #2a3260;border-radius:10px;
    padding:12px 22px;font-size:13px;font-weight:600;color:#e8eaf0;
    box-shadow:0 8px 32px rgba(0,0,0,.6);pointer-events:none;
    opacity:0;white-space:nowrap;
}
#cm-toast.show{animation:slide-in .3s ease forwards}
#cm-toast.hide{animation:fade-out .4s ease forwards}

/* ── Print ── */
@media print {
    #cm-map-wrap,#cm-progress-section,#cm-address-bar,#cm-live-badge,
    #cm-speed-badge,#cm-fs-btn,.cm-map-btn-group,#cm-offline-banner,
    .cm-hdr-actions{display:none!important}
    #cm-tracker-shell{box-shadow:none;border:1px solid #ccc;max-width:100%;border-radius:0}
    body{background:#fff;color:#000}
}

/* ── Responsive ── */
@media(max-width:640px){
    #cm-info-strip{grid-template-columns:1fr 1fr}
    .cm-info-cell:nth-child(2){border-right:none}
    #map{height:300px}
    #cm-header{flex-direction:column;align-items:flex-start}
    .cm-hdr-actions{flex-wrap:wrap}
}
</style>

<!-- ── HTML ──────────────────────────────────────────────────────────────── -->
<div id="cm-tracker-shell" role="region" aria-label="Shipment Tracker">

    <!-- Header -->
    <div id="cm-header">
        <div class="cm-brand" aria-label="CargoMasters">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a8cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            CargoMasters
        </div>
        <div class="cm-track-num" aria-label="Tracking number"><?php echo esc_html($tracking_no); ?></div>
        <div class="cm-status-pill" role="status" aria-live="polite">
            <span class="cm-dot" aria-hidden="true"></span>
            <?php echo esc_html($status); ?>
        </div>
        <!-- FEATURE B & H -->
        <div class="cm-hdr-actions">
            <button class="cm-hdr-btn" id="cm-share-btn" aria-label="Copy tracking link to clipboard">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
            </button>
            <button class="cm-hdr-btn" id="cm-print-btn" aria-label="Print tracking summary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print
            </button>
        </div>
    </div>

    <!-- Info strip -->
    <div id="cm-info-strip">
        <div class="cm-info-cell">
            <div class="lbl">Origin</div>
            <div class="val"><?php echo esc_html($origin); ?></div>
        </div>
        <div class="cm-info-cell">
            <div class="lbl">Destination</div>
            <div class="val"><?php echo esc_html($destination); ?></div>
        </div>
        <div class="cm-info-cell">
            <div class="lbl">Est. Delivery</div>
            <div class="val"><?php echo esc_html($eta_display); ?></div>
            <!-- FEATURE G: live ETA countdown -->
            <div id="cm-eta-countdown" aria-live="polite"></div>
        </div>
        <div class="cm-info-cell">
            <div class="lbl">Weight</div>
            <div class="val"><?php echo esc_html($weight); ?></div>
        </div>
    </div>

    <!-- Map -->
    <div id="cm-map-wrap">
        <div id="cm-live-badge" aria-hidden="true"><span class="dot"></span>Live Tracking</div>
        <div id="cm-speed-badge" aria-hidden="true">Speed: <span id="cm-speed-val">—</span> km/h</div>
        <!-- FEATURE C -->
        <button id="cm-fs-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen">⛶</button>
        <div id="map" aria-label="Live shipment map"></div>
        <!-- FEATURE D -->
        <div class="cm-map-btn-group" role="group" aria-label="Map controls">
            <button class="cm-map-btn active" id="cm-follow-btn" aria-pressed="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Follow Truck
            </button>
        </div>
    </div>

    <!-- FEATURE E: Offline banner -->
    <div id="cm-offline-banner" role="alert" aria-live="assertive">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>
        No network connection — live updates paused. Reconnecting…
    </div>

    <!-- Address bar -->
    <div id="cm-address-bar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Current location:&nbsp;<span id="cm-current-addr" aria-live="polite">Locating…</span>
    </div>

    <!-- Progress -->
    <div id="cm-progress-section">
        <div id="cm-progress-header">
            <div id="cm-progress-label">Delivery Progress</div>
            <div id="cm-progress-pct" aria-live="polite">0%</div>
        </div>
        <div id="cm-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Delivery progress">
            <div id="cm-progress-fill"></div>
        </div>
    </div>

    <!-- Timeline -->
    <div id="cm-timeline" role="list" aria-label="Shipment timeline">
        <div class="cm-tl-row" role="listitem">
            <div class="cm-tl-icon done" aria-label="Completed">✓</div>
            <div class="cm-tl-body">
                <div class="cm-tl-title">Package Picked Up</div>
                <div class="cm-tl-meta"><?php echo esc_html($origin); ?> Facility</div>
            </div>
            <div class="cm-tl-time">08:14 AM</div>
        </div>
        <div class="cm-tl-row" role="listitem">
            <div class="cm-tl-icon done" aria-label="Completed">✓</div>
            <div class="cm-tl-body">
                <div class="cm-tl-title">Departed Sorting Hub</div>
                <div class="cm-tl-meta">Regional Distribution Center</div>
            </div>
            <div class="cm-tl-time">10:47 AM</div>
        </div>
        <div class="cm-tl-row" role="listitem">
            <div class="cm-tl-icon done" aria-label="Completed">✓</div>
            <div class="cm-tl-body">
                <div class="cm-tl-title">In Transit</div>
                <div class="cm-tl-meta">On route to destination</div>
            </div>
            <div class="cm-tl-time">12:30 PM</div>
        </div>
        <div class="cm-tl-row" role="listitem" id="cm-tl-row-active">
            <div class="cm-tl-icon active" aria-label="In progress">⟳</div>
            <div class="cm-tl-body">
                <div class="cm-tl-title">Out for Delivery</div>
                <div class="cm-tl-meta" id="cm-tl-live-addr">Updating location…</div>
            </div>
            <div class="cm-tl-time" id="cm-tl-live-time">—</div>
        </div>
        <div class="cm-tl-row" role="listitem" id="cm-tl-row-delivered">
            <div class="cm-tl-icon pending" aria-label="Pending">○</div>
            <div class="cm-tl-body">
                <div class="cm-tl-title pending" id="cm-tl-delivered-title">Delivered</div>
                <div class="cm-tl-meta"><?php echo esc_html($destination); ?></div>
            </div>
            <div class="cm-tl-time">Est. <?php echo esc_html($eta_display); ?></div>
        </div>
    </div>

</div><!-- /cm-tracker-shell -->

<!-- Toast -->
<div id="cm-toast" role="status" aria-live="polite"></div>

<script>
/* ── FEATURE K: IIFE — no globals ───────────────────────────────────────── */
(function () {
    'use strict';

    /* ── Tiny helpers ──────────────────────────────────────────────────── */
    /* BUG FIX 8: sanitise strings before injecting into innerHTML */
    function esc(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
    }

    /* BUG FIX 9: null-safe getElementById */
    function $id(id) { return document.getElementById(id); }

    function showToast(msg, ms) {
        ms = ms || 2800;
        var t = $id('cm-toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'show';
        clearTimeout(t._timer);
        t._timer = setTimeout(function () {
            t.className = 'hide';
            setTimeout(function () { t.className = ''; }, 440);
        }, ms);
    }

    /* ── PHP data ───────────────────────────────────────────────────────── */
    var STATUS      = <?php echo json_encode($status); ?>;
    var TRACKING_NO = <?php echo json_encode($tracking_no); ?>;
    var ROUTE       = <?php echo json_encode($route); ?>;   // [[lat,lng], ...]
    var STEPS_DONE  = <?php echo (int) $steps_done; ?>;     /* BUG FIX 7 */
    var ETA_ISO     = <?php echo json_encode($eta_iso); ?>;

    /* ── Guard: Leaflet ─────────────────────────────────────────────────── */
    if (typeof L === 'undefined') {
        console.error('CargoMasters: Leaflet failed to load.');
        var mapEl = $id('map');
        if (mapEl) mapEl.innerHTML =
            '<div style="padding:24px;color:#ff4040;font-size:13px;background:#0b0f1a">'+
            '⚠️ Map could not be loaded. Check your internet connection and refresh.</div>';
        return;
    }

    /* ── Guard: route data ──────────────────────────────────────────────── */
    if (!Array.isArray(ROUTE) || ROUTE.length < 2) {
        console.error('CargoMasters: Invalid route data — need at least 2 points.');
        return;
    }

    /* ── Guard: each route point must have finite numbers ──────────────── */
    for (var ri = 0; ri < ROUTE.length; ri++) {
        if (!Array.isArray(ROUTE[ri]) || ROUTE[ri].length < 2 ||
            !isFinite(ROUTE[ri][0]) || !isFinite(ROUTE[ri][1])) {
            console.error('CargoMasters: Malformed route point at index', ri, ROUTE[ri]);
            return;
        }
    }

    /* BUG FIX 10 (JS-side clamp) */
    var completedIdx = Math.max(0, Math.min(STEPS_DONE, ROUTE.length - 2));

    /* ── FEATURE G: ETA countdown ───────────────────────────────────────── */
    var etaDate = new Date(ETA_ISO);
    function updateCountdown() {
        var el   = $id('cm-eta-countdown');
        if (!el) return;
        var diff = etaDate - Date.now();
        if (isNaN(diff) || diff <= 0) { el.textContent = ''; return; }
        var h = Math.floor(diff / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        el.textContent = h + 'h ' + m + 'm remaining';
    }
    updateCountdown();
    setInterval(updateCountdown, 60000);

    /* ── FEATURE E: Offline detection ───────────────────────────────────── */
    function setOfflineBanner(show) {
        var b = $id('cm-offline-banner');
        if (b) b.style.display = show ? 'flex' : 'none';
    }
    setOfflineBanner(!navigator.onLine);
    window.addEventListener('online',  function () { setOfflineBanner(false); showToast('🌐 Back online — resuming live updates'); });
    window.addEventListener('offline', function () { setOfflineBanner(true); });

    /* ── Map init ───────────────────────────────────────────────────────── */
    var darkTile = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution:'© OpenStreetMap © CARTO', subdomains:'abcd', maxZoom:19 }
    );
    var lightTile = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution:'© OpenStreetMap © CARTO', subdomains:'abcd', maxZoom:19 }
    );
    var satelliteTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution:'Tiles © Esri' }
    );

    var map = L.map('map', {
        zoomControl:      true,
        layers:           [darkTile],
        attributionControl:true,
    }).setView([ROUTE[0][0], ROUTE[0][1]], 14);

    L.control.layers(
        { 'Dark':darkTile, 'Light':lightTile, 'Satellite':satelliteTile },
        {},
        { position:'topright' }
    ).addTo(map);

    /* ── Route lines ────────────────────────────────────────────────────── */
    var completedCoords = ROUTE.slice(0, completedIdx + 1).map(function (p) { return L.latLng(p[0], p[1]); });
    var remainingCoords = ROUTE.slice(completedIdx).map(function (p)         { return L.latLng(p[0], p[1]); });

    L.polyline(completedCoords, { color:'#1a8cff', weight:4, opacity:.9 }).addTo(map);
    L.polyline(remainingCoords, { color:'#3a4a80', weight:3, opacity:.45, dashArray:'8,10' }).addTo(map);

    /* ── Origin / Destination dots ──────────────────────────────────────── */
    function dotIcon(color, shadow) {
        return L.divIcon({
            className: '',
            html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color +
                  ';border:3px solid #0b0f1a;box-shadow:0 0 0 4px ' + shadow + '"></div>',
            iconAnchor: [7, 7]
        });
    }
    L.marker([ROUTE[0][0], ROUTE[0][1]], { icon: dotIcon('#34d678','rgba(52,214,120,.25)') })
        .addTo(map).bindTooltip('Origin', { direction:'top' });
    L.marker([ROUTE[ROUTE.length-1][0], ROUTE[ROUTE.length-1][1]], { icon: dotIcon('#ff6b35','rgba(255,107,53,.25)') })
        .addTo(map).bindTooltip('Destination', { direction:'top' });

    /* ── Truck marker ───────────────────────────────────────────────────── */
    /* BUG FIX 4: ripple animation is defined in <style> above, NOT inline here */
    function truckIcon(delivered) {
        var emoji  = delivered ? '📦' : '🚚';
        var border = delivered ? '#34d678' : '#1a8cff';
        return L.divIcon({
            className: '',
            html:
                '<div style="position:relative;width:44px;height:44px;">' +
                    '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,140,255,.13);animation:ripple 1.8s ease-out infinite;"></div>' +
                    '<div style="position:absolute;inset:6px;border-radius:50%;background:#1a2040;border:2px solid ' + border + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' + emoji + '</div>' +
                '</div>',
            iconSize:    [44, 44],
            iconAnchor:  [22, 22],
            popupAnchor: [0, -26]
        });
    }

    function popupHtml(addr, time) {
        return '<div class="cm-popup">' +
            '<div class="ptitle">CargoMasters · Live Update</div>' +
            '<div class="prow"><span class="pk">Tracking</span><span class="pv">' + esc(TRACKING_NO) + '</span></div>' +
            '<div class="prow"><span class="pk">Status</span><span class="pv">'   + esc(STATUS)      + '</span></div>' +
            '<div class="prow"><span class="pk">Location</span><span class="pv">' + esc(addr)        + '</span></div>' +
            '<div class="prow"><span class="pk">Updated</span><span class="pv">'  + esc(time)        + '</span></div>' +
            '<div class="pgps">📡 Live GPS Signal</div>' +
        '</div>';
    }

    var marker = L.marker([ROUTE[0][0], ROUTE[0][1]], { icon: truckIcon(false), zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(popupHtml('Locating…', '—'), { maxWidth:280, minWidth:240 })
        .openPopup();

    /* BUG FIX 5: track user intent to close popup */
    var popupUserClosed = false;
    marker.on('popupclose', function () { popupUserClosed = true; });
    marker.on('popupopen',  function () { popupUserClosed = false; });

    /* ── FEATURE D: Follow-truck toggle ─────────────────────────────────── */
    var followTruck = true;
    var followBtn   = $id('cm-follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', function () {
            followTruck = !followTruck;
            followBtn.classList.toggle('active', followTruck);
            followBtn.setAttribute('aria-pressed', String(followTruck));
            showToast(followTruck ? '📍 Following truck' : '🔓 Map unlocked — scroll freely');
        });
    }

    /* ── FEATURE C: Fullscreen toggle ──────────────────────────────────── */
    var fsBtn = $id('cm-fs-btn');
    var shell = $id('cm-tracker-shell');
    if (fsBtn && shell) {
        fsBtn.addEventListener('click', function () {
            var req  = shell.requestFullscreen  || shell.webkitRequestFullscreen  || null;
            var exit = document.exitFullscreen   || document.webkitExitFullscreen  || null;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (req) req.call(shell);
                fsBtn.textContent = '✕';
            } else {
                if (exit) exit.call(document);
                fsBtn.textContent = '⛶';
            }
        });
        /* Sync icon when user presses Esc */
        document.addEventListener('fullscreenchange', function () {
            if (!document.fullscreenElement) fsBtn.textContent = '⛶';
        });
    }

    /* ── FEATURE B: Share button ─────────────────────────────────────────── */
    var shareBtn = $id('cm-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var url = window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url)
                    .then(function () { showToast('🔗 Tracking link copied to clipboard!'); })
                    .catch(function () { prompt('Copy this link:', url); });
            } else {
                prompt('Copy this tracking link:', url);
            }
        });
    }

    /* ── FEATURE H: Print button ─────────────────────────────────────────── */
    var printBtn = $id('cm-print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function () { window.print(); });
    }

    /* ── Progress helper ─────────────────────────────────────────────────── */
    function updateProgress(pct) {
        var fill  = $id('cm-progress-fill');
        var label = $id('cm-progress-pct');
        var track = $id('cm-progress-track');
        var r     = Math.round(pct);
        if (fill)  fill.style.width = pct + '%';
        if (label) label.textContent = r + '%';
        if (track) track.setAttribute('aria-valuenow', r);
    }

    /* ── FEATURE F: Delivered state ─────────────────────────────────────── */
    var isDelivered = false;
    function onDelivered() {
        if (isDelivered) return;
        isDelivered = true;

        marker.setIcon(truckIcon(true));
        updateProgress(100);

        var row   = $id('cm-tl-row-delivered');
        var icon  = row   ? row.querySelector('.cm-tl-icon')  : null;
        var title = $id('cm-tl-delivered-title');
        if (icon)  { icon.className = 'cm-tl-icon done'; icon.textContent = '✓'; icon.setAttribute('aria-label','Completed'); }
        if (title) { title.className = 'cm-tl-title'; }

        var activeIcon = document.querySelector('#cm-tl-row-active .cm-tl-icon');
        if (activeIcon) { activeIcon.className = 'cm-tl-icon done'; activeIcon.textContent = '✓'; activeIcon.setAttribute('aria-label','Completed'); }

        var speedEl = $id('cm-speed-val');
        if (speedEl) speedEl.textContent = '0';

        showToast('📦 Package delivered! Thank you for shipping with CargoMasters.', 5000);
    }

    /* ── Geocoding (throttled) ───────────────────────────────────────────── */
    var lastGeocodeMs = 0;
    function geocode(lat, lng) {
        var now = Date.now();
        if (now - lastGeocodeMs < 3000) return;
        lastGeocodeMs = now;

        fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var addr      = (data && data.display_name) ? data.display_name : 'Unknown location';
                var shortAddr = addr.split(',').slice(0, 3).join(',').trim();
                var timeStr   = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

                var addrEl = $id('cm-current-addr');
                var tlAddr = $id('cm-tl-live-addr');
                var tlTime = $id('cm-tl-live-time');
                if (addrEl) addrEl.textContent = shortAddr;
                if (tlAddr) tlAddr.textContent  = shortAddr;
                if (tlTime) tlTime.textContent  = timeStr;

                /* BUG FIX 5: update popup content without force-reopening it */
                marker.getPopup().setContent(popupHtml(shortAddr, timeStr));
                if (!popupUserClosed) marker.openPopup();
            })
            .catch(function (err) {
                console.warn('CargoMasters: reverse geocode failed —', err.message);
                if (!navigator.onLine) setOfflineBanner(true);
            });
    }

    /* ── Main animation loop ─────────────────────────────────────────────── */
    var step       = 0;
    var animFrameId = null;

    function glideMarker() {
        if (step >= ROUTE.length - 1) {
            onDelivered();
            return;
        }

        var start  = L.latLng(ROUTE[step][0],     ROUTE[step][1]);
        var end    = L.latLng(ROUTE[step + 1][0], ROUTE[step + 1][1]);
        var frames = 120;
        var frame  = 0;

        var distKm   = start.distanceTo(end) / 1000;
        var speedKmh = Math.round((distKm / 0.5) * 60);
        var speedEl  = $id('cm-speed-val');
        if (speedEl) speedEl.textContent = speedKmh || '—';

        function animate() {
            if (frame > frames) {
                step++;
                animFrameId = null;
                setTimeout(glideMarker, 600);
                return;
            }

            var t   = frame / frames;
            var lat = start.lat + (end.lat - start.lat) * t;
            var lng = start.lng + (end.lng - start.lng) * t;

            marker.setLatLng([lat, lng]);

            /* BUG FIX 6: pan only once per step, not every frame */
            if (frame === 0 && followTruck) {
                map.panTo([lat, lng], { animate:true, duration:0.7 });
            }

            var progress = ((step + t) / (ROUTE.length - 1)) * 100;
            updateProgress(progress);

            geocode(lat, lng);

            frame++;
            animFrameId = requestAnimationFrame(animate);
        }
        animate();
    }

    glideMarker();

    /* FEATURE L: clean up rAF on page unload (avoids console errors in SPAs) */
    window.addEventListener('beforeunload', function () {
        if (animFrameId) { cancelAnimationFrame(animFrameId); }
    });

})();
</script>

<?php });
