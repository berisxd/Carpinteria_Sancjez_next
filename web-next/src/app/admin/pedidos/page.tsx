import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireStaffSession } from "@/lib/admin";
import {
  getAdminPreference,
  normalizePageSize,
  normalizePedidosEstado,
  normalizePedidosMetodoPago,
  normalizePedidosPeriodo,
  normalizePedidoSortBy,
  normalizeSortDir,
  pageSizeOptions,
  savePedidosPreference,
  type PedidoSortBy,
  type SortDir,
} from "@/lib/admin-preferences";
import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatMetodoPago,
  parsePedidoProductos,
  pedidoMetodoPagoOptions,
  pedidoStatusOptions,
} from "@/lib/pedidos";

interface PedidosSearchParams {
  q?: string;
  estado?: string;
  metodoPago?: string;
  periodo?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
}

interface PageProps {
  searchParams: Promise<PedidosSearchParams>;
}

function getPeriodoDate(periodo: string) {
  const now = new Date();

  if (periodo === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (periodo === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (periodo === "last_month") {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  if (periodo === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (periodo === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getCustomRange(from: string, to: string) {
  const start = from ? parseDateInput(from) : null;
  const endInput = to ? parseDateInput(to) : null;
  const end = endInput ? new Date(endInput.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  if (start && end && start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

function pedidoSortLabel(activeSortBy: PedidoSortBy, activeSortDir: SortDir, key: PedidoSortBy) {
  if (activeSortBy !== key) {
    return "↕";
  }
  return activeSortDir === "asc" ? "↑" : "↓";
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const session = await requireStaffSession("/admin/pedidos");
  const query = await searchParams;
  const preference = await getAdminPreference(session.user.id);

  const q = (query.q ?? "").trim();
  const estado =
    query.estado !== undefined
      ? normalizePedidosEstado(query.estado)
      : normalizePedidosEstado(preference?.pedidosEstado);
  const metodoPago =
    query.metodoPago !== undefined
      ? normalizePedidosMetodoPago(query.metodoPago)
      : normalizePedidosMetodoPago(preference?.pedidosMetodoPago);
  const periodo =
    query.periodo !== undefined
      ? normalizePedidosPeriodo(query.periodo)
      : normalizePedidosPeriodo(preference?.pedidosPeriodo);
  const from = (query.from ?? "").trim();
  const to = (query.to ?? "").trim();
  const currentPage = Math.max(1, Number(query.page ?? "1") || 1);
  const pageSize =
    query.pageSize !== undefined
      ? normalizePageSize(query.pageSize)
      : normalizePageSize(preference?.pedidosPageSize ?? 10);
  const sortBy =
    query.sortBy !== undefined
      ? normalizePedidoSortBy(query.sortBy)
      : normalizePedidoSortBy(preference?.pedidosSortBy);
  const sortDir =
    query.sortDir !== undefined
      ? normalizeSortDir(query.sortDir)
      : normalizeSortDir(preference?.pedidosSortDir);

  if (
    query.pageSize !== undefined ||
    query.sortBy !== undefined ||
    query.sortDir !== undefined ||
    query.estado !== undefined ||
    query.metodoPago !== undefined ||
    query.periodo !== undefined
  ) {
    await savePedidosPreference(session.user.id, {
      pageSize,
      sortBy,
      sortDir,
      estado,
      metodoPago,
      periodo,
    });
  }

  const whereAnd: Array<Record<string, unknown>> = [];

  if (q) {
    whereAnd.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { nombreDestinatario: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { ciudad: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (pedidoStatusOptions.includes(estado as (typeof pedidoStatusOptions)[number])) {
    whereAnd.push({ estado });
  }

  if (pedidoMetodoPagoOptions.includes(metodoPago as (typeof pedidoMetodoPagoOptions)[number])) {
    whereAnd.push({ metodoPago });
  }

  if (periodo === "custom") {
    const customRange = getCustomRange(from, to);
    if (customRange.start || customRange.end) {
      whereAnd.push({
        createdAt: {
          ...(customRange.start ? { gte: customRange.start } : {}),
          ...(customRange.end ? { lte: customRange.end } : {}),
        },
      });
    }
  } else if (periodo === "last_month") {
    const { start, end } = getLastMonthRange();
    whereAnd.push({
      createdAt: {
        gte: start,
        lte: end,
      },
    });
  } else {
    const periodoStart = getPeriodoDate(periodo);
    if (periodoStart) {
      whereAnd.push({
        createdAt: {
          gte: periodoStart,
        },
      });
    }
  }

  const where = whereAnd.length > 0 ? { AND: whereAnd } : undefined;

  const orderByFieldMap: Record<PedidoSortBy, string> = {
    fecha: "createdAt",
    total: "total",
    estado: "estado",
    nombre: "nombreDestinatario",
  };

  const primaryField = orderByFieldMap[sortBy];
  const orderBy: Prisma.PedidoOrderByWithRelationInput | Prisma.PedidoOrderByWithRelationInput[] =
    sortBy === "fecha"
      ? { createdAt: sortDir }
      : [
          { [primaryField]: sortDir } as Prisma.PedidoOrderByWithRelationInput,
          { createdAt: "desc" },
        ];

  const [pedidos, aggregate, totalCount] = await Promise.all([
    prisma.pedido.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pedido.aggregate({
      where,
      _count: true,
      _sum: {
        total: true,
      },
    }),
    prisma.pedido.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (estado !== "all") baseParams.set("estado", estado);
  if (metodoPago !== "all") baseParams.set("metodoPago", metodoPago);
  if (periodo !== "all") baseParams.set("periodo", periodo);
  if (periodo === "custom" && from) baseParams.set("from", from);
  if (periodo === "custom" && to) baseParams.set("to", to);
  if (pageSize !== 10) baseParams.set("pageSize", String(pageSize));
  if (sortBy !== "fecha") baseParams.set("sortBy", sortBy);
  if (sortDir !== "desc") baseParams.set("sortDir", sortDir);

  function pageHref(page: number) {
    const params = new URLSearchParams(baseParams);
    if (page > 1) {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  }

  function sortHref(column: PedidoSortBy) {
    const params = new URLSearchParams(baseParams);
    const nextDir: SortDir =
      sortBy === column ? (sortDir === "asc" ? "desc" : "asc") : column === "fecha" || column === "total" ? "desc" : "asc";
    if (column !== "fecha") {
      params.set("sortBy", column);
    } else {
      params.delete("sortBy");
    }
    if (nextDir !== "desc") {
      params.set("sortDir", nextDir);
    } else {
      params.delete("sortDir");
    }
    params.delete("page");
    const qs = params.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  }

  const exportParams = new URLSearchParams(baseParams);
  exportParams.delete("page");
  const exportHref = `/api/admin/pedidos/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  const paginationWindow = 2;
  const pages: number[] = [];
  const startPage = Math.max(1, safeCurrentPage - paginationWindow);
  const endPage = Math.min(totalPages, safeCurrentPage + paginationWindow);
  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Gestión de pedidos</h1>
            <p className="mt-2 text-sm text-slate-400">
              Vista operativa para revisar estados, totales y detalle de cada pedido.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/productos"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Productos
            </Link>
            <Link
              href={exportHref}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Exportar CSV
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20">
          <form className="grid gap-4 md:grid-cols-[1fr_0.5fr_0.6fr_0.5fr_0.55fr_0.55fr_auto]">
            <input type="hidden" name="sortBy" value={sortBy} />
            <input type="hidden" name="sortDir" value={sortDir} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por pedido, cliente, email o ciudad"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
            />

            <select
              name="estado"
              defaultValue={estado}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="all">Todos los estados</option>
              {pedidoStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              name="metodoPago"
              defaultValue={metodoPago}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="all">Todos los medios</option>
              {pedidoMetodoPagoOptions.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {formatMetodoPago(metodo)}
                </option>
              ))}
            </select>

            <select
              name="periodo"
              defaultValue={periodo}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="all">Todo el histórico</option>
              <option value="today">Hoy</option>
              <option value="this_month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="custom">Rango personalizado</option>
            </select>

            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />

            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            />

            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} por página
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Filtrar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>
              Resultados: <strong className="text-slate-200">{aggregate._count}</strong>
            </span>
            <span>
              Total listado: <strong className="text-slate-200">{formatCurrency(Number(aggregate._sum.total ?? 0))}</strong>
            </span>
            <span>
              Página: <strong className="text-slate-200">{safeCurrentPage}</strong> de <strong className="text-slate-200">{totalPages}</strong>
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
          <div className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.6fr_0.6fr_0.8fr_0.5fr] gap-4 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Pedido</span>
            <Link href={sortHref("nombre")} className="hover:text-slate-200">
              Cliente {pedidoSortLabel(sortBy, sortDir, "nombre")}
            </Link>
            <Link href={sortHref("fecha")} className="hover:text-slate-200">
              Fecha {pedidoSortLabel(sortBy, sortDir, "fecha")}
            </Link>
            <Link href={sortHref("estado")} className="hover:text-slate-200">
              Estado {pedidoSortLabel(sortBy, sortDir, "estado")}
            </Link>
            <span>Pago</span>
            <Link href={sortHref("total")} className="hover:text-slate-200">
              Total {pedidoSortLabel(sortBy, sortDir, "total")}
            </Link>
            <span></span>
          </div>

          <div className="divide-y divide-slate-800">
            {pedidos.map((pedido) => {
              const productos = parsePedidoProductos(pedido.productosJson);

              return (
                <div
                  key={pedido.id}
                  className="grid grid-cols-[1.1fr_0.8fr_0.7fr_0.6fr_0.6fr_0.8fr_0.5fr] gap-4 px-6 py-5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{pedido.id}</p>
                    <p className="mt-1 text-slate-400">
                      {productos.length} producto{productos.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{pedido.nombreDestinatario}</p>
                    <p className="mt-1 text-slate-400">{pedido.email}</p>
                  </div>
                  <div className="text-slate-300">
                    {pedido.createdAt.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold capitalize text-amber-300 ring-1 ring-inset ring-amber-400/30">
                      {pedido.estado}
                    </span>
                  </div>
                  <div className="text-slate-300 capitalize">
                    {formatMetodoPago(pedido.metodoPago)}
                  </div>
                  <div className="font-semibold text-slate-100">
                    {formatCurrency(Number(pedido.total))}
                  </div>
                  <div>
                    <Link
                      href={`/admin/pedidos/${pedido.id}`}
                      className="text-amber-300 transition hover:text-amber-200"
                    >
                      Abrir
                    </Link>
                  </div>
                </div>
              );
            })}

            {pedidos.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                No hay pedidos para los filtros seleccionados.
              </div>
            ) : null}
          </div>
        </section>

        {totalPages > 1 ? (
          <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <Link
              href={safeCurrentPage > 1 ? pageHref(safeCurrentPage - 1) : pageHref(1)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                safeCurrentPage > 1
                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  : "cursor-not-allowed bg-slate-900 text-slate-500"
              }`}
            >
              ← Anterior
            </Link>

            <div className="flex items-center gap-2">
              {pages.map((page) => (
                <Link
                  key={page}
                  href={pageHref(page)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    page === safeCurrentPage
                      ? "bg-amber-400 text-slate-950"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {page}
                </Link>
              ))}
            </div>

            <Link
              href={safeCurrentPage < totalPages ? pageHref(safeCurrentPage + 1) : pageHref(totalPages)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                safeCurrentPage < totalPages
                  ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  : "cursor-not-allowed bg-slate-900 text-slate-500"
              }`}
            >
              Siguiente →
            </Link>
          </nav>
        ) : null}
      </main>
    </div>
  );
}