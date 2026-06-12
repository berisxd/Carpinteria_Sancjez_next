"use client";

import Link from "next/link";

interface CategoriaCardProps {
  slug: string;
  nombre: string;
  count: number;
}

export function CategoriaCard({ slug, nombre, count }: CategoriaCardProps) {
  return (
    <Link href={`/categoria/${slug}`}>
      <div className="cs-card p-6 transition hover:-translate-y-0.5">
        <h3 className="text-lg font-semibold text-[var(--brand-700)]">{nombre}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{count} productos</p>
      </div>
    </Link>
  );
}
