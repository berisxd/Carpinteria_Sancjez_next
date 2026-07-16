import { TipoMueble } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const tipoMuebleValues = [
  "cocinas_integrales",
  "closets",
  "puertas",
  "muebles_personalizados",
  "instalacion_montaje",
  "otro",
] as const;

const cotizacionSchema = z.object({
  nombre: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email(),
  telefono: z.string().trim().min(6).max(20),
  tipoMueble: z.enum(tipoMuebleValues),
  descripcion: z.string().trim().min(20).max(5000),
  imagenReferencia: z
    .string()
    .trim()
    .url({ message: "La URL de imagen no es válida. Asegúrate de que comience con https://." }),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const json = {
      nombre: String(formData.get("nombre") || ""),
      email: String(formData.get("email") || ""),
      telefono: String(formData.get("telefono") || ""),
      tipoMueble: String(formData.get("tipoMueble") || ""),
      descripcion: String(formData.get("descripcion") || ""),
      imagenReferencia: String(formData.get("imagenReferencia") || ""),
    };

    const result = cotizacionSchema.safeParse(json);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message;
      return NextResponse.json(
        { error: firstError ?? "Datos invalidos para cotizacion." },
        { status: 400 },
      );
    }

    await prisma.cotizacion.create({
      data: {
        nombre: result.data.nombre,
        email: result.data.email,
        telefono: result.data.telefono,
        tipoMueble: result.data.tipoMueble as TipoMueble,
        descripcion: result.data.descripcion,
        imagenReferencia: result.data.imagenReferencia,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating cotizacion:", error);
    return NextResponse.json(
      { error: "No se pudo enviar la cotizacion." },
      { status: 500 },
    );
  }
}