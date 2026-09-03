// Invoice / shipment-receipt manager: generates DHL-style PDF receipts,
// stores them in the `invoices` bucket and emails them to sender + receiver.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildInvoicePdf, money, type LineItem } from "./pdf.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "TransportHaven <support@transporthaven.com>";
const SITE = "https://transporthaven.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const N = (v: unknown, d = 0): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : d;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

function invoiceNumber(trackingId: string): string {
  const tail = trackingId.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `THR-${stamp}-${tail}`;
}

const SERVICE_BASE: Record<string, number> = {
  STANDARD: 28,
  EXPRESS: 48,
  OVERNIGHT: 79,
  ECONOMY: 19,
  FREIGHT: 120,
};

function defaultCharges(shipment: Record<string, unknown>) {
  const service = String(shipment.service_type ?? "STANDARD").toUpperCase();
  const base = SERVICE_BASE[service] ?? 32;
  const pieces = Math.max(1, Math.round(N(shipment.package_count, 1)));
  const weight = Math.max(1, N(shipment.weight, 1));
  const items: LineItem[] = [
    {
      description: `${service} freight service — ${pieces} piece${pieces > 1 ? "s" : ""}`,
      quantity: pieces,
      unit_price: r2(base),
      amount: r2(base * pieces),
    },
    {
      description: "Weight-based handling charge",
      quantity: 1,
      unit_price: r2(weight * 1.85),
      amount: r2(weight * 1.85),
    },
    { description: "Fuel surcharge", quantity: 1, unit_price: r2(base * 0.14), amount: r2(base * 0.14) },
  ];
  if (shipment.requires_signature) {
    items.push({ description: "Signature on delivery", quantity: 1, unit_price: 4.5, amount: 4.5 });
  }
  return items;
}

async function requireAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", data.user.id);
  return !!roles?.some((r: { role: string }) => r.role === "admin");
}

async function loadShipment(trackingId: string) {
  const { data: shipment, error } = await admin
    .from("shipments")
    .select("*")
    .eq("tracking_id", trackingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!shipment) throw new Error(`Shipment ${trackingId} not found`);
  const { data: events } = await admin
    .from("shipment_events")
    .select("status, description, location, created_at")
    .eq("shipment_id", shipment.id)
    .order("created_at", { ascending: false });
  return { shipment, events: events ?? [] };
}

type Charges = {
  currency?: string;
  items?: LineItem[];
  discount?: number;
  taxRate?: number;
  tax?: number;
  amountPaid?: number;
  paymentStatus?: string;
};

