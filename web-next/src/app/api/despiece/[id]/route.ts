import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizar } from "@/lib/despiece/optimizer";
import { generarDespiecePdf } from "@/lib/despiece/pdf-generator";
import type { DespieceConfig } from "@/lib/despiece/types";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const { id } = await params;

  const producto = await prisma.producto.findUnique({
    where: { id, habilitado: true },
    select: { nombre: true, despieceJson: true },
  });

  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  // Parse despiece configuration
  let config: DespieceConfig | null = null;
  try {
    const parsed = JSON.parse(producto.despieceJson) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "piezas" in parsed
    ) {
      config = parsed as DespieceConfig;
    }
  } catch {
    /* fall through */
  }

  if (!config || !Array.isArray(config.piezas) || config.piezas.length === 0) {
    return NextResponse.json(
      { error: "Este producto no tiene un plano de corte configurado aún." },
      { status: 400 },
    );
  }

  try {
    const resultado = optimizar(config, producto.nombre);
    const pdfBytes  = await generarDespiecePdf(resultado);

    const safeName = producto.nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .slice(0, 40);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="despiece-${safeName}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al generar el plano.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
