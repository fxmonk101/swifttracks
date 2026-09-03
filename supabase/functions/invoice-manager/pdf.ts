// DHL-style "Shipment Receipt" PDF renderer (pdf-lib, no browser required)
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";
import qrcode from "npm:qrcode-generator@1.4.4";
import { LOGO_PNG_BASE64, LOGO_H, LOGO_W } from "./logo.ts";

export const COMPANY = {
  name: "TransportHaven",
  tagline: "Reliable global logistics",
  address: "1200 Harbor Logistics Way, Suite 480",
  cityLine: "Los Angeles, CA 90021, United States",
  phone: "+1 (213) 595-7723",
  email: "support@transporthaven.com",
  website: "https://transporthaven.com",
};

const INK = rgb(0.07, 0.08, 0.1);
const MUTED = rgb(0.38, 0.41, 0.46);
const RULE = rgb(0.1, 0.11, 0.13);
const LIGHT = rgb(0.82, 0.84, 0.87);
const RED = rgb(0.82, 0.02, 0.1);

const A4: [number, number] = [595.28, 841.89];
const M = 46;
const CW = A4[0] - M * 2;
const COL2 = M + CW / 2 + 8;

export type LineItem = { description: string; quantity: number; unit_price: number; amount: number };

export type InvoicePdfInput = {
  invoice: {
    invoice_number: string;
    invoice_date: string;
    currency: string;
    line_items: LineItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amount_paid: number;
    balance_due: number;
    payment_status: string;
    tracking_number: string;
  };
  shipment: Record<string, unknown>;
  events: { status: string; description: string | null; location: string | null; created_at: string }[];
  currentLocation?: string | null;
  trackUrl: string;
};

const S = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s === "null" || s === "undefined" ? "" : s;
};
const N = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

