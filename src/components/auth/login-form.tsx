"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";
import { forceCreateConfirmedUser } from "@/app/actions/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erro no login com Google:", error);
      alert("Ocorreu um erro ao tentar entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      
      if (password) {
        if (isSignUp) {
          // MODO CADASTRO BYPASS ADMIN
          // Chama a server action que usa a Service Role Key para contornar qualquer limite 
          // de emails e já cria o usuário validado na mesma hora.
          await forceCreateConfirmedUser(email, password);
          
          // Imediatamente após criar (ou se já existir validado), faz o login
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          window.location.href = "/dashboard";
        } else {
          // MODO LOGIN
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          window.location.href = "/dashboard";
        }
      } else {
        // Se não tem senha, usa o Magic Link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccess(true);
      }
    } catch (error: unknown) {
      console.error("Erro no login:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("rate limit")) {
        alert("Limite de envio de emails excedido no Supabase. Use uma senha de teste ou Google.");
      } else {
        alert(message || "Ocorreu um erro ao tentar entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div 
        className="p-6 text-center rounded-xl" 
        style={{ 
          background: "var(--bg-card)", 
          border: "1px solid var(--border)", 
          boxShadow: "var(--shadow)" 
        }}
      >
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--callout-tip-bg)", color: "var(--callout-tip-border)" }}>
          <Mail size={24} />
        </div>
        <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Link enviado!</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Verifique a caixa de entrada de <strong>{email}</strong> e clique no link mágico para entrar.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleEmailLogin}
      className="p-6 rounded-xl flex flex-col gap-4"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          Seu melhor e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="exemplo@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg outline-none transition-colors"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)"
          }}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          Senha (Obrigatória para Cadastro)
        </label>
        <input
          id="password"
          type="password"
          placeholder="Sua senha secreta"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg outline-none transition-colors"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)"
          }}
        />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          {isSignUp 
            ? "Crie uma senha de pelo menos 6 caracteres." 
            : "Deixe em branco para usar o Link Mágico (sem senha)."}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "var(--accent)",
          color: "white",
        }}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Mail size={20} />
        )}
        <span>
          {loading 
            ? "Aguarde..." 
            : isSignUp 
              ? "Criar Conta"
              : password 
                ? "Entrar com Senha" 
                : "Receber Link Mágico"}
        </span>
      </button>

      {/* Toggle entre Login e Cadastro */}
      <div className="text-center mt-2">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-medium hover:underline transition-colors"
          style={{ color: "var(--accent)" }}
        >
          {isSignUp 
            ? "Já tem uma conta? Faça Login" 
            : "Não tem conta? Cadastre-se com senha"}
        </button>
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }}></div>
        <span className="flex-shrink-0 mx-4 text-xs" style={{ color: "var(--text-muted)" }}>OU</span>
        <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }}></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5 border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "var(--bg-primary)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        <span>{loading ? "Aguarde..." : "Entrar com Google"}</span>
      </button>
    </form>
  );
}
