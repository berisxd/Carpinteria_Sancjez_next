import { TipoMueble } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
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
});

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const json = {
      nombre: String(formData.get("nombre") || ""),
      email: String(formData.get("email") || ""),
      telefono: String(formData.get("telefono") || ""),
      tipoMueble: String(formData.get("tipoMueble") || ""),
      descripcion: String(formData.get("descripcion") || ""),
    };

    const result = cotizacionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos invalidos para cotizacion." },
        { status: 400 },
      );
    }

    const imagenReferenciaFile = formData.get("imagenReferencia");
    let imagenReferenciaPath: string | null = null;

    if (imagenReferenciaFile instanceof File && imagenReferenciaFile.size > 0) {
      if (imagenReferenciaFile.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "La imagen excede el maximo permitido de 5MB." },
          { status: 400 },
        );
      }

      if (!allowedMimeTypes.has(imagenReferenciaFile.type)) {
        return NextResponse.json(
          { error: "Formato de imagen no permitido. Usa JPG, PNG o WEBP." },
          { status: 400 },
        );
      }

      const extension = extensionForMimeType(imagenReferenciaFile.type);
      if (!extension) {
        return NextResponse.json(
          { error: "No se pudo procesar el tipo de imagen." },
          { status: 400 },
        );
      }

      const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "cotizaciones");
      const outputPath = path.join(uploadDir, fileName);

      await mkdir(uploadDir, { recursive: true });

      const bytes = Buffer.from(await imagenReferenciaFile.arrayBuffer());
      await writeFile(outputPath, bytes);

      imagenReferenciaPath = `/uploads/cotizaciones/${fileName}`;
    }

    await prisma.cotizacion.create({
      data: {
        nombre: result.data.nombre,
        email: result.data.email,
        telefono: result.data.telefono,
        tipoMueble: result.data.tipoMueble as TipoMueble,
        descripcion: result.data.descripcion,
        imagenReferencia: imagenReferenciaPath,
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