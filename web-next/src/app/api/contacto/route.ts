import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactoSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  contacto: z.string().trim().min(5).max(200),
  mensaje: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = contactoSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos invalidos para contacto." },
        { status: 400 },
      );
    }

    await prisma.contacto.create({
      data: {
        nombre: result.data.nombre,
        contacto: result.data.contacto,
        mensaje: result.data.mensaje,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating contacto:", error);
    return NextResponse.json(
      { error: "No se pudo enviar tu mensaje." },
      { status: 500 },
    );
  }
}