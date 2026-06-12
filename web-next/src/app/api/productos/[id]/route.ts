import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: {
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(producto, { status: 200 });
  } catch (error) {
    console.error("Error fetching producto by id:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
