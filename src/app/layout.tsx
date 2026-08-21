import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { withSiteBasePath } from "@/lib/site-paths.mjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PRO Resumos — Plataforma de Estudos para Concursos",
    template: "%s | PRO Resumos",
  },
  description:
    "Plataforma interativa para estudo de concursos com resumos estruturados, flashcards, mnemônicos e mapas mentais.",
  keywords: [
    "concurso público",
    "direito",
    "estudo",
    "flashcards",
    "resumo jurídico",
    "PRO Resumos",
    "PRO Concursos",
  ],
  icons: {
    icon: withSiteBasePath("/brand/pro-resumos-favicon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`} suppressHydrationWarning>
      {/* O otimizador CSS ainda não reconhece ::highlight(); React 19 carrega a folha estática sem CSS inline. */}
      <link rel="stylesheet" href={withSiteBasePath("/study-highlights.css")} precedence="default" />
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
