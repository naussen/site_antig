import Link from "next/link";
import { BookOpen, Sparkles, Brain, GraduationCap } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2 font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Sparkles size={16} className="text-white" />
          </div>
          PRO Resumos
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <Link 
            href="/login" 
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-primary)" }}
          >
            Login
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium px-5 py-2.5 rounded-full transition-transform hover:scale-105"
            style={{ background: "var(--text-primary)", color: "var(--bg-primary)" }}
          >
            Novo Usuário
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 py-12 md:py-24 text-center">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, var(--accent-soft) 0%, transparent 60%)",
          }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow)"
            }}
          >
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
            Plataforma de Alta Performance
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Sua aprovação desenhada <br className="hidden md:block"/>
            com{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              inteligência
            </span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Mnemônicos, flashcards 3D, mapas mentais e a melhor estrutura de revisão para concursos.
          </p>

          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-base font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-1"
            style={{ 
              background: "var(--accent)", 
              color: "white",
              boxShadow: "0 10px 25px -5px var(--accent-soft)"
            }}
          >
            Começar a estudar agora
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "Mnemônicos Poderosos",
              desc: "Associações mentais precisas para você não esquecer listas e regras no dia da prova.",
            },
            {
              icon: BookOpen,
              title: "Flashcards Interativos",
              desc: "Repetição espaçada integrada no texto para testar seu conhecimento na hora.",
            },
            {
              icon: GraduationCap,
              title: "Mapas Mentais",
              desc: "Diagramas visuais gerados para conectar ideias e melhorar a retenção do conteúdo.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-8 rounded-3xl transition-transform hover:-translate-y-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{
                  background:
                    "linear-gradient(135deg, var(--mnemonic-gradient-from), var(--mnemonic-gradient-to))",
                }}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
