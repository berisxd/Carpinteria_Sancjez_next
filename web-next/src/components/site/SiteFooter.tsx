import Link from "next/link";

const NAV_LINKS = [
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/cotizacion", label: "Solicitar cotización" },
  { href: "/#nosotros", label: "Sobre nosotros" },
  { href: "/#contacto", label: "Contacto" },
  { href: "/login", label: "Iniciar sesión" },
];

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--brand)", color: "#fff" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-white">Carpintería Sánchez</p>
            <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Artesanos en madera desde 1995. Muebles a medida para hogares y
              negocios en Tlaxcala, México.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
              Navegación
            </p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
              Contacto
            </p>
            <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <li>(246) 158 1146</li>
              <li>juanyahelsanchezflores5@gmail.com</li>
              <li>Privada Progreso No.12</li>
              <li>San Cosme Atlamaxac, Tlaxcala</li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col justify-between gap-2 border-t pt-6 text-xs sm:flex-row"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}
        >
          <span>© {new Date().getFullYear()} Carpintería Sánchez. Todos los derechos reservados.</span>
          <span>Tlaxcala, México</span>
        </div>
      </div>
    </footer>
  );
}
