import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, type RGB } from "pdf-lib";
import type { ResultadoDespiece, TableroOptimizado, PiezaUbicada } from "./types";

// ── Page constants (A4 portrait) ──────────────────────────────────────────────
const PW = 595.28;    // page width  pts
const PH = 841.89;    // page height pts
const M  = 36;        // margin      pts
const MM = 2.8346;    // pts per mm

// ── Brand palette ─────────────────────────────────────────────────────────────
const BRAND_DARK  = rgb(0.06, 0.24, 0.45);   // navy header
const BRAND_AMBER = rgb(0.86, 0.61, 0.12);   // amber accent
const GRAY_BG     = rgb(0.95, 0.96, 0.97);
const GRAY_MID    = rgb(0.70, 0.72, 0.76);
const GRAY_DARK   = rgb(0.20, 0.23, 0.28);
const WHITE       = rgb(1, 1, 1);
const BOARD_BG    = rgb(0.93, 0.94, 0.92);   // light grey-beige for board

// ── Piece colour palette (10 distinct hues) ──────────────────────────────────
const PIECE_COLORS: RGB[] = [
  rgb(0.35, 0.65, 0.95),
  rgb(0.40, 0.80, 0.55),
  rgb(1.00, 0.75, 0.25),
  rgb(0.95, 0.45, 0.45),
  rgb(0.72, 0.52, 0.96),
  rgb(0.96, 0.62, 0.26),
  rgb(0.35, 0.82, 0.82),
  rgb(0.92, 0.52, 0.76),
  rgb(0.48, 0.76, 0.36),
  rgb(0.30, 0.50, 0.88),
];

function pieceColor(idx: number): RGB {
  return PIECE_COLORS[idx % PIECE_COLORS.length];
}

function darken(c: RGB, f = 0.65): RGB {
  return rgb(c.red * f, c.green * f, c.blue * f);
}

function contrastText(bg: RGB): RGB {
  const lum = 0.299 * bg.red + 0.587 * bg.green + 0.114 * bg.blue;
  return lum > 0.52 ? rgb(0.08, 0.10, 0.14) : WHITE;
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Low-level drawing helpers ─────────────────────────────────────────────────

function hRule(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  color: RGB = GRAY_MID,
  thickness = 0.5,
) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness, color });
}

function fillRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: RGB,
  stroke?: RGB,
  strokeW = 0.5,
) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: fill,
    ...(stroke ? { borderColor: stroke, borderWidth: strokeW } : {}),
  });
}

function text(
  page: PDFPage,
  s: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB = GRAY_DARK,
) {
  page.drawText(s, { x, y, size, font, color });
}

/** Draw a dimension line (horizontal) with ticks and mm label */
function dimH(
  page: PDFPage,
  x1: number,
  x2: number,
  y: number,
  label: string,
  font: PDFFont,
) {
  const color = GRAY_MID;
  const tick  = 3;
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.4, color });
  page.drawLine({ start: { x: x1, y: y - tick }, end: { x: x1, y: y + tick }, thickness: 0.4, color });
  page.drawLine({ start: { x: x2, y: y - tick }, end: { x: x2, y: y + tick }, thickness: 0.4, color });
  const tw = font.widthOfTextAtSize(label, 5.5);
  text(page, label, (x1 + x2) / 2 - tw / 2, y - 8, 5.5, font, GRAY_MID);
}

/** Draw a dimension line (vertical) with ticks and mm label */
function dimV(
  page: PDFPage,
  y1: number,
  y2: number,
  x: number,
  label: string,
  font: PDFFont,
) {
  const color = GRAY_MID;
  const tick  = 3;
  page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.4, color });
  page.drawLine({ start: { x: x - tick, y: y1 }, end: { x: x + tick, y: y1 }, thickness: 0.4, color });
  page.drawLine({ start: { x: x - tick, y: y2 }, end: { x: x + tick, y: y2 }, thickness: 0.4, color });
  const tw = font.widthOfTextAtSize(label, 5.5);
  text(page, label, x + 4, (y1 + y2) / 2 - 2.5, 5.5, font, GRAY_MID);
}

// ── Page header (brand bar) ───────────────────────────────────────────────────

