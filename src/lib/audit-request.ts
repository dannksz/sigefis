import prisma from "@/lib/prisma";

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
};

function getResource(pathname: string): { table: string; registroId: number } {
  const segments = pathname.split("/").filter(Boolean);
  const resource = segments[1] ?? "unknown";
  const parsedId = Number(segments[2]);
  return {
    table: resourceNames[resource] ?? resource,
    registroId: Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0,
  };
}

export async function auditMutationRequest(input: {
  method: string;
  pathname: string;
  usuarioId: number;
  ipOrigem: string;
}): Promise<void> {
  const resource = getResource(input.pathname);
  await prisma.log_auditoria.create({
    data: {
      acao: `REQUEST_${input.method}`,
      tabelaAfetada: resource.table,
      registroId: resource.registroId,
      detalhes: JSON.stringify({
        tipo: "mutation_request",
        status: "accepted_by_authorization",
        rota: input.pathname,
      }),
      ipOrigem: input.ipOrigem,
      usuarioId: input.usuarioId,
    },
  });
}
