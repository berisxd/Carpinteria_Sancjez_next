import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const categoria = await prisma.categoria.findUnique({
      where: { slug },
      include: {
        productos: {
          where: { habilitado: true },
          orderBy: { nombre: "asc" },
        },
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(categoria, { status: 200 });
  } catch (error) {
    console.error("Error fetching categoria by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}
