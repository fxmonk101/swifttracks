// Server-side A4 shipment invoice PDF renderer (pdf-lib, no browser required)
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

const NAVY = rgb(0.043, 0.165, 0.333);
const NAVY_SOFT = rgb(0.11, 0.25, 0.44);
const RED = rgb(0.82, 0.02, 0.1);
const INK = rgb(0.11, 0.13, 0.18);
const MUTED = rgb(0.42, 0.46, 0.53);
const LINE = rgb(0.84, 0.86, 0.89);
const BAND = rgb(0.957, 0.965, 0.976);
const WHITE = rgb(1, 1, 1);

const A4: [number, number] = [595.28, 841.89];
const M = 40; // margin
const CW = A4[0] - M * 2; // content width

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
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "\u20AC" : currency === "GBP" ? "\u00A3" : "";
  return symbol ? `${symbol}${grouped}.${dec}` : `${currency} ${grouped}.${dec}`;
};

const fmtDate = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit", timeZone: "UTC" });
};
const fmtDateTime = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${fmtDate(value)} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
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

const addressLines = (p: Record<string, unknown>, prefix: "sender" | "receiver"): string[] => {
  const out: string[] = [];
  const street = S(p[`${prefix}_street`]);
  if (street) out.push(street);
  const city = [S(p[`${prefix}_city`]), S(p[`${prefix}_state`])].filter(Boolean).join(", ");
  const zip = S(p[`${prefix}_zip`]);
  const cityLine = [city, zip].filter(Boolean).join(" ");
  if (cityLine) out.push(cityLine);
  const country = S(p[`${prefix}_country`]);
  if (country) out.push(country.toUpperCase() === "US" ? "United States" : country);
  return out;
};

