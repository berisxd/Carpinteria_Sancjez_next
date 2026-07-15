"use client";

interface ZonaEnvio {
  codigoPostal: string;
  municipio: string;
  precio: number;
}

interface EnvioModalProps {
  zona: ZonaEnvio;
  onAceptar: () => void;
  onRechazar: () => void;
}

function formatCurrency(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function EnvioModal({ zona, onAceptar, onRechazar }: EnvioModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[rgba(31,77,122,0.3)] bg-white shadow-2xl">
        {/* Ícono */}
        <div className="flex justify-center pt-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)]/10">
            <svg
              className="h-7 w-7 text-[var(--brand)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-7 pb-2 pt-5 text-center">
          <h2 className="text-xl font-bold text-[var(--brand-700)]">
            ¡Hacemos envíos a tu zona!
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Detectamos que el código postal{" "}
            <span className="font-semibold text-[var(--brand-700)]">{zona.codigoPostal}</span>
            {zona.municipio ? (
              <>
                {" "}({zona.municipio})
              </>
            ) : null}{" "}
            cuenta con servicio de entrega a domicilio.
          </p>
        </div>

        {/* Precio destacado */}
        <div className="mx-7 my-4 rounded-xl bg-[var(--brand)]/5 border border-[var(--brand)]/15 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Costo de envío
          </p>
          <p className="mt-1 text-3xl font-bold text-[var(--brand-700)]">
            {formatCurrency(zona.precio)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Se sumará al total de tu pedido
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 px-7 pb-7">
          <button
            onClick={onAceptar}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white shadow-md transition hover:brightness-95"
          >
            Sí, quiero envío a domicilio
          </button>
          <button
            onClick={onRechazar}
            className="w-full rounded-xl border border-[rgba(31,77,122,0.25)] py-3 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand)]/5"
          >
            No gracias, paso a recoger en tienda
          </button>
        </div>
      </div>
    </div>
  );
}
