"use client";

import Link from "next/link";
import Image from "next/image";

interface ProductoCardProps {
  id: string;
  nombre: string;
  imagen: string;
  precio: number;
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
  categoria,
}: ProductoCardProps) {
  return (
    <Link href={`/producto/${id}`}>
      <div className="cs-card overflow-hidden transition hover:-translate-y-0.5">
        <div className="relative h-48 w-full bg-slate-100">
          <Image
            src={imagen}
            alt={nombre}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4">
          <p className="text-xs uppercase text-[var(--muted)]">{categoria.nombre}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--brand-700)]">
            {nombre}
          </h3>
          <p className="mt-3 text-lg font-bold text-[var(--accent)]">
            ${Number(precio).toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    </Link>
  );
}
