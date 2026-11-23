"use client";

import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

type StoredUser = { nome: string; email: string; role: string };

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sigefis-auth", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sigefis-auth", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem("sigefis_user") ?? sessionStorage.getItem("sigefis_user") ?? "";
}

function getServerSnapshot() {
  return "";
}

function parseUser(value: string): StoredUser | null {
  if (!value) return null;
  try {
    const user: unknown = JSON.parse(value);
    if (user && typeof user === "object" && "nome" in user && typeof user.nome === "string") return user as StoredUser;
  } catch {
    return null;
  }
  return null;
}

export default function AuthMenu() {
  const router = useRouter();
  const storedUser = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => parseUser(storedUser), [storedUser]);

  function logout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("sigefis_token");
      storage.removeItem("sigefis_user");
    }
    window.dispatchEvent(new Event("sigefis-auth"));
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link href="/login" aria-label="Entrar no SIGEFIS" className="portal-account">
        <UserRound size={19} fill="currentColor" strokeWidth={2.3} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button type="button" aria-haspopup="menu" aria-label={`Menu de ${user.nome}`} className="portal-account cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
        <UserRound size={19} fill="currentColor" strokeWidth={2.3} aria-hidden="true" />
      </button>
      <div role="menu" className="invisible absolute left-1/2 top-[calc(100%+8px)] z-50 min-w-52 -translate-x-1/2 translate-y-1 rounded-lg border border-[#c8c8c8] bg-white p-2 opacity-0 shadow-lg transition-all duration-300 before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:content-[''] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="border-b border-[#dedede] px-3 py-2">
          <p className="truncate text-sm font-bold text-secondary">{user.nome}</p>
          <p className="mt-0.5 truncate text-xs text-[#666]">{user.email}</p>
        </div>
        {user.role !== "USER" && (
          <Link href="/adm" role="menuitem" className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-secondary transition-colors duration-300 hover:bg-ice focus-visible:bg-ice focus-visible:outline-none">
            <LayoutDashboard size={16} aria-hidden="true" /> Acessar painel administrativo
          </Link>
        )}
        <button type="button" role="menuitem" onClick={logout} className="mt-1 flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-left text-sm text-secondary transition-colors duration-300 hover:bg-ice hover:text-red-600 focus-visible:bg-ice focus-visible:text-red-600 focus-visible:outline-none">
          <LogOut size={16} aria-hidden="true" /> Deslogar
        </button>
      </div>
    </div>
  );
}
