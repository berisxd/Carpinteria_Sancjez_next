"use client";

import Link from "next/link";
import Image from "next/image";

interface ProductoCardProps {
  id: string;
  nombre: string;
  imagen: string;
  precio: number;
  materialCount?: number;
  categoria: {
    nombre: string;
    slug: string;
  };
}

export function ProductoCard({
  id,
  nombre,
  imagen,
  precio,
  materialCount,
  categoria,
}: ProductoCardProps) {
  return (
    <Link href={`/producto/${id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-lg">
        {/* Image */}
        <div className="relative h-52 w-full overflow-hidden bg-[var(--bg)]">
          <Image
            src={imagen}
            alt={nombre}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "var(--brand)",
              backdropFilter: "blur(4px)",
            }}
          >
            {categoria.nombre}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-[0.88rem] font-semibold leading-snug text-[var(--fg)]">
            {nombre}
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>
              ${Number(precio).toLocaleString("es-MX")}
            </p>
            <div className="flex items-center gap-2">
              {materialCount != null && materialCount > 0 && (
                <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {materialCount} {materialCount === 1 ? "material" : "materiales"}
                </span>
              )}
              <span className="text-xs font-bold text-[var(--brand)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                Ver más →
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
