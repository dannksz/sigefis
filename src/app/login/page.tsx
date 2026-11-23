"use client";

import { ArrowLeft, Lock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserResponseDTO } from "@/types/user";

type LoginResponse = {
  message: string;
  token: string;
  user: UserResponseDTO;
};

function isLoginResponse(value: unknown): value is LoginResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.token === "string" && typeof data.user === "object" && data.user !== null;
}

function apiError(value: unknown) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
  return "Não foi possível realizar o login. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLocaleLowerCase("pt-BR"), senha: password }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isLoginResponse(data)) {
        setError(apiError(data));
        return;
      }

      const selectedStorage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("sigefis_token");
      otherStorage.removeItem("sigefis_user");
      selectedStorage.setItem("sigefis_token", data.token);
      selectedStorage.setItem("sigefis_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("sigefis-auth"));
      router.replace("/");
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="flex min-h-[500px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl lg:h-[600px] lg:flex-row">
        <section className="hidden w-[65%] flex-col justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-14 text-white lg:flex" aria-labelledby="welcome-title">
          <Link href="/" className="mb-14 inline-flex w-fit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Voltar para a página inicial do SIGEFIS">
            <Image src="/images/logomarca-white.png" alt="SIGEFIS" width={780} height={126} unoptimized className="h-auto w-36" />
          </Link>
          <h1 id="welcome-title" className="mb-6 text-5xl font-bold leading-tight xl:text-6xl">Bem-vindo de volta!</h1>
          <p className="w-[85%] text-xl leading-relaxed xl:text-2xl">Acesse o ambiente interno para gerenciar, fiscalizar e acompanhar as obras públicas.</p>
        </section>

        <section className="flex w-full flex-col justify-center bg-white px-8 py-12 md:px-12 lg:w-[35%]" aria-labelledby="login-title">
          <Link href="/" className="mb-8 inline-flex w-fit items-center gap-2 text-sm text-gray-700 transition-colors hover:text-secondary lg:hidden"><ArrowLeft size={17} aria-hidden="true" /> Voltar ao portal</Link>
          <h2 id="login-title" className="mb-6 text-3xl font-bold text-gray-800 md:mb-10 md:text-4xl lg:text-5xl">Entrar</h2>

          {error && <div role="alert" aria-live="assertive" className="mb-4 rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label htmlFor="login-email" className="sr-only">E-mail</label>
              <User className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input id="login-email" name="email" type="email" autoComplete="email" placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={191} disabled={loading} className="h-14 w-full rounded-2xl border-2 border-gray-300 py-2 pl-12 pr-4 text-lg text-gray-700 outline-none transition-colors duration-300 placeholder:text-gray-400 focus:border-primary-dark focus:shadow-sm disabled:cursor-wait disabled:opacity-70" />
            </div>

            <div className="relative">
              <label htmlFor="login-password" className="sr-only">Senha</label>
              <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input id="login-password" name="senha" type="password" autoComplete="current-password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} className="h-14 w-full rounded-2xl border-2 border-gray-300 py-2 pl-12 pr-4 text-lg text-gray-700 outline-none transition-colors duration-300 placeholder:text-gray-400 focus:border-primary-dark focus:shadow-sm disabled:cursor-wait disabled:opacity-70" />
            </div>

            <div className="flex flex-col items-start justify-between gap-2 text-sm sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={loading} className="size-4 cursor-pointer accent-secondary" />
                <span className="text-gray-700">Lembrar-me</span>
              </label>
              <Link href="/" className="text-gray-700 underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current">Voltar ao portal</Link>
            </div>

            <button type="submit" disabled={loading} className="mt-6 h-12 w-full cursor-pointer rounded-2xl bg-secondary text-xl font-semibold tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary-light hover:shadow-md active:translate-y-0 disabled:cursor-wait disabled:bg-gray-400 disabled:shadow-none md:mt-8 md:h-14 md:text-2xl">
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="mt-4 text-center text-sm text-gray-700">
              Novo aqui?&nbsp;
              <Link href="/cadastro" className="font-semibold text-blue-600 transition-colors hover:text-blue-800">Crie uma conta</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
