import Link from "next/link";
import Image from "next/image";
import { AddToCartButton, type MaterialOpcion } from "@/components/cart/AddToCartButton";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { notFound } from "next/navigation";
import { DescargaDespieceButton } from "@/components/despiece/DescargaDespieceButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id },
  });

  if (!producto) return {};

  return {
    title: `${producto.nombre} - Carpintería`,
    description: producto.descripcion,
  };
}

export default async function ProductoPage({ params }: PageProps) {
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
    },
  });

  if (!producto || !producto.habilitado) {
    notFound();
  }

  const opcionesMaterial = (() => {
    try {
      const parsed = JSON.parse(producto.opcionesMaterial) as unknown;
      if (!Array.isArray(parsed)) return [] as MaterialOpcion[];
      return (parsed as unknown[]).map((item): MaterialOpcion => {
        if (typeof item === "string") return { nombre: item, imagen: "" };
        const o = item as Record<string, unknown>;
        return { nombre: String(o.nombre ?? ""), imagen: String(o.imagen ?? "") };
      }).filter((o) => o.nombre);
    } catch {
      return [] as MaterialOpcion[];
    }
  })();

  // Check if this product has a cut-list configured
  const hasDespiece = (() => {
    try {
      const parsed = JSON.parse(producto.despieceJson) as unknown;
      return (
        !!parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        "piezas" in parsed &&
        Array.isArray((parsed as { piezas: unknown }).piezas) &&
        (parsed as { piezas: unknown[] }).piezas.length > 0
      );
    } catch {
      return false;
    }
  })();

  // Obtener productos relacionados de la misma categoría
  const relacionados = await prisma.producto.findMany({
    where: {
      categoriaId: producto.categoriaId,
      habilitado: true,
      id: { not: producto.id },
    },
    take: 3,
  });

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8">
          <Link href={`/categoria/${producto.categoria.slug}`} className="text-sm font-semibold text-[var(--brand)] hover:underline">
            ← Volver a {producto.categoria.nombre}
          </Link>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative h-96 w-full overflow-hidden rounded-xl cs-card">
            <Image
              src={producto.imagen}
              alt={producto.nombre}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="cs-card space-y-6 p-6 sm:p-7">
            <div>
              <Link
                href={`/categoria/${producto.categoria.slug}`}
                className="text-xs font-semibold uppercase text-[var(--muted)] hover:text-[var(--brand)]"
              >
                {producto.categoria.nombre}
              </Link>
              <h1 className="mt-2 text-3xl font-bold text-[var(--brand-700)]">
                {producto.nombre}
              </h1>
            </div>

            <div>
              <p className="text-4xl font-bold text-[var(--accent)]">
                ${Number(producto.precio).toLocaleString("es-AR")}
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-semibold text-[var(--brand-700)]">
                Descripción
              </h2>
              <p className="leading-relaxed text-[var(--muted)]">
                {producto.descripcion}
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-semibold text-[var(--brand-700)]">
                Materiales
              </h2>
              <p className="leading-relaxed text-[var(--muted)]">
                {producto.materiales}
              </p>
            </div>

            <AddToCartButton
              opcionesMaterial={opcionesMaterial}
              product={{
                id: producto.id,
                nombre: producto.nombre,
                imagen: producto.imagen,
                precio: Number(producto.precio),
                categoria: {
                  nombre: producto.categoria.nombre,
                  slug: producto.categoria.slug,
                },
              }}
            />

            {hasDespiece && (
              <DescargaDespieceButton
                productoId={producto.id}
                productoNombre={producto.nombre}
              />
            )}
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-[var(--brand-700)]">
              Más en {producto.categoria.nombre}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((prod) => (
                <Link key={prod.id} href={`/producto/${prod.id}`}>
                  <div className="cs-card overflow-hidden transition hover:-translate-y-0.5">
                    <div className="relative h-48 w-full bg-slate-100">
                      <Image
                        src={prod.imagen}
                        alt={prod.nombre}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-[var(--brand-700)]">
                        {prod.nombre}
                      </h3>
                      <p className="mt-3 text-lg font-bold text-[var(--accent)]">
                        ${Number(prod.precio).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
