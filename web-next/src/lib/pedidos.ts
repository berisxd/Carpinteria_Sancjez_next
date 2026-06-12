export interface PedidoProductoDetalle {
  id: string;
  nombre: string;
  imagen: string;
  precioUnitario: number;
  quantity: number;
  subtotal: number;
  categoria: {
    nombre: string;
    slug: string;
  };
}

export const pedidoStatusOptions = [
  "pendiente",
  "confirmado",
  "procesando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export const pedidoMetodoPagoOptions = [
  "tarjeta",
  "mercado_pago",
  "ticket_tienda",
] as const;

export type PedidoStatus = (typeof pedidoStatusOptions)[number];
export type PedidoMetodoPago = (typeof pedidoMetodoPagoOptions)[number];

export function parsePedidoProductos(productosJson: string): PedidoProductoDetalle[] {
  try {
    const parsed = JSON.parse(productosJson) as PedidoProductoDetalle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

export function formatMetodoPago(value: string) {
  return value.replaceAll("_", " ");
}