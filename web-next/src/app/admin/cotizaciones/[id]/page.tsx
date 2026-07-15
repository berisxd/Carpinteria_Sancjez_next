import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { TipoMueble } from "@prisma/client";
import { CotizacionImagen } from "@/components/admin/CotizacionImagen";

const TIPO_MUEBLE_LABELS: Record<TipoMueble, string> = {
  cocinas_integrales: "Cocinas integrales",
  closets: "Closets",
  puertas: "Puertas",
  muebles_personalizados: "Muebles personalizados",
  instalacion_montaje: "Instalación y montaje",
  otro: "Otro",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCotizacionDetallePage({ params }: PageProps) {
  await requireStaffSession("/admin/cotizaciones");

  const { id } = await params;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
  });

  if (!cotizacion) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin / Cotizaciones</p>
            <h1 className="mt-2 text-3xl font-bold">Detalle de cotización</h1>
            <p className="mt-1 text-xs text-slate-500 font-mono">{cotizacion.id}</p>
          </div>
          <Link
            href="/admin/cotizaciones"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ← Volver
          </Link>
        </header>

        {/* Datos del cliente */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 space-y-4">
          <h2 className="text-lg font-semibold border-b border-slate-800 pb-3">Datos del cliente</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nombre</p>
              <p className="mt-1 text-slate-100">{cotizacion.nombre}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <p className="mt-1">
                <a
                  href={`mailto:${cotizacion.email}`}
                  className="text-sky-400 hover:text-sky-300 transition"
                >
                  {cotizacion.email}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Teléfono</p>
              <p className="mt-1">
                <a
                  href={`tel:${cotizacion.telefono}`}
                  className="text-sky-400 hover:text-sky-300 transition"
                >
                  {cotizacion.telefono}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha de solicitud</p>
              <p className="mt-1 text-slate-100">
                {cotizacion.createdAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}{" "}
                <span className="text-slate-400">
                  {cotizacion.createdAt.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Detalles del proyecto */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 space-y-4">
          <h2 className="text-lg font-semibold border-b border-slate-800 pb-3">Detalles del proyecto</h2>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tipo de mueble</p>
            <div className="mt-2">
              <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/30">
                {TIPO_MUEBLE_LABELS[cotizacion.tipoMueble]}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</p>
            <p className="mt-2 text-slate-300 leading-relaxed whitespace-pre-wrap">
              {cotizacion.descripcion}
            </p>
          </div>
        </section>

        {/* Imagen de referencia */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 space-y-4">
          <h2 className="text-lg font-semibold border-b border-slate-800 pb-3">Imagen de referencia</h2>
          {cotizacion.imagenReferencia ? (
            <CotizacionImagen src={cotizacion.imagenReferencia} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-12 text-center">
              <p className="text-sm text-slate-400">El cliente no adjuntó imagen de referencia.</p>
            </div>
          )}
        </section>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${cotizacion.email}?subject=Cotización%20de%20carpintería%20-%20${encodeURIComponent(TIPO_MUEBLE_LABELS[cotizacion.tipoMueble])}`}
            className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Responder por email
          </a>
          <a
            href={`https://wa.me/${cotizacion.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${cotizacion.nombre}, recibimos tu solicitud de cotización para ${TIPO_MUEBLE_LABELS[cotizacion.tipoMueble]}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-700/60 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:border-emerald-500 hover:bg-emerald-900/20"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
