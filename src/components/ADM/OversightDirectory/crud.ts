import type { PaginatedResult } from "@/lib/pagination";

export const oversightRecords = {
  "alertas-fiscalizacao": {
    base: "/adm/alertas-bloqueios", name: "alerta", status: "statusAlerta", description: "descricao", descriptionLabel: "Descrição",
  },
  "bloqueios-repasse": {
    base: "/adm/alertas-bloqueios/bloqueios", name: "bloqueio de repasse", status: "statusBloqueio", description: "motivoBloqueio", descriptionLabel: "Motivo do bloqueio",
  },
  "processos-regularizacao": {
    base: "/adm/regularizacao", name: "processo de regularização", status: "statusProcesso", description: "descricaoJustificativa", descriptionLabel: "Justificativa",
  },
} as const;

export type OversightResource = keyof typeof oversightRecords;
export type StaffRole = "ADMIN" | "FISCAL" | "GESTOR";
export type OversightFormRoute = { resource: OversightResource; id?: number };

export function canWriteOversight(resource: OversightResource, role: StaffRole) {
  return role === "ADMIN" || resource === "processos-regularizacao" ||
    (resource === "alertas-fiscalizacao" ? role === "FISCAL" : role === "GESTOR");
}

export async function oversightRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/${path}`, { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? "Não foi possível concluir a operação.");
  }
  return data as T;
}

export async function loadOversightOptions<T>(resource: string, token: string, signal: AbortSignal): Promise<T[]> {
  const first = await oversightRequest<PaginatedResult<T>>(`${resource}?page=1&pageSize=100`, token, { signal });
  const records = [...first.data];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const result = await oversightRequest<PaginatedResult<T>>(`${resource}?page=${page}&pageSize=100`, token, { signal });
    records.push(...result.data);
  }
  return records;
}
