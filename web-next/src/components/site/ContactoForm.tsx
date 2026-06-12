"use client";

import { FormEvent, useState } from "react";

export function ContactoForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      nombre: String(formData.get("nombre") || "").trim(),
      contacto: String(formData.get("contacto") || "").trim(),
      mensaje: String(formData.get("mensaje") || "").trim(),
    };

    setLoading(true);

    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "No se pudo enviar tu mensaje.");
        return;
      }

      form.reset();
      setSuccess("Gracias, recibimos tu mensaje y te contactaremos pronto.");
    } catch {
      setError("No se pudo enviar tu mensaje. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Nombre
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={120}
            className="cs-input"
          />
        </label>

        <label className="block text-sm font-medium text-[var(--brand-700)]">
          Telefono o email
          <input
            name="contacto"
            required
            minLength={5}
            maxLength={200}
            className="cs-input"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-[var(--brand-700)]">
        Mensaje
        <textarea
          name="mensaje"
          required
          minLength={10}
          maxLength={4000}
          rows={4}
          className="cs-input min-h-28 resize-y"
          placeholder="Cuéntanos sobre tu proyecto"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}