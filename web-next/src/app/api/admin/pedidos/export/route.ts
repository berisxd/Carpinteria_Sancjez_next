import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatMetodoPago,
  parsePedidoProductos,
  pedidoMetodoPagoOptions,
  pedidoStatusOptions,
} from "@/lib/pedidos";

type PedidoSortBy = "fecha" | "total" | "estado" | "nombre";
type SortDir = "asc" | "desc";

function normalizePedidoSortBy(value: string | null): PedidoSortBy {
  if (value === "total" || value === "estado" || value === "nombre") {
    return value;
  }
  return "fecha";
}

function normalizeSortDir(value: string | null): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function getPeriodoDate(periodo: string | null) {
  const now = new Date();

  if (periodo === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (periodo === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (periodo === "last_month") {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  if (periodo === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (periodo === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function getCustomRange(from: string, to: string) {
  const start = from ? parseDateInput(from) : null;
  const endInput = to ? parseDateInput(to) : null;
  const end = endInput ? new Date(endInput.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  if (start && end && start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function csvEscape(value: string | number) {
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response("No autenticado", { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return new Response("No autorizado", { status: 403 });
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const estado = (url.searchParams.get("estado") ?? "all").trim();
  const metodoPago = (url.searchParams.get("metodoPago") ?? "all").trim();
  const periodo = (url.searchParams.get("periodo") ?? "all").trim();
  const from = (url.searchParams.get("from") ?? "").trim();
  const to = (url.searchParams.get("to") ?? "").trim();
  const sortBy = normalizePedidoSortBy(url.searchParams.get("sortBy"));
  const sortDir = normalizeSortDir(url.searchParams.get("sortDir"));

  const whereAnd: Array<Record<string, unknown>> = [];

  if (q) {
    whereAnd.push({
      OR: [
        { id: { contains: q, mode: "insensitive" } },
        { nombreDestinatario: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { ciudad: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (pedidoStatusOptions.includes(estado as (typeof pedidoStatusOptions)[number])) {
    whereAnd.push({ estado });
  }

  if (pedidoMetodoPagoOptions.includes(metodoPago as (typeof pedidoMetodoPagoOptions)[number])) {
    whereAnd.push({ metodoPago });
  }

  if (periodo === "custom") {
    const customRange = getCustomRange(from, to);
    if (customRange.start || customRange.end) {
      whereAnd.push({
        createdAt: {
          ...(customRange.start ? { gte: customRange.start } : {}),
          ...(customRange.end ? { lte: customRange.end } : {}),
        },
      });
    }
  } else if (periodo === "last_month") {
    const { start, end } = getLastMonthRange();
    whereAnd.push({
      createdAt: {
        gte: start,
        lte: end,
      },
    });
  } else {
    const periodoStart = getPeriodoDate(periodo);
    if (periodoStart) {
      whereAnd.push({
        createdAt: {
          gte: periodoStart,
        },
      });
    }
  }

  const where = whereAnd.length > 0 ? { AND: whereAnd } : undefined;

  const orderByFieldMap: Record<PedidoSortBy, string> = {
    fecha: "createdAt",
    total: "total",
    estado: "estado",
    nombre: "nombreDestinatario",
  };

  const primaryField = orderByFieldMap[sortBy];
  const orderBy: Prisma.PedidoOrderByWithRelationInput | Prisma.PedidoOrderByWithRelationInput[] =
    sortBy === "fecha"
      ? { createdAt: sortDir }
      : [
          { [primaryField]: sortDir } as Prisma.PedidoOrderByWithRelationInput,
          { createdAt: "desc" },
        ];

  const pedidos = await prisma.pedido.findMany({
    where,
    orderBy,
    take: 5000,
  });

  const headers = [
    "id",
    "fecha",
    "estado",
    "metodo_pago",
    "total",
    "items",
    "cliente",
    "email",
    "telefono",
    "ciudad",
    "direccion",
    "codigo_postal",
    "referencia",
  ];

  const rows = pedidos.map((pedido) => {
    const itemsCount = parsePedidoProductos(pedido.productosJson).length;

    return [
      pedido.id,
      pedido.createdAt.toISOString(),
      pedido.estado,
      formatMetodoPago(pedido.metodoPago),
      Number(pedido.total).toFixed(2),
      itemsCount,
      pedido.nombreDestinatario,
      pedido.email,
      pedido.telefono,
      pedido.ciudad,
      pedido.direccion,
      pedido.codigoPostal,
      pedido.referencia,
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  const stamp = new Date()
    .toISOString()
    .replaceAll(":", "")
    .replaceAll("-", "")
    .slice(0, 13);

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=pedidos-${stamp}.csv`,
      "Cache-Control": "no-store",
    },
  });
}