export const money = (currency: string, value: number): string => {
  const amount = (Math.round(N(value) * 100) / 100).toFixed(2);
  const [int, dec] = amount.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${dec} ${currency}`;
};

const fmtDateISO = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};
const fmtDateLong = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" });
};
const fmtDateTime = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${fmtDateISO(value)} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
};
const statusLabel = (raw: string): string =>
  S(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = S(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    let piece = word;
    while (font.widthOfTextAtSize(piece, size) > maxWidth) {
      let cut = piece.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(piece.slice(0, cut), size) > maxWidth) cut--;
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(piece.slice(0, cut));
      piece = piece.slice(cut);
    }
    const candidate = current ? `${current} ${piece}` : piece;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (current) lines.push(current);
      current = piece;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const partyBlock = (p: Record<string, unknown>, prefix: "sender" | "receiver"): string[] => {
  const out: string[] = [];
  const name = S(p[`${prefix}_name`]);
  if (name) out.push(name);
  const company = S(p[`${prefix}_company`]);
  if (company) out.push(company);
  const street = S(p[`${prefix}_street`]);
  if (street) out.push(street);
  const cityLine = [S(p[`${prefix}_city`]), S(p[`${prefix}_state`]), S(p[`${prefix}_zip`])].filter(Boolean).join(" ");
  if (cityLine) out.push(cityLine);
  const country = S(p[`${prefix}_country`]);
  if (country) out.push(country.toUpperCase() === "US" ? "United States" : country.toUpperCase() === "CA" ? "Canada" : country);
  const phone = S(p[`${prefix}_phone`]);
  if (phone) out.push(phone);
  return out;
};

const locationText = (p: Record<string, unknown>, prefix: "sender" | "receiver"): string =>
  [S(p[`${prefix}_city`]), S(p[`${prefix}_state`]), S(p[`${prefix}_country`])].filter(Boolean).join(", ");

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const { invoice, shipment, events, trackUrl } = input;
  const cur = invoice.currency || "USD";

  const doc = await PDFDocument.create();
  doc.setTitle(`TransportHaven Shipment Receipt ${invoice.invoice_number}`);
  doc.setAuthor(COMPANY.name);
  doc.setSubject(`Shipment receipt for ${invoice.tracking_number}`);

  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Uint8Array.from(atob(LOGO_PNG_BASE64), (c) => c.charCodeAt(0)));

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - M;

  const text = (
    str: string,
    x: number,
    baselineY: number,
    opts: { size?: number; font?: PDFFont; color?: typeof INK } = {},
  ) => {
    page.drawText(S(str), { x, y: baselineY, size: opts.size ?? 9, font: opts.font ?? reg, color: opts.color ?? INK });
  };

  const rule = (atY: number, thickness = 1.4) => {
    page.drawLine({ start: { x: M, y: atY }, end: { x: A4[0] - M, y: atY }, thickness, color: RULE });
  };

  const heading = (label: string, x: number, atY: number) => {
    page.drawText(label, { x, y: atY, size: 13.5, font: bold, color: INK });
  };

  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - M;
  };
  const ensure = (needed: number) => {
    if (y - needed < 70) newPage();
  };

  // ---- Header: logo left, title right -------------------------------------
  const logoW = 132;
  const logoH = (logoW * LOGO_H) / LOGO_W;
  page.drawImage(logo, { x: M, y: y - logoH, width: logoW, height: logoH });
  const title = "Shipment Receipt";
  const titleW = bold.widthOfTextAtSize(title, 22);
  text(title, A4[0] - M - titleW, y - logoH + 4, { size: 22, font: bold });
  y -= logoH + 12;
  rule(y);
  y -= 26;

  // ---- Shipment From / Shipment To ---------------------------------------
  heading("Shipment From", M, y);
  heading("Shipment To", COL2, y);
  y -= 20;

  const fromLines = partyBlock(shipment, "sender");
  const toLines = partyBlock(shipment, "receiver");
  const fromEmail = S(shipment.sender_email);
  const toEmail = S(shipment.receiver_email);
  const colW = CW / 2 - 18;

  const drawParty = (lines: string[], email: string, x: number): number => {
    let ly = y;
    for (const line of lines) {
      for (const w of wrap(line, reg, 9, colW)) {
        text(w, x, ly, { size: 9 });
        ly -= 12.5;
      }
    }
    if (email) {
      ly -= 6;
      text(email, x, ly, { size: 9, color: MUTED });
      ly -= 12.5;
    }
    return ly;
  };
  const endFrom = drawParty(fromLines, fromEmail, M);
  const endTo = drawParty(toLines, toEmail, COL2);
  y = Math.min(endFrom, endTo) - 22;
  rule(y);
  y -= 26;

  // ---- Shipment Details / International Information ----------------------
  heading("Shipment Details", M, y);
  heading("International Information", COL2, y);
  y -= 20;

  const dims = [N(shipment.dimensions_length), N(shipment.dimensions_width), N(shipment.dimensions_height)];
  const pkgCount = Math.max(1, Math.round(N(shipment.package_count) || 1));
  const weightKg = N(shipment.weight) * 0.453592;

  const leftRows: [string, string][] = [
    ["Shipment Date:", fmtDateISO(S(shipment.pickup_date) || S(shipment.created_at))],
    ["Waybill Number:", invoice.tracking_number],
    ["Receipt Number:", invoice.invoice_number],
    ["Service Type:", statusLabel(S(shipment.service_type)).toUpperCase()],
    ["Packaging Type:", pkgCount > 1 ? `${pkgCount} Pieces` : "1 Parcel"],
    ["Number of Pieces:", String(pkgCount)],
    ["Total Weight:", N(shipment.weight) > 0 ? `${weightKg.toFixed(2)}kg` : ""],
    ["Dimensional:", dims.every((d) => d > 0) ? `${dims[0]} x ${dims[1]} x ${dims[2]} in` : ""],
    ["Chargeable:", N(shipment.weight) > 0 ? `${Math.max(weightKg, 0.5).toFixed(2)}kg` : ""],
    ["Signature Required:", shipment.requires_signature ? "Yes" : "No"],
    ["Terms of Trade:", "DAP"],
  ].filter((r) => S(r[1]) !== "") as [string, string][];

  const rightRows: [string, string][] = [
    ["Declared Value:", money(cur, invoice.total)],
    ["Duties & taxes acct:", "Shipper"],
    ["Dutiable Status:", "Dutiable"],
    ["Estimated Del date:", fmtDateLong(S(shipment.estimated_delivery_date)) || "Pending schedule"],
    ["Shipment Status:", statusLabel(S(shipment.status))],
    ["Current Location:", S(input.currentLocation) || locationText(shipment, "receiver")],
    ["Assigned Driver:", S(shipment.assigned_driver)],
    ["Promo Code:", ""],
  ];

  const drawRows = (rows: [string, string][], x: number, labelW: number, maxW: number): number => {
    let ly = y;
    for (const [label, value] of rows) {
      text(label, x, ly, { size: 8.6, color: INK });
      const lines = wrap(value, reg, 8.6, maxW - labelW);
      if (!lines.length) {
        ly -= 13.5;
        continue;
      }
      lines.forEach((ln, i) => {
        text(ln, x + labelW, ly - i * 11, { size: 8.6, font: bold });
      });
      ly -= 13.5 + (lines.length - 1) * 11;
    }
    return ly;
  };
  const endLeft = drawRows(leftRows, M, 104, colW + 14);
  const endRight = drawRows(rightRows, COL2, 108, colW + 14);
  y = Math.min(endLeft, endRight) - 14;

  // ---- Billing Information ------------------------------------------------
  ensure(140);
  heading("Billing Information", M, y);
  y -= 20;
  const billRows: [string, string][] = [
    ["Payment Type:", "TransportHaven Account"],
    ["Billing Account:", `TH-${invoice.tracking_number.replace(/[^A-Z0-9]/gi, "").slice(-8).toUpperCase()}`],
    ["Duties & taxes acct:", "Shipper"],
    ["Payment Status:", statusLabel(invoice.payment_status)],
    ["Charge Breakdown:", money(cur, invoice.total)],
  ];
  const billEnd = drawRows(billRows, M, 104, colW + 14);
  // Special services column
  let sy = y;
  text("Special Services:", COL2, sy, { size: 8.6 });
  const svc = [
    shipment.requires_signature ? "Signature on delivery" : null,
    "Fuel Surcharge",
    "Real-time GPS tracking",
  ].filter(Boolean) as string[];
  for (const s of svc) {
    for (const ln of wrap(s, reg, 8.6, colW - 96)) {
      text(ln, COL2 + 96, sy, { size: 8.6, font: bold });
      sy -= 11.5;
    }
  }
  y = Math.min(billEnd, sy) - 10;

  // ---- Charge table -------------------------------------------------------
  const items = invoice.line_items ?? [];
  ensure(items.length * 15 + 130);
  const amtRight = A4[0] - M;
  const unitRight = amtRight - 108;
  const qtyRight = unitRight - 62;
  page.drawLine({ start: { x: M, y: y }, end: { x: amtRight, y }, thickness: 0.8, color: LIGHT });
  y -= 14;
  const rightAt = (str: string, xRight: number, opts: { size?: number; font?: PDFFont; color?: typeof INK } = {}) => {
    const f = opts.font ?? reg;
    const size = opts.size ?? 8.6;
    text(str, xRight - f.widthOfTextAtSize(str, size), y, { ...opts, size, font: f });
  };
  text("Charge Description", M, y, { size: 8.4, font: bold, color: MUTED });
  rightAt("QTY", qtyRight, { size: 8.4, font: bold, color: MUTED });
  rightAt("UNIT PRICE", unitRight, { size: 8.4, font: bold, color: MUTED });
  rightAt("AMOUNT", amtRight, { size: 8.4, font: bold, color: MUTED });
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: amtRight, y }, thickness: 0.6, color: LIGHT });
  y -= 15;

  for (const item of items) {
    if (y < 96) {
      newPage();
      y -= 10;
    }
    const nameLines = wrap(item.description, reg, 8.8, qtyRight - M - 40);
    text(nameLines[0] ?? "", M, y, { size: 8.8 });
    rightAt(String(item.quantity ?? 1), qtyRight, { size: 8.8 });
    rightAt(money(cur, item.unit_price), unitRight, { size: 8.8 });
    rightAt(money(cur, item.amount), amtRight, { size: 8.8 });
    y -= 15;
    if (nameLines.length > 1) {
      for (const ln of nameLines.slice(1)) {
        text(ln, M, y, { size: 8.2, color: MUTED });
        y -= 12;
      }
    }
  }

  page.drawLine({ start: { x: M, y: y + 3 }, end: { x: amtRight, y: y + 3 }, thickness: 0.6, color: LIGHT });
  y -= 8;
  const totals: [string, number, boolean?][] = [
    ["Subtotal", invoice.subtotal],
    ["Discount", -Math.abs(invoice.discount)],
    ["Tax / VAT", invoice.tax],
    ["Total Charges", invoice.total, true],
    ["Amount Paid", invoice.amount_paid],
    ["Balance Due", invoice.balance_due, true],
  ];
  for (const [label, value, strong] of totals) {
    text(label, unitRight - 96, y, { size: strong ? 9.2 : 8.6, font: strong ? bold : reg });
    rightAt(money(cur, value), amtRight, { size: strong ? 9.2 : 8.6, font: strong ? bold : reg });
    y -= 14;
  }
  y -= 4;
  text("Charge is estimated until TransportHaven reweigh.", M, y, { size: 8.6 });
  y -= 24;

  // ---- Reference Information ---------------------------------------------
  ensure(180);
  heading("Reference Information", M, y);
  y -= 18;
  text(`Reference: ${invoice.tracking_number}`, M, y, { size: 8.6, color: MUTED });
  y -= 12;
  text(`Pickup reference nr: ${fmtDateISO(S(shipment.pickup_date) || S(shipment.created_at))}`, M, y, { size: 8.6, color: MUTED });
  y -= 26;

  // ---- Description of Contents -------------------------------------------
  heading("Description of Contents", M, y);
  y -= 18;
  const contents =
    S(shipment.shipment_description) ||
    S(shipment.description) ||
    (Array.isArray(shipment.packages_meta)
      ? (shipment.packages_meta as { description?: string }[]).map((p) => S(p?.description)).filter(Boolean).join("; ")
      : "") ||
    "General merchandise";
  for (const ln of wrap(contents, reg, 9.4, CW - 130)) {
    text(ln, M, y, { size: 9.4 });
    y -= 13;
  }
  y -= 10;

  // ---- Tracking + QR ------------------------------------------------------
  ensure(120);
  const qrSize = 82;
  const qr = qrcode(0, "M");
  qr.addData(trackUrl);
  qr.make();
  const modules = qr.getModuleCount();
  const qrX = A4[0] - M - qrSize;
  const qrY = y - qrSize + 8;
  const cell = qrSize / modules;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (!qr.isDark(r, c)) continue;
      page.drawRectangle({
        x: qrX + c * cell,
        y: qrY + qrSize - (r + 1) * cell,
        width: cell + 0.25,
        height: cell + 0.25,
        color: INK,
      });
    }
  }
  const scan = "Scan to track";
  text(scan, qrX + qrSize / 2 - reg.widthOfTextAtSize(scan, 6.8) / 2, qrY - 11, { size: 6.8, color: MUTED });

  heading("Tracking", M, y);
  y -= 18;
  const trackRows: [string, string][] = [
    ["Waybill Number:", invoice.tracking_number],
    ["Current Status:", statusLabel(S(shipment.status))],
    ["Current Location:", S(input.currentLocation) || locationText(shipment, "receiver")],
    ["Track online:", trackUrl],
  ];
  y = drawRows(trackRows, M, 104, CW - qrSize - 40) - 12;

  // ---- Shipment history --------------------------------------------------
  const history = (events ?? []).slice(0, 10);
  if (history.length) {
    ensure(history.length * 13 + 60);
    heading("Shipment History", M, y);
    y -= 18;
    text("DATE & TIME", M, y, { size: 7.4, font: bold, color: MUTED });
    text("LOCATION", M + 150, y, { size: 7.4, font: bold, color: MUTED });
    text("STATUS", M + 300, y, { size: 7.4, font: bold, color: MUTED });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.6, color: LIGHT });
    y -= 13;
    for (const ev of history) {
      if (y < 80) {
        newPage();
        y -= 10;
      }
      text(fmtDateTime(ev.created_at), M, y, { size: 8.2 });
      text(wrap(S(ev.location) || "\u2014", reg, 8.2, 140)[0] ?? "", M + 150, y, { size: 8.2 });
      text(wrap(S(ev.description) || statusLabel(ev.status), reg, 8.2, CW - 310)[0] ?? "", M + 300, y, { size: 8.2 });
      y -= 13;
    }
  }

  // ---- Footer on every page ----------------------------------------------
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 58 }, end: { x: A4[0] - M, y: 58 }, thickness: 0.7, color: LIGHT });
    p.drawText(`${COMPANY.website}  |  ${COMPANY.email}  |  ${COMPANY.phone} (calls & text)`, {
      x: M,
      y: 46,
      size: 7,
      font: reg,
      color: MUTED,
    });
    p.drawText(`${new Date().getFullYear()} \u00A9 ${COMPANY.name} - All rights reserved`, {
      x: M,
      y: 34,
      size: 7,
      font: reg,
      color: MUTED,
    });
    const pn = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pn, { x: A4[0] - M - reg.widthOfTextAtSize(pn, 7), y: 34, size: 7, font: reg, color: MUTED });
    p.drawRectangle({ x: 0, y: A4[1] - 4, width: A4[0], height: 4, color: RED });
  });

  return await doc.save();
}
