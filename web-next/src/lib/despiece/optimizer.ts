import type {
  DespieceConfig,
  Material,
  Pieza,
  PiezaUbicada,
  ResultadoDespiece,
  Tablero,
  TableroOptimizado,
} from "./types";

// ── Board size catalogue ──────────────────────────────────────────────────────
const BOARD_SIZES: Record<Material, { ancho: number; alto: number }> = {
  MDF:        { ancho: 2440, alto: 1220 },
  Melamina:   { ancho: 2750, alto: 1830 },
  Triplay:    { ancho: 2440, alto: 1220 },
  Aglomerado: { ancho: 2440, alto: 1220 },
};

const KERF = 3; // mm – saw-blade width added between cuts

// ── Free-rectangle list ───────────────────────────────────────────────────────
type Rect = { x: number; y: number; w: number; h: number };

/**
 * Guillotine Best-Area-Fit: find the free rectangle with the smallest area
 * that still fits the piece (w × h). Tries both normal and rotated placement.
 * Returns the chosen position and the updated free-rect list, or null.
 */
function guillotinePlacement(
  frees: Rect[],
  pw: number,
  ph: number,
  allowRotate: boolean,
): { x: number; y: number; rotada: boolean; newFrees: Rect[] } | null {
  let bestIdx = -1;
  let bestArea = Infinity;
  let bestRotated = false;

  for (let i = 0; i < frees.length; i++) {
    const f = frees[i];
    const fitsNormal  = pw + KERF <= f.w && ph + KERF <= f.h;
    const fitsRotated = allowRotate && ph + KERF <= f.w && pw + KERF <= f.h;

    if (fitsNormal && f.w * f.h < bestArea) {
      bestArea = f.w * f.h;
      bestIdx = i;
      bestRotated = false;
    }
    // Only prefer rotation when normal doesn't fit or gives worse BAF
    if (fitsRotated && !fitsNormal && f.w * f.h < bestArea) {
      bestArea = f.w * f.h;
      bestIdx = i;
      bestRotated = true;
    }
  }

  if (bestIdx === -1) return null;

  const f     = frees[bestIdx];
  const usedW = bestRotated ? ph : pw;
  const usedH = bestRotated ? pw : ph;

  // Guillotine split with max-area rule
  const remainRight  = (f.w - usedW - KERF) * usedH;
  const remainBottom = f.w * (f.h - usedH - KERF);

  const newFrees: Rect[] = [
    ...frees.slice(0, bestIdx),
    ...frees.slice(bestIdx + 1),
  ];

  if (remainRight >= remainBottom) {
    if (f.w - usedW - KERF > 0)
      newFrees.push({ x: f.x + usedW + KERF, y: f.y, w: f.w - usedW - KERF, h: usedH });
    if (f.h - usedH - KERF > 0)
      newFrees.push({ x: f.x, y: f.y + usedH + KERF, w: f.w, h: f.h - usedH - KERF });
  } else {
    if (f.h - usedH - KERF > 0)
      newFrees.push({ x: f.x, y: f.y + usedH + KERF, w: usedW, h: f.h - usedH - KERF });
    if (f.w - usedW - KERF > 0)
      newFrees.push({ x: f.x + usedW + KERF, y: f.y, w: f.w - usedW - KERF, h: f.h });
  }

  return { x: f.x, y: f.y, rotada: bestRotated, newFrees };
}

// ── Board state during packing ────────────────────────────────────────────────
type BoardState = {
  tablero: Tablero;
  numero: number;
  piezasUbicadas: PiezaUbicada[];
  frees: Rect[];
};

function newBoard(tablero: Tablero, numero: number): BoardState {
  return {
    tablero,
    numero,
    piezasUbicadas: [],
    frees: [{ x: 0, y: 0, w: tablero.ancho, h: tablero.alto }],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the Guillotine BAF optimizer on a DespieceConfig.
 * Returns a full ResultadoDespiece ready for PDF rendering.
 */
export function optimizar(
  config: DespieceConfig,
  productoNombre = "",
): ResultadoDespiece {
  const dim = BOARD_SIZES[config.material];
  const tableroBase: Tablero = {
    ancho:    config.tableroAncho  ?? dim.ancho,
    alto:     config.tableroAlto   ?? dim.alto,
    material: config.material,
    espesor:  config.espesor,
  };

  // Validate: no piece larger than a full board
  for (const pieza of config.piezas) {
    const fitsNormal  = pieza.ancho <= tableroBase.ancho && pieza.alto <= tableroBase.alto;
    const fitsRotated = pieza.alto  <= tableroBase.ancho && pieza.ancho <= tableroBase.alto;
    if (!fitsNormal && !fitsRotated) {
      throw new Error(
        `La pieza "${pieza.nombre}" (${pieza.ancho}×${pieza.alto} mm) no cabe en el tablero (${tableroBase.ancho}×${tableroBase.alto} mm).`,
      );
    }
  }

  // Expand by quantity and sort largest-first (Better First-Fit Decreasing)
  type Instance = { pieza: Pieza; instancia: number };
  const instances: Instance[] = [];
  for (const pieza of config.piezas) {
    for (let i = 1; i <= pieza.cantidad; i++) {
      instances.push({ pieza, instancia: i });
    }
  }
  instances.sort((a, b) => b.pieza.ancho * b.pieza.alto - a.pieza.ancho * a.pieza.alto);

  const boards: BoardState[] = [];

  for (const { pieza, instancia } of instances) {
    const allowRotate = !pieza.veta || pieza.veta === "ninguna";
    let placed = false;

    for (const board of boards) {
      const result = guillotinePlacement(board.frees, pieza.ancho, pieza.alto, allowRotate);
      if (result) {
        board.piezasUbicadas.push({
          pieza,
          x: result.x,
          y: result.y,
          rotada: result.rotada,
          instancia,
        });
        board.frees = result.newFrees;
        placed = true;
        break;
      }
    }

    if (!placed) {
      const board = newBoard(tableroBase, boards.length + 1);
      boards.push(board);
      const result = guillotinePlacement(board.frees, pieza.ancho, pieza.alto, allowRotate);
      if (result) {
        board.piezasUbicadas.push({
          pieza,
          x: result.x,
          y: result.y,
          rotada: result.rotada,
          instancia,
        });
        board.frees = result.newFrees;
      }
    }
  }

  // Build final result with utilization percentages
  const boardArea = tableroBase.ancho * tableroBase.alto;
  const tablerosOpt: TableroOptimizado[] = boards.map((b) => {
    const usedArea = b.piezasUbicadas.reduce((sum, pu) => {
      const w = pu.rotada ? pu.pieza.alto : pu.pieza.ancho;
      const h = pu.rotada ? pu.pieza.ancho : pu.pieza.alto;
      return sum + w * h;
    }, 0);
    return {
      tablero: b.tablero,
      numero: b.numero,
      piezas: b.piezasUbicadas,
      aprovechamiento: Math.round((usedArea / boardArea) * 1000) / 10,
    };
  });

  const avgUtil =
    tablerosOpt.reduce((s, t) => s + t.aprovechamiento, 0) /
    (tablerosOpt.length || 1);

  return {
    producto: productoNombre,
    material: config.material,
    espesor:  config.espesor,
    tableros: tablerosOpt,
    piezas:   config.piezas,
    totalTableros: tablerosOpt.length,
    aprovechamientoPromedio: Math.round(avgUtil * 10) / 10,
  };
}
