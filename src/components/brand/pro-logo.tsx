"use client";

import Image from "next/image";
import Link from "next/link";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

interface ProLogoProps {
  /** Altura renderizada da marca em pixels. */
  size?: number;
  /** Marca horizontal ou símbolo isolado para espaços compactos. */
  variant?: "icon" | "full";
  /** Força o wordmark claro em superfícies que são sempre escuras. */
  tone?: "auto" | "dark";
  className?: string;
}

const FULL_LOGO_RATIO = 1935 / 434;
const ICON_LOGO_RATIO = 393 / 434;
const FULL_LOGO_SRC = withSiteBasePath("/brand/pro-resumos-logo.png");
const DARK_LOGO_SRC = withSiteBasePath("/brand/pro-resumos-logo-dark.png");
const ICON_LOGO_SRC = withSiteBasePath("/brand/pro-resumos-icon.png");

export function ProLogo({
  size = 32,
  variant = "icon",
  tone = "auto",
  className = "",
}: ProLogoProps) {
  if (variant === "icon") {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>
        <Image
          src={ICON_LOGO_SRC}
          alt="PRO Resumos"
          width={Math.round(size * ICON_LOGO_RATIO)}
          height={size}
          draggable={false}
        />
      </span>
    );
  }

  const width = Math.round(size * FULL_LOGO_RATIO);

  return (
    <span
      className={`pro-logo inline-flex shrink-0 items-center ${tone === "dark" ? "pro-logo--on-dark" : ""} ${className}`}
    >
      <Image
        src={FULL_LOGO_SRC}
        alt="PRO Resumos"
        width={width}
        height={size}
        className="pro-logo__light"
        draggable={false}
      />
      <Image
        src={DARK_LOGO_SRC}
        alt="PRO Resumos"
        width={width}
        height={size}
        className="pro-logo__dark"
        draggable={false}
      />
    </span>
  );
}

type ProLogoLinkProps = ProLogoProps & {
  href?: string;
  label?: string;
};

/** Identidade navegável e consistente do módulo PRO Resumos. */
export function ProLogoLink({
  href = "/dashboard",
  label = "Ir para o início do PRO Resumos",
  ...logoProps
}: ProLogoLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <ProLogo {...logoProps} />
    </Link>
  );
}
