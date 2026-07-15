import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

const updateSchema = z.object({
  municipio: z.string().trim().max(120).optional(),
  precio: z.number().positive().optional(),
  habilitado: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH /api/admin/envios/[id] — Actualiza municipio, precio o habilitado */
export async function PATCH(request: Request, { params }: RouteContext) {
  await requireAdminSession("/admin/envios");

  const { id } = await params;
  const json = await request.json();
  const result = updateSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", issues: result.error.flatten() },
      { status: 400 },
    );
  }

  const zona = await prisma.zonaEnvio.findUnique({ where: { id } });
  if (!zona) {
    return NextResponse.json({ error: "Zona no encontrada." }, { status: 404 });
  }

  const updated = await prisma.zonaEnvio.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json({ ...updated, precio: Number(updated.precio) });
}

/** DELETE /api/admin/envios/[id] — Elimina una zona */
export async function DELETE(_request: Request, { params }: RouteContext) {
  await requireAdminSession("/admin/envios");

  const { id } = await params;

  const zona = await prisma.zonaEnvio.findUnique({ where: { id } });
  if (!zona) {
    return NextResponse.json({ error: "Zona no encontrada." }, { status: 404 });
  }

  await prisma.zonaEnvio.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
