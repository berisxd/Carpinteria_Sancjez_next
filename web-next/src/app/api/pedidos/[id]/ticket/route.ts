import { prisma } from "@/lib/prisma";
import { buildPedidoTicketPdf } from "@/lib/ticket-pdf";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteProps) {
  const { id } = await context.params;

  const pedido = await prisma.pedido.findUnique({ where: { id } });

  if (!pedido) {
    return new Response("Pedido no encontrado", { status: 404 });
  }

  const pdfBuffer = await buildPedidoTicketPdf(pedido);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=ticket-pedido-${pedido.id}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
