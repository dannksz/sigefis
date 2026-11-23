"use client";

import { AlertTriangle, BriefcaseBusiness, ClipboardCheck, Gauge, Landmark, ShieldCheck, UserCheck, Users, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import AdminTemplate from "@/templates/AdminTemplate";
import type { CidadeResponseDTO } from "@/types/cidade";
import type { ContratoResponseDTO } from "@/types/contrato";
import type { EnderecoResponseDTO } from "@/types/endereco";
import type { EstadoResponseDTO } from "@/types/estado";
import type { LiberacaoRecursoResponseDTO } from "@/types/liberacao-recurso";
import type { PagamentoResponseDTO } from "@/types/pagamento";
import type { ProjetoResponseDTO } from "@/types/projeto";
import type { ProjetoVerbaResponseDTO } from "@/types/projeto-verba";
import type { UserRole } from "@/types/user";

type InternalRole = Exclude<UserRole, "USER">;
type AuthState = { user: { nome: string; email: string; role: UserRole }; token: string };
type ChartDatum = { label: string; value: number };
type Metric = { key: string; label: string; icon: typeof Landmark; color: string; roles: InternalRole[] };

const metricsConfig: Metric[] = [
  { key: "obras", label: "Total de obras", icon: Landmark, color: "bg-blue-100 text-blue-700", roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { key: "contratos", label: "Contratos", icon: BriefcaseBusiness, color: "bg-amber-100 text-amber-700", roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { key: "fiscalizacoes", label: "Fiscalizações", icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-700", roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { key: "alertas", label: "Alertas", icon: AlertTriangle, color: "bg-red-100 text-red-700", roles: ["ADMIN", "GESTOR", "FISCAL"] },
  { key: "liberacoes", label: "Liberações", icon: WalletCards, color: "bg-cyan-100 text-cyan-700", roles: ["ADMIN", "GESTOR"] },
  { key: "pagamentos", label: "Pagamentos", icon: WalletCards, color: "bg-indigo-100 text-indigo-700", roles: ["ADMIN", "GESTOR"] },
  { key: "administradores", label: "Administradores", icon: ShieldCheck, color: "bg-violet-100 text-violet-700", roles: ["ADMIN"] },
  { key: "fiscais", label: "Fiscais", icon: UserCheck, color: "bg-orange-100 text-orange-700", roles: ["ADMIN"] },
  { key: "gestores", label: "Gestores", icon: Users, color: "bg-fuchsia-100 text-fuchsia-700", roles: ["ADMIN"] },
  { key: "usuarios", label: "Usuários", icon: Users, color: "bg-green-100 text-green-700", roles: ["ADMIN"] },
];

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("sigefis-auth", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("sigefis-auth", callback); };
}
function getSnapshot() { const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage; return `${storage.getItem("sigefis_user") ?? ""}\u0000${storage.getItem("sigefis_token") ?? ""}`; }
function getServerSnapshot() { return "\u0000"; }
function parseAuth(snapshot: string): AuthState | null {
  const separator = snapshot.indexOf("\u0000"); const userText = snapshot.slice(0, separator); const token = snapshot.slice(separator + 1);
  if (!userText || !token) return null;
  try { const user = JSON.parse(userText) as AuthState["user"]; return user.nome && ["ADMIN", "GESTOR", "FISCAL", "USER"].includes(user.role) ? { user, token } : null; } catch { return null; }
}
async function fetchPage(path: string, token: string, pageSize = 1, page = 1) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 401 ? "SESSION_EXPIRED" : "LOAD_FAILED");
  const value: unknown = await response.json();
  if (!value || typeof value !== "object" || !("data" in value) || !("pagination" in value) || !Array.isArray(value.data)) throw new Error("LOAD_FAILED");
  return value as { data: unknown[]; pagination: { total: number; totalPages: number } };
}
async function fetchTotal(path: string, token: string) { return (await fetchPage(path, token)).pagination.total; }
async function fetchAll<T>(path: string, token: string): Promise<T[]> {
  const first = await fetchPage(path, token, 100); const items = [...first.data] as T[];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) items.push(...(await fetchPage(path, token, 100, page)).data as T[]);
  return items;
}
function groupCounts(values: string[]): ChartDatum[] {
  const counts = new Map<string, number>(); values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "pt-BR"));
}
function sum<T>(items: T[], field: keyof T) { return items.reduce((total, item) => total + Number(item[field] ?? 0), 0); }

export default function AdminDashboard() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const auth = useMemo(() => parseAuth(snapshot), [snapshot]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [regions, setRegions] = useState<ChartDatum[]>([]);
  const [states, setStates] = useState<ChartDatum[]>([]);
  const [financial, setFinancial] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    for (const storage of [localStorage, sessionStorage]) { storage.removeItem("sigefis_token"); storage.removeItem("sigefis_user"); }
    window.dispatchEvent(new Event("sigefis-auth")); router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.user.role === "USER") { router.replace("/"); return; }
    let active = true;
    const countRequests: [string, string][] = [
      ["obras", "/api/projetos"], ["contratos", "/api/contratos"], ["fiscalizacoes", "/api/fiscalizacoes"], ["alertas", "/api/alertas-fiscalizacao"],
    ];
    if (auth.user.role !== "FISCAL") countRequests.push(["liberacoes", "/api/liberacoes-recursos"], ["pagamentos", "/api/pagamentos"]);
    if (auth.user.role === "ADMIN") countRequests.push(
      ["administradores", "/api/users?role=ADMIN"], ["fiscais", "/api/users?role=FISCAL"], ["gestores", "/api/users?role=GESTOR"], ["usuarios", "/api/users?role=USER"],
    );
    const chartRequest = Promise.all([
      fetchAll<ProjetoResponseDTO>("/api/projetos", auth.token), fetchAll<EnderecoResponseDTO>("/api/enderecos", auth.token),
      fetchAll<CidadeResponseDTO>("/api/cidades", auth.token), fetchAll<EstadoResponseDTO>("/api/estados", auth.token),
      fetchAll<ProjetoVerbaResponseDTO>("/api/projetos-verbas", auth.token), fetchAll<ContratoResponseDTO>("/api/contratos", auth.token),
      fetchAll<LiberacaoRecursoResponseDTO>("/api/liberacoes-recursos", auth.token), fetchAll<PagamentoResponseDTO>("/api/pagamentos", auth.token),
    ]).then(([works, addresses, cities, stateRecords, allocations, contracts, releases, payments]) => {
      const addressMap = new Map(addresses.map((item) => [item.id, item])); const cityMap = new Map(cities.map((item) => [item.id, item])); const stateMap = new Map(stateRecords.map((item) => [item.id, item]));
      const workStates = works.flatMap((work) => { const address = addressMap.get(work.enderecoId); const city = address && cityMap.get(address.cidadeId); const state = city && stateMap.get(city.estadoId); return state ? [state] : []; });
      return {
        regions: groupCounts(workStates.map((state) => state.regiao)), states: groupCounts(workStates.map((state) => `${state.nome} (${state.sigla})`)),
        financial: [
          { label: "Valor alocado", value: sum(allocations, "valorAlocado") }, { label: "Valor contratado", value: sum(contracts, "valorContrato") },
          { label: "Recursos liberados", value: sum(releases.filter((item) => item.status === "APROVADA"), "valorLiberacao") },
          { label: "Pagamentos realizados", value: sum(payments.filter((item) => item.status === "APROVADA"), "valorPagamento") },
        ],
      };
    });
    Promise.all([Promise.all(countRequests.map(async ([key, path]) => [key, await fetchTotal(path, auth.token)] as const)), chartRequest])
      .then(([entries, charts]) => { if (active) { setMetrics(Object.fromEntries(entries)); setRegions(charts.regions); setStates(charts.states); setFinancial(charts.financial); } })
      .catch((reason: unknown) => { if (active) { if (reason instanceof Error && reason.message === "SESSION_EXPIRED") logout(); else setError("Não foi possível carregar todos os indicadores do painel."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auth, logout, router]);

  if (!auth || auth.user.role === "USER") return <main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Redirecionando...</p></main>;
  const role = auth.user.role; const visibleMetrics = metricsConfig.filter((metric) => metric.roles.includes(role));
  const maxLocation = Math.max(1, ...regions.map((item) => item.value), ...states.map((item) => item.value));
  const maxFinancial = Math.max(1, ...financial.map((item) => item.value));
  const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <AdminTemplate user={{ nome: auth.user.nome, role }} onLogout={logout}>
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8"><div className="flex items-center gap-3"><Gauge className="size-8" aria-hidden="true" /><h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1></div><p className="mt-2 text-[#4d5565]">Painel de controle e indicadores do SIGEFIS.</p></header>
        {error && <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
        <section aria-label="Indicadores gerais" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {visibleMetrics.map((metric) => { const Icon = metric.icon; return <article key={metric.key} className="flex min-h-32 items-center justify-between rounded-xl bg-white p-6 shadow-sm"><div><h2 className="text-sm text-[#4d5565]">{metric.label}</h2><p className="mt-2 text-3xl font-bold">{loading ? "—" : (metrics[metric.key] ?? 0).toLocaleString("pt-BR")}</p></div><div className={`grid size-14 place-items-center rounded-full ${metric.color}`}><Icon className="size-7" aria-hidden="true" /></div></article>; })}
        </section>
        <section className="mt-7 grid gap-6 xl:grid-cols-2" aria-label="Gráficos administrativos">
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Obras por localização</h2><p className="mt-1 text-sm text-[#666]">Quantidade de obras cadastradas por região e estado.</p>
            <div className="mt-7 grid gap-7 2xl:grid-cols-2">
              <BarGroup title="Regiões" data={regions} max={maxLocation} loading={loading} color="bg-primary" empty="Nenhuma região cadastrada." />
              <BarGroup title="Estados" data={states} max={maxLocation} loading={loading} color="bg-secondary-light" empty="Nenhum estado cadastrado." scroll />
            </div>
          </article>
          <article className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Execução financeira</h2><p className="mt-1 text-sm text-[#666]">Comparação entre recursos previstos e efetivamente movimentados.</p>
            <div className="mt-7 space-y-6">{financial.map((item, index) => <div key={item.label}><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span>{item.label}</span><strong>{currency.format(item.value)}</strong></div><div className="h-5 overflow-hidden rounded-full bg-[#e8eaf0]"><div className={`h-full rounded-full transition-[width] duration-700 ${["bg-primary", "bg-blue-600", "bg-emerald-500", "bg-violet-600"][index]}`} style={{ width: loading ? "0%" : `${Math.max(item.value / maxFinancial * 100, item.value ? 4 : 0)}%` }} /></div></div>)}</div>
            <div className="mt-8 rounded-lg bg-[#f5f6f8] p-4 text-sm text-[#555]">Liberações e pagamentos consideram somente registros aprovados.</div>
          </article>
        </section>
      </div>
    </AdminTemplate>
  );
}

function BarGroup({ title, data, max, loading, color, empty, scroll = false }: { title: string; data: ChartDatum[]; max: number; loading: boolean; color: string; empty: string; scroll?: boolean }) {
  return <div><h3 className="mb-4 font-bold">{title}</h3><div className={`space-y-4 ${scroll ? "max-h-64 overflow-y-auto pr-2" : ""}`}>{data.map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between gap-4 text-sm"><span>{item.label}</span><strong>{item.value}</strong></div><div className="h-4 overflow-hidden rounded-full bg-[#e8eaf0]"><div className={`h-full rounded-full transition-[width] duration-700 ${color}`} style={{ width: loading ? "0%" : `${Math.max(item.value / max * 100, 5)}%` }} /></div></div>)}{!loading && data.length === 0 && <p className="text-sm text-[#666]">{empty}</p>}</div></div>;
}
