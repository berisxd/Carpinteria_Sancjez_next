import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getPayment, mapMpStatusToPedidoStatus } from "@/lib/mercadopago";

interface PageProps {
  searchParams: Promise<{
    resultado?: string;
    external_reference?: string;
    payment_id?: string;
    merchant_order_id?: string;
    status?: string;
    collection_status?: string;
  }>;
}

function resolveTitle(resultado: string, estadoPedido: string | null) {
  if (estadoPedido === "confirmado" || resultado === "exitoso") {
    return {
      heading: "Pago realizado con exito",
      message: "Tu pago fue registrado correctamente y tu pedido esta confirmado.",
      tone: "text-emerald-700",
      card: "border-emerald-300 bg-emerald-50",
    };
  }

  if (estadoPedido === "cancelado" || resultado === "fallido") {
    return {
      heading: "El pago no pudo completarse",
      message: "Puedes intentar nuevamente o elegir otro metodo de pago.",
      tone: "text-red-700",
      card: "border-red-300 bg-red-50",
    };
  }

  return {
    heading: "Pago pendiente",
    message: "Tu pago esta en revision o pendiente de acreditacion.",
    tone: "text-amber-700",
    card: "border-amber-300 bg-amber-50",
  };
}

export default async function PagoResultadoPage({ searchParams }: PageProps) {
  const query = await searchParams;

  const externalReference = query.external_reference?.trim() || "";
  const paymentId = query.payment_id?.trim() || "";
  const merchantOrderId = query.merchant_order_id?.trim() || "";
  const resultado = (query.resultado?.trim() || "pendiente").toLowerCase();

  const statusFromQuery = (query.collection_status || query.status || "").trim();

  let pedido = externalReference
    ? await prisma.pedido.findUnique({ where: { id: externalReference } })
    : null;

  let mpStatus = statusFromQuery || null;

  if (!mpStatus && paymentId) {
    try {
      const payment = await getPayment(paymentId);
      mpStatus = payment.status ?? null;
    } catch {
      mpStatus = null;
    }
  }

  const mappedStatus = mapMpStatusToPedidoStatus(mpStatus ?? undefined);

  if (pedido) {
    const nextEstado = mappedStatus || pedido.estado;

    pedido = await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        estado: nextEstado,
        mpPaymentId: paymentId || pedido.mpPaymentId,
        mpMerchantOrderId: merchantOrderId || pedido.mpMerchantOrderId,
        mpStatus: mpStatus || pedido.mpStatus,
      },
    });
  }

  const alert = resolveTitle(resultado, pedido?.estado ?? mappedStatus);

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`rounded-2xl border p-6 shadow-sm ${alert.card}`}>
          <h1 className={`text-2xl font-bold ${alert.tone}`}>{alert.heading}</h1>
          <p className="mt-3 text-sm text-slate-700">{alert.message}</p>

          {pedido ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p>
                Pedido: <strong>{pedido.id}</strong>
              </p>
              <p className="mt-1">
                Estado actual: <strong className="capitalize">{pedido.estado}</strong>
              </p>
              <p className="mt-1">
                Monto: <strong>${Number(pedido.total).toLocaleString("es-AR")}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-700">
              No pudimos asociar este retorno a un pedido especifico. Si ya completaste el pago,
              contáctanos con tu comprobante.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {pedido ? (
              <Link href={`/pedido/${pedido.id}`} className="cs-btn-primary">
                Ver pedido
              </Link>
            ) : null}
            <Link href="/checkout" className="cs-btn-outline !border-slate-300 !text-slate-700 hover:!bg-slate-100">
              Volver a checkout
            </Link>
            <Link href="/" className="cs-btn-outline !border-slate-300 !text-slate-700 hover:!bg-slate-100">
              Ir al inicio
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