const locationText = (p: Record<string, unknown>, prefix: "sender" | "receiver"): string =>
  [S(p[`${prefix}_city`]), S(p[`${prefix}_state`]), S(p[`${prefix}_country`])].filter(Boolean).join(", ");

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const { invoice, shipment, events, trackUrl } = input;
  const cur = invoice.currency || "USD";

  const doc = await PDFDocument.create();
  doc.setTitle(`TransportHaven Invoice ${invoice.invoice_number}`);
  doc.setAuthor(COMPANY.name);
  doc.setSubject(`Shipment invoice for ${invoice.tracking_number}`);

  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(Uint8Array.from(atob(LOGO_PNG_BASE64), (c) => c.charCodeAt(0)));

  let page: PDFPage = doc.addPage(A4);
  let y = 0;
  let pageIndex = 0;

  const text = (
    str: string,
    x: number,
    baselineY: number,
    opts: { size?: number; font?: PDFFont; color?: typeof INK } = {},
  ) => {
    page.drawText(S(str), {
      x,
      y: baselineY,
      size: opts.size ?? 9,
      font: opts.font ?? reg,
      color: opts.color ?? INK,
    });
  };

  const drawFooter = (p: PDFPage) => {
    p.drawLine({ start: { x: M, y: 74 }, end: { x: A4[0] - M, y: 74 }, thickness: 0.7, color: LINE });
    const notes = [
      `${COMPANY.website}  |  ${COMPANY.email}  |  ${COMPANY.phone} (calls & text)`,
      `Track your shipment any time at ${COMPANY.website}/track using tracking number ${invoice.tracking_number}.`,
      "Payment terms: due within 14 days of the invoice date. Late balances may delay release of the shipment.",
      "Shipment charges and delivery estimates may be subject to applicable customs, duties, taxes and service conditions.",
    ];
    let fy = 64;
    for (const note of notes) {
      for (const ln of wrap(note, reg, 6.8, CW)) {
        p.drawText(ln, { x: M, y: fy, size: 6.8, font: reg, color: MUTED });
        fy -= 8.4;
      }
    }
    p.drawText("Thank you for choosing TransportHaven.", { x: M, y: fy - 2, size: 8, font: bold, color: NAVY });
  };

  const drawPageHeader = (first: boolean) => {
    page.drawRectangle({ x: 0, y: A4[1] - 6, width: A4[0], height: 6, color: RED });
    const logoW = first ? 148 : 112;
    const logoH = (logoW * LOGO_H) / LOGO_W;
    page.drawImage(logo, { x: M, y: A4[1] - 24 - logoH, width: logoW, height: logoH });

    if (first) {
      let hy = A4[1] - 30;
      const right = (str: string, size: number, font: PDFFont, color = MUTED) => {
        const w = font.widthOfTextAtSize(str, size);
        page.drawText(str, { x: A4[0] - M - w, y: hy, size, font, color });
        hy -= size + 3.2;
      };
      right(COMPANY.name, 11, bold, NAVY);
      right(COMPANY.address, 8, reg);
      right(COMPANY.cityLine, 8, reg);
      right(`Tel: ${COMPANY.phone}`, 8, reg);
      right(COMPANY.email, 8, reg);
      right("transporthaven.com", 8, reg);
      y = Math.min(A4[1] - 24 - logoH, hy) - 18;
    } else {
      const label = `Invoice ${invoice.invoice_number} \u2022 Tracking ${invoice.tracking_number}`;
      const w = reg.widthOfTextAtSize(label, 8);
      page.drawText(label, { x: A4[0] - M - w, y: A4[1] - 34, size: 8, font: reg, color: MUTED });
      y = A4[1] - 24 - logoH - 16;
    }
  };

  const newPage = () => {
    drawFooter(page);
    page = doc.addPage(A4);
    pageIndex += 1;
    drawPageHeader(false);
  };

  const ensure = (needed: number) => {
    if (y - needed < 96) newPage();
  };

  drawPageHeader(true);

  // ---- Title + meta -------------------------------------------------------
  const metaRows: [string, string][] = [
    ["Invoice Number", invoice.invoice_number],
    ["Invoice Date", fmtDate(invoice.invoice_date)],
    ["Tracking Number", invoice.tracking_number],
    ["Shipment Status", statusLabel(S(shipment.status))],
    ["Payment Status", statusLabel(invoice.payment_status)],
    ["Currency", cur],
  ];
  const titleH = 26;
  page.drawRectangle({ x: M, y: y - titleH, width: CW, height: titleH, color: NAVY });
  page.drawRectangle({ x: M, y: y - titleH, width: 5, height: titleH, color: RED });
  text("SHIPMENT INVOICE", M + 14, y - titleH + 8.5, { size: 14, font: bold, color: WHITE });
  const totalTag = `TOTAL ${money(cur, invoice.total)}`;
  const tagW = bold.widthOfTextAtSize(totalTag, 11);
  text(totalTag, A4[0] - M - 12 - tagW, y - titleH + 9, { size: 11, font: bold, color: WHITE });
  y -= titleH + 12;

  const metaBoxH = 20 + Math.ceil(metaRows.length / 3) * 26;
  page.drawRectangle({ x: M, y: y - metaBoxH, width: CW, height: metaBoxH, color: BAND, borderColor: LINE, borderWidth: 0.7 });
  const colW = CW / 3;
  metaRows.forEach((row, i) => {
    const col = i % 3;
    const line = Math.floor(i / 3);
    const cx = M + 14 + col * colW;
    const cy = y - 20 - line * 26;
    text(row[0].toUpperCase(), cx, cy, { size: 6.6, font: bold, color: MUTED });
    text(row[1] || "\u2014", cx, cy - 11, { size: 9.5, font: bold, color: NAVY });
  });
  y -= metaBoxH + 16;

  // ---- Shipper / Consignee ------------------------------------------------
  const partyBoxW = (CW - 14) / 2;
  const partyLines = (prefix: "sender" | "receiver") => {
    const lines: { txt: string; bold?: boolean; muted?: boolean }[] = [];
    lines.push({ txt: S(shipment[`${prefix}_name`]) || "\u2014", bold: true });
    for (const l of addressLines(shipment, prefix)) lines.push({ txt: l });
    const phone = S(shipment[`${prefix}_phone`]);
    const email = S(shipment[`${prefix}_email`]);
    if (phone) lines.push({ txt: `Tel: ${phone}`, muted: true });
    if (email) lines.push({ txt: email, muted: true });
    return lines;
  };
  const senderLines = partyLines("sender");
  const receiverLines = partyLines("receiver");
  const bodyH = Math.max(senderLines.length, receiverLines.length) * 12 + 34;
  ensure(bodyH + 10);

  const drawParty = (title: string, x: number, lines: { txt: string; bold?: boolean; muted?: boolean }[]) => {
    page.drawRectangle({ x, y: y - bodyH, width: partyBoxW, height: bodyH, borderColor: LINE, borderWidth: 0.7, color: WHITE });
    page.drawRectangle({ x, y: y - 17, width: partyBoxW, height: 17, color: NAVY });
    text(title, x + 10, y - 12, { size: 7.6, font: bold, color: WHITE });
    let ly = y - 32;
    for (const l of lines) {
      for (const w of wrap(l.txt, l.bold ? bold : reg, l.bold ? 9.5 : 8.6, partyBoxW - 20)) {
        text(w, x + 10, ly, {
          size: l.bold ? 9.5 : 8.6,
          font: l.bold ? bold : reg,
          color: l.muted ? MUTED : INK,
        });
        ly -= 12;
      }
    }
  };
  drawParty("SHIPPER / SENDER", M, senderLines);
  drawParty("CONSIGNEE / RECEIVER", M + partyBoxW + 14, receiverLines);
  y -= bodyH + 16;

  // ---- Shipment details ---------------------------------------------------
  const dims = [N(shipment.dimensions_length), N(shipment.dimensions_width), N(shipment.dimensions_height)];
  const pkgCount = Math.max(1, Math.round(N(shipment.package_count) || 1));
  const detailPairs: [string, string][] = [
    ["Tracking Number", invoice.tracking_number],
    ["Shipment Date", fmtDate(S(shipment.pickup_date) || S(shipment.created_at))],
    ["Estimated Delivery", fmtDate(S(shipment.estimated_delivery_date))],
    ["Origin", locationText(shipment, "sender")],
    ["Destination", locationText(shipment, "receiver")],
    ["Service Type", statusLabel(S(shipment.service_type))],
    ["Package Type", pkgCount > 1 ? "Multi-piece parcel" : "Parcel"],
    ["Number of Packages", String(pkgCount)],
    ["Weight", N(shipment.weight) > 0 ? `${N(shipment.weight).toFixed(2)} lb` : ""],
    ["Dimensions", dims.every((d) => d > 0) ? `${dims[0]} x ${dims[1]} x ${dims[2]} in` : ""],
    ["Signature Required", shipment.requires_signature ? "Yes" : "No"],
    ["Assigned Driver", S(shipment.assigned_driver)],
    ["Actual Delivery", fmtDate(S(shipment.actual_delivery_date))],
  ].filter((pair) => S(pair[1]) !== "") as [string, string][];

  const detailRows = Math.ceil(detailPairs.length / 2);
  ensure(detailRows * 18 + 40);
  page.drawRectangle({ x: M, y: y - 17, width: CW, height: 17, color: NAVY_SOFT });
  text("SHIPMENT DETAILS", M + 10, y - 12, { size: 7.6, font: bold, color: WHITE });
  y -= 17;
  const halfW = CW / 2;
  for (let r = 0; r < detailRows; r++) {
    const rowY = y - r * 18;
    if (r % 2 === 0) page.drawRectangle({ x: M, y: rowY - 18, width: CW, height: 18, color: BAND });
    for (let c = 0; c < 2; c++) {
      const pair = detailPairs[r * 2 + c];
      if (!pair) continue;
      const x = M + c * halfW;
      text(pair[0].toUpperCase(), x + 10, rowY - 12, { size: 6.6, font: bold, color: MUTED });
      const valX = x + 118;
      const lines = wrap(pair[1], reg, 8.6, halfW - 128);
      text(lines[0] ?? "", valX, rowY - 12, { size: 8.6 });
      if (lines.length > 1) text(lines.slice(1).join(" "), valX, rowY - 12, { size: 8.6 });
    }
    page.drawLine({ start: { x: M, y: rowY - 18 }, end: { x: A4[0] - M, y: rowY - 18 }, thickness: 0.5, color: LINE });
  }
  y -= detailRows * 18;

  const desc = S(shipment.shipment_description) || S(shipment.description);
  const instructions = S(shipment.delivery_instructions);
  for (const block of [
    desc ? { label: "SHIPMENT DESCRIPTION", value: desc } : null,
    instructions ? { label: "DELIVERY INSTRUCTIONS", value: instructions } : null,
  ]) {
    if (!block) continue;
    const lines = wrap(block.value, reg, 8.6, CW - 20);
    ensure(lines.length * 11 + 24);
    text(block.label, M + 10, y - 13, { size: 6.6, font: bold, color: MUTED });
    let by = y - 25;
    for (const ln of lines) {
      text(ln, M + 10, by, { size: 8.6 });
      by -= 11;
    }
    y = by - 6;
  }
  y -= 12;

  // ---- Charges ------------------------------------------------------------
  const items = invoice.line_items ?? [];
  ensure(items.length * 17 + 130);
  const cols = [M, M + CW - 250, M + CW - 190, M + CW - 90];
  page.drawRectangle({ x: M, y: y - 18, width: CW, height: 18, color: NAVY });
  text("DESCRIPTION", cols[0] + 10, y - 12.5, { size: 7.2, font: bold, color: WHITE });
  const headRight = (label: string, xRight: number) => {
    const w = bold.widthOfTextAtSize(label, 7.2);
    text(label, xRight - w, y - 12.5, { size: 7.2, font: bold, color: WHITE });
  };
  headRight("QTY", cols[2] - 12);
  headRight("UNIT PRICE", cols[3] - 12);
  headRight("AMOUNT", M + CW - 10);
  y -= 18;

  items.forEach((item, i) => {
    if (y - 17 < 96) {
      newPage();
      page.drawRectangle({ x: M, y: y - 18, width: CW, height: 18, color: NAVY });
      text("DESCRIPTION (CONTINUED)", cols[0] + 10, y - 12.5, { size: 7.2, font: bold, color: WHITE });
      y -= 18;
    }
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - 17, width: CW, height: 17, color: BAND });
    const nameLines = wrap(item.description, reg, 8.6, cols[1] - cols[0] - 20);
    text(nameLines[0] ?? "", cols[0] + 10, y - 11.5, { size: 8.6 });
    const rightAt = (str: string, xRight: number) => {
      const w = reg.widthOfTextAtSize(str, 8.6);
      text(str, xRight - w, y - 11.5, { size: 8.6 });
    };
    rightAt(String(item.quantity ?? 1), cols[2] - 12);
    rightAt(money(cur, item.unit_price), cols[3] - 12);
    rightAt(money(cur, item.amount), M + CW - 10);
    page.drawLine({ start: { x: M, y: y - 17 }, end: { x: A4[0] - M, y: y - 17 }, thickness: 0.5, color: LINE });
    y -= 17;
  });

  // Totals
  const totals: [string, number, boolean?][] = [
    ["Subtotal", invoice.subtotal],
    ["Discount", -Math.abs(invoice.discount)],
    ["Tax / VAT", invoice.tax],
    ["Total Shipping Charges", invoice.total, true],
    ["Amount Paid", invoice.amount_paid],
    ["Balance Due", invoice.balance_due, true],
  ];
  ensure(totals.length * 16 + 20);
  const tBoxX = M + CW - 250;
  y -= 8;
  totals.forEach(([label, value, strong]) => {
    if (strong) page.drawRectangle({ x: tBoxX, y: y - 16, width: 250, height: 16, color: strong ? BAND : WHITE });
    text(label, tBoxX + 10, y - 11.5, { size: strong ? 9 : 8.6, font: strong ? bold : reg, color: strong ? NAVY : INK });
    const str = money(cur, value);
    const f = strong ? bold : reg;
    const size = strong ? 9 : 8.6;
    const w = f.widthOfTextAtSize(str, size);
    text(str, M + CW - 10 - w, y - 11.5, { size, font: f, color: strong ? NAVY : INK });
    y -= 16;
  });
  y -= 14;

  // ---- Track your shipment + QR ------------------------------------------
  const qrSize = 88;
  const trackH = qrSize + 26;
  ensure(trackH + 10);
  page.drawRectangle({ x: M, y: y - trackH, width: CW, height: trackH, color: BAND, borderColor: LINE, borderWidth: 0.7 });
  text("TRACK YOUR SHIPMENT", M + 14, y - 18, { size: 7.6, font: bold, color: NAVY });
  const trackRows: [string, string][] = [
    ["Tracking Number", invoice.tracking_number],
    ["Current Status", statusLabel(S(shipment.status))],
    ["Current Location", S(input.currentLocation) || locationText(shipment, "receiver")],
    ["Estimated Delivery", fmtDate(S(shipment.estimated_delivery_date)) || "Pending schedule"],
  ];
  let ty = y - 34;
  for (const [label, value] of trackRows) {
    text(`${label}:`, M + 14, ty, { size: 8, font: bold, color: MUTED });
    text(value || "\u2014", M + 110, ty, { size: 8.6 });
    ty -= 13;
  }
  const urlLines = wrap(trackUrl, reg, 7.4, CW - 150 - qrSize);
  text(urlLines[0] ?? "", M + 14, ty - 2, { size: 7.4, color: NAVY });

  // QR code (pure-JS matrix drawn as vector squares — always renders)
  const qr = qrcode(0, "M");
  qr.addData(trackUrl);
  qr.make();
  const modules = qr.getModuleCount();
  const qrX = M + CW - qrSize - 16;
  const qrY = y - trackH + 20;
  page.drawRectangle({ x: qrX - 5, y: qrY - 5, width: qrSize + 10, height: qrSize + 10, color: WHITE, borderColor: LINE, borderWidth: 0.6 });
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
  const scanLabel = "Scan to track";
  const slW = reg.widthOfTextAtSize(scanLabel, 6.6);
  text(scanLabel, qrX + qrSize / 2 - slW / 2, qrY - 14, { size: 6.6, color: MUTED });
  y -= trackH + 16;

  // ---- Shipment history ---------------------------------------------------
  const history = (events ?? []).slice(0, 8);
  if (history.length) {
    ensure(history.length * 16 + 40);
    page.drawRectangle({ x: M, y: y - 18, width: CW, height: 18, color: NAVY_SOFT });
    text("SHIPMENT HISTORY", M + 10, y - 12.5, { size: 7.6, font: bold, color: WHITE });
    y -= 18;
    const hCols = [M + 10, M + 170, M + 350];
    page.drawRectangle({ x: M, y: y - 15, width: CW, height: 15, color: BAND });
    text("DATE & TIME", hCols[0], y - 10.5, { size: 6.6, font: bold, color: MUTED });
    text("LOCATION", hCols[1], y - 10.5, { size: 6.6, font: bold, color: MUTED });
    text("STATUS", hCols[2], y - 10.5, { size: 6.6, font: bold, color: MUTED });
    y -= 15;
    for (const ev of history) {
      if (y - 16 < 96) newPage();
      text(fmtDateTime(ev.created_at), hCols[0], y - 11, { size: 8 });
      text(wrap(S(ev.location) || "\u2014", reg, 8, 170)[0] ?? "", hCols[1], y - 11, { size: 8 });
      text(wrap(S(ev.description) || statusLabel(ev.status), reg, 8, CW - 360)[0] ?? "", hCols[2], y - 11, { size: 8 });
      page.drawLine({ start: { x: M, y: y - 16 }, end: { x: A4[0] - M, y: y - 16 }, thickness: 0.5, color: LINE });
      y -= 16;
    }
  }

  drawFooter(page);

  // Page numbers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const label = `Page ${i + 1} of ${pages.length}`;
    const w = reg.widthOfTextAtSize(label, 6.8);
    p.drawText(label, { x: A4[0] - M - w, y: 84, size: 6.8, font: reg, color: MUTED });
    p.drawText(`Invoice ${invoice.invoice_number}`, { x: M, y: 84, size: 6.8, font: bold, color: NAVY });
  });

  return await doc.save();
}
