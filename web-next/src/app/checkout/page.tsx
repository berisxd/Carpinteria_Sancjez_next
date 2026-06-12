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

    if (pedidoCreado.redirectUrl) {
      window.location.href = pedidoCreado.redirectUrl;
      return;
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
                  <legend className="text-sm font-medium text-[var(--brand-700)]">
                    Metodo de pago
                  </legend>
                  <div className="mt-3 space-y-3">
                    <label className="flex items-start gap-3 rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4">
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={metodoPago === "mercado_pago"}
                        onChange={() => setMetodoPago("mercado_pago")}
                      />
                      <span>
                        <span className="block font-medium text-[var(--brand-700)]">Mercado Pago</span>
                        <span className="text-sm text-[var(--muted)]">
                          Dejado listo para integrar el redirect real en el siguiente paso.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4">
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={metodoPago === "tarjeta"}
                        onChange={() => setMetodoPago("tarjeta")}
                      />
                      <span>
                        <span className="block font-medium text-[var(--brand-700)]">Tarjeta</span>
                        <span className="text-sm text-[var(--muted)]">
                          Simulado para esta fase local.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4">
                      <input
                        type="radio"
                        name="metodoPago"
                        checked={metodoPago === "ticket_tienda"}
                        onChange={() => setMetodoPago("ticket_tienda")}
                      />
                      <span>
                        <span className="block font-medium text-[var(--brand-700)]">Pago en tienda</span>
                        <span className="text-sm text-[var(--muted)]">
                          Reservamos el pedido para retiro o coordinacion directa.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creando pedido..." : "Confirmar pedido"}
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
                    <div key={item.id} className="rounded-xl border border-[rgba(31,77,122,0.2)] bg-white/90 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-[var(--muted)]">
                            {item.categoria.nombre}
                          </p>
                          <h3 className="mt-1 font-semibold text-[var(--brand-700)]">{item.nombre}</h3>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            ${item.precio.toLocaleString("es-AR")} c/u
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-sm text-slate-500 hover:text-red-600"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-[rgba(31,77,122,0.2)] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 text-sm text-[var(--brand-700)]"
                          >
                            -
                          </button>
                          <span className="min-w-10 px-3 py-2 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
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