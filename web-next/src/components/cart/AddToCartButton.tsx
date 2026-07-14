"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

export interface MaterialOpcion {
  nombre: string;
  imagen: string;
}

// Auto-map known material names to their SVG texture path
const MATERIAL_IMAGE_MAP: Record<string, string> = {
  "pino natural":  "/materiales/pino.svg",
  "cedro rojo":    "/materiales/cedro.svg",
  "mdf laqueado":  "/materiales/mdf.svg",
  "mdf":           "/materiales/mdf.svg",
  "roble":         "/materiales/roble.svg",
  "caoba":         "/materiales/caoba.svg",
  "fresno":        "/materiales/fresno.svg",
  "wenge":         "/materiales/wenge.svg",
};

function resolveMatImage(mat: MaterialOpcion): string {
  if (mat.imagen) return mat.imagen;
  return MATERIAL_IMAGE_MAP[mat.nombre.toLowerCase().trim()] ?? "/materiales/madera-default.svg";
}

interface AddToCartButtonProps {
  product: {
    id: string;
    nombre: string;
    imagen: string;
    precio: number;
    categoria: {
      nombre: string;
      slug: string;
    };
  };
  opcionesMaterial?: MaterialOpcion[];
}

export function AddToCartButton({ product, opcionesMaterial = [] }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>(
    opcionesMaterial.length === 1 ? opcionesMaterial[0].nombre : undefined,
  );
  const [error, setError] = useState(false);

  const requiresMaterial = opcionesMaterial.length > 0;

  function handleClick() {
    if (requiresMaterial && !selectedMaterial) {
      setError(true);
      return;
    }
    setError(false);
    const cartKey = selectedMaterial ? `${product.id}::${selectedMaterial}` : product.id;
    addItem({ ...product, materialSeleccionado: selectedMaterial, cartKey });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      {opcionesMaterial.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--brand-700)]">
            Tipo de material
          </p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {opcionesMaterial.map((mat) => {
              const active = selectedMaterial === mat.nombre;
              return (
                <button
                  key={mat.nombre}
                  type="button"
                  onClick={() => {
                    setSelectedMaterial(mat.nombre);
                    setError(false);
                  }}
                  className={[
                    "group flex flex-col overflow-hidden rounded-xl border-2 transition shadow-sm",
                    active
                      ? "border-[var(--brand)] shadow-md"
                      : "border-transparent hover:border-[var(--brand)]/40",
                  ].join(" ")}
                >
                  {/* Image */}
                  <div className="relative h-16 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={resolveMatImage(mat)}
                      alt={mat.nombre}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      unoptimized
                    />
                    {/* Checkmark overlay when selected */}
                    {active && (
                      <div className="absolute inset-0 flex items-start justify-end bg-[var(--brand)]/20 p-1">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)]">
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    className={[
                      "w-full px-1 py-1.5 text-center text-[11px] font-medium leading-tight transition",
                      active
                        ? "bg-[var(--brand)] text-white"
                        : "bg-white text-[var(--brand-700)] group-hover:bg-[var(--brand)]/5",
                    ].join(" ")}
                  >
                    {mat.nombre}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">
              Selecciona un tipo de material antes de agregar al carrito.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-center font-semibold text-white shadow-md transition hover:brightness-95"
      >
        {justAdded ? "Agregado al carrito!" : "Agregar al carrito"}
      </button>
    </div>
  );
}