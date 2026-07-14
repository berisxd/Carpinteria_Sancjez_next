"use client";

import { useState } from "react";

interface Props {
  productoId: string;
  productoNombre: string;
}

type Estado = "idle" | "cargando" | "error";

export function DescargaDespieceButton({ productoId, productoNombre }: Props) {
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function descargar() {
    setEstado("cargando");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/despiece/${productoId}`);

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `Error ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `despiece-${productoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setEstado("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "No se pudo generar el plano.");
      setEstado("error");
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => void descargar()}
        disabled={estado === "cargando"}
        className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-4 py-3 text-sm font-semibold text-[var(--brand-700)] transition hover:border-[var(--brand)]/60 hover:bg-[var(--brand)]/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Descarga el plano de corte en PDF antes de comprar"
      >
        {estado === "cargando" ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)]/30 border-t-[var(--brand)]" />
            Generando plano…
          </>
        ) : (
          <>
            <BlueprintIcon className="h-4 w-4 shrink-0" />
            Descargar Plano de Corte
          </>
        )}
      </button>

      {estado === "error" && errorMsg && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

function BlueprintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.6}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 15h4" />
    </svg>
  );
}
