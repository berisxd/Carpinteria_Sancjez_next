"use client";

import { FormEvent, useState } from "react";

const tiposMueble = [
  { value: "cocinas_integrales", label: "Cocinas Integrales" },
  { value: "closets", label: "Closets y Armarios" },
  { value: "puertas", label: "Puertas" },
  { value: "muebles_personalizados", label: "Muebles Personalizados" },
  { value: "instalacion_montaje", label: "Instalacion y Montaje" },
  { value: "otro", label: "Otro" },
] as const;

export function CotizacionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    try {
      const response = await fetch("/api/cotizaciones", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "No se pudo enviar la cotizacion.");
        return;
      }

      form.reset();
      setSuccess("Cotizacion enviada con exito. Te contactaremos pronto.");
    } catch {
      setError("No se pudo enviar la cotizacion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Nombre completo
          <input name="nombre" required minLength={2} maxLength={200} className="cs-input" />
        </label>
        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Email
          <input name="email" type="email" required className="cs-input" />
        </label>
        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Telefono
          <input name="telefono" required minLength={6} maxLength={20} className="cs-input" />
        </label>
        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Tipo de mueble
          <select name="tipoMueble" required className="cs-input">
            {tiposMueble.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-[var(--brand-700)]">
        Descripcion
        <textarea
          name="descripcion"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          className="cs-input min-h-36 resize-y"
          placeholder="Describe medidas, acabados, estilo y detalles importantes"
        />
      </label>

      <label className="block text-sm font-medium text-[var(--brand-700)]">
        Imagen de referencia <span className="text-red-500">*</span> (JPG/PNG/WEBP, max 5MB)
        <input
          name="imagenReferencia"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="cs-input"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Enviar cotizacion"}
      </button>
    </form>
  );
}