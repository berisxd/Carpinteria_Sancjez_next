import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-[rgba(31,77,122,0.14)] bg-white/85">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-6 text-sm sm:px-6 lg:flex-row lg:px-8">
        <div>
          <p className="font-semibold text-[var(--brand-700)]">
            Carpintería Sánchez
          </p>
          <p className="text-[var(--muted)]">
            Privada Progreso No.12, San Cosme Atlamaxac, Tepeyanco, Tlaxcala
          </p>
        </div>
        <div className="text-[var(--muted)] lg:text-right">
          <p>Tel: (246) 158 1146</p>
          <p>Email: juanyahelsanchezflores5@gmail.com</p>
          <p>
            <Link href="/cotizacion" className="cs-link">
              Solicitar cotizacion
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
