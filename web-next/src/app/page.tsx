import React from "react";
import Link from "next/link";
import { CategoriaCard } from "@/components/CategoriaCard";
import { ProductoCard } from "@/components/ProductoCard";
import { ContactoForm } from "@/components/site/ContactoForm";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATS_HERO = [
  { num: "30+", label: "Años de experiencia" },
  { num: "500+", label: "Proyectos completados" },
  { num: "100%", label: "Garantía en acabados" },
];

const FEATURES = [
  "Materiales de primera calidad seleccionados a mano",
  "Acabados artesanales con atención al detalle",
  "Entrega y montaje incluidos en tu zona",
  "Presupuesto sin compromiso en 24 horas",
];

const STATS_ABOUT = [
  { num: "1995", label: "Año de fundación", sub: "Más de 30 años de historia" },
  { num: "500+", label: "Proyectos realizados", sub: "En hogares y negocios" },
  { num: "4", label: "Líneas de producto", sub: "Cocinas, armarios y más" },
  { num: "24h", label: "Respuesta garantizada", sub: "Presupuesto sin compromiso" },
];

const CONTACT_INFO = [
  { label: "Teléfono", value: "(246) 158 1146" },
  { label: "WhatsApp", value: "+52 246 158 1146" },
  { label: "Email", value: "juanyahelsanchezflores5@gmail.com" },
  { label: "Dirección", value: "San Cosme Atlamaxac, Tepeyanco, Tlaxcala" },
];


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
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <SiteHeader />

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="cs-hero">
        <div className="cs-hero-overlay" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_260px] lg:items-center">
            {/* Copy */}
            <div>
              <span className="cs-pill">Artesanos desde 1995</span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.2rem]">
                Muebles que duran{" "}
                <span style={{ color: "var(--accent)" }}>generaciones</span>
              </h1>
              <p className="mt-5 max-w-lg text-[0.97rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                Diseñamos y fabricamos piezas únicas para tu hogar o negocio,
                con acabados artesanales, materiales de primera y atención
                personalizada en cada proyecto.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#catalogo" className="cs-btn-primary">
                  Explorar catálogo
                </a>
                <Link href="/cotizacion" className="cs-btn-hero-outline">
                  Solicitar presupuesto
                </Link>
              </div>
            </div>

            {/* Stat cards (desktop) */}
            <div className="hidden lg:flex lg:flex-col gap-3">
              {STATS_HERO.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border p-5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
                    {s.num}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stat row (mobile) */}
          <div
            className="mt-12 grid grid-cols-3 divide-x border-t pt-8 lg:hidden"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              "--tw-divide-opacity": "0.15",
            } as React.CSSProperties}
          >
            {STATS_HERO.map((s) => (
              <div key={s.label} className="px-4 text-center first:pl-0 last:pr-0">
                <p className="text-xl font-extrabold" style={{ color: "var(--accent)" }}>
                  {s.num}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-24 px-4 py-16 sm:px-6 lg:px-8">
        {/* ─── Categories ─────────────────────────────────────── */}
        <section id="catalogo">
          <div className="mb-8 flex items-end justify-between gap-3">
            <div>
              <p className="cs-eyebrow">Nuestros productos</p>
              <h2 className="cs-section-title mt-1">Explora por categoría</h2>
            </div>
            <Link
              href="/checkout"
              className="shrink-0 text-sm font-semibold transition-colors"
              style={{ color: "var(--muted)" }}
            >
              Ver carrito →
            </Link>
          </div>
          {categorias.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <p style={{ color: "var(--muted)" }}>No hay categorías disponibles.</p>
          )}
        </section>

        {/* ─── Products ───────────────────────────────────────── */}
        <section>
          <div className="mb-8">
            <p className="cs-eyebrow">Recién añadidos</p>
            <h2 className="cs-section-title mt-1">Últimos productos</h2>
          </div>
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
            <p style={{ color: "var(--muted)" }}>No hay productos disponibles.</p>
          )}
        </section>

        {/* ─── About ──────────────────────────────────────────── */}
        <section id="nosotros" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="cs-eyebrow">Quiénes somos</p>
            <h2 className="cs-section-title mt-1">
              Tradición artesanal y diseño moderno
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
              En Carpintería Sánchez combinamos oficio tradicional con soluciones
              actuales. Nuestro equipo acompaña cada proyecto desde la idea hasta
              la instalación, buscando que cada pieza tenga utilidad, estilo y
              durabilidad.
            </p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--muted)" }}>
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--accent)" }}
                  >
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/cotizacion" className="cs-btn-primary">
                Pedir presupuesto gratis
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS_ABOUT.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border bg-white p-5 shadow-sm"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
                  {s.num}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Contact ────────────────────────────────────────── */}
        <section
          id="contacto"
          className="rounded-2xl border bg-white p-8 shadow-sm sm:p-10"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="cs-eyebrow">Hablemos</p>
              <h2 className="cs-section-title mt-1">Ponerse en contacto</h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Escríbenos y te responderemos para coordinar visita, tomar
                medidas o preparar tu propuesta personalizada.
              </p>
              <ul className="mt-7 space-y-5">
                {CONTACT_INFO.map((c) => (
                  <li key={c.label} className="flex flex-col gap-0.5">
                    <span
                      className="text-[0.7rem] font-bold uppercase tracking-widest"
                      style={{ color: "var(--accent)" }}
                    >
                      {c.label}
                    </span>
                    <span className="text-sm" style={{ color: "var(--fg)" }}>
                      {c.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ContactoForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

