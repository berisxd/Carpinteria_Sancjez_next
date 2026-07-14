"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

type MetodoPago = "tarjeta" | "mercado_pago" | "ticket_tienda";

interface PedidoCreado {
  id: string;
  redirectUrl?: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    hydrated,
    total,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("mercado_pago");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;

    if (items.length === 0) {
      setError("Tu carrito esta vacio.");
      return;
    }

    setLoading(true);

    const formData = new FormData(form);
    const payload = {
      customer: {
        nombreDestinatario: String(formData.get("nombreDestinatario") || ""),
        email: String(formData.get("email") || ""),
        telefono: String(formData.get("telefono") || ""),
        direccion: String(formData.get("direccion") || ""),
        ciudad: String(formData.get("ciudad") || ""),
        codigoPostal: String(formData.get("codigoPostal") || ""),
        referencia: String(formData.get("referencia") || ""),
      },
      metodoPago,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        materialSeleccionado: item.materialSeleccionado,
      })),
    };

    const response = await fetch("/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as PedidoCreado | { error?: string };

    if (!response.ok) {
      const apiError = "error" in data ? data.error : undefined;
      setError(apiError ?? "No se pudo crear el pedido.");
      setLoading(false);
      return;
    }

    const pedidoCreado = data as PedidoCreado;

    clearCart();
    form.reset();

    // Mercado Pago / Tarjeta → redirect to MP checkout
    if (pedidoCreado.redirectUrl) {
      window.location.href = pedidoCreado.redirectUrl;
      return;
    }

    // Ticket tienda → auto-download voucher PDF then redirect
    if (metodoPago === "ticket_tienda") {
      try {
        const ticketRes = await fetch(`/api/pedidos/${pedidoCreado.id}/ticket`);
        if (ticketRes.ok) {
          const blob = await ticketRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `voucher-tienda-${pedidoCreado.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }
      } catch {
        // Non-critical, redirect anyway
      }
    }

    router.push(`/pedido/${pedidoCreado.id}?creado=1`);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-[var(--muted)]">Cargando carrito...</p>
      </div>
    );
  }

  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-semibold text-[var(--brand)] hover:underline">
              ← Seguir comprando
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[var(--brand-700)]">Checkout</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Revisa tu pedido y completa los datos de entrega.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Entrega y pago</h2>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Nombre completo
                    <input
                      name="nombreDestinatario"
                      required
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Telefono
                    <input
                      name="telefono"
                      required
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Ciudad
                    <input
                      name="ciudad"
                      required
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-[var(--brand-700)]">
                  Direccion
                  <input
                    name="direccion"
                    required
                    className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-[0.4fr_1fr]">
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Codigo postal
                    <input
                      name="codigoPostal"
                      required
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--brand-700)]">
                    Referencia
                    <input
                      name="referencia"
                      placeholder="Piso, dpto, horario, punto de referencia"
                      className="mt-1 w-full rounded-lg border border-[rgba(31,77,122,0.25)] bg-white px-3 py-2 text-sm outline-none ring-[var(--brand)]/15 focus:ring"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-semibold text-[var(--brand-700)]">
                    Metodo de pago
                  </legend>
                  <div className="mt-3 grid gap-3">

                    {/* Mercado Pago */}
                    <label className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${metodoPago === "mercado_pago" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[rgba(31,77,122,0.2)] bg-white/90 hover:border-[var(--brand)]/40"}`}>
                      <input type="radio" className="mt-0.5" name="metodoPago" checked={metodoPago === "mercado_pago"} onChange={() => setMetodoPago("mercado_pago")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏦</span>
                          <span className="font-semibold text-[var(--brand-700)]">Mercado Pago</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Recomendado</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Paga con tu cuenta MP o con cualquier tarjeta. Te redirigimos a la plataforma segura de Mercado Pago.
                        </p>
                      </div>
                    </label>

                    {/* Tarjeta */}
                    <label className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${metodoPago === "tarjeta" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[rgba(31,77,122,0.2)] bg-white/90 hover:border-[var(--brand)]/40"}`}>
                      <input type="radio" className="mt-0.5" name="metodoPago" checked={metodoPago === "tarjeta"} onChange={() => setMetodoPago("tarjeta")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span>
                          <span className="font-semibold text-[var(--brand-700)]">Tarjeta de credito / debito</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Ingresa tus datos de tarjeta de forma segura a traves de Mercado Pago.
                        </p>
                      </div>
                    </label>

                    {/* Ticket tienda */}
                    <label className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${metodoPago === "ticket_tienda" ? "border-amber-500 bg-amber-50" : "border-[rgba(31,77,122,0.2)] bg-white/90 hover:border-amber-400/60"}`}>
                      <input type="radio" className="mt-0.5" name="metodoPago" checked={metodoPago === "ticket_tienda"} onChange={() => setMetodoPago("ticket_tienda")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏪</span>
                          <span className="font-semibold text-[var(--brand-700)]">Pago en tienda fisica</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Recibe un <strong>voucher PDF</strong> con los detalles de tu pedido y pagalo directamente en nuestra sucursal. Aceptamos efectivo y tarjeta en tienda.
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                          Privada Progreso No. 12, San Cosme Atlamaxac, Tepeyanco, Tlaxcala
                        </p>
                      </div>
                    </label>

                  </div>
                </fieldset>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading
                    ? "Procesando..."
                    : metodoPago === "ticket_tienda"
                    ? "Reservar y descargar voucher"
                    : "Continuar al pago"}
                </button>
              </form>
            </section>

            <aside className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Tu carrito</h2>

              {items.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[rgba(31,77,122,0.3)] p-6 text-center">
                  <p className="text-sm text-[var(--muted)]">Todavia no agregaste productos.</p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Ir al catalogo
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.cartKey} className="rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                            {item.categoria.nombre}
                          </p>
                          <h3 className="mt-1 font-semibold text-[var(--brand-700)]">{item.nombre}</h3>
                          {item.materialSeleccionado && (
                            <span className="mt-1 inline-block rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand-700)]">
                              {item.materialSeleccionado}
                            </span>
                          )}
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            ${item.precio.toLocaleString("es-AR")} c/u
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.cartKey)}
                          className="text-sm text-slate-500 hover:text-red-600"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-[rgba(31,77,122,0.2)] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className="px-3 py-2 text-sm text-[var(--brand-700)]"
                          >
                            -
                          </button>
                          <span className="min-w-10 px-3 py-2 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className="px-3 py-2 text-sm text-[var(--brand-700)]"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-[var(--brand-700)]">
                          ${(item.precio * item.quantity).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-[rgba(31,77,122,0.2)] pt-4">
                    <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                      <span>Subtotal</span>
                      <span>${total.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-lg font-bold text-[var(--brand-700)]">
                      <span>Total</span>
                      <span>${total.toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
      </main>

      <SiteFooter />
    </div>
  );
}