import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const STAFF_ROLES = ["ADMIN", "WORKER"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

/** Permite acceso solo a ADMIN */
export async function requireAdminSession(callbackUrl: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}

/** Permite acceso a ADMIN y WORKER */
export async function requireStaffSession(callbackUrl: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!(STAFF_ROLES as readonly string[]).includes(session.user.role)) {
    redirect("/");
  }

  return session as typeof session & { user: { role: StaffRole } };
}

export function isAdmin(session: Awaited<ReturnType<typeof requireStaffSession>>) {
  return session.user.role === "ADMIN";
}