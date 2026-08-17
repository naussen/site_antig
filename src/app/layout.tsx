import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
