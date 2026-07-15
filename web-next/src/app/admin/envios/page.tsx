"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ZonaEnvio {
  id: string;
  codigoPostal: string;
  municipio: string;
  precio: number;
  habilitado: boolean;
  createdAt: string;
}

function formatCurrency(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function AdminEnviosPage() {
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form para agregar
  const [cpNew, setCpNew] = useState("");
  const [municipioNew, setMunicipioNew] = useState("");
  const [precioNew, setPrecioNew] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edición inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editMunicipio, setEditMunicipio] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchZonas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/envios");
      if (!res.ok) throw new Error("Error al cargar zonas.");
      const data = (await res.json()) as ZonaEnvio[];
      setZonas(data);
    } catch {
      setError("No se pudieron cargar las zonas de envío.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchZonas();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    const precio = parseFloat(precioNew);
    if (isNaN(precio) || precio <= 0) {
      setAddError("El precio debe ser un número positivo.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoPostal: cpNew.trim(), municipio: municipioNew.trim(), precio }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAddError(data.error ?? "Error al agregar.");
        return;
      }
      setCpNew(""); setMunicipioNew(""); setPrecioNew("");
      await fetchZonas();
    } catch {
      setAddError("Error de red.");
    } finally {
      setAdding(false);
    }
  }

  async function toggleHabilitado(zona: ZonaEnvio) {
    await fetch(`/api/admin/envios/${zona.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habilitado: !zona.habilitado }),
    });
    await fetchZonas();
  }

  function startEdit(zona: ZonaEnvio) {
    setEditId(zona.id);
    setEditMunicipio(zona.municipio);
    setEditPrecio(String(zona.precio));
  }

  async function saveEdit(id: string) {
    const precio = parseFloat(editPrecio);
    if (isNaN(precio) || precio <= 0) return;
    setSaving(true);
    await fetch(`/api/admin/envios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ municipio: editMunicipio.trim(), precio }),
    });
    setEditId(null);
    setSaving(false);
    await fetchZonas();
  }

  async function handleDelete(id: string, cp: string) {
    if (!confirm(`¿Eliminar la zona CP ${cp}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/admin/envios/${id}`, { method: "DELETE" });
    await fetchZonas();
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Admin</p>
            <h1 className="mt-2 text-3xl font-bold">Zonas de envío</h1>
            <p className="mt-2 text-sm text-slate-400">
              Configura los códigos postales con entrega disponible y su costo.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ← Dashboard
          </Link>
        </header>

        {/* Formulario nueva zona */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
          <h2 className="text-lg font-semibold mb-4">Agregar zona de envío</h2>
          <form onSubmit={(e) => void handleAdd(e)} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Código postal
              </label>
              <input
                value={cpNew}
                onChange={(e) => setCpNew(e.target.value)}
                required
                maxLength={10}
                placeholder="90000"
                className="w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Municipio
              </label>
              <input
                value={municipioNew}
                onChange={(e) => setMunicipioNew(e.target.value)}
                maxLength={120}
                placeholder="Tepeyanco"
                className="w-48 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Costo de envío ($)
              </label>
              <input
                value={precioNew}
                onChange={(e) => setPrecioNew(e.target.value)}
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="150.00"
                className="w-36 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {adding ? "Agregando…" : "Agregar"}
            </button>
          </form>
          {addError && <p className="mt-3 text-sm text-red-400">{addError}</p>}
        </section>

        {/* Tabla de zonas */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20 overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Cargando…</div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-red-400 text-sm">{error}</div>
          ) : zonas.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">
              No hay zonas configuradas aún. Agrega la primera arriba.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">Código postal</th>
                    <th className="px-6 py-4">Municipio</th>
                    <th className="px-6 py-4">Costo envío</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {zonas.map((zona) => (
                    <tr key={zona.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-slate-100">
                          {zona.codigoPostal}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editId === zona.id ? (
                          <input
                            value={editMunicipio}
                            onChange={(e) => setEditMunicipio(e.target.value)}
                            className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-amber-400 focus:outline-none w-40"
                          />
                        ) : (
                          <span className="text-slate-300">
                            {zona.municipio || <span className="text-slate-600 italic">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editId === zona.id ? (
                          <input
                            value={editPrecio}
                            onChange={(e) => setEditPrecio(e.target.value)}
                            type="number"
                            min="1"
                            step="0.01"
                            className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-amber-400 focus:outline-none w-28"
                          />
                        ) : (
                          <span className="font-semibold text-emerald-300">
                            {formatCurrency(zona.precio)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => void toggleHabilitado(zona)}
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                            zona.habilitado
                              ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30 hover:bg-red-400/10 hover:text-red-300 hover:ring-red-400/30"
                              : "bg-slate-700/50 text-slate-400 ring-slate-600/30 hover:bg-emerald-400/10 hover:text-emerald-300 hover:ring-emerald-400/30"
                          }`}
                        >
                          {zona.habilitado ? "Habilitado" : "Deshabilitado"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {editId === zona.id ? (
                            <>
                              <button
                                onClick={() => void saveEdit(zona.id)}
                                disabled={saving}
                                className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition disabled:opacity-50"
                              >
                                {saving ? "Guardando…" : "Guardar"}
                              </button>
                              <button
                                onClick={() => setEditId(null)}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(zona)}
                                className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => void handleDelete(zona.id, zona.codigoPostal)}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-slate-500 text-center">
          Solo los códigos postales habilitados aparecen como opción de envío en el checkout del cliente.
        </p>
      </main>
    </div>
  );
}
