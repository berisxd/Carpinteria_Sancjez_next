import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { GestionEquipo } from "@/components/admin/GestionEquipo";

export default async function AdminUsuariosPage() {
  const session = await requireAdminSession("/admin/usuarios");
  const meId = (session.user as { id?: string }).id ?? "";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              ← Volver al dashboard
            </Link>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-1 text-3xl font-bold">Gestión de equipo</h1>
            <p className="mt-2 text-sm text-slate-400">
              Crea y administra los accesos de trabajadores y otros administradores.
            </p>
          </div>
        </header>

        {/* Permissions info */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">Permisos por rol</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="text-sm font-bold text-amber-300">🛡 Administrador</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                <li>✓ Dashboard completo y KPIs</li>
                <li>✓ Ver y cambiar estado de pedidos</li>
                <li>✓ Crear / editar / eliminar productos</li>
                <li>✓ Gestionar usuarios y roles</li>
                <li>✓ Asistente IA y exportación CSV</li>
              </ul>
            </div>
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
              <p className="text-sm font-bold text-sky-300">🔧 Trabajador</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                <li>✓ Dashboard y KPIs</li>
                <li>✓ Ver pedidos y detalle de clientes</li>
                <li>✓ Cambiar estado de pedidos</li>
                <li>✓ Editar productos y plano de corte</li>
                <li>✗ <span className="line-through opacity-60">Gestionar usuarios</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Team management */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
          <GestionEquipo meId={meId} />
        </section>
      </main>
    </div>
  );
}
