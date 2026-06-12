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

export default async function CategoriePage({ params }: PageProps) {
  const { slug } = await params;
  const categoria = await prisma.categoria.findUnique({
    where: { slug },
    include: {
      productos: {
        where: { habilitado: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!categoria) {
    notFound();
  }

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8 cs-card p-5 sm:p-6">
          <Link href="/" className="text-sm font-semibold text-[var(--brand)] hover:underline">
            ← Volver al inicio
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-[var(--brand-700)]">
            {categoria.nombre}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Productos disponibles en esta categoría.
          </p>
        </section>

        {categoria.productos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoria.productos.map((prod) => (
              <ProductoCard
                key={prod.id}
                id={prod.id}
                nombre={prod.nombre}
                imagen={prod.imagen}
                precio={Number(prod.precio)}
                categoria={{
                  nombre: categoria.nombre,
                  slug: categoria.slug,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="cs-card p-8 text-center">
            <p className="text-[var(--muted)]">
              No hay productos en esta categoría.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