function drawPageHeader(
  page: PDFPage,
  fontBold: PDFFont,
  fontReg: PDFFont,
  subtitle: string,
): number {
  const barH = 52;
  fillRect(page, 0, PH - barH, PW, barH, BRAND_DARK);

  // Logo text
  text(page, "Carpintería Sánchez", M, PH - 24, 14, fontBold, WHITE);
  text(page, "Plano de Corte / Cut List", M, PH - 38, 8, fontReg, rgb(0.78, 0.88, 1));

  // Subtitle (right-aligned)
  const sw = fontReg.widthOfTextAtSize(subtitle, 8);
  text(page, subtitle, PW - M - sw, PH - 31, 8, fontReg, rgb(0.78, 0.88, 1));

  return PH - barH; // top of remaining content area
}

// ── Cover / parts-list page ───────────────────────────────────────────────────

async function addCoverPage(
  pdfDoc: PDFDocument,
  resultado: ResultadoDespiece,
  colorMap: Map<string, RGB>,
  fontBold: PDFFont,
  fontReg: PDFFont,
  dateStr: string,
) {
  const page = pdfDoc.addPage([PW, PH]);
  let y = drawPageHeader(page, fontBold, fontReg, dateStr);
  y -= 18;

  // ── Product title ──────────────────────────────────────────────────────────
  text(page, trunc(resultado.producto, 55), M, y, 18, fontBold, BRAND_DARK);
  y -= 14;
  text(
    page,
    `${resultado.material} ${resultado.espesor} mm`,
    M, y, 9, fontReg, GRAY_MID,
  );
  y -= 10;
  hRule(page, M, y, PW - 2 * M, BRAND_AMBER, 1.5);
  y -= 16;

  // ── Summary KPI row ────────────────────────────────────────────────────────
  const kpis = [
    { label: "Tableros necesarios",        value: String(resultado.totalTableros) },
    { label: "Piezas distintas",           value: String(resultado.piezas.length) },
    { label: "Total unidades",             value: String(resultado.piezas.reduce((s, p) => s + p.cantidad, 0)) },
    { label: "Aprovechamiento promedio",   value: `${resultado.aprovechamientoPromedio}%` },
  ];
  const kpiW = (PW - 2 * M) / kpis.length;
  const kpiH = 44;
  kpis.forEach(({ label, value }, i) => {
    const kx = M + i * kpiW;
    fillRect(page, kx + 2, y - kpiH, kpiW - 4, kpiH, GRAY_BG, rgb(0.88, 0.90, 0.93));
    const vw = fontBold.widthOfTextAtSize(value, 16);
    text(page, value, kx + 2 + (kpiW - 4 - vw) / 2, y - 22, 16, fontBold, BRAND_DARK);
    const lw = fontReg.widthOfTextAtSize(trunc(label, 22), 6.5);
    text(page, trunc(label, 22), kx + 2 + (kpiW - 4 - lw) / 2, y - 38, 6.5, fontReg, GRAY_MID);
  });
  y -= kpiH + 14;

  hRule(page, M, y, PW - 2 * M);
  y -= 14;

  // ── Parts list table ───────────────────────────────────────────────────────
  text(page, "LISTA DE PIEZAS", M, y, 8.5, fontBold, BRAND_DARK);
  y -= 12;

  const cols = [
    { header: "#",          w: 18 },
    { header: "Nombre",     w: 150 },
    { header: "Ancho",      w: 46 },
    { header: "Alto",       w: 46 },
    { header: "Cant.",      w: 34 },
    { header: "Espesor",    w: 46 },
    { header: "Veta",       w: 40 },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const rowH   = 16;

  // Table header
  fillRect(page, M, y - rowH, tableW, rowH, BRAND_DARK);
  let cx = M;
  for (const col of cols) {
    const hw = fontBold.widthOfTextAtSize(col.header, 7);
    text(page, col.header, cx + (col.w - hw) / 2, y - 11, 7, fontBold, WHITE);
    cx += col.w;
  }
  y -= rowH;

  // Table rows
  let pIdx = 0;
  for (const pieza of resultado.piezas) {
    if (y < M + 20) break; // safety guard
    const rowBg = pIdx % 2 === 0 ? WHITE : GRAY_BG;
    fillRect(page, M, y - rowH, tableW, rowH, rowBg);

    // Color swatch
    const swatchColor = colorMap.get(pieza.id) ?? GRAY_MID;
    fillRect(page, M + 3, y - rowH + 4, 8, 8, swatchColor, darken(swatchColor));

    const cells = [
      String(pIdx + 1),
      trunc(pieza.nombre, 26),
      `${pieza.ancho} mm`,
      `${pieza.alto} mm`,
      `×${pieza.cantidad}`,
      `${pieza.espesor ?? resultado.espesor} mm`,
      pieza.veta ?? "—",
    ];

    cx = M;
    cells.forEach((cell, ci) => {
      // Skip first col (has swatch)
      if (ci === 0) { cx += cols[ci].w; return; }
      const isRight = ci >= 2;
      if (isRight) {
        const tw = fontReg.widthOfTextAtSize(cell, 7.5);
        text(page, cell, cx + cols[ci].w - tw - 4, y - 11, 7.5, fontReg);
      } else {
        text(page, cell, cx + 3, y - 11, 7.5, fontReg);
      }
      cx += cols[ci].w;
    });

    // Row bottom border
    hRule(page, M, y - rowH, tableW, rgb(0.88, 0.90, 0.93), 0.3);
    y -= rowH;
    pIdx++;
  }

  // Table outer border
  page.drawRectangle({
    x: M, y, width: tableW, height: rowH * (resultado.piezas.length + 1),
    borderColor: GRAY_MID, borderWidth: 0.5, color: undefined,
  });

  y -= 16;
  text(
    page,
    `Generado por Carpintería Sánchez — ${dateStr}. Los valores son orientativos; verifique con su fabricante.`,
    M, y, 6, fontReg, GRAY_MID,
  );
}

// ── Board layout page ─────────────────────────────────────────────────────────

async function addBoardPage(
  pdfDoc: PDFDocument,
  tablero: TableroOptimizado,
  totalTableros: number,
  colorMap: Map<string, RGB>,
  fontBold: PDFFont,
  fontReg: PDFFont,
  dateStr: string,
) {
  const page = pdfDoc.addPage([PW, PH]);
  const subtitle = `${dateStr}  ·  Tablero ${tablero.numero} de ${totalTableros}`;
  let y = drawPageHeader(page, fontBold, fontReg, subtitle);
  y -= 12;

  // ── Board info strip ───────────────────────────────────────────────────────
  const infoText = [
    `TABLERO ${tablero.numero} / ${totalTableros}`,
    `·`,
    `${tablero.tablero.material} ${tablero.tablero.espesor} mm`,
    `·`,
    `${tablero.tablero.ancho} × ${tablero.tablero.alto} mm`,
    `·`,
    `Aprovechamiento: ${tablero.aprovechamiento}%`,
  ].join("  ");
  text(page, infoText, M, y, 8.5, fontBold, BRAND_DARK);
  y -= 8;
  hRule(page, M, y, PW - 2 * M, BRAND_AMBER, 1.5);
  y -= 12;

  // ── Compute board drawing area ─────────────────────────────────────────────
  // Reserve bottom for legend (estimate: 2 rows of 5 items = ~46 pts + margin)
  const uniquePiezas = [...new Set(tablero.piezas.map((p) => p.pieza.id))];
  const legendRows   = Math.ceil(uniquePiezas.length / 5);
  const legendH      = 14 + legendRows * 14;

  const drawH = y - M - legendH - 20;  // available pts for board
  const drawW = PW - 2 * M - 20;       // with extra right margin for dim line

  const { ancho: BW, alto: BH } = tablero.tablero;
  const scale = Math.min(drawW / BW, drawH / BH); // pts per mm

  const boardPtsW = BW * scale;
  const boardPtsH = BH * scale;

  // Center horizontally
  const boardX = M + (drawW - boardPtsW) / 2;
  const boardY = y - boardPtsH; // bottom-left in PDF coords

  // ── Draw board background ──────────────────────────────────────────────────
  fillRect(page, boardX, boardY, boardPtsW, boardPtsH, BOARD_BG, rgb(0.55, 0.57, 0.60), 0.7);

  // Draw subtle grid lines (every 100 mm)
  const gridStep = 100 * scale;
  for (let gx = gridStep; gx < boardPtsW - 1; gx += gridStep) {
    page.drawLine({
      start: { x: boardX + gx, y: boardY },
      end:   { x: boardX + gx, y: boardY + boardPtsH },
      thickness: 0.2, color: rgb(0.75, 0.77, 0.80),
    });
  }
  for (let gy = gridStep; gy < boardPtsH - 1; gy += gridStep) {
    page.drawLine({
      start: { x: boardX,             y: boardY + gy },
      end:   { x: boardX + boardPtsW, y: boardY + gy },
      thickness: 0.2, color: rgb(0.75, 0.77, 0.80),
    });
  }

  // ── Draw pieces ────────────────────────────────────────────────────────────
  for (const pu of tablero.piezas) {
    const color = colorMap.get(pu.pieza.id) ?? GRAY_MID;
    const pw  = (pu.rotada ? pu.pieza.alto  : pu.pieza.ancho) * scale;
    const ph  = (pu.rotada ? pu.pieza.ancho : pu.pieza.alto)  * scale;
    const px  = boardX + pu.x * scale;
    // y-flip: board (0,0) = top-left; PDF y grows upward
    const py  = boardY + boardPtsH - pu.y * scale - ph;

    fillRect(page, px, py, pw, ph, color, darken(color, 0.68), 0.6);

    // ── Label inside piece ───────────────────────────────────────────────────
    const minLabelW = 22;
    const minLabelH = 14;
    if (pw >= minLabelW && ph >= minLabelH) {
      const tc    = contrastText(color);
      const maxSz = Math.min(6.5, pw / 9, ph / 5);
      const sz    = Math.max(4, maxSz);

      const label  = trunc(pu.pieza.nombre, Math.floor(pw / (sz * 0.55)));
      const dims   = `${pu.rotada ? pu.pieza.alto : pu.pieza.ancho}×${pu.rotada ? pu.pieza.ancho : pu.pieza.alto}`;

      const lw = fontBold.widthOfTextAtSize(label, sz);
      const dw = fontReg.widthOfTextAtSize(dims, sz - 0.5);

      if (lw < pw - 4) {
        text(page, label, px + (pw - lw) / 2, py + ph / 2 + sz * 0.5, sz, fontBold, tc);
      }
      if (ph > 24 && dw < pw - 4) {
        text(page, dims, px + (pw - dw) / 2, py + ph / 2 - sz * 0.9, sz - 0.5, fontReg, tc);
      }
    }

    // Rotation badge
    if (pu.rotada && pw >= 14 && ph >= 10) {
      text(page, "[R]", px + pw - 14, py + ph - 2, 4.5, fontReg, contrastText(color));
    }
  }

  // ── Board outer border (draw on top) ──────────────────────────────────────
  page.drawRectangle({
    x: boardX, y: boardY, width: boardPtsW, height: boardPtsH,
    borderColor: rgb(0.35, 0.38, 0.45), borderWidth: 0.8, color: undefined,
  });

  // ── Dimension lines ────────────────────────────────────────────────────────
  dimH(page, boardX, boardX + boardPtsW, boardY - 4, `${BW} mm`, fontReg);
  dimV(page, boardY, boardY + boardPtsH, boardX + boardPtsW + 5, `${BH} mm`, fontReg);

  // ── Legend ─────────────────────────────────────────────────────────────────
  let ly = boardY - 18;
  text(page, "Leyenda de piezas", M, ly, 7, fontBold, GRAY_DARK);
  ly -= 10;

  const itemsPerRow = 5;
  const swatchSz    = 9;
  const itemW       = (PW - 2 * M) / itemsPerRow;

  uniquePiezas.forEach((pid, i) => {
    const pieza = tablero.piezas.find((pu) => pu.pieza.id === pid)?.pieza;
    if (!pieza) return;
    const col   = i % itemsPerRow;
    const row   = Math.floor(i / itemsPerRow);
    const lx    = M + col * itemW;
    const lrY   = ly - row * 13;
    const color = colorMap.get(pid) ?? GRAY_MID;
    fillRect(page, lx, lrY - swatchSz + 1, swatchSz, swatchSz, color, darken(color));
    text(
      page,
      trunc(`${pieza.nombre} (${pieza.ancho}×${pieza.alto})`, 28),
      lx + swatchSz + 3,
      lrY - swatchSz + 2,
      6.5,
      fontReg,
    );
  });
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function generarDespiecePdf(resultado: ResultadoDespiece): Promise<Uint8Array> {
  const pdfDoc  = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Assign a stable colour per unique piece ID
  const colorMap = new Map<string, RGB>();
  resultado.piezas.forEach((pieza, idx) => {
    colorMap.set(pieza.id, pieceColor(idx));
  });

  const dateStr = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });

  // Page 1: cover + parts list
  await addCoverPage(pdfDoc, resultado, colorMap, fontBold, fontReg, dateStr);

  // Pages 2+: one per board
  for (const tablero of resultado.tableros) {
    await addBoardPage(
      pdfDoc,
      tablero,
      resultado.totalTableros,
      colorMap,
      fontBold,
      fontReg,
      dateStr,
    );
  }

  return pdfDoc.save();
}
