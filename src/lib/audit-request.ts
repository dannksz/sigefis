import prisma from "@/lib/prisma";
import { snapshotAuditWork } from "@/lib/audit-work";

const resourceNames: Record<string, string> = {
  estados: "estado",
  cidades: "cidade",
  enderecos: "endereco",
  orgaos: "orgao_publico",
  empresas: "empresa",
  projetos: "projeto_obra",
  contratos: "contrato",
  "verbas-publicas": "verba_publica",
  "emendas-parlamentares": "emenda_parlamentar",
  "projetos-verbas": "projeto_verba",
  "etapas-cronograma": "etapa_cronograma",
  "obras-fiscais": "obra_fiscal",
  fiscalizacoes: "fiscalizacao",
  "evidencias-fiscalizacao": "evidencia_fiscalizacao",
  "liberacoes-recursos": "liberacao_recurso",
  pagamentos: "pagamento",
  "contas-bancarias": "conta_bancaria",
  "alertas-fiscalizacao": "alerta_fiscalizacao",
  "bloqueios-repasse": "bloqueio_repasse",
  "processos-regularizacao": "processo_regularizacao",
  "decisoes-financeiras": "decisao_financeira",
  "revisoes-fiscalizacao": "revisao_fiscalizacao",
  "logs-auditoria": "log_auditoria",
};

export function getAuditResource(pathname: string): {
  tabelaAfetada: string;
  registroId: number;
} {
  const segments = pathname.split("/").filter(Boolean);
  const resource = segments[1] ?? "unknown";
  const parsedId = Number(segments[2]);
  return {
    tabelaAfetada: resourceNames[resource] ?? resource,
    registroId: Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0,
  };
}

export async function auditSuccess(input: {
  acao: string;
  pathname: string;
  usuarioId: number;
  ipOrigem: string;
  registroId?: number;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  const resource = getAuditResource(input.pathname);
  const registroId = input.registroId ?? resource.registroId;
  const work = input.detalhes?.obraNome || registroId <= 0
    ? undefined
    : await snapshotAuditWork(resource.tabelaAfetada, registroId);
  await prisma.log_auditoria.create({
    data: {
      acao: input.acao,
      tabelaAfetada: resource.tabelaAfetada,
      registroId,
      detalhes: JSON.stringify({
        tipo: "operation_completed",
        status: "success",
        rota: input.pathname,
        ...work,
        ...(input.detalhes ?? {}),
      }),
      ipOrigem: input.ipOrigem,
      usuarioId: input.usuarioId,
    },
  });
}

export async function auditRequestSuccess(
  request: Request,
  acao: string,
  registroId?: number,
  detalhes?: Record<string, unknown>,
): Promise<void> {
  const usuarioId = Number(request.headers.get("x-auth-user-id"));
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return;
  }

  await auditSuccess({
    acao,
    pathname: new URL(request.url).pathname,
    usuarioId,
    ipOrigem: request.headers.get("x-auth-client-ip") || "unknown",
    registroId,
    detalhes,
  }).catch((error: unknown) =>
    console.error(`Erro ao auditar ${acao}:`, error),
  );
}

export async function auditFailedLogin(ipOrigem: string): Promise<void> {
  await prisma.log_auditoria.create({
    data: {
      acao: "LOGIN_FALHOU",
      tabelaAfetada: "usuario",
      registroId: 0,
      detalhes: JSON.stringify({
        status: "failure",
        motivo: "credenciais_invalidas",
        rota: "/api/auth/login",
      }),
      ipOrigem,
      usuarioId: null,
    },
  });
}
