import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CotizacionForm } from "@/components/site/CotizacionForm";

export const metadata = {
  title: "Cotizacion - Carpintería Sánchez",
  description: "Solicita tu cotizacion de muebles y proyectos personalizados",
};

export default function CotizacionPage() {
  return (
    <div className="cs-page">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-8">
          <Link href="/" className="cs-link text-sm">
            ← Volver al inicio
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-[var(--brand-700)]">Solicitar cotizacion</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Cuéntanos qué mueble o proyecto necesitas y te enviaremos una propuesta
            con tiempos estimados y rango de inversion.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="cs-card p-6 sm:p-8">
            <CotizacionForm />
          </section>

          <aside className="space-y-6">
            <section className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Que incluir</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Medidas aproximadas del espacio</li>
                <li>Materiales o estilo preferido</li>
                <li>Fecha ideal de entrega</li>
                <li>URL de imagen de referencia (Google, Pinterest, etc.)</li>
              </ul>
            </section>

            <section className="cs-card p-6">
              <h2 className="text-xl font-semibold text-[var(--brand-700)]">Contacto directo</h2>
              <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <p>WhatsApp: +52 246 158 1146</p>
                <p>Email: juanyahelsanchezflores5@gmail.com</p>
                <p>Tepeyanco, Tlaxcala</p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}