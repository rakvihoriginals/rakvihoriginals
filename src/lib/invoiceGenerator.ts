import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceCartItem {
  id?: number | string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variationName?: string;
  originalPrice?: number;
}

export interface InvoiceOrder {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  alt_phone_number?: string;
  house_number: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  payment_id: string;
  payment_status: string;
  status: string;
  total_price: string | number;
  shipping_cost?: string | number;
  grand_total: string | number;
  discount_amount?: string | number;
  coupon_code?: string | null;
  order_date: string;
  cart_items: InvoiceCartItem[];
}

/**
 * Loads the brand logo as an authentic transparent PNG base64 data URL.
 * Preserves transparency and wide 8:1 aspect ratio so white/gold letters
 * stand out vibrantly against the dark header banner in jsPDF.
 */
export async function loadLogoAsBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // 1. Try direct fetch for lossless, uncompressed PNG bytes
  try {
    const res = await fetch("/rakvih-logo.png");
    if (res.ok) {
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) return base64;
    }
  } catch {
    // continue to canvas fallback
  }

  // 2. Canvas fallback preserving transparency and natural dimensions
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const w = img.naturalWidth || 893;
          const h = img.naturalHeight || 112;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = "/rakvih-logo.png";
    } catch {
      resolve(null);
    }
  });
}

/**
 * Safely converts an image URL into a base64 data URL via HTML Canvas.
 * Returns null if network or CORS fails, ensuring PDF generation never crashes.
 */
