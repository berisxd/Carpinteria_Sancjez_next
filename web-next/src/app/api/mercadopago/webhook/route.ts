import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getMerchantOrder,
  getPayment,
  mapMpStatusToPedidoStatus,
} from "@/lib/mercadopago";

interface MpWebhookBody {
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    let payload: MpWebhookBody = {};

    try {
      payload = (await request.json()) as MpWebhookBody;
    } catch {
      payload = {};
    }

    const url = new URL(request.url);
    const topic = payload.type || payload.action || url.searchParams.get("topic") || "";
    const resourceId = String(
      payload.data?.id || url.searchParams.get("id") || "",
    ).trim();

    if (!resourceId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!topic.includes("payment") && !topic.includes("merchant_order")) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    let externalReference = "";
    let mpStatus = "";
    let paymentId = "";
    let merchantOrderId = "";

    if (topic.includes("payment")) {
      const payment = await getPayment(resourceId);
      externalReference = String(payment.external_reference || "").trim();
      mpStatus = String(payment.status || "").trim();
      paymentId = String(payment.id || resourceId);
      merchantOrderId = payment.order?.id ? String(payment.order.id) : "";
    } else {
      const order = await getMerchantOrder(resourceId);
      externalReference = String(order.external_reference || "").trim();
      merchantOrderId = String(order.id || resourceId);
      const firstPayment = order.payments?.[0];
      if (firstPayment?.status) {
        mpStatus = String(firstPayment.status);
      }
      if (firstPayment?.id) {
        paymentId = String(firstPayment.id);
      }
    }

    if (!externalReference) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const pedido = await prisma.pedido.findUnique({ where: { id: externalReference } });

    if (!pedido) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const mappedStatus = mapMpStatusToPedidoStatus(mpStatus || undefined);

    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        estado: mappedStatus || pedido.estado,
        mpStatus: mpStatus || pedido.mpStatus,
        mpPaymentId: paymentId || pedido.mpPaymentId,
        mpMerchantOrderId: merchantOrderId || pedido.mpMerchantOrderId,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error in Mercado Pago webhook:", error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
