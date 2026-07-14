import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductoCard } from "@/components/ProductoCard";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    orden?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const categoria = await prisma.categoria.findUnique({
    where: { slug },
  });

  if (!categoria) return {};

  return {
    title: `${categoria.nombre} - Carpintería`,
    description: `Catálogo de ${categoria.nombre}`,
  };
}

const SORT_OPTIONS = [
  { label: "Más recientes", value: "reciente" },
  { label: "Menor precio", value: "precio_asc" },
  { label: "Mayor precio", value: "precio_desc" },
];

export default async function CategoriePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { orden = "reciente" } = await searchParams;

  const orderBy =
    orden === "precio_asc"
      ? { precio: "asc" as const }
      : orden === "precio_desc"
        ? { precio: "desc" as const }
        : { createdAt: "desc" as const };

  const categoria = await prisma.categoria.findUnique({
    where: { slug },
    include: {
      productos: {
        where: { habilitado: true },
        orderBy,
        select: {
          id: true,
          nombre: true,
          imagen: true,
          precio: true,
          opcionesMaterial: true,
        },
      },
    },
  });

  if (!categoria) {
    notFound();
  }

  const count = categoria.productos.length;

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* ── Header card ────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8"
          style={{ background: "var(--brand-700)" }}
        >
          {/* decorative wood grain stripe */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(105deg, #fff 0px, #fff 1px, transparent 1px, transparent 18px)",
            }}
          />
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              ← Inicio
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              {categoria.nombre}
            </h1>
            <p className="mt-1.5 text-sm text-white/60">
              {count === 0
                ? "Sin productos disponibles por ahora"
                : `${count} producto${count !== 1 ? "s" : ""} disponible${count !== 1 ? "s" : ""}`}
            </p>
          </div>
        </section>

        {/* ── Sort bar ───────────────────────────────────── */}
        {count > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Ordenar:
            </span>
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/categoria/${slug}?orden=${opt.value}`}
                className={[
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                  orden === opt.value
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : "border-[var(--brand)]/30 text-[var(--brand-700)] hover:border-[var(--brand)] hover:bg-[var(--brand)]/5",
                ].join(" ")}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Product grid ───────────────────────────────── */}
        {count > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoria.productos.map((prod) => {
              let matCount = 0;
              try {
                const parsed = JSON.parse(prod.opcionesMaterial) as unknown;
                if (Array.isArray(parsed)) matCount = parsed.length;
              } catch { /* ignore */ }
              return (
                <ProductoCard
                  key={prod.id}
                  id={prod.id}
                  nombre={prod.nombre}
                  imagen={prod.imagen}
                  precio={Number(prod.precio)}
                  materialCount={matCount}
                  categoria={{
                    nombre: categoria.nombre,
                    slug: categoria.slug,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="cs-card p-10 text-center">
            <p className="text-2xl">🪵</p>
            <p className="mt-3 font-semibold text-[var(--brand-700)]">
              Sin productos en esta categoría
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Estamos trabajando en nuevos diseños.
            </p>
            <Link
              href="/cotizacion"
              className="mt-5 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Solicitar diseño a medida
            </Link>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

