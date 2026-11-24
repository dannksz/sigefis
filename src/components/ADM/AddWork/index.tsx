"use client";

import { ArrowLeft, Check, Landmark, MapPin, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import AdminTemplate from "@/templates/AdminTemplate";
import type { OrgaoPublicoResponseDTO } from "@/types/orgao-publico";
import { consultarCep } from "@/services/cep.service";
import { formatCep } from "@/lib/input-masks";
import type { CidadeResponseDTO } from "@/types/cidade";
import type { EnderecoResponseDTO } from "@/types/endereco";
import type { EstadoResponseDTO } from "@/types/estado";
import type { ProjetoResponseDTO } from "@/types/projeto";
import type { UserRole } from "@/types/user";

type Auth = { user: { id: number; nome: string; email: string; role: UserRole }; token: string };
type WorkForm = { nome: string; finalidade: string; descricao: string; dataConclusao: string };
type AddressForm = { estadoId: string; cidade: string; cep: string; logradouro: string; numero: string; bairro: string; complemento: string };

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sigefis-auth", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sigefis-auth", callback);
  };
}
function getSnapshot() {
  const storage = localStorage.getItem("sigefis_user") ? localStorage : sessionStorage;
  return `${storage.getItem("sigefis_user") ?? ""}\u0000${storage.getItem("sigefis_token") ?? ""}`;
}
function getServerSnapshot() { return "\u0000"; }
function parseAuth(value: string): Auth | null {
  const separator = value.indexOf("\u0000");
  try {
    const user = JSON.parse(value.slice(0, separator)) as Auth["user"];
    const token = value.slice(separator + 1);
    return user.nome && token ? { user, token } : null;
  } catch { return null; }
}
async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init?.headers },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Não foi possível concluir a operação.";
    throw new Error(response.status === 401 ? "SESSION_EXPIRED" : message);
  }
  return data as T;
}
async function fetchAll<T>(path: string, token: string) {
  const first = await requestJson<{ data: T[]; pagination: { totalPages: number } }>(`${path}?page=1&pageSize=100`, token);
  const items = [...first.data];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    items.push(...(await requestJson<{ data: T[] }>(`${path}?page=${page}&pageSize=100`, token)).data);
  }
  return items;
}
export default function AddWork({ workId }: { workId?: number }) {
  const router = useRouter();
  const authValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const auth = useMemo(() => parseAuth(authValue), [authValue]);
  const [states, setStates] = useState<EstadoResponseDTO[]>([]);
  const [orgaos, setOrgaos] = useState<OrgaoPublicoResponseDTO[]>([]);
  const [orgaoId, setOrgaoId] = useState("");
  const [publication, setPublication] = useState<{ current: boolean; initial: boolean; hadAgency: boolean }>();
  const [work, setWork] = useState<WorkForm>({ nome: "", finalidade: "", descricao: "", dataConclusao: "" });
  const [address, setAddress] = useState<AddressForm>({ estadoId: "", cidade: "", cep: "", logradouro: "", numero: "", bairro: "", complemento: "" });
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cepMessage, setCepMessage] = useState("");
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const isEditing = workId !== undefined;

  const logout = useCallback(() => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("sigefis_token");
      storage.removeItem("sigefis_user");
    }
    window.dispatchEvent(new Event("sigefis-auth"));
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!auth) { router.replace("/login"); return; }
    if (auth.user.role === "USER") { router.replace("/"); return; }
    if (auth.user.role === "FISCAL") { router.replace("/adm/obras"); return; }
    let active = true;
    const load = async () => {
      const [stateItems, orgaoItems] = await Promise.all([
        fetchAll<EstadoResponseDTO>("/api/estados", auth.token),
        fetchAll<OrgaoPublicoResponseDTO>("/api/orgaos", auth.token),
      ]);
      if (!workId) return { stateItems, orgaoItems };
      const project = await requestJson<ProjetoResponseDTO>(`/api/projetos/${workId}`, auth.token);
      const projectAddress = await requestJson<EnderecoResponseDTO>(`/api/enderecos/${project.enderecoId}`, auth.token);
      const city = await requestJson<CidadeResponseDTO>(`/api/cidades/${projectAddress.cidadeId}`, auth.token);
      return { stateItems, orgaoItems, project, projectAddress, city };
    };
    load()
      .then(({ stateItems, orgaoItems, project, projectAddress, city }) => {
        if (!active) return;
        setOrgaos(orgaoItems.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setStates(stateItems.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        if (project && projectAddress && city) {
          setOrgaoId(project.orgaoResponsavelId?.toString() ?? "");
          setPublication({ current: project.publicado, initial: project.publicado, hadAgency: project.orgaoResponsavelId != null });
          setWork({ nome: project.nome, finalidade: project.finalidade, descricao: project.descricao, dataConclusao: project.dataConclusao ?? "" });
          setAddress({
            estadoId: String(city.estadoId),
            cidade: city.nome,
            cep: formatCep(projectAddress.cep),
            logradouro: projectAddress.logradouro,
            numero: projectAddress.numero,
            bairro: projectAddress.bairro,
            complemento: projectAddress.complemento ?? "",
          });
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof Error && reason.message === "SESSION_EXPIRED") logout();
        else setError(reason instanceof Error ? reason.message : "Erro ao carregar estados.");
      })
      .finally(() => { if (active) setLoadingLocations(false); });
    return () => { active = false; };
  }, [auth, logout, router, workId]);

  useEffect(() => {
    const cep = address.cep.replace(/\D/g, "");
    if (cep.length !== 8 || !auth || states.length === 0) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLookingUpCep(true);
      setCepMessage("Consultando CEP...");
      consultarCep(cep, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          const state = states.find((item) => item.sigla.toUpperCase() === result.uf.toUpperCase());
          setAddress((current) => current.cep.replace(/\D/g, "") !== cep ? current : {
            ...current,
            estadoId: state ? String(state.id) : current.estadoId,
            cidade: result.cidade || current.cidade,
            logradouro: result.logradouro || current.logradouro,
            bairro: result.bairro || current.bairro,
            complemento: current.complemento || result.complemento,
          });
          setCepMessage(
            state && result.cidade
              ? "Endereço localizado. Confira o número e os demais dados."
              : "CEP localizado, mas não foi possível identificar estado e cidade.",
          );
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setCepMessage(reason instanceof Error ? `${reason.message} Preencha manualmente.` : "Não foi possível consultar o CEP. Preencha manualmente.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLookingUpCep(false);
        });
    }, 450);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address.cep, auth, logout, states]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || saving) return;
    setSaving(true);
    setError("");
    try {
      await requestJson<ProjetoResponseDTO>(isEditing ? `/api/projetos/${workId}` : "/api/projetos", auth.token, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify({
          ...((orgaoId || !publication?.initial || publication.hadAgency || !publication.current) && {
            orgaoResponsavelId: orgaoId ? Number(orgaoId) : null,
          }),
          ...(auth.user.role === "ADMIN" && publication && publication.current !== publication.initial && { publicado: publication.current }),
          nome: work.nome.trim(),
          finalidade: work.finalidade.trim(),
          descricao: work.descricao.trim(),
          ...(work.dataConclusao && { dataConclusao: work.dataConclusao }),
          endereco: {
            logradouro: address.logradouro.trim(),
            numero: address.numero.trim(),
            bairro: address.bairro.trim(),
            cep: address.cep,
            cidade: { nome: address.cidade.trim(), estadoId: Number(address.estadoId) },
            ...(address.complemento.trim() && { complemento: address.complemento.trim() }),
          },
        }),
      });
      router.push("/adm/obras");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : `Erro ao ${isEditing ? "alterar" : "cadastrar"} obra.`);
      setSaving(false);
    }
  }

  if (!auth || auth.user.role === "USER" || auth.user.role === "FISCAL") {
    return <main className="grid min-h-dvh place-items-center bg-[#eef0f5]"><p>Redirecionando...</p></main>;
  }
  const role = auth.user.role;
  const fieldClass = "mt-1.5 w-full rounded-lg border border-[#9eabd0] bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-60";

  return (
    <AdminTemplate user={{ nome: auth.user.nome, role }} onLogout={logout}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-3">{isEditing ? <Pencil className="size-8 text-blue-800" aria-hidden="true" /> : <Plus className="size-8 text-blue-800" aria-hidden="true" />}<h1 className="text-3xl font-bold md:text-4xl">{isEditing ? "Alterar obra pública" : "Adicionar obra pública"}</h1></header>
        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm md:p-8">
          {error && <div role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
          <section aria-labelledby="general-data-title">
            <h2 id="general-data-title" className="mb-6 flex items-center gap-2 text-xl font-bold"><Landmark className="size-5 text-blue-800" aria-hidden="true" /> Dados gerais da obra</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm font-medium">Nome da obra <span className="text-red-600">*</span><input value={work.nome} onChange={(event) => setWork((current) => ({ ...current, nome: event.target.value }))} required maxLength={45} disabled={saving} className={fieldClass} /></label>
              <label className="text-sm font-medium">Finalidade <span className="text-red-600">*</span><input value={work.finalidade} onChange={(event) => setWork((current) => ({ ...current, finalidade: event.target.value }))} required maxLength={45} disabled={saving} className={fieldClass} placeholder="Ex.: Infraestrutura urbana" /></label>
              <label className="text-sm font-medium md:col-span-2">Descrição <span className="text-red-600">*</span><textarea value={work.descricao} onChange={(event) => setWork((current) => ({ ...current, descricao: event.target.value }))} required maxLength={250} rows={5} disabled={saving} className={`${fieldClass} resize-y`} placeholder="Descreva o objetivo, o escopo e as principais entregas da obra..." /></label>
              <label className="text-sm font-medium">Conclusão prevista<input type="date" value={work.dataConclusao} onChange={(event) => setWork((current) => ({ ...current, dataConclusao: event.target.value }))} disabled={saving} className={fieldClass} /></label>
            </div>
          </section>

          <section className="mt-9 border-t border-[#d8dce5] pt-8">
            <h2 className="mb-4 text-xl font-bold">Órgão responsável</h2>
            <label className="block text-sm font-medium">Órgão público
              <select className={fieldClass} value={orgaoId} onChange={(event) => setOrgaoId(event.target.value)}
                disabled={saving || loadingLocations} required={publication?.current && (!publication.initial || publication.hadAgency)}>
                <option value="">Sem órgão vinculado</option>
                {orgaos.map((orgao) => <option key={orgao.id} value={orgao.id}>{orgao.nome} ({orgao.sigla})</option>)}
              </select>
            </label>
            <p className="mt-2 text-sm text-gray-600">Obrigatório para publicar a obra.</p>
            {role === "ADMIN" && publication && (
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={publication.current} disabled={saving}
                  onChange={(event) => setPublication({ ...publication, current: event.target.checked })} />
                Publicar obra no portal
              </label>
            )}
          </section>
          <section className="mt-9 border-t border-[#d8dce5] pt-8" aria-labelledby="location-title">
            <h2 id="location-title" className="mb-6 flex items-center gap-2 text-xl font-bold"><MapPin className="size-5 text-blue-800" aria-hidden="true" /> Localização completa</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-sm font-medium">Estado <span className="text-red-600">*</span><select value={address.estadoId} onChange={(event) => setAddress((current) => ({ ...current, estadoId: event.target.value }))} required disabled={saving || loadingLocations} className={fieldClass}><option value="">{loadingLocations ? "Carregando estados..." : "Selecione o estado"}</option>{states.map((state) => <option key={state.id} value={state.id}>{state.nome} ({state.sigla})</option>)}</select></label>
              <label className="text-sm font-medium">Cidade <span className="text-red-600">*</span><input value={address.cidade} onChange={(event) => setAddress((current) => ({ ...current, cidade: event.target.value }))} required maxLength={100} disabled={saving} className={fieldClass} placeholder="Digite a cidade" /></label>
              <label className="text-sm font-medium">CEP <span className="text-red-600">*</span><input inputMode="numeric" value={address.cep} onChange={(event) => { const cep = formatCep(event.target.value); setAddress((current) => ({ ...current, cep })); if (cep.replace(/\D/g, "").length < 8) { setCepMessage(""); setLookingUpCep(false); } }} required pattern="\d{5}-?\d{3}" maxLength={9} disabled={saving} aria-describedby="cep-feedback" className={fieldClass} placeholder="00000-000" /><span id="cep-feedback" aria-live="polite" className={`mt-2 block text-xs ${cepMessage.startsWith("Endereço localizado") ? "text-green-700" : "text-[#596174]"}`}>{lookingUpCep ? "Consultando CEP..." : cepMessage}</span></label>
              <label className="text-sm font-medium">Bairro <span className="text-red-600">*</span><input value={address.bairro} onChange={(event) => setAddress((current) => ({ ...current, bairro: event.target.value }))} required maxLength={45} disabled={saving} className={fieldClass} /></label>
              <label className="text-sm font-medium md:col-span-2">Logradouro <span className="text-red-600">*</span><input value={address.logradouro} onChange={(event) => setAddress((current) => ({ ...current, logradouro: event.target.value }))} required maxLength={191} disabled={saving} className={fieldClass} placeholder="Rua, avenida, estrada..." /></label>
              <label className="text-sm font-medium">Número <span className="text-red-600">*</span><input value={address.numero} onChange={(event) => setAddress((current) => ({ ...current, numero: event.target.value }))} required maxLength={10} disabled={saving} className={fieldClass} placeholder="Ex.: 100 ou S/N" /></label>
              <label className="text-sm font-medium">Complemento<input value={address.complemento} onChange={(event) => setAddress((current) => ({ ...current, complemento: event.target.value }))} maxLength={45} disabled={saving} className={fieldClass} placeholder="Opcional" /></label>
            </div>
          </section>

          <div className="mt-9 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{isEditing ? "Os dados gerais e o endereço serão atualizados juntos. Os demais vínculos da obra não serão alterados." : "O endereço e a obra serão cadastrados juntos. A obra será criada como não publicada; contratos, cronograma, recursos e publicação serão vinculados posteriormente."}</div>
          <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-[#d8dce5] pt-6 sm:flex-row">
            <Link href="/adm/obras" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 font-semibold text-white transition-colors hover:bg-red-700"><ArrowLeft className="size-4" aria-hidden="true" /> Cancelar</Link>
            <button type="submit" disabled={saving || loadingLocations || states.length === 0} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-600 px-7 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400">{saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar obra"}<Check className="size-4" aria-hidden="true" /></button>
          </div>
        </form>
      </div>
    </AdminTemplate>
  );
}
