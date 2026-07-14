"use client";

import { useState } from "react";
import type { DespieceConfig, Material, Pieza, Veta } from "@/lib/despiece/types";

const MATERIALES: Material[]        = ["MDF", "Melamina", "Triplay", "Aglomerado"];
const ESPESORES: number[]           = [6, 9, 12, 15, 18, 22, 25];
const VETAS: { value: Veta; label: string }[] = [
  { value: "ninguna",    label: "Ninguna / indiferente" },
  { value: "vertical",   label: "Vertical ↑" },
  { value: "horizontal", label: "Horizontal →" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface Props {
  action:         (formData: FormData) => Promise<void> | void;
  initialConfig:  DespieceConfig | null;
}

const DEFAULT_CONFIG: DespieceConfig = {
  material: "MDF",
  espesor:  18,
  piezas:   [],
};

export function AdminDespieceEditor({ action, initialConfig }: Props) {
  const [config, setConfig] = useState<DespieceConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Piece helpers ──────────────────────────────────────────────────────────
  function addPieza() {
    const pieza: Pieza = {
      id:       uid(),
      nombre:   "",
      ancho:    300,
      alto:     600,
      cantidad: 1,
      veta:     "ninguna",
    };
    setConfig((c) => ({ ...c, piezas: [...c.piezas, pieza] }));
    setExpanded(pieza.id);
  }

  function removePieza(id: string) {
    setConfig((c) => ({ ...c, piezas: c.piezas.filter((p) => p.id !== id) }));
  }

  function updatePieza(id: string, patch: Partial<Pieza>) {
    setConfig((c) => ({
      ...c,
      piezas: c.piezas.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function duplicatePieza(pieza: Pieza) {
    const copy: Pieza = { ...pieza, id: uid(), nombre: pieza.nombre + " (copia)" };
    setConfig((c) => ({ ...c, piezas: [...c.piezas, copy] }));
  }

  // ── Total pieces count ─────────────────────────────────────────────────────
  const totalUnits = config.piezas.reduce((s, p) => s + p.cantidad, 0);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="despieceJson" value={JSON.stringify(config)} readOnly />

      {/* Global settings */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Material por defecto
          <select
            value={config.material}
            onChange={(e) => setConfig((c) => ({ ...c, material: e.target.value as Material }))}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {MATERIALES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Espesor por defecto (mm)
          <select
            value={config.espesor}
            onChange={(e) => setConfig((c) => ({ ...c, espesor: Number(e.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {ESPESORES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
      </div>

      {/* Board size override */}
      <details className="group">
        <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300">
          ▸ Tamaño de tablero personalizado (opcional)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-xs text-slate-400">
            Ancho tablero (mm)
            <input
              type="number"
              min={100}
              value={config.tableroAncho ?? ""}
              placeholder="Auto (ej. 2440)"
              onChange={(e) =>
                setConfig((c) => ({ ...c, tableroAncho: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Alto tablero (mm)
            <input
              type="number"
              min={100}
              value={config.tableroAlto ?? ""}
              placeholder="Auto (ej. 1220)"
              onChange={(e) =>
                setConfig((c) => ({ ...c, tableroAlto: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
      </details>

      {/* Pieces list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Piezas  <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              {config.piezas.length} tipos · {totalUnits} unidades
            </span>
          </p>
          <button
            type="button"
            onClick={addPieza}
            className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
          >
            + Agregar pieza
          </button>
        </div>

        {config.piezas.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 py-8 text-center text-xs text-slate-500">
            Sin piezas. Haz clic en "Agregar pieza" para comenzar.
          </div>
        )}

        <div className="space-y-2">
          {config.piezas.map((pieza, idx) => (
            <div
              key={pieza.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
            >
              {/* Piece header row */}
              <button
                type="button"
                onClick={() => setExpanded(expanded === pieza.id ? null : pieza.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {/* Color swatch */}
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-sm"
                  style={{ background: SWATCH_COLORS[idx % SWATCH_COLORS.length] }}
                />
                <span className="flex-1 truncate text-sm font-medium text-slate-200">
                  {pieza.nombre || <em className="text-slate-500">Sin nombre</em>}
                </span>
                <span className="text-[10px] text-slate-500">
                  {pieza.ancho}×{pieza.alto} mm · ×{pieza.cantidad}
                </span>
                <span className="text-slate-500">{expanded === pieza.id ? "▲" : "▼"}</span>
              </button>

              {/* Expanded editor */}
              {expanded === pieza.id && (
                <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3">
                  <label className="block text-xs text-slate-400">
                    Nombre de la pieza
                    <input
                      value={pieza.nombre}
                      onChange={(e) => updatePieza(pieza.id, { nombre: e.target.value })}
                      placeholder="Ej. Lateral izquierdo"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="block text-xs text-slate-400">
                      Ancho (mm)
                      <input
                        type="number"
                        min={1}
                        value={pieza.ancho}
                        onChange={(e) => updatePieza(pieza.id, { ancho: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="block text-xs text-slate-400">
                      Alto (mm)
                      <input
                        type="number"
                        min={1}
                        value={pieza.alto}
                        onChange={(e) => updatePieza(pieza.id, { alto: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="block text-xs text-slate-400">
                      Cantidad
                      <input
                        type="number"
                        min={1}
                        value={pieza.cantidad}
                        onChange={(e) => updatePieza(pieza.id, { cantidad: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs text-slate-400">
                      Dirección de veta
                      <select
                        value={pieza.veta ?? "ninguna"}
                        onChange={(e) => updatePieza(pieza.id, { veta: e.target.value as Veta })}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      >
                        {VETAS.map((v) => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs text-slate-400">
                      Descripción (opcional)
                      <input
                        value={pieza.descripcion ?? ""}
                        onChange={(e) => updatePieza(pieza.id, { descripcion: e.target.value })}
                        placeholder="Notas adicionales"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => duplicatePieza(pieza)}
                      className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => removePieza(pieza.id)}
                      className="flex-1 rounded-lg border border-rose-800/50 py-1.5 text-xs text-rose-400 hover:border-rose-600 hover:text-rose-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
      >
        Guardar plano de corte
      </button>
    </form>
  );
}

// Mirrors the PDF palette so the admin sees the same colors as the PDF
const SWATCH_COLORS = [
  "#59A6F2", "#66CC8C", "#FFC040", "#F37373", "#B785F5",
  "#F59E42", "#59D0D0", "#EB85C0", "#7AC05C", "#4D80E0",
];
