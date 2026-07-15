import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/envios/zona?cp=90000
 * Público — verifica si un código postal tiene envío habilitado y devuelve el precio.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cp = (searchParams.get("cp") ?? "").trim();

  if (!cp) {
    return NextResponse.json({ zona: null });
  }

  const zona = await prisma.zonaEnvio.findFirst({
    where: { codigoPostal: cp, habilitado: true },
    select: { id: true, municipio: true, precio: true, codigoPostal: true },
  });

  return NextResponse.json({
    zona: zona
      ? { ...zona, precio: Number(zona.precio) }
      : null,
  });
}
