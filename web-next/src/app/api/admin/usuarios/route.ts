import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ROLES_STAFF = ["ADMIN", "WORKER"] as const;

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return (session as { user?: { role?: string } } | null)?.user?.role === "ADMIN";
}

/** GET /api/admin/usuarios — list all non-CLIENT users + clients summary */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filtroRol = searchParams.get("rol") ?? "staff"; // "staff" | "all"

  const where =
    filtroRol === "all"
      ? {}
      : { role: { in: ROLES_STAFF as unknown as ("ADMIN" | "WORKER")[] } };

  const usuarios = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  const totalClientes = await prisma.user.count({ where: { role: "CLIENT" } });

  return NextResponse.json({ usuarios, totalClientes });
}

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "WORKER", "CLIENT"]),
});

/** PATCH /api/admin/usuarios — change a user's role */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { userId, role } = parsed.data;

  // Prevent demoting yourself
  const meId = (session?.user as { id?: string })?.id;
  if (meId && meId === userId && role !== "ADMIN") {
    return NextResponse.json(
      { error: "No puedes cambiar tu propio rol." },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "WORKER"]),
});

/** POST /api/admin/usuarios — create a staff user (worker or admin) */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as unknown;
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese correo." },
      { status: 409 },
    );
  }

  const { hash } = await import("bcryptjs");
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}

/** DELETE /api/admin/usuarios?id=xxx — remove a staff user */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const meId = (session?.user as { id?: string })?.id;
  if (meId && meId === userId) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta." },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
