"use client";

import { useState, useEffect, useCallback } from "react";

type UserRole = "ADMIN" | "WORKER" | "CLIENT";

type Usuario = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:  "Administrador",
  WORKER: "Trabajador",
  CLIENT: "Cliente",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:  "bg-amber-400/20 text-amber-300 ring-amber-400/30",
  WORKER: "bg-sky-400/20 text-sky-300 ring-sky-400/30",
  CLIENT: "bg-slate-700/50 text-slate-400 ring-slate-600/30",
};

// ── Invite form ───────────────────────────────────────────────────────────────
function InviteForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "WORKER" as UserRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setForm({ name: "", email: "", password: "", role: "WORKER" });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Nombre completo
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Juan Pérez"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Correo electrónico
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="juan@carpinteria.com"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Contraseña temporal
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Rol
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          >
            <option value="WORKER">Trabajador</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UsuarioRow({
  user,
  meId,
  onChanged,
}: {
  user: Usuario;
  meId: string;
  onChanged: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMe = user.id === meId;

  async function handleRoleChange(newRole: UserRole) {
    setSaving(true);
    setRole(newRole);
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    });
    setSaving(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${user.name ?? user.email}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/usuarios?id=${user.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4 text-sm">
      {/* Avatar placeholder */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
        {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-100 truncate">
          {user.name ?? <span className="text-slate-500 italic">Sin nombre</span>}
          {isMe && (
            <span className="ml-2 text-[10px] font-normal text-amber-300">(tú)</span>
          )}
        </p>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
      </div>

      <div className="flex items-center gap-3">
        <RoleBadge role={role} />

        {!isMe && (
          <select
            value={role}
            onChange={(e) => void handleRoleChange(e.target.value as UserRole)}
            disabled={saving}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none disabled:opacity-50"
          >
            <option value="ADMIN">Administrador</option>
            <option value="WORKER">Trabajador</option>
            <option value="CLIENT">Cliente</option>
          </select>
        )}

        {saving && (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
        )}

        {!isMe && (
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-lg border border-rose-800/40 px-2.5 py-1 text-[11px] font-medium text-rose-400 transition hover:border-rose-600 hover:text-rose-300 disabled:opacity-40"
          >
            {deleting ? "…" : "Eliminar"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GestionEquipo({ meId }: { meId: string }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/usuarios");
    const data = (await res.json()) as { usuarios: Usuario[]; totalClientes: number };
    setUsuarios(data.usuarios);
    setTotalClientes(data.totalClientes);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchUsuarios(); }, [fetchUsuarios]);

  const admins  = usuarios.filter((u) => u.role === "ADMIN");
  const workers = usuarios.filter((u) => u.role === "WORKER");

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Administradores", count: admins.length,  color: "text-amber-300" },
          { label: "Trabajadores",    count: workers.length, color: "text-sky-300"  },
          { label: "Clientes",        count: totalClientes,  color: "text-slate-300" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="mt-1 text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Invite toggle */}
      <div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20"
        >
          {showInvite ? "✕ Cancelar" : "+ Agregar usuario"}
        </button>

        {showInvite && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">Nuevo trabajador / administrador</h3>
            <InviteForm onCreated={() => { setShowInvite(false); void fetchUsuarios(); }} />
          </div>
        )}
      </div>

      {/* User list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Cargando…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <p className="border-b border-slate-800 bg-slate-900/60 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-amber-300/70">
                Administradores
              </p>
              <div className="divide-y divide-slate-800 bg-slate-900">
                {admins.map((u) => (
                  <UsuarioRow key={u.id} user={u} meId={meId} onChanged={() => void fetchUsuarios()} />
                ))}
              </div>
            </div>
          )}

          {/* Workers */}
          {workers.length > 0 && (
            <div>
              <p className="border-b border-t border-slate-800 bg-slate-900/60 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-sky-300/70">
                Trabajadores
              </p>
              <div className="divide-y divide-slate-800 bg-slate-900">
                {workers.map((u) => (
                  <UsuarioRow key={u.id} user={u} meId={meId} onChanged={() => void fetchUsuarios()} />
                ))}
              </div>
            </div>
          )}

          {admins.length === 0 && workers.length === 0 && (
            <div className="bg-slate-900 px-5 py-10 text-center text-sm text-slate-500">
              No hay usuarios de equipo todavía.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