export async function loadImageAsBase64(url: string): Promise<string | null> {
  if (typeof window === "undefined" || !url) return null;
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 120;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          // White background for transparent PNGs
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

function formatCurrency(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  return `INR ${num.toLocaleString("en-IN")}`;
}

export async function downloadOrderInvoice(order: InvoiceOrder): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Pre-load images concurrently (brand logo + cart items)
  const [logoBase64, ...itemImages] = await Promise.all([
    loadLogoAsBase64(),
    ...order.cart_items.map((it) => (it.image ? loadImageAsBase64(it.image) : Promise.resolve(null))),
  ]);

  // ── HEADER ACCENT BAR ──────────────────────────────────────
  // Top luxury gold stripe
  doc.setFillColor(196, 161, 116); // #C4A174 gold
  doc.rect(0, 0, pageWidth, 4, "F");

  // Dark header banner
  doc.setFillColor(15, 13, 10); // Rich luxury charcoal black
  doc.rect(0, 4, pageWidth, 32, "F");

  // Logo / Brand Title
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 7.5, 56, 7.5);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      doc.text("RAKVIH ORIGINALS", margin, 17);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text("RAKVIH ORIGINALS", margin, 17);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(196, 161, 116);
  doc.text("MAISON HAUTE COUTURE & LUXURY ATELIER", margin, 20);
  doc.setTextColor(180, 180, 180);
  doc.text("Bangalore · Paris · Milan | rakvihoriginals@gmail.com", margin, 25);

  // Top Right: TAX INVOICE Title & Ref
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL INVOICE", pageWidth - margin, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(196, 161, 116);
  const shortId = order.id ? order.id.slice(0, 8).toUpperCase() : "VIP";
  doc.text(`Ref: #RO-${shortId}`, pageWidth - margin, 22, { align: "right" });

  const orderDateStr = order.order_date
    ? new Date(order.order_date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");
  doc.setTextColor(180, 180, 180);
  doc.text(`Date: ${orderDateStr}`, pageWidth - margin, 28, { align: "right" });

  // ── INVOICE METADATA & BILLING BOX ─────────────────────────
  let currentY = 42;

  // Two columns: Billed & Shipped To (Left) | Order Details (Right)
  const colWidth = (pageWidth - margin * 2 - 8) / 2;

  // Box 1: Client Information
  doc.setFillColor(250, 248, 244);
  doc.setDrawColor(228, 220, 206);
  doc.roundedRect(margin, currentY, colWidth, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 13, 10);
  doc.text("BILLED & DELIVERED TO", margin + 4, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(order.full_name || "Valued Client", margin + 4, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Email: ${order.email || "—"}`, margin + 4, currentY + 20);
  doc.text(`Phone: ${order.phone_number || "—"}${order.alt_phone_number ? ` / ${order.alt_phone_number}` : ""}`, margin + 4, currentY + 25);
  
  const addressLine1 = `${order.house_number || ""}, ${order.street || ""}`.trim();
  const addressLine2 = `${order.city || ""}, ${order.state || ""} - ${order.pincode || ""}`.trim();
  doc.text(addressLine1 || "Address on File", margin + 4, currentY + 31);
  doc.text(addressLine2, margin + 4, currentY + 36);

  // Box 2: Order & Payment Status
  const rightColX = margin + colWidth + 8;
  doc.setFillColor(250, 248, 244);
  doc.setDrawColor(228, 220, 206);
  doc.roundedRect(rightColX, currentY, colWidth, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 13, 10);
  doc.text("ORDER & PAYMENT LEDGER", rightColX + 4, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Order ID:", rightColX + 4, currentY + 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(order.id, rightColX + 22, currentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Fulfillment:", rightColX + 4, currentY + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(order.status?.toLowerCase() === "delivered" ? 22 : 180, order.status?.toLowerCase() === "delivered" ? 140 : 120, 40);
  doc.text((order.status || "CONFIRMED").toUpperCase(), rightColX + 24, currentY + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Payment:", rightColX + 4, currentY + 26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(order.payment_status?.toLowerCase() === "paid" ? 22 : 200, order.payment_status?.toLowerCase() === "paid" ? 140 : 100, 40);
  doc.text((order.payment_status || "PAID").toUpperCase(), rightColX + 22, currentY + 26);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Method:", rightColX + 4, currentY + 32);
  doc.setTextColor(40, 40, 40);
  doc.text(`${(order.payment_method || "Online").toUpperCase()}`, rightColX + 20, currentY + 32);

  doc.setTextColor(80, 80, 80);
  doc.text("Transaction:", rightColX + 4, currentY + 38);
  doc.setTextColor(40, 40, 40);
  doc.text(`${order.payment_id || "Direct Secure"}`, rightColX + 25, currentY + 38);

  currentY += 48;

  // ── ITEMIZED CREATIONS TABLE ───────────────────────────────
  const tableRows = order.cart_items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price) || 0;
    const lineTotal = unitPrice * qty;

    const desc = `${item.name}${item.variationName ? `\nVariant: ${item.variationName}` : ""}`;

    return [
      "", // Image placeholder drawn via didDrawCell
      desc,
      String(qty),
      formatCurrency(unitPrice),
      formatCurrency(lineTotal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Item", "Creation & Specification", "Qty", "Unit Price", "Total Amount"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [15, 13, 10],
      textColor: [196, 161, 116],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3.5,
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8.5,
      cellPadding: 3.5,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [252, 250, 247],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" }, // Thumbnail column
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
    },
    didDrawCell: (data) => {
      // Draw product thumbnail inside column 0
      if (data.column.index === 0 && data.cell.section === "body") {
        const itemIdx = data.row.index;
        const img = itemImages[itemIdx];
        if (img) {
          try {
            const pad = 1.5;
            const imgSize = Math.min(data.cell.width - pad * 2, data.cell.height - pad * 2, 13);
            const x = data.cell.x + (data.cell.width - imgSize) / 2;
            const y = data.cell.y + (data.cell.height - imgSize) / 2;
            doc.addImage(img, "JPEG", x, y, imgSize, imgSize);
          } catch {
            // gracefully fallback to blank cell
          }
        }
      }
    },
  });

  // ── FINANCIAL SUMMARY ──────────────────────────────────────
  const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 50;
  let summaryY = finalTableY + 6;

  // Ensure summary doesn't overflow page
  if (summaryY + 50 > pageHeight - margin) {
    doc.addPage();
    summaryY = margin + 10;
  }

  // Left Note / Authenticity Seal
  const noteBoxWidth = colWidth + 10;
  doc.setFillColor(252, 250, 247);
  doc.setDrawColor(228, 220, 206);
  doc.roundedRect(margin, summaryY, noteBoxWidth, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(196, 161, 116);
  doc.text("AUTHENTICITY & MAISON GUARANTEE", margin + 4, summaryY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Every creation acquired from RAKVIH Originals is verified", margin + 4, summaryY + 13);
  doc.text("by our master curators in Bangalore and crafted to genuine", margin + 4, summaryY + 18);
  doc.text("haute couture standards with signature packaging.", margin + 4, summaryY + 23);
  doc.setTextColor(140, 140, 140);
  doc.text("Support & Care: rakvihoriginals@gmail.com", margin + 4, summaryY + 29);

  // Right Totals Table
  const totalsX = margin + noteBoxWidth + 6;
  const totalsWidth = pageWidth - margin - totalsX;

  const subtotal = Number(order.total_price || order.grand_total);
  const discount = Number(order.discount_amount || 0);
  const grandTotal = Number(order.grand_total);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal:", totalsX, summaryY + 7);
  doc.text(formatCurrency(subtotal), pageWidth - margin, summaryY + 7, { align: "right" });

  if (discount > 0) {
    doc.text(`Promotional Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}:`, totalsX, summaryY + 13);
    doc.setTextColor(46, 117, 89);
    doc.text(`- ${formatCurrency(discount)}`, pageWidth - margin, summaryY + 13, { align: "right" });
    doc.setTextColor(80, 80, 80);
  }

  const shippingY = discount > 0 ? summaryY + 19 : summaryY + 14;
  doc.text("Luxury Shipping:", totalsX, shippingY);
  doc.setTextColor(46, 117, 89);
  doc.text("COMPLIMENTARY", pageWidth - margin, shippingY, { align: "right" });

  // Divider Line
  const divY = shippingY + 3;
  doc.setDrawColor(210, 200, 185);
  doc.line(totalsX, divY, pageWidth - margin, divY);

  // Grand Total Highlight
  const grandTotalY = divY + 7;
  doc.setFillColor(15, 13, 10);
  doc.roundedRect(totalsX - 2, divY + 2, totalsWidth + 2, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(196, 161, 116);
  doc.text("GRAND TOTAL:", totalsX + 2, grandTotalY);
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(grandTotal), pageWidth - margin - 2, grandTotalY, { align: "right" });

  // ── FOOTER ─────────────────────────────────────────────────
  doc.setDrawColor(228, 220, 206);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This is a computer-generated tax invoice for your authentic RAKVIH Originals acquisition. No signature required.",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // Trigger browser download
  const safeFileName = `RAKVIH-Invoice-${shortId}.pdf`;
  doc.save(safeFileName);
}