async function generate(trackingId: string, charges: Charges = {}) {
  const { shipment, events } = await loadShipment(trackingId);
  const { data: existing } = await admin
    .from("invoices")
    .select("*")
    .eq("shipment_id", shipment.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currency = charges.currency ?? existing?.currency ?? "USD";
  const items: LineItem[] =
    charges.items && charges.items.length
      ? charges.items.map((i) => ({
          description: String(i.description ?? "Service charge"),
          quantity: N(i.quantity, 1),
          unit_price: r2(N(i.unit_price)),
          amount: r2(N(i.amount) || N(i.unit_price) * N(i.quantity, 1)),
        }))
      : (existing?.line_items as LineItem[] | undefined)?.length
        ? (existing!.line_items as LineItem[])
        : defaultCharges(shipment);

  const subtotal = r2(items.reduce((s, i) => s + N(i.amount), 0));
  const discount = r2(Math.abs(N(charges.discount ?? existing?.discount ?? 0)));
  const taxable = Math.max(0, subtotal - discount);
  const tax = r2(charges.tax != null ? N(charges.tax) : taxable * N(charges.taxRate ?? 0.0, 0));
  const total = r2(taxable + tax);
  const amountPaid = r2(Math.min(total, Math.abs(N(charges.amountPaid ?? existing?.amount_paid ?? 0))));
  const balanceDue = r2(total - amountPaid);
  const paymentStatus =
    charges.paymentStatus ?? (balanceDue <= 0 ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID");

  const number = existing?.invoice_number ?? invoiceNumber(trackingId);
  const record = {
    invoice_number: number,
    shipment_id: shipment.id as string,
    tracking_number: trackingId,
    currency,
    line_items: items,
    subtotal,
    discount,
    tax,
    total,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    payment_status: paymentStatus,
    status: "GENERATED",
    error_message: null as string | null,
  };

  let invoiceRow;
  if (existing) {
    const { data, error } = await admin.from("invoices").update(record).eq("id", existing.id).select().single();
    if (error) throw new Error(error.message);
    invoiceRow = data;
  } else {
    const { data, error } = await admin.from("invoices").insert(record).select().single();
    if (error) throw new Error(error.message);
    invoiceRow = data;
  }

  const currentLocation =
    events.find((e) => e.location)?.location ??
    [shipment.receiver_city, shipment.receiver_state].filter(Boolean).join(", ");

  const pdf = await buildInvoicePdf({
    invoice: {
      invoice_number: invoiceRow.invoice_number,
      invoice_date: invoiceRow.invoice_date ?? new Date().toISOString(),
      currency,
      line_items: items,
      subtotal,
      discount,
      tax,
      total,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      tracking_number: trackingId,
    },
    shipment: shipment as Record<string, unknown>,
    events,
    currentLocation,
    trackUrl: `${SITE}/track/${encodeURIComponent(trackingId)}`,
  });

  const path = `${trackingId}/${invoiceRow.invoice_number}.pdf`;
  const { error: upErr } = await admin.storage
    .from("invoices")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  await admin.from("invoices").update({ pdf_path: path }).eq("id", invoiceRow.id);
  const { data: signed } = await admin.storage.from("invoices").createSignedUrl(path, 60 * 60 * 24 * 7);

  const base64 = btoa(String.fromCharCode(...new Uint8Array(pdf)));
  return {
    invoice: { ...invoiceRow, pdf_path: path },
    shipment,
    pdfBase64: base64,
    signedUrl: signed?.signedUrl ?? null,
    fileName: `${invoiceRow.invoice_number}.pdf`,
  };
}

function emailHtml(opts: {
  role: "sender" | "receiver";
  name: string;
  trackingId: string;
  invoiceNumber: string;
  total: string;
  balance: string;
  status: string;
  link: string | null;
}) {
  const intro =
    opts.role === "sender"
      ? "Your shipment receipt is attached below. It contains the full charge breakdown and shipment details."
      : "A shipment is on its way to you. The official shipment receipt is attached for your records.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;">
    <tr><td style="background:#0b2a55;padding:20px 24px;color:#fff;">
      <div style="font-size:20px;font-weight:bold;">TransportHaven</div>
      <div style="font-size:12px;opacity:.85;">Shipment Receipt ${opts.invoiceNumber}</div>
    </td></tr>
    <tr><td style="padding:26px 24px;">
      <p style="margin:0 0 14px;">Hi ${opts.name || "there"},</p>
      <p style="margin:0 0 18px;line-height:1.55;">${intro}</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:6px;">
        <tr><td style="padding:14px 16px;font-size:13px;line-height:1.7;">
          <strong>Waybill number:</strong> ${opts.trackingId}<br/>
          <strong>Receipt number:</strong> ${opts.invoiceNumber}<br/>
          <strong>Total charges:</strong> ${opts.total}<br/>
          <strong>Balance due:</strong> ${opts.balance}<br/>
          <strong>Payment status:</strong> ${opts.status.replace(/_/g, " ")}
        </td></tr>
      </table>
      <p style="margin:20px 0;">
        <a href="${SITE}/track/${encodeURIComponent(opts.trackingId)}" style="background:#d10419;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold;display:inline-block;">Track this shipment</a>
      </p>
      ${opts.link ? `<p style="margin:0 0 8px;font-size:13px;">Or <a href="${opts.link}" style="color:#0b2a55;">download the receipt PDF</a>.</p>` : ""}
      <p style="margin:18px 0 0;font-size:12px;color:#64748b;line-height:1.6;">Questions? Call or text +1 (213) 595-7723 or email support@transporthaven.com.</p>
    </td></tr>
    <tr><td style="background:#f1f5f9;padding:14px 24px;font-size:11px;color:#64748b;">${new Date().getFullYear()} &copy; TransportHaven — All rights reserved</td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendEmails(result: Awaited<ReturnType<typeof generate>>, override?: string[]) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const { invoice, shipment, pdfBase64, signedUrl, fileName } = result;
  const targets: { email: string; name: string; role: "sender" | "receiver" }[] = [];
  if (override?.length) {
    for (const e of override) targets.push({ email: e, name: "", role: "receiver" });
  } else {
    if (shipment.sender_email) targets.push({ email: shipment.sender_email, name: shipment.sender_name, role: "sender" });
    if (shipment.receiver_email)
      targets.push({ email: shipment.receiver_email, name: shipment.receiver_name, role: "receiver" });
  }
  if (!targets.length) throw new Error("No sender or receiver email on this shipment");

  const results: { email: string; ok: boolean; error?: string }[] = [];
  for (const t of targets) {
    let ok = false;
    let errMsg: string | undefined;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [t.email],
          subject: `Shipment Receipt ${invoice.invoice_number} — Waybill ${invoice.tracking_number}`,
          html: emailHtml({
            role: t.role,
            name: t.name,
            trackingId: invoice.tracking_number,
            invoiceNumber: invoice.invoice_number,
            total: money(invoice.currency, invoice.total),
            balance: money(invoice.currency, invoice.balance_due),
            status: invoice.payment_status,
            link: signedUrl,
          }),
          attachments: [{ filename: fileName, content: pdfBase64 }],
        }),
      });
      const body = await res.text();
      ok = res.ok;
      if (!ok) errMsg = `[${res.status}] ${body}`;
    } catch (e) {
      errMsg = e instanceof Error ? e.message : String(e);
    }
    results.push({ email: t.email, ok, error: errMsg });
    await admin.from("invoice_email_logs").insert({
      invoice_id: invoice.id,
      tracking_number: invoice.tracking_number,
      recipient_email: t.email,
      recipient_type: t.role.toUpperCase(),
      status: ok ? "SENT" : "FAILED",
      error_message: errMsg ?? null,
      sent_at: ok ? new Date().toISOString() : null,
    });
  }

  const anySent = results.some((r) => r.ok);
  await admin
    .from("invoices")
    .update({ status: anySent ? "SENT" : "ERROR", error_message: anySent ? null : results.map((r) => r.error).join(" | ") })
    .eq("id", invoice.id);
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!(await requireAdmin(req))) return json({ error: "Not authorized" }, 403);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "generate");
    const trackingId = String(body.trackingId ?? "").trim();
    if (!trackingId) return json({ error: "trackingId is required" }, 400);

    if (action === "generate") {
      const result = await generate(trackingId, body.charges ?? {});
      return json({
        success: true,
        invoice: result.invoice,
        pdfBase64: result.pdfBase64,
        signedUrl: result.signedUrl,
        fileName: result.fileName,
      });
    }

    if (action === "send") {
      const result = await generate(trackingId, body.charges ?? {});
      const emails = await sendEmails(result, Array.isArray(body.recipients) ? body.recipients : undefined);
      return json({ success: emails.some((e) => e.ok), invoice: result.invoice, emails });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("invoice-manager error:", msg);
    return json({ error: msg }, 500);
  }
});
