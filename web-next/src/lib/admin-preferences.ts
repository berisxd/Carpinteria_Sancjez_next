import { prisma } from "@/lib/prisma";

export type SortDir = "asc" | "desc";
export type PedidoSortBy = "fecha" | "total" | "estado" | "nombre";
export type ProductoSortBy = "fecha" | "nombre" | "precio" | "estado";
export type PedidoPeriodo = "all" | "today" | "this_month" | "last_month" | "7d" | "30d" | "custom";

export const pageSizeOptions = [10, 25, 50] as const;

export function normalizePageSize(value: string | number | undefined, fallback = 10) {
  const parsed = Number(value ?? fallback);
  return pageSizeOptions.includes(parsed as (typeof pageSizeOptions)[number])
    ? parsed
    : fallback;
}

export function normalizeSortDir(value: string | undefined, fallback: SortDir = "desc"): SortDir {
  if (value === "asc" || value === "desc") {
    return value;
  }
  return fallback;
}

export function normalizePedidoSortBy(value: string | undefined, fallback: PedidoSortBy = "fecha"): PedidoSortBy {
  if (value === "total" || value === "estado" || value === "nombre" || value === "fecha") {
    return value;
  }
  return fallback;
}

export function normalizeProductoSortBy(value: string | undefined, fallback: ProductoSortBy = "fecha"): ProductoSortBy {
  if (value === "nombre" || value === "precio" || value === "estado" || value === "fecha") {
    return value;
  }
  return fallback;
}

export function normalizePedidosEstado(value: string | undefined, fallback = "all") {
  return value && value.trim() ? value.trim() : fallback;
}

export function normalizePedidosMetodoPago(value: string | undefined, fallback = "all") {
  return value && value.trim() ? value.trim() : fallback;
}

export function normalizePedidosPeriodo(value: string | undefined, fallback: PedidoPeriodo = "all"): PedidoPeriodo {
  if (
    value === "today" ||
    value === "this_month" ||
    value === "last_month" ||
    value === "7d" ||
    value === "30d" ||
    value === "custom" ||
    value === "all"
  ) {
    return value;
  }
  return fallback;
}

export function normalizeProductosCategoria(value: string | undefined, fallback = "all") {
  return value && value.trim() ? value.trim() : fallback;
}

export async function getAdminPreference(userId: string) {
  return prisma.adminPreference.findUnique({
    where: { userId },
  });
}

export async function savePedidosPreference(
  userId: string,
  values: {
    pageSize: number;
    sortBy: PedidoSortBy;
    sortDir: SortDir;
    estado: string;
    metodoPago: string;
    periodo: PedidoPeriodo;
  },
) {
  await prisma.adminPreference.upsert({
    where: { userId },
    create: {
      userId,
      pedidosPageSize: values.pageSize,
      pedidosSortBy: values.sortBy,
      pedidosSortDir: values.sortDir,
      pedidosEstado: values.estado,
      pedidosMetodoPago: values.metodoPago,
      pedidosPeriodo: values.periodo,
    },
    update: {
      pedidosPageSize: values.pageSize,
      pedidosSortBy: values.sortBy,
      pedidosSortDir: values.sortDir,
      pedidosEstado: values.estado,
      pedidosMetodoPago: values.metodoPago,
      pedidosPeriodo: values.periodo,
    },
  });
}

export async function saveProductosPreference(
  userId: string,
  values: { pageSize: number; sortBy: ProductoSortBy; sortDir: SortDir; categoria: string },
) {
  await prisma.adminPreference.upsert({
    where: { userId },
    create: {
      userId,
      productosPageSize: values.pageSize,
      productosSortBy: values.sortBy,
      productosSortDir: values.sortDir,
      productosCategoria: values.categoria,
    },
    update: {
      productosPageSize: values.pageSize,
      productosSortBy: values.sortBy,
      productosSortDir: values.sortDir,
      productosCategoria: values.categoria,
    },
  });
}
