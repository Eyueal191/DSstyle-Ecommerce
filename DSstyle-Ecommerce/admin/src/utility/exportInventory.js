/**
 * DS Style Inventory Export Utility
 * Generates Native Excel (.xlsx), Direct Downloadable PDF (.pdf), and Universal CSV (.csv)
 */
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Format numbers as Ethiopian Birr (ETB)
export const formatETB = (val) => {
  const num = Number(val || 0);
  return `ETB ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Safe category name extractor
export const getCategoryName = (cat) => {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (Array.isArray(cat)) {
    if (cat.length === 0) return "General";
    return getCategoryName(cat[0]);
  }
  if (typeof cat === "object") {
    return cat.name || cat.title || cat.category || "General";
  }
  return String(cat);
};

/**
 * Direct Download Native Excel (.xlsx) via SheetJS
 * Opens warning-free in Microsoft Excel, Apple Numbers, and Google Sheets
 */
export const exportInventoryToExcel = (products, options = {}) => {
  if (!products || products.length === 0) {
    alert("No products available to export.");
    return;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = options.filename || `DSStyle_Inventory_${dateStr}.xlsx`;
  const exportDate = new Date().toLocaleString();

  // Calculate totals
  const totalItems = products.length;
  const totalUnits = products.reduce(
    (acc, p) => acc + Number(p.actualStock ?? p.stock ?? p.quantity ?? 0),
    0
  );
  const totalValuation = products.reduce((acc, p) => {
    const stock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const price = Number(p.price || 0);
    return acc + stock * price;
  }, 0);
  const outOfStockCount = products.filter(
    (p) => Number(p.actualStock ?? p.stock ?? p.quantity ?? 0) === 0
  ).length;

  // Build rows array for SheetJS
  const sheetData = [
    ["DS STYLE — INVENTORY VALUATION & AUDIT REPORT"],
    [
      `Generated: ${exportDate}`,
      `Total SKUs: ${totalItems}`,
      `Units in Stock: ${totalUnits}`,
      `Out of Stock: ${outOfStockCount}`,
      `Total Asset Valuation: ETB ${totalValuation.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    ],
    [], // Spacer row
    [
      "#",
      "Product ID",
      "Product Name",
      "Category",
      "Volume / Spec",
      "Unit Price (ETB)",
      "Actual Stock (Units)",
      "Visible Stock (Units)",
      "Stock Status",
      "Valuation (ETB)",
      "Marquee Spotlight",
    ],
  ];

  // Data rows
  products.forEach((p, index) => {
    const actStock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const visStock = Number(p.visibleStock ?? actStock);
    const price = Number(p.price || 0);
    const lineValuation = actStock * price;
    const catName = getCategoryName(p.category);
    const status =
      actStock === 0
        ? "Out of Stock"
        : actStock <= 5
        ? "Low Stock"
        : "In Stock";

    sheetData.push([
      index + 1,
      p._id || String(index + 1),
      p.name || "Untitled Product",
      catName,
      p.amount || p.volume || "-",
      price,
      actStock,
      visStock,
      status,
      lineValuation,
      p.isFeatured ? "Yes" : "No",
    ]);
  });

  // Summary footer row
  sheetData.push([]);
  sheetData.push([
    "TOTAL",
    "",
    `Catalog Items: ${totalItems}`,
    "",
    "",
    "",
    totalUnits,
    "",
    `${outOfStockCount} Out of Stock`,
    totalValuation,
    "",
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Set balanced column widths
  worksheet["!cols"] = [
    { wch: 6 },  // #
    { wch: 26 }, // ID
    { wch: 34 }, // Name
    { wch: 18 }, // Category
    { wch: 14 }, // Spec
    { wch: 16 }, // Unit Price
    { wch: 20 }, // Actual Stock
    { wch: 20 }, // Visible Stock
    { wch: 16 }, // Status
    { wch: 22 }, // Total Valuation
    { wch: 18 }, // Featured
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Audit");

  // Directly triggers browser download of true .xlsx file
  XLSX.writeFile(workbook, filename);
};

/**
 * Direct Download Clean Vector PDF (.pdf) via jsPDF & autoTable
 * Generates an executive, branded, multi-page PDF document
 * with KPI cards, formatted numbers, repeat headers, and signature block.
 */
export const exportInventoryToPdf = (products, options = {}) => {
  if (!products || products.length === 0) {
    alert("No products available to export.");
    return;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = options.filename || `DSStyle_Inventory_Audit_${dateStr}.pdf`;
  const exportDate = new Date().toLocaleString();
  const title = options.title || "Inventory Valuation & Stock Audit Report";
  const filterSubtitle = options.filterSubtitle || "";

  // Summary Metrics
  const totalItems = products.length;
  const totalUnits = products.reduce(
    (acc, p) => acc + Number(p.actualStock ?? p.stock ?? p.quantity ?? 0),
    0
  );
  const totalValuation = products.reduce((acc, p) => {
    const stock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const price = Number(p.price || 0);
    return acc + stock * price;
  }, 0);
  const outOfStockCount = products.filter(
    (p) => Number(p.actualStock ?? p.stock ?? p.quantity ?? 0) === 0
  ).length;
  const lowStockCount = products.filter((p) => {
    const s = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    return s > 0 && s <= 5;
  }).length;

  // Initialize jsPDF in Standard A4 Portrait
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Brand Top Accent Bar
  doc.setFillColor(201, 160, 67); // #c9a043 signature pink
  doc.rect(margin, 12, contentWidth, 2, "F");

  // 2. Header Title & Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(201, 160, 67);
  doc.text("DS STYLE", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text("STREETWEAR & SNEAKERS • GOLAGOLE 22 • AUDIT REPORT", margin, 27);

  // Metadata block (Right aligned)
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Generated: ${exportDate}`, pageWidth - margin, 20, { align: "right" });
  doc.text("Portal: Operations Management", pageWidth - margin, 24, { align: "right" });
  doc.text("Telegram: t.me/DSstyles", pageWidth - margin, 28, { align: "right" });

  // 3. Document Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(title, margin, 36);

  if (filterSubtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(201, 160, 67);
    doc.text(filterSubtitle, margin, 41);
  }

  // 4. Executive KPI Grid (4 Cards)
  const kpiY = filterSubtitle ? 45 : 40;
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 14;

  const kpis = [
    { label: "Catalog SKUs", val: String(totalItems), sub: "Total catalog items" },
    { label: "Units in Warehouse", val: totalUnits.toLocaleString(), sub: "Physical stock units" },
    {
      label: "Inventory Valuation",
      val: `ETB ${totalValuation.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      sub: "Total asset value",
    },
    {
      label: "Stock Alerts",
      val: `${outOfStockCount} Out / ${lowStockCount} Low`,
      sub: "Requires replenishment",
      alert: outOfStockCount > 0,
    },
  ];

  kpis.forEach((k, i) => {
    const cardX = margin + i * (cardWidth + cardGap);
    // Background fill
    if (k.alert) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
    } else {
      doc.setFillColor(253, 242, 246);
      doc.setDrawColor(251, 207, 232);
    }
    doc.roundedRect(cardX, kpiY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    // KPI Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(k.alert ? 185 : 157, k.alert ? 28 : 23, k.alert ? 28 : 77);
    doc.text(k.label.toUpperCase(), cardX + 2.5, kpiY + 4);

    // KPI Value
    doc.setFontSize(9);
    doc.setTextColor(k.alert ? 153 : 131, k.alert ? 27 : 24, k.alert ? 27 : 67);
    doc.text(k.val, cardX + 2.5, kpiY + 8.5);

    // KPI Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(156, 163, 175);
    doc.text(k.sub, cardX + 2.5, kpiY + 12);
  });

  // 5. Data Table Preparation
  const tableHeaders = [
    [
      "#",
      "Product Name & Spec",
      "Category",
      "Unit Price (ETB)",
      "Stock",
      "Visible",
      "Status",
      "Valuation (ETB)",
    ],
  ];

  const tableRows = products.map((p, index) => {
    const actStock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const visStock = Number(p.visibleStock ?? actStock);
    const price = Number(p.price || 0);
    const lineValuation = actStock * price;
    const catName = getCategoryName(p.category);
    const status =
      actStock === 0
        ? "Out of Stock"
        : actStock <= 5
        ? "Low Stock"
        : "In Stock";
    const spec = p.amount || p.volume ? ` (${p.amount || p.volume})` : "";
    const fullName = `${p.name || "Untitled"}${spec}`;

    return [
      index + 1,
      fullName,
      catName,
      price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      actStock,
      visStock,
      status,
      lineValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];
  });

  const tableFooter = [
    [
      "TOTAL",
      `Total Catalog: ${totalItems} Products`,
      "",
      "",
      totalUnits.toLocaleString(),
      "-",
      `${outOfStockCount} Out`,
      `ETB ${totalValuation.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    ],
  ];

  // Render autoTable with clean executive vector styling
  autoTable(doc, {
    startY: kpiY + cardHeight + 4,
    margin: { left: margin, right: margin, bottom: 20 },
    head: tableHeaders,
    body: tableRows,
    foot: tableFooter,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [17, 24, 39], // #18181b Dark slate
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // #fafaf8 zebra
    },
    footStyles: {
      fillColor: [253, 242, 246], // Soft pink tint
      textColor: [131, 24, 67],
      fontStyle: "bold",
      fontSize: 8,
      lineWidth: 0.3,
      lineColor: [201, 160, 67],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: "auto", fontStyle: "bold" },
      2: { cellWidth: 26 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "center", cellWidth: 14, fontStyle: "bold" },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "right", cellWidth: 28, fontStyle: "bold", textColor: [201, 160, 67] },
    },
    didDrawCell: (data) => {
      // Highlight Status column cells with appropriate text colors
      if (data.section === "body" && data.column.index === 6) {
        const text = String(data.cell.raw || "");
        if (text === "Out of Stock") {
          doc.setTextColor(185, 28, 28);
        } else if (text === "Low Stock") {
          doc.setTextColor(180, 83, 9);
        } else {
          doc.setTextColor(21, 128, 61);
        }
      }
    },
    didDrawPage: (data) => {
      // Running Footer on every page
      const currentPg = data.pageNumber;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text(
        "DS Style • Confidential Inventory Audit Document",
        margin,
        pageHeight - 8
      );
      doc.text(
        `Page ${currentPg}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  // 6. Sign-off block at the end
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 220;
  if (finalY + 25 < pageHeight - 14) {
    const signBoxWidth = (contentWidth - 20) / 3;
    const signY = finalY;

    // Dashed divider
    doc.setDrawColor(209, 213, 219);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, signY, pageWidth - margin, signY);
    doc.setLineDashPattern([], 0);

    const signers = [
      "Prepared By (Inventory Lead)",
      "Audited By (Finance / Ops)",
      "Approved By (Store Director)",
    ];

    signers.forEach((name, i) => {
      const boxX = margin + i * (signBoxWidth + 10);
      const lineY = signY + 14;
      doc.setDrawColor(75, 85, 99);
      doc.line(boxX, lineY, boxX + signBoxWidth, lineY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(55, 65, 81);
      doc.text(name.toUpperCase(), boxX, lineY + 3.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(156, 163, 175);
      doc.text("Signature & Date", boxX, lineY + 6.5);
    });
  }

  // Directly downloads genuine .pdf file
  doc.save(filename);
};

/**
 * Direct Download Universal CSV (.csv)
 */
export const exportInventoryToCsv = (products, options = {}) => {
  if (!products || products.length === 0) {
    alert("No products available to export.");
    return;
  }

  const filename =
    options.filename ||
    `DSStyle_Inventory_${new Date().toISOString().split("T")[0]}.csv`;

  const headers = [
    "Product ID",
    "Product Name",
    "Category",
    "Volume / Size",
    "Unit Price (ETB)",
    "Actual Stock (Units)",
    "Visible Stock (Units)",
    "Stock Status",
    "Valuation (ETB)",
    "Marquee Featured",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = products.map((p, idx) => {
    const actStock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const visStock = Number(p.visibleStock ?? actStock);
    const price = Number(p.price || 0);
    const valuation = actStock * price;
    const catName = getCategoryName(p.category);
    const status =
      actStock === 0
        ? "Out of Stock"
        : actStock <= 5
        ? "Low Stock"
        : "In Stock";

    return [
      escapeCsv(p._id || idx + 1),
      escapeCsv(p.name || "Untitled"),
      escapeCsv(catName),
      escapeCsv(p.amount || p.volume || "-"),
      escapeCsv(price.toFixed(2)),
      escapeCsv(actStock),
      escapeCsv(visStock),
      escapeCsv(status),
      escapeCsv(valuation.toFixed(2)),
      escapeCsv(p.isFeatured ? "Yes" : "No"),
    ].join(",");
  });

  const totalUnits = products.reduce(
    (acc, p) => acc + Number(p.actualStock ?? p.stock ?? p.quantity ?? 0),
    0
  );
  const totalValuation = products.reduce((acc, p) => {
    const stock = Number(p.actualStock ?? p.stock ?? p.quantity ?? 0);
    const price = Number(p.price || 0);
    return acc + stock * price;
  }, 0);

  const summaryRow = [
    escapeCsv("TOTALS"),
    escapeCsv(`Total Items: ${products.length}`),
    escapeCsv(""),
    escapeCsv(""),
    escapeCsv(""),
    escapeCsv(totalUnits),
    escapeCsv(""),
    escapeCsv(""),
    escapeCsv(totalValuation.toFixed(2)),
    escapeCsv(""),
  ].join(",");

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows, summaryRow].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
