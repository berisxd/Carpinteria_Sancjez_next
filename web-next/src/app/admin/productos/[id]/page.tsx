import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pedidos";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    updated?: string;
  }>;
}

export default async function AdminProductoDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  await requireAdminSession(`/admin/productos/${id}`);

  const [producto, categorias] = await Promise.all([
    prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!producto) {
    notFound();
  }

  async function updateProducto(formData: FormData) {
    "use server";

    await requireAdminSession(`/admin/productos/${id}`);
    const nombre = String(formData.get("nombre") || "").trim();
    const categoriaId = String(formData.get("categoriaId") || "").trim();
    const precioValue = Number(formData.get("precio") || 0);
    const descripcion = String(formData.get("descripcion") || "").trim();
    const materiales = String(formData.get("materiales") || "").trim();
    const imagen = String(formData.get("imagen") || "").trim();
    const habilitado = formData.get("habilitado") === "on";

    if (!nombre || !categoriaId || !Number.isFinite(precioValue) || precioValue <= 0) {
      redirect(`/admin/productos/${id}`);
    }

    await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        categoriaId,
        precio: precioValue,
        descripcion,
        materiales,
        imagen,
        habilitado,
      },
    });

    redirect(`/admin/productos/${id}?updated=1`);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/productos"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              ← Volver a productos
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Editar producto</h1>
            <p className="mt-2 text-sm text-slate-400">ID: {producto.id}</p>
          </div>
          <Link
            href={`/producto/${producto.id}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Ver en tienda
          </Link>
        </header>

        {query.updated === "1" ? (
          <section className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Producto actualizado correctamente.
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-semibold">Datos del producto</h2>

            <form action={updateProducto} className="mt-6 space-y-5">
              <label className="block text-sm font-medium text-slate-300">
                Nombre
                <input
                  name="nombre"
                  defaultValue={producto.nombre}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-300">
                  Categoría
                  <select
                    name="categoriaId"
                    defaultValue={producto.categoriaId}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  >
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-300">
                  Precio
                  <input
                    name="precio"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={Number(producto.precio)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-300">
                URL de imagen
                <input
                  name="imagen"
                  defaultValue={producto.imagen}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Descripción
                <textarea
                  name="descripcion"
                  defaultValue={producto.descripcion}
                  rows={4}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Materiales
                <textarea
                  name="materiales"
                  defaultValue={producto.materiales}
                  rows={3}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                />
              </label>

              <label className="inline-flex items-center gap-3 text-sm text-slate-300">
                <input
                  name="habilitado"
                  type="checkbox"
                  defaultChecked={producto.habilitado}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                />
                Producto habilitado para el catálogo
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Guardar cambios
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
              <h2 className="text-xl font-semibold">Estado actual</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between">
                  <dt>Categoría</dt>
                  <dd className="font-medium text-slate-100">{producto.categoria.nombre}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Precio</dt>
                  <dd className="font-semibold text-slate-100">
                    {formatCurrency(Number(producto.precio))}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Visibilidad</dt>
                  <dd className={producto.habilitado ? "text-emerald-300" : "text-rose-300"}>
                    {producto.habilitado ? "habilitado" : "deshabilitado"}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}