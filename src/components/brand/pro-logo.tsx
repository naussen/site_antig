"use client";

/**
 * Componente de logo SVG proprietário do PRO Resumos.
 *
 * O ícone combina a letra "P" com degraus ascendentes e seta,
 * simbolizando progresso e evolução na carreira pública.
 *
 * Variantes:
 * - "icon"  → apenas o ícone (favicon, sidebar colapsada)
 * - "full"  → ícone + wordmark "PRO Resumos"
 * - "brand" → ícone + wordmark "PRO Concursos" (marca mãe)
 */

interface ProLogoProps {
  /** Altura do ícone em pixels */
  size?: number;
  /** "icon" = só ícone, "full" = ícone + "PRO Resumos", "brand" = ícone + "PRO Concursos" */
  variant?: "icon" | "full" | "brand";
  /** Cor do texto (herda --text-primary por padrão) */
  textColor?: string;
  /** Classe CSS adicional no wrapper */
  className?: string;
}

/** Ícone SVG standalone — "P" com escada ascendente */
function ProIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pro-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* Fundo arredondado */}
      <rect width="48" height="48" rx="12" fill="url(#pro-grad)" />
      {/* Letra P estilizada com degraus */}
      <path
        d="M14 36V16h8c4.418 0 8 2.686 8 6s-3.582 6-8 6h-4"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Degraus ascendentes */}
      <path
        d="M24 36h-4v-5h4v-5h4v-5h4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.85"
      />
      {/* Seta de progresso */}
      <path
        d="M30 18l2-3 2 3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

export function ProLogo({
  size = 32,
  variant = "icon",
  textColor,
  className = "",
}: ProLogoProps) {
  if (variant === "icon") {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>
        <ProIcon size={size} />
      </span>
    );
  }

  const moduleName = variant === "brand" ? "Concursos" : "Resumos";
  const fontSize = size * 0.5;
  const subFontSize = size * 0.3;

  return (
    <span
      className={`inline-flex items-center shrink-0 ${className}`}
      style={{ gap: size * 0.3 }}
    >
      <ProIcon size={size} />
      <span className="flex flex-col leading-none min-w-0">
        <span
          className="font-extrabold tracking-tight"
          style={{
            fontSize,
            color: textColor ?? "currentColor",
            lineHeight: 1.1,
          }}
        >
          PRO{" "}
          <span className="font-semibold" style={{ fontSize: subFontSize }}>
            {moduleName}
          </span>
        </span>
      </span>
    </span>
  );
}
