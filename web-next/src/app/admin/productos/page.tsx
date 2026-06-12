import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin";
import {
  getAdminPreference,
  normalizePageSize,
  normalizeProductosCategoria,
  normalizeProductoSortBy,
  normalizeSortDir,
  pageSizeOptions,
  saveProductosPreference,
  type ProductoSortBy,
  type SortDir,
} from "@/lib/admin-preferences";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pedidos";

interface ProductosSearchParams {
  q?: string;
  categoria?: string;
  estado?: string;
  csvUpdatedAt?: string;
  csvCategoriaSlug?: string;
  csvCategoriaId?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
}

interface PageProps {
  searchParams: Promise<ProductosSearchParams>;
}

function productoSortLabel(activeSortBy: ProductoSortBy, activeSortDir: SortDir, key: ProductoSortBy) {
  if (activeSortBy !== key) {
    return "↕";
  }
  return activeSortDir === "asc" ? "↑" : "↓";
}

export default async function AdminProductosPage({ searchParams }: PageProps) {
  const session = await requireAdminSession("/admin/productos");
  const query = await searchParams;
  const preference = await getAdminPreference(session.user.id);

  const q = (query.q ?? "").trim();
  const categoria =
    query.categoria !== undefined
      ? normalizeProductosCategoria(query.categoria)
      : normalizeProductosCategoria(preference?.productosCategoria);
  const estado = (query.estado ?? "all").trim();
  const csvUpdatedAt = query.csvUpdatedAt === "1";
  const csvCategoriaSlug = query.csvCategoriaSlug === "1";
  const csvCategoriaId = query.csvCategoriaId === "1";
  const currentPage = Math.max(1, Number(query.page ?? "1") || 1);
  const pageSize =
    query.pageSize !== undefined
      ? normalizePageSize(query.pageSize)
      : normalizePageSize(preference?.productosPageSize ?? 10);
  const sortBy =
    query.sortBy !== undefined
      ? normalizeProductoSortBy(query.sortBy)
      : normalizeProductoSortBy(preference?.productosSortBy);
  const sortDir =
    query.sortDir !== undefined
      ? normalizeSortDir(query.sortDir)
      : normalizeSortDir(preference?.productosSortDir);

  if (
    query.pageSize !== undefined ||
    query.sortBy !== undefined ||
    query.sortDir !== undefined ||
    query.categoria !== undefined
  ) {
    await saveProductosPreference(session.user.id, { pageSize, sortBy, sortDir, categoria });
  }

  const whereConditions: Array<Record<string, unknown>> = [];

  if (q) {
    whereConditions.push({
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
        { categoria: { nombre: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (categoria !== "all") {
    whereConditions.push({ categoriaId: categoria });
  }

  if (estado === "habilitado") {
    whereConditions.push({ habilitado: true });
  }

  if (estado === "deshabilitado") {
    whereConditions.push({ habilitado: false });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : undefined;

  const orderByFieldMap: Record<ProductoSortBy, string> = {
    fecha: "createdAt",
    nombre: "nombre",
    precio: "precio",
    estado: "habilitado",
  };

  const primaryField = orderByFieldMap[sortBy];
  const orderBy: Prisma.ProductoOrderByWithRelationInput | Prisma.ProductoOrderByWithRelationInput[] =
    sortBy === "fecha"
      ? { createdAt: sortDir }
      : [
          { [primaryField]: sortDir } as Prisma.ProductoOrderByWithRelationInput,
          { createdAt: "desc" },
        ];

  const [categorias, productos, totalCount] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: { nombre: true },
        },
      },
      orderBy,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.producto.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (categoria !== "all") baseParams.set("categoria", categoria);
  if (estado !== "all") baseParams.set("estado", estado);
  if (csvUpdatedAt) baseParams.set("csvUpdatedAt", "1");
  if (csvCategoriaSlug) baseParams.set("csvCategoriaSlug", "1");
  if (csvCategoriaId) baseParams.set("csvCategoriaId", "1");
  if (pageSize !== 10) baseParams.set("pageSize", String(pageSize));
  if (sortBy !== "fecha") baseParams.set("sortBy", sortBy);
  if (sortDir !== "desc") baseParams.set("sortDir", sortDir);
  const exportParams = new URLSearchParams(baseParams);
  exportParams.delete("page");
  const exportHref = `/api/admin/productos/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  function pageHref(page: number) {
    const params = new URLSearchParams(baseParams);
    if (page > 1) {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `/admin/productos?${qs}` : "/admin/productos";
  }

  function sortHref(column: ProductoSortBy) {
    const params = new URLSearchParams(baseParams);
    const nextDir: SortDir =
      sortBy === column ? (sortDir === "asc" ? "desc" : "asc") : column === "fecha" || column === "precio" ? "desc" : "asc";
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
    return qs ? `/admin/productos?${qs}` : "/admin/productos";
  }

  const returnPath = pageHref(safeCurrentPage);
  const paginationWindow = 2;
  const pages: number[] = [];
  const startPage = Math.max(1, safeCurrentPage - paginationWindow);
  const endPage = Math.min(totalPages, safeCurrentPage + paginationWindow);
  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  async function quickToggleProducto(formData: FormData) {
    "use server";

    await requireAdminSession("/admin/productos");
    const id = String(formData.get("id") || "");
    const habilitado = formData.get("habilitado") === "true";
    const nextPath = String(formData.get("next") || "/admin/productos");

    if (!id) {
      return;
    }

    await prisma.producto.update({
      where: { id },
      data: { habilitado: !habilitado },
    });

    redirect(nextPath);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Gestión de productos</h1>
            <p className="mt-2 text-sm text-slate-400">
              Busca, filtra y administra disponibilidad del catálogo.
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
              href="/admin/pedidos"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Pedidos
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
          <form className="grid gap-4 md:grid-cols-[1fr_0.6fr_0.5fr_auto]">
            <input type="hidden" name="sortBy" value={sortBy} />
            <input type="hidden" name="sortDir" value={sortDir} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, descripción o categoría"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
            />
            <select
              name="categoria"
              defaultValue={categoria}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="all">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <select
              name="estado"
              defaultValue={estado}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="all">Todos</option>
              <option value="habilitado">Habilitados</option>
              <option value="deshabilitado">Deshabilitados</option>
            </select>
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

            <div className="md:col-span-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Columnas extra CSV</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="csvUpdatedAt"
                    value="1"
                    defaultChecked={csvUpdatedAt}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                  />
                  updatedAt
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="csvCategoriaSlug"
                    value="1"
                    defaultChecked={csvCategoriaSlug}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                  />
                  slug categoría
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="csvCategoriaId"
                    value="1"
                    defaultChecked={csvCategoriaId}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                  />
                  id categoría
                </label>
              </div>
            </div>
          </form>

          <div className="mt-4 text-xs text-slate-400">
            Resultados: <strong className="text-slate-200">{totalCount}</strong>
            <span className="ml-3">
              Página: <strong className="text-slate-200">{safeCurrentPage}</strong> de <strong className="text-slate-200">{totalPages}</strong>
            </span>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.7fr_0.6fr_0.8fr_0.5fr] gap-4 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Link href={sortHref("nombre")} className="hover:text-slate-200">
              Producto {productoSortLabel(sortBy, sortDir, "nombre")}
            </Link>
            <span>Categoría</span>
            <Link href={sortHref("precio")} className="hover:text-slate-200">
              Precio {productoSortLabel(sortBy, sortDir, "precio")}
            </Link>
            <Link href={sortHref("fecha")} className="hover:text-slate-200">
              Fecha {productoSortLabel(sortBy, sortDir, "fecha")}
            </Link>
            <Link href={sortHref("estado")} className="hover:text-slate-200">
              Estado {productoSortLabel(sortBy, sortDir, "estado")}
            </Link>
            <span>Acción rápida</span>
            <span></span>
          </div>

          <div className="divide-y divide-slate-800">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.7fr_0.6fr_0.8fr_0.5fr] gap-4 px-6 py-5 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-100">{producto.nombre}</p>
                  <p className="mt-1 text-slate-400">{producto.id}</p>
                </div>
                <div className="text-slate-200">{producto.categoria.nombre}</div>
                <div className="font-semibold text-slate-100">
                  {formatCurrency(Number(producto.precio))}
                </div>
                <div className="text-slate-300">
                  {producto.createdAt.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                    producto.habilitado
                      ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30"
                      : "bg-rose-400/10 text-rose-300 ring-rose-400/30"
                  }`}>
                    {producto.habilitado ? "habilitado" : "deshabilitado"}
                  </span>
                </div>
                <div>
                  <form action={quickToggleProducto}>
                    <input type="hidden" name="id" value={producto.id} />
                    <input
                      type="hidden"
                      name="habilitado"
                      value={producto.habilitado ? "true" : "false"}
                    />
                    <input type="hidden" name="next" value={returnPath} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        producto.habilitado
                          ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                          : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      }`}
                    >
                      {producto.habilitado ? "Deshabilitar" : "Habilitar"}
                    </button>
                  </form>
                </div>
                <div>
                  <Link
                    href={`/admin/productos/${producto.id}`}
                    className="text-amber-300 transition hover:text-amber-200"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}

            {productos.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                No hay productos para los filtros seleccionados.
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