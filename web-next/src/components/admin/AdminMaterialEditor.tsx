"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export interface MaterialOpcion {
  nombre: string;
  imagen: string;
}

// Suggested materials with default SVG textures (admin can override)
export const MATERIALES_SUGERIDOS: MaterialOpcion[] = [
  { nombre: "Pino natural",   imagen: "/materiales/pino.svg" },
  { nombre: "Cedro rojo",     imagen: "/materiales/cedro.svg" },
  { nombre: "MDF laqueado",   imagen: "/materiales/mdf.svg" },
  { nombre: "Roble",          imagen: "/materiales/roble.svg" },
  { nombre: "Caoba",          imagen: "/materiales/caoba.svg" },
  { nombre: "Fresno",         imagen: "/materiales/fresno.svg" },
  { nombre: "Wenge",          imagen: "/materiales/wenge.svg" },
];

interface Props {
  action: (formData: FormData) => Promise<void> | void;
  initialOpciones: MaterialOpcion[];
}

export function AdminMaterialEditor({ action, initialOpciones }: Props) {
  const [opciones, setOpciones] = useState<MaterialOpcion[]>(initialOpciones);
  const formRef = useRef<HTMLFormElement>(null);

  function addOpcion() {
    setOpciones((prev) => [...prev, { nombre: "", imagen: "" }]);
  }

  function addSugerido(mat: MaterialOpcion) {
    if (!opciones.find((o) => o.nombre === mat.nombre)) {
      setOpciones((prev) => [...prev, mat]);
    }
  }

  function removeOpcion(index: number) {
    setOpciones((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOpcion(index: number, field: keyof MaterialOpcion, value: string) {
    setOpciones((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  }

  const remaining = MATERIALES_SUGERIDOS.filter(
    (s) => !opciones.find((o) => o.nombre === s.nombre),
  );

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <input type="hidden" name="opcionesMaterial" value={JSON.stringify(opciones)} readOnly />

      {/* Current options list */}
      <div className="space-y-3">
        {opciones.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-700 py-6 text-center text-xs text-slate-500">
            Sin opciones configuradas. Agrega materiales desde los sugeridos o manualmente.
          </p>
        )}

        {opciones.map((op, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
          >
            {/* Image preview */}
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
              {op.imagen ? (
                <Image src={op.imagen} alt={op.nombre || "material"} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">🪵</div>
              )}
            </div>

            {/* Inputs */}
            <div className="flex flex-1 flex-col gap-2 min-w-0">
              <input
                value={op.nombre}
                onChange={(e) => updateOpcion(i, "nombre", e.target.value)}
                placeholder="Nombre (ej. Pino natural)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400"
              />
              <input
                value={op.imagen}
                onChange={(e) => updateOpcion(i, "imagen", e.target.value)}
                placeholder="URL imagen (ej. /materiales/pino.svg)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-amber-400"
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeOpcion(i)}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-red-900/30 hover:text-red-400"
              title="Eliminar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Quick-add from suggested */}
      {remaining.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Agregar rápido
          </p>
          <div className="flex flex-wrap gap-2">
            {remaining.map((mat) => (
              <button
                key={mat.nombre}
                type="button"
                onClick={() => addSugerido(mat)}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-400 hover:text-amber-300"
              >
                <div className="relative h-4 w-6 overflow-hidden rounded-sm">
                  <Image src={mat.imagen} alt={mat.nombre} fill className="object-cover" unoptimized />
                </div>
                {mat.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual add */}
      <button
        type="button"
        onClick={addOpcion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-2.5 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar material personalizado
      </button>

      {/* Save */}
      <button
        type="submit"
        className="w-full rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
      >
        Guardar opciones de material
      </button>
    </form>
  );
}
