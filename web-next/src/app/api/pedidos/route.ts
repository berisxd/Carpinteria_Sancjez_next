import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { notifyAll, msgNuevoPedido } from "@/lib/notifications";
import { formatCurrency } from "@/lib/pedidos";

const pedidoSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  customer: z.object({
    nombreDestinatario: z.string().min(3),
    email: z.email(),
    telefono: z.string().min(6),
    direccion: z.string().min(5),
    ciudad: z.string().min(2),
    codigoPostal: z.string().min(3),
    referencia: z.string().optional().default(""),
  }),
  metodoPago: z.enum(["tarjeta", "mercado_pago", "ticket_tienda"]),
  costoEnvio: z.number().nonnegative().default(0),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = pedidoSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Datos invalidos para crear el pedido",
          issues: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { items, customer, metodoPago, costoEnvio } = result.data;

    if (metodoPago === "mercado_pago" && !process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago no esta configurado en el servidor." },
        { status: 400 },
      );
    }

    const uniqueIds = [...new Set(items.map((item) => item.id))];
    const productos = await prisma.producto.findMany({
      where: {
        id: { in: uniqueIds },
        habilitado: true,
      },
      include: {
        categoria: {
          select: {
            nombre: true,
            slug: true,
          },
        },
      },
    });

    if (productos.length !== uniqueIds.length) {
      return NextResponse.json(
        { error: "Hay productos invalidos o deshabilitados en el carrito" },
        { status: 400 },
      );
    }

    const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));
    const detallePedido = items.map((item) => {
      const producto = productosPorId.get(item.id);

      if (!producto) {
        throw new Error(`Producto no encontrado: ${item.id}`);
      }

      const precioUnitario = Number(producto.precio);

      return {
        id: producto.id,
        nombre: producto.nombre,
        imagen: producto.imagen,
        precioUnitario,
        quantity: item.quantity,
        subtotal: precioUnitario * item.quantity,
        categoria: producto.categoria,
      };
    });

    const subtotal = detallePedido.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + costoEnvio;

    const pedido = await prisma.pedido.create({
      data: {
        nombreDestinatario: customer.nombreDestinatario,
        email: customer.email,
        telefono: customer.telefono,
        direccion: customer.direccion,
        ciudad: customer.ciudad,
        codigoPostal: customer.codigoPostal,
        referencia: customer.referencia ?? "",
        total,
        costoEnvio: costoEnvio > 0 ? costoEnvio : null,
        metodoPago,
        estado: "pendiente",
        productosJson: JSON.stringify(detallePedido),
      },
    });

    // Notify workers asynchronously (fire-and-forget, no await to avoid blocking response)
    void notifyAll(
      msgNuevoPedido({
        id: pedido.id,
        cliente: customer.nombreDestinatario,
        total: formatCurrency(total),
        metodo: metodoPago,
      }),
    );

    let redirectUrl: string | null = null;

    if (metodoPago === "mercado_pago" || metodoPago === "tarjeta") {
      const appUrl = process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
      const itemsForMp = detallePedido.map((item) => ({
        title: item.nombre,
        quantity: item.quantity,
        unit_price: Number(item.precioUnitario),
        currency_id: "MXN" as const,
      }));

      const preference = await createCheckoutPreference({
        externalReference: pedido.id,
        customer: {
          nombreDestinatario: customer.nombreDestinatario,
          email: customer.email,
          telefono: customer.telefono,
        },
        items:
          itemsForMp.length > 0
            ? itemsForMp
            : [
                {
                  title: `Pedido ${pedido.id}`,
                  quantity: 1,
                  unit_price: total,
                  currency_id: "MXN",
                },
              ],
        appUrl,
      });

      redirectUrl = preference.sandbox_init_point || preference.init_point || null;

      if (!redirectUrl) {
        throw new Error("Mercado Pago did not return a checkout URL.");
      }

      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          mpPreferenceId: preference.id,
          mpStatus: "preference_created",
        },
      });
    }

    return NextResponse.json(
      {
        id: pedido.id,
        estado: pedido.estado,
        total,
        redirectUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating pedido:", error);
    return NextResponse.json(
      { error: "No se pudo crear el pedido" },
      { status: 500 },
    );
  }
}