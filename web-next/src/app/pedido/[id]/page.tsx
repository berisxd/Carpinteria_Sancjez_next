import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, parsePedidoProductos } from "@/lib/pedidos";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    creado?: string;
  }>;
}

export async function generateMetadata({ params }: Omit<PageProps, "searchParams">) {
  const { id } = await params;

  return {
    title: `Pedido ${id} - Carpintería`,
    description: "Detalle y seguimiento del pedido",
  };
}

export default async function PedidoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
  });

  if (!pedido) {
    notFound();
  }

  const productos = parsePedidoProductos(pedido.productosJson);
  const fueCreado = query.creado === "1";

  return (
    <div className="cs-page">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="cs-link text-sm">
              ← Volver al catalogo
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[var(--brand-700)]">Pedido {pedido.id}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Estado actual: <span className="font-semibold capitalize">{pedido.estado}</span>
            </p>
          </div>
          <Link
            href="/checkout"
            className="rounded-lg border border-[rgba(31,77,122,0.3)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[rgba(31,77,122,0.06)]"
          >
            Ver checkout
          </Link>
        </header>

        <div>
          <a
            href={`/api/pedidos/${pedido.id}/ticket`}
            className="inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Descargar ticket PDF
          </a>
        </div>

        {fueCreado ? (
          <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 shadow-sm">
            <h2 className="text-xl font-bold">Pedido confirmado</h2>
            <p className="mt-2 text-sm">
              Ya registramos tu pedido y lo dejamos en estado pendiente para revision.
            </p>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="cs-card p-6">
            <h2 className="text-xl font-semibold text-[var(--brand-700)]">Productos</h2>
            <div className="mt-6 space-y-4">
              {productos.map((producto) => (
                <div
                  key={`${producto.id}-${producto.nombre}`}
                  className="rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                        {producto.categoria.nombre}
                      </p>
                      <h3 className="mt-1 font-semibold text-[var(--brand-700)]">{producto.nombre}</h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {producto.quantity} x {formatCurrency(producto.precioUnitario)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--brand-700)]">
                      {formatCurrency(producto.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Entrega</h2>
              <dl className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <div>
                  <dt className="font-medium text-[var(--brand-700)]">Destinatario</dt>
                  <dd>{pedido.nombreDestinatario}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--brand-700)]">Contacto</dt>
                  <dd>{pedido.email}</dd>
                  <dd>{pedido.telefono}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--brand-700)]">Direccion</dt>
                  <dd>{pedido.direccion}</dd>
                  <dd>
                    {pedido.ciudad}, {pedido.codigoPostal}
                  </dd>
                </div>
                {pedido.referencia ? (
                  <div>
                    <dt className="font-medium text-[var(--brand-700)]">Referencia</dt>
                    <dd>{pedido.referencia}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Resumen</h2>
              <dl className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <div className="flex items-center justify-between">
                  <dt>Metodo de pago</dt>
                  <dd className="font-medium text-[var(--brand-700)] capitalize">
                    {pedido.metodoPago.replaceAll("_", " ")}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total</dt>
                  <dd className="text-base font-bold text-[var(--accent)]">
                    {formatCurrency(Number(pedido.total))}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}