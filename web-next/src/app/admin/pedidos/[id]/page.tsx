import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import {
  formatCurrency,
  parsePedidoProductos,
  pedidoStatusOptions,
} from "@/lib/pedidos";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPedidoDetailPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdminSession(`/admin/pedidos/${id}`);

  const pedido = await prisma.pedido.findUnique({
    where: { id },
  });

  if (!pedido) {
    notFound();
  }

  const productos = parsePedidoProductos(pedido.productosJson);

  async function updatePedidoStatus(formData: FormData) {
    "use server";

    await requireAdminSession(`/admin/pedidos/${id}`);
    const estado = String(formData.get("estado") || "pendiente");

    if (!pedidoStatusOptions.includes(estado as (typeof pedidoStatusOptions)[number])) {
      redirect(`/admin/pedidos/${id}`);
    }

    await prisma.pedido.update({
      where: { id },
      data: { estado },
    });

    redirect(`/admin/pedidos/${id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/pedidos"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              ← Volver a pedidos
            </Link>
            <h1 className="mt-2 text-3xl font-bold">Pedido {pedido.id}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Revisa el detalle operativo y actualiza el estado del pedido.
            </p>
          </div>

          <form action={updatePedidoStatus} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <select
              name="estado"
              defaultValue={pedido.estado}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
            >
              {pedidoStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Guardar estado
            </button>
          </form>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-semibold">Items del pedido</h2>
            <div className="mt-6 space-y-4">
              {productos.map((producto) => (
                <div key={`${producto.id}-${producto.nombre}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {producto.categoria.nombre}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-100">{producto.nombre}</h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {producto.quantity} x {formatCurrency(producto.precioUnitario)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-100">
                      {formatCurrency(producto.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
              <h2 className="text-xl font-semibold">Cliente</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-400">
                <div>
                  <dt className="font-medium text-slate-100">Nombre</dt>
                  <dd>{pedido.nombreDestinatario}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-100">Email</dt>
                  <dd>{pedido.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-100">Telefono</dt>
                  <dd>{pedido.telefono}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-100">Direccion</dt>
                  <dd>{pedido.direccion}</dd>
                  <dd>
                    {pedido.ciudad}, {pedido.codigoPostal}
                  </dd>
                </div>
                {pedido.referencia ? (
                  <div>
                    <dt className="font-medium text-slate-100">Referencia</dt>
                    <dd>{pedido.referencia}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
              <h2 className="text-xl font-semibold">Resumen</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-400">
                <div className="flex items-center justify-between">
                  <dt>Estado</dt>
                  <dd className="font-semibold capitalize text-amber-300">{pedido.estado}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Metodo de pago</dt>
                  <dd className="font-medium capitalize text-slate-100">
                    {pedido.metodoPago.replaceAll("_", " ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total</dt>
                  <dd className="text-base font-bold text-slate-100">
                    {formatCurrency(Number(pedido.total))}
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