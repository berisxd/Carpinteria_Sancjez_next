import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Nuevo producto — Admin" };

export default async function AdminNuevoProductoPage() {
  await requireStaffSession("/admin/productos/nuevo");

  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });

  async function crearProducto(formData: FormData) {
    "use server";

    await requireStaffSession("/admin/productos/nuevo");

    const nombre = String(formData.get("nombre") || "").trim();
    const categoriaId = String(formData.get("categoriaId") || "").trim();
    const precioValue = Number(formData.get("precio") || 0);
    const descripcion = String(formData.get("descripcion") || "").trim();
    const materiales = String(formData.get("materiales") || "").trim();
    const imagen = String(formData.get("imagen") || "").trim();
    const habilitado = formData.get("habilitado") === "on";

    if (
      !nombre ||
      !categoriaId ||
      !Number.isFinite(precioValue) ||
      precioValue <= 0 ||
      !descripcion ||
      !materiales ||
      !imagen
    ) {
      redirect("/admin/productos/nuevo");
    }

    const nuevo = await prisma.producto.create({
      data: {
        nombre,
        categoriaId,
        precio: precioValue,
        descripcion,
        materiales,
        imagen,
        habilitado,
        opcionesMaterial: "[]",
        despieceJson: "{}",
      },
      select: { id: true },
    });

    redirect(`/admin/productos/${nuevo.id}?updated=1`);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin / Productos</p>
            <h1 className="mt-2 text-3xl font-bold">Nuevo producto</h1>
            <p className="mt-1 text-sm text-slate-400">
              Completa los datos para agregar un producto al catálogo.
            </p>
          </div>
          <Link
            href="/admin/productos"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ← Volver
          </Link>
        </header>

        {/* Form */}
        <form action={crearProducto} className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 space-y-5">
            <h2 className="text-lg font-semibold border-b border-slate-800 pb-3">
              Información básica
            </h2>

            {/* Nombre */}
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Nombre del producto <span className="text-red-400">*</span>
              </span>
              <input
                name="nombre"
                required
                maxLength={200}
                placeholder="Ej: Armario empotrado clásico"
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </label>

            {/* Categoría + Precio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Categoría <span className="text-red-400">*</span>
                </span>
                <select
                  name="categoriaId"
                  required
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                >
                  <option value="">— Seleccionar —</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Precio (MXN) <span className="text-red-400">*</span>
                </span>
                <input
                  name="precio"
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                />
              </label>
            </div>

            {/* Imagen URL */}
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                URL de imagen <span className="text-red-400">*</span>
              </span>
              <input
                name="imagen"
                type="url"
                required
                placeholder="https://ejemplo.com/foto-producto.jpg"
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Enlace directo a la imagen del producto.
              </span>
            </label>

            {/* Descripción */}
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Descripción <span className="text-red-400">*</span>
              </span>
              <textarea
                name="descripcion"
                required
                rows={4}
                placeholder="Describe el producto: dimensiones estándar, acabados, usos…"
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </label>

            {/* Materiales */}
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Materiales <span className="text-red-400">*</span>
              </span>
              <textarea
                name="materiales"
                required
                rows={3}
                placeholder="Ej: MDF enchapado, herrajes de acero inoxidable…"
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
              />
            </label>

            {/* Habilitado */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="habilitado"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-amber-400"
              />
              <span className="text-sm font-medium text-slate-300">
                Publicar en el catálogo inmediatamente
              </span>
            </label>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Crear producto
            </button>
            <Link
              href="/admin/productos"
              className="rounded-lg border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
