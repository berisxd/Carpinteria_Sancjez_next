"use client";

import { useState } from "react";

interface CotizacionImagenProps {
  src: string;
}

export function CotizacionImagen({ src }: CotizacionImagenProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-12 text-center">
        <svg
          className="h-10 w-10 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V3.75A.75.75 0 013.75 3z"
          />
        </svg>
        <p className="text-sm text-slate-400">
          La imagen no está disponible en el servidor.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 transition underline"
        >
          Intentar abrir URL directamente
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Imagen de referencia del cliente"
        className="rounded-xl max-w-full max-h-96 object-contain border border-slate-700"
        onError={() => setError(true)}
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-sky-400 hover:text-sky-300 transition"
      >
        Abrir imagen en tamaño completo →
      </a>
    </div>
  );
}
