// Send shipment notification emails via Resend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "TransportHaven <support@transporthaven.com>";
const SUPPORT_PHONE = "+1 (213) 595-7723";

interface Payload {
  type: "created" | "status_update";
  trackingId: string;
  status?: string;
  description?: string;
  location?: string;
  senderName?: string;
  senderEmail?: string;
  receiverName?: string;
  receiverEmail?: string;
  origin?: string;
  destination?: string;
  estimatedDelivery?: string;
}

const trackUrl = (id: string) =>
  `https://transporthaven.com/track?id=${encodeURIComponent(id)}`;

function renderEmail(role: "sender" | "receiver", p: Payload) {
  const name = role === "sender" ? p.senderName : p.receiverName;
  const isCreated = p.type === "created";
  const title = isCreated
    ? `Your shipment ${p.trackingId} has been created`
    : `Update on shipment ${p.trackingId}`;

  const intro = isCreated
    ? role === "sender"
      ? `Your shipment has been booked successfully. We'll keep you posted as it moves toward ${p.destination || "the destination"}.`
      : `${p.senderName || "A sender"} has shipped a package to you via TransportHaven. You can track it anytime using the link below.`
    : `The status of your shipment is now <strong>${(p.status || "").replace(/_/g, " ")}</strong>.${p.description ? `<br/>${p.description}` : ""}${p.location ? `<br/>Location: ${p.location}` : ""}`;

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background:#0f172a;padding:20px 24px;color:#fff;">
          <div style="font-size:20px;font-weight:bold;">TransportHaven</div>
          <div style="font-size:12px;opacity:.8;">Reliable global logistics</div>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${title}</h1>
          <p style="margin:0 0 16px;line-height:1.5;">Hi ${name || "there"},</p>
          <p style="margin:0 0 16px;line-height:1.5;">${intro}</p>
          <table cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:6px;width:100%;margin:16px 0;">
            <tr><td style="padding:14px 16px;">
              <div style="font-size:12px;color:#64748b;">Tracking number</div>
              <div style="font-size:18px;font-weight:bold;color:#0f172a;letter-spacing:.5px;">${p.trackingId}</div>
              ${p.origin || p.destination ? `<div style="margin-top:8px;font-size:13px;color:#475569;">${p.origin || ""} ${p.destination ? `→ ${p.destination}` : ""}</div>` : ""}
              ${p.estimatedDelivery ? `<div style="margin-top:4px;font-size:13px;color:#475569;">ETA: ${new Date(p.estimatedDelivery).toLocaleDateString()}</div>` : ""}
            </td></tr>
          </table>
          <p style="margin:16px 0;"><a href="${trackUrl(p.trackingId)}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;display:inline-block;font-weight:bold;">Track shipment</a></p>
          <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
            Need help? Reply to this email or contact us at
            <a href="mailto:support@transporthaven.com" style="color:#2563eb;">support@transporthaven.com</a>
            or call/text <a href="tel:+12135957723" style="color:#2563eb;">${SUPPORT_PHONE}</a>.
          </p>
        </td></tr>
        <tr><td style="background:#0f172a;padding:14px 24px;color:#94a3b8;font-size:12px;text-align:center;">
          © ${new Date().getFullYear()} TransportHaven. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const payload = (await req.json()) as Payload;
    if (!payload?.trackingId) throw new Error("trackingId required");

    const subject =
      payload.type === "created"
        ? `Shipment ${payload.trackingId} created`
        : `Shipment ${payload.trackingId} update: ${(payload.status || "").replace(/_/g, " ")}`;

    const recipients: { email: string; role: "sender" | "receiver" }[] = [];
    if (payload.senderEmail) recipients.push({ email: payload.senderEmail, role: "sender" });
    if (payload.receiverEmail) recipients.push({ email: payload.receiverEmail, role: "receiver" });

    const results: any[] = [];
    for (const r of recipients) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [r.email],
          subject,
          html: renderEmail(r.role, payload),
        }),
      });
      const data = await res.json();
      results.push({ to: r.email, ok: res.ok, data });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
