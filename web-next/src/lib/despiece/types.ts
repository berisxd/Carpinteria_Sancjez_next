// ── Despiece / Cut-List types ────────────────────────────────────────────────

export type Material = "MDF" | "Melamina" | "Triplay" | "Aglomerado";

export type Veta = "vertical" | "horizontal" | "ninguna";

/** A single part (piece) of a furniture item */
export type Pieza = {
  id: string;
  nombre: string;
  ancho: number;   // mm – finished width
  alto: number;    // mm – finished height
  cantidad: number;
  espesor?: number; // mm – if omitted, uses DespieceConfig.espesor
  veta?: Veta;
  descripcion?: string;
};

/** Board (panel) dimensions and material */
export type Tablero = {
  ancho: number; // mm
  alto: number;  // mm
  material: Material;
  espesor: number; // mm
};

/** Positioned piece inside a board */
export type PiezaUbicada = {
  pieza: Pieza;
  x: number;      // mm from board top-left
  y: number;      // mm from board top-left
  rotada: boolean; // 90° rotated to fit
  instancia: number; // copy index (1-based)
};

/** One board with all its placed pieces */
export type TableroOptimizado = {
  tablero: Tablero;
  numero: number;
  piezas: PiezaUbicada[];
  aprovechamiento: number; // 0–100 %
};

/** Full cut-list result */
export type ResultadoDespiece = {
  producto: string;
  material: Material;
  espesor: number;
  tableros: TableroOptimizado[];
  piezas: Pieza[];
  totalTableros: number;
  aprovechamientoPromedio: number;
};

// ── JSON stored in Producto.despieceJson ─────────────────────────────────────

export type DespieceConfig = {
  material: Material;
  espesor: number;
  tableroAncho?: number; // override default board width (mm)
  tableroAlto?: number;  // override default board height (mm)
  piezas: Pieza[];
};
