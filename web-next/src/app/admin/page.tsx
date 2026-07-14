import Link from "next/link";
import { requireStaffSession, isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pedidos";
import { AdminAssistantInline } from "@/components/admin/AdminAssistantInline";

function dayLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function AdminIndexPage() {
  const session = await requireStaffSession("/admin");
  const esAdmin = isAdmin(session);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    totalPedidos,
    pedidosPendientes,
    totalVentas,
    totalProductos,
    productosHabilitados,
    totalCategorias,
    totalEquipo,
    ultimosPedidos,
    pedidosPorEstado,
    ventasRecientes,
  ] = await Promise.all([
    prisma.pedido.count(),
    prisma.pedido.count({ where: { estado: "pendiente" } }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: {
        estado: {
          not: "cancelado",
        },
      },
    }),
    prisma.producto.count(),
    prisma.producto.count({ where: { habilitado: true } }),
    prisma.categoria.count(),
    prisma.user.count({ where: { role: { in: ["ADMIN", "WORKER"] } } }),
    prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        nombreDestinatario: true,
        estado: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.pedido.groupBy({
      by: ["estado"],
      _count: {
        estado: true,
      },
    }),
    prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        estado: {
          not: "cancelado",
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    }),
  ]);

  const kpis = [
    {
      label: "Pedidos",
      value: String(totalPedidos),
      hint: `${pedidosPendientes} pendientes`,
    },
    {
      label: "Ventas",
      value: formatCurrency(Number(totalVentas._sum.total ?? 0)),
      hint: "No incluye cancelados",
    },
    {
      label: "Productos",
      value: String(totalProductos),
      hint: `${productosHabilitados} habilitados`,
    },
    {
      label: "Categorías",
      value: String(totalCategorias),
      hint: "Catálogo activo",
    },
  ];

  const equipoKpi = esAdmin
    ? { label: "Equipo", value: String(totalEquipo), hint: "Admins y trabajadores", href: "/admin/usuarios" }
    : null;

  const maxEstado = Math.max(...pedidosPorEstado.map((row) => row._count.estado), 1);
  const estadoChart = pedidosPorEstado
    .map((row) => ({
      estado: row.estado,
      count: row._count.estado,
      width: (row._count.estado / maxEstado) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const salesByDay = new Map<string, number>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    salesByDay.set(dayLabel(date), 0);
  }

  for (const sale of ventasRecientes) {
    const label = dayLabel(sale.createdAt);
    if (!salesByDay.has(label)) {
      continue;
    }
    salesByDay.set(label, (salesByDay.get(label) ?? 0) + Number(sale.total));
  }

  const salesPoints = [...salesByDay.entries()].map(([label, total]) => ({ label, total }));
  const maxSales = Math.max(...salesPoints.map((point) => point.total), 1);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard operativo</h1>
            <p className="mt-2 text-sm text-slate-400">
              Monitoreo rápido de pedidos y catálogo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pedidos"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Ver pedidos
            </Link>
            {esAdmin && (
              <>
                <Link
                  href="/admin/productos"
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Productos
                </Link>
                <Link
                  href="/admin/usuarios"
                  className="rounded-lg border border-sky-700/60 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:border-sky-500 hover:bg-sky-900/20"
                >
                  Equipo
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-100">{kpi.value}</p>
              <p className="mt-2 text-xs text-slate-500">{kpi.hint}</p>
            </article>
          ))}
          {equipoKpi && (
            <Link
              href={equipoKpi.href}
              className="group rounded-2xl border border-sky-800/40 bg-sky-900/10 p-5 shadow-2xl shadow-black/20 transition hover:border-sky-600/60 hover:bg-sky-900/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/70">
                {equipoKpi.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-sky-300">{equipoKpi.value}</p>
              <p className="mt-2 text-xs text-sky-500/80">{equipoKpi.hint} →</p>
            </Link>
          )}
        </section>

        {/* ── Asistente IA inline ────────────────────────────────── */}
        <AdminAssistantInline />

        <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold">Actividad reciente</h2>
            <Link
              href="/admin/pedidos"
              className="text-sm font-medium text-amber-300 transition hover:text-amber-200"
            >
              Ver todo
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {ultimosPedidos.map((pedido) => (
              <div key={pedido.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-100">{pedido.id}</p>
                  <p className="mt-1 text-slate-400">{pedido.nombreDestinatario}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold capitalize text-amber-300 ring-1 ring-inset ring-amber-400/30">
                    {pedido.estado}
                  </span>
                  <span className="font-semibold text-slate-100">
                    {formatCurrency(Number(pedido.total))}
                  </span>
                  <Link
                    href={`/admin/pedidos/${pedido.id}`}
                    className="text-amber-300 transition hover:text-amber-200"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-lg font-semibold">Pedidos por estado</h2>
            <p className="mt-1 text-xs text-slate-400">Distribución actual de estados.</p>

            <div className="mt-5 space-y-3">
              {estadoChart.length > 0 ? (
                estadoChart.map((row) => (
                  <div key={row.estado}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                      <span className="capitalize">{row.estado}</span>
                      <span>{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-amber-400"
                        style={{ width: `${Math.max(6, row.width)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Aún no hay pedidos.</p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-lg font-semibold">Ventas últimos 7 días</h2>
            <p className="mt-1 text-xs text-slate-400">Suma diaria sin pedidos cancelados.</p>

            <div className="mt-6 flex h-44 items-end gap-3">
              {salesPoints.map((point) => {
                const height = (point.total / maxSales) * 100;
                return (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="text-[10px] text-slate-400">{point.total > 0 ? formatCurrency(point.total) : "-"}</div>
                    <div className="flex h-32 w-full items-end rounded-md bg-slate-800/70 p-1">
                      <div
                        className="w-full rounded-sm bg-emerald-400"
                        style={{ height: `${Math.max(6, height)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400">{point.label}</div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}