import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        _count: {
          select: { productos: { where: { habilitado: true } } },
        },
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(categorias, { status: 200 });
  } catch (error) {
    console.error("Error fetching categorias:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
