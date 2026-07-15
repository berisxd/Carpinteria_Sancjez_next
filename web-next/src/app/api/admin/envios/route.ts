import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

const createSchema = z.object({
  codigoPostal: z.string().trim().min(4).max(10),
  municipio: z.string().trim().max(120).default(""),
  precio: z.number().positive(),
  habilitado: z.boolean().default(true),
});

/** GET /api/admin/envios — Lista todas las zonas de envío */
export async function GET() {
  await requireAdminSession("/admin/envios");

  const zonas = await prisma.zonaEnvio.findMany({
    orderBy: { codigoPostal: "asc" },
  });

  return NextResponse.json(
    zonas.map((z) => ({ ...z, precio: Number(z.precio) })),
  );
}

/** POST /api/admin/envios — Crea una nueva zona */
export async function POST(request: Request) {
  await requireAdminSession("/admin/envios");

  const json = await request.json();
  const result = createSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: result.error.flatten() },
      { status: 400 },
    );
  }

  const { codigoPostal, municipio, precio, habilitado } = result.data;

  const existing = await prisma.zonaEnvio.findUnique({ where: { codigoPostal } });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una zona con ese código postal." },
      { status: 409 },
    );
  }

  const zona = await prisma.zonaEnvio.create({
    data: { codigoPostal, municipio, precio, habilitado },
  });

  return NextResponse.json({ ...zona, precio: Number(zona.precio) }, { status: 201 });
}
