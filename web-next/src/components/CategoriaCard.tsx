"use client";

import Link from "next/link";

interface CategoriaCardProps {
  slug: string;
  nombre: string;
  count: number;
}

function ArmarioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <circle cx="8" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <line x1="3" y1="19" x2="21" y2="19" />
    </svg>
  );
}

function CocinaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="20" height="13" rx="2" />
      <path d="M7 9V6a5 5 0 0 1 10 0v3" />
      <circle cx="8.5" cy="15.5" r="1.5" />
      <circle cx="15.5" cy="15.5" r="1.5" />
      <line x1="12" y1="13" x2="12" y2="18" />
    </svg>
  );
}

function LibreriaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="18" rx="1" />
      <rect x="10" y="6" width="4" height="15" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}

function MueblePersonalizadoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <path d="m15 5 3 3" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

type SlugConfig = {
  Icon: (props: { className?: string }) => React.JSX.Element;
  iconBg: string;
  iconColor: string;
  borderHover: string;
  tagline: string;
};

const categoryConfig: Record<string, SlugConfig> = {
  armarios: {
    Icon: ArmarioIcon,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    borderHover: "hover:border-amber-400",
    tagline: "Almacenamiento y organización",
  },
  cocinas: {
    Icon: CocinaIcon,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    borderHover: "hover:border-sky-400",
    tagline: "Diseño funcional para tu hogar",
  },
  librerias: {
    Icon: LibreriaIcon,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    borderHover: "hover:border-emerald-400",
    tagline: "Estantes y exhibidores a medida",
  },
  "muebles-personalizados": {
    Icon: MueblePersonalizadoIcon,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    borderHover: "hover:border-violet-400",
    tagline: "Diseñado exactamente para ti",
  },
};

const defaultConfig: SlugConfig = {
  Icon: MueblePersonalizadoIcon,
  iconBg: "bg-gray-100",
  iconColor: "text-gray-600",
  borderHover: "hover:border-gray-400",
  tagline: "Explora nuestros productos",
};

export function CategoriaCard({ slug, nombre, count }: CategoriaCardProps) {
  const { Icon, iconBg, iconColor, tagline } =
    categoryConfig[slug] ?? defaultConfig;

  const gradients: Record<string, string> = {
    armarios: "from-amber-50 to-amber-100",
    cocinas: "from-sky-50 to-sky-100",
    librerias: "from-emerald-50 to-emerald-100",
    "muebles-personalizados": "from-violet-50 to-violet-100",
  };
  const gradient = gradients[slug] ?? "from-slate-50 to-slate-100";

  return (
    <Link href={`/categoria/${slug}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-lg">
        {/* Icon area */}
        <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}>
          <div className={`rounded-2xl p-4 shadow-sm ${iconBg} ${iconColor}`}>
            <Icon className="h-10 w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-[var(--fg)]">{nombre}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{tagline}</p>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--muted)]">
              {count} {count === 1 ? "producto" : "productos"}
            </span>
            <span
              className="flex items-center gap-1 text-xs font-bold transition-all duration-150 group-hover:gap-1.5"
              style={{ color: "var(--accent)" }}
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
