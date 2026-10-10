import Image from "next/image";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

interface ProQuestionsLogoProps {
  compact?: boolean;
  tone?: "auto" | "dark" | "landing";
  className?: string;
}

const LOGO_SRC = withSiteBasePath("/brand/pro-questoes-logo.png");
const DARK_LOGO_SRC = withSiteBasePath("/brand/pro-questoes-logo-dark.png");
const ICON_SRC = withSiteBasePath("/brand/pro-questoes-icon.png");

/** Marca oficial do PRO Questões, com variações para superfícies claras e escuras. */
export function ProQuestionsLogo({
  compact = false,
  tone = "auto",
  className = "",
}: ProQuestionsLogoProps) {
  if (compact) {
    return (
      <span className={`inline-flex shrink-0 ${className}`} role="img" aria-label="PRO Questões">
        <Image
          src={ICON_SRC}
          alt=""
          width={560}
          height={560}
          className="h-10 w-10"
          sizes="40px"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={`pro-questions-logo pro-questions-logo--${tone} inline-flex min-w-0 shrink-0 items-center ${className}`}
      role="img"
      aria-label="PRO Questões"
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={2400}
        height={560}
        className="pro-questions-logo__light h-10 w-auto max-w-full"
        sizes="(max-width: 640px) 172px, 190px"
        draggable={false}
      />
      <Image
        src={DARK_LOGO_SRC}
        alt=""
        width={2400}
        height={560}
        className="pro-questions-logo__dark h-10 w-auto max-w-full"
        sizes="(max-width: 640px) 172px, 190px"
        draggable={false}
      />
    </span>
  );
}
