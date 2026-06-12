import Link from "next/link";
import { CategoriaCard } from "@/components/CategoriaCard";
import { ProductoCard } from "@/components/ProductoCard";
import { ContactoForm } from "@/components/site/ContactoForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categorias, productos] = await Promise.all([
    prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        _count: {
          select: { productos: { where: { habilitado: true } } },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where: { habilitado: true },
      include: { categoria: { select: { nombre: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="cs-hero mb-14 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="cs-hero-panel p-6 sm:p-7">
              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                Muebles a tu medida con el sello de Carpintería Sánchez
              </h1>
              <p className="mt-4 text-[15px] text-blue-50/95">
                Diseñamos y fabricamos piezas funcionales y duraderas para tu
                hogar o negocio, con acabados artesanales y atención personalizada.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#catalogo" className="cs-btn-primary">
                  Explorar catálogo
                </a>
                <Link href="/cotizacion" className="cs-btn-outline">
                  Solicitar presupuesto
                </Link>
              </div>
            </div>
            <div className="cs-hero-panel p-6 text-white/95">
              <p className="text-sm uppercase tracking-wide text-blue-100/90">
                Desde 1995
              </p>
              <p className="mt-2 text-2xl font-bold">Tradición y diseño moderno</p>
              <p className="mt-3 text-sm text-blue-100/90">
                Trabajamos cocinas, armarios, puertas y mobiliario personalizado
                en madera y derivados, priorizando calidad y tiempos de entrega.
              </p>
            </div>
          </div>
        </section>

        <section id="catalogo" className="mb-16">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[var(--brand-700)]">Categorías</h2>
            <Link href="/checkout" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              Ver carrito
            </Link>
          </div>
          {categorias.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorias.map((cat) => (
                <CategoriaCard
                  key={cat.id}
                  slug={cat.slug}
                  nombre={cat.nombre}
                  count={cat._count.productos}
                />
              ))}
            </div>
          ) : (
            <p className="text-[var(--muted)]">No hay categorías disponibles.</p>
          )}
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-[var(--brand-700)]">
            Últimos Productos
          </h2>
          {productos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((prod) => (
                <ProductoCard
                  key={prod.id}
                  id={prod.id}
                  nombre={prod.nombre}
                  imagen={prod.imagen}
                  precio={Number(prod.precio)}
                  categoria={{
                    nombre: prod.categoria.nombre,
                    slug: prod.categoria.slug,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[var(--muted)]">
              No hay productos disponibles en este momento.
            </p>
          )}
        </section>

        <section id="nosotros" className="cs-card mb-16 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--brand-700)]">Sobre Nosotros</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-[var(--muted)]">
            En Carpintería Sánchez combinamos oficio tradicional con soluciones
            actuales. Nuestro equipo acompaña cada proyecto desde la idea hasta
            la instalación final, buscando que cada pieza tenga utilidad, estilo
            y durabilidad.
          </p>
        </section>

        <section id="contacto" className="cs-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--brand-700)]">Contacto</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Escríbenos y te responderemos para coordinar visita, medidas o propuesta.
          </p>
          <div className="mt-4 grid gap-2 text-[var(--muted)] sm:grid-cols-2">
            <p>Tel: (246) 158 1146</p>
            <p>Email: juanyahelsanchezflores5@gmail.com</p>
            <p>WhatsApp: +52 246 158 1146</p>
            <p>San Cosme Atlamaxac, Tepeyanco, Tlaxcala</p>
          </div>
          <ContactoForm />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

