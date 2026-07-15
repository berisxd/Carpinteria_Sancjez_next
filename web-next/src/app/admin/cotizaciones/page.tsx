import Link from "next/link";
import { requireStaffSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { TipoMueble } from "@prisma/client";

const TIPO_MUEBLE_LABELS: Record<TipoMueble, string> = {
  cocinas_integrales: "Cocinas integrales",
  closets: "Closets",
  puertas: "Puertas",
  muebles_personalizados: "Muebles personalizados",
  instalacion_montaje: "Instalación y montaje",
  otro: "Otro",
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  tipo?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminCotizacionesPage({ searchParams }: PageProps) {
  await requireStaffSession("/admin/cotizaciones");

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tipo = params.tipo ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Parameters<typeof prisma.cotizacion.findMany>[0]["where"] = {};

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q, mode: "insensitive" } },
    ];
  }

  if (tipo && Object.keys(TIPO_MUEBLE_LABELS).includes(tipo)) {
    where.tipoMueble = tipo as TipoMueble;
  }

  const [total, cotizaciones] = await Promise.all([
    prisma.cotizacion.count({ where }),
    prisma.cotizacion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        tipoMueble: true,
        descripcion: true,
        imagenReferencia: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { q, tipo, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/admin/cotizaciones?${p.toString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Cotizaciones</h1>
            <p className="mt-2 text-sm text-slate-400">
              {total} solicitud{total !== 1 ? "es" : ""} recibida{total !== 1 ? "s" : ""}.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ← Dashboard
          </Link>
        </header>

        {/* Filtros */}
        <form method="GET" className="flex flex-wrap gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, email o teléfono…"
            className="flex-1 min-w-[220px] rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          <select
            name="tipo"
            defaultValue={tipo}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-amber-400 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TIPO_MUEBLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Filtrar
          </button>
          {(q || tipo) && (
            <Link
              href="/admin/cotizaciones"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Tabla */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20 overflow-hidden">
          {cotizaciones.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No se encontraron cotizaciones.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4 hidden md:table-cell">Descripción</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Imagen</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{cot.nombre}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{cot.email}</p>
                        <p className="text-slate-500 text-xs">{cot.telefono}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/30">
                          {TIPO_MUEBLE_LABELS[cot.tipoMueble]}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell max-w-xs">
                        <p className="text-slate-300 line-clamp-2 text-xs leading-relaxed">
                          {cot.descripcion}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {cot.imagenReferencia ? (
                          <a
                            href={cot.imagenReferencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 text-xs underline"
                          >
                            Ver imagen
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {cot.createdAt.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/cotizaciones/${cot.id}`}
                          className="text-amber-300 hover:text-amber-200 text-xs font-semibold transition"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Paginación */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 transition hover:bg-slate-900"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 transition hover:bg-slate-900"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
