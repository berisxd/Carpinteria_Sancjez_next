import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProductoSortBy = "fecha" | "nombre" | "precio" | "estado";
type SortDir = "asc" | "desc";

function normalizeProductoSortBy(value: string | null): ProductoSortBy {
  if (value === "nombre" || value === "precio" || value === "estado") {
    return value;
  }
  return "fecha";
}

function normalizeSortDir(value: string | null): SortDir {
  return value === "asc" ? "asc" : "desc";
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
  const categoria = (url.searchParams.get("categoria") ?? "all").trim();
  const estado = (url.searchParams.get("estado") ?? "all").trim();
  const csvUpdatedAt = url.searchParams.get("csvUpdatedAt") === "1";
  const csvCategoriaSlug = url.searchParams.get("csvCategoriaSlug") === "1";
  const csvCategoriaId = url.searchParams.get("csvCategoriaId") === "1";
  const sortBy = normalizeProductoSortBy(url.searchParams.get("sortBy"));
  const sortDir = normalizeSortDir(url.searchParams.get("sortDir"));

  const whereAnd: Array<Record<string, unknown>> = [];

  if (q) {
    whereAnd.push({
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { descripcion: { contains: q, mode: "insensitive" } },
        { categoria: { nombre: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (categoria !== "all") {
    whereAnd.push({ categoriaId: categoria });
  }

  if (estado === "habilitado") {
    whereAnd.push({ habilitado: true });
  }

  if (estado === "deshabilitado") {
    whereAnd.push({ habilitado: false });
  }

  const where = whereAnd.length > 0 ? { AND: whereAnd } : undefined;

  const orderByFieldMap: Record<ProductoSortBy, string> = {
    fecha: "createdAt",
    nombre: "nombre",
    precio: "precio",
    estado: "habilitado",
  };

  const primaryField = orderByFieldMap[sortBy];
  const orderBy: Prisma.ProductoOrderByWithRelationInput | Prisma.ProductoOrderByWithRelationInput[] =
    sortBy === "fecha"
      ? { createdAt: sortDir }
      : [
          { [primaryField]: sortDir } as Prisma.ProductoOrderByWithRelationInput,
          { createdAt: "desc" },
        ];

  const productos = await prisma.producto.findMany({
    where,
    include: {
      categoria: {
        select: {
          id: true,
          nombre: true,
          slug: true,
        },
      },
    },
    orderBy,
    take: 5000,
  });

  const headers = [
    "id",
    "nombre",
    "categoria_id",
    "categoria",
    "categoria_slug",
    "precio",
    "estado",
    "fecha_alta",
    "updated_at",
    "imagen",
    "descripcion",
    "materiales",
  ];

  const defaultVisibleHeaders = new Set([
    "id",
    "nombre",
    "categoria",
    "precio",
    "estado",
    "fecha_alta",
    "imagen",
    "descripcion",
    "materiales",
  ]);

  if (csvCategoriaId) {
    defaultVisibleHeaders.add("categoria_id");
  }

  if (csvCategoriaSlug) {
    defaultVisibleHeaders.add("categoria_slug");
  }

  if (csvUpdatedAt) {
    defaultVisibleHeaders.add("updated_at");
  }

  const visibleHeaders = headers.filter((header) => defaultVisibleHeaders.has(header));

  const rows = productos.map((producto) => {
    const row: Record<string, string> = {
      id: producto.id,
      nombre: producto.nombre,
      categoria_id: producto.categoria.id,
      categoria: producto.categoria.nombre,
      categoria_slug: producto.categoria.slug,
      precio: Number(producto.precio).toFixed(2),
      estado: producto.habilitado ? "habilitado" : "deshabilitado",
      fecha_alta: producto.createdAt.toISOString(),
      updated_at: producto.updatedAt.toISOString(),
      imagen: producto.imagen,
      descripcion: producto.descripcion,
      materiales: producto.materiales,
    };

    return visibleHeaders.map((header) => row[header]);
  });

  const csv = [visibleHeaders, ...rows]
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
      "Content-Disposition": `attachment; filename=productos-${stamp}.csv`,
      "Cache-Control": "no-store",
    },
  });
}
