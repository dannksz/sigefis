import prisma from "@/lib/prisma";

const work = { select: { nome: true } } as const;
const linkedWork = { select: { projetoObra: work } } as const;

type Lookup = (ids: number[]) => Promise<{ id: number; nome: string }[]>;

const lookups = new Map<string, Lookup>([
  ["projeto_obra", (ids) => prisma.projeto_obra.findMany({
    where: { id: { in: ids } }, select: { id: true, nome: true },
  })],
  ["projeto_verba", async (ids) =>
    (await prisma.projeto_verba.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["etapa_cronograma", async (ids) =>
    (await prisma.etapa_cronograma.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["contrato", async (ids) =>
    (await prisma.contrato.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["obra_fiscal", async (ids) =>
    (await prisma.obra_fiscal.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["fiscalizacao", async (ids) =>
    (await prisma.fiscalizacao.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["conta_bancaria", async (ids) =>
    (await prisma.conta_bancaria.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["alerta_fiscalizacao", async (ids) =>
    (await prisma.alerta_fiscalizacao.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["bloqueio_repasse", async (ids) =>
    (await prisma.bloqueio_repasse.findMany({
      where: { id: { in: ids } }, select: { id: true, projetoObra: work },
    })).map((row) => ({ id: row.id, nome: row.projetoObra.nome }))],
  ["evidencia_fiscalizacao", async (ids) =>
    (await prisma.evidencia_fiscalizacao.findMany({
      where: { id: { in: ids } }, select: { id: true, fiscalizacao: linkedWork },
    })).map((row) => ({ id: row.id, nome: row.fiscalizacao.projetoObra.nome }))],
  ["revisao_fiscalizacao", async (ids) =>
    (await prisma.revisao_fiscalizacao.findMany({
      where: { id: { in: ids } }, select: { id: true, fiscalizacao: linkedWork },
    })).map((row) => ({ id: row.id, nome: row.fiscalizacao.projetoObra.nome }))],
  ["liberacao_recurso", async (ids) =>
    (await prisma.liberacao_recurso.findMany({
      where: { id: { in: ids } }, select: { id: true, etapaCronograma: linkedWork },
    })).map((row) => ({ id: row.id, nome: row.etapaCronograma.projetoObra.nome }))],
  ["pagamento", async (ids) =>
    (await prisma.pagamento.findMany({
      where: { id: { in: ids } }, select: { id: true, contrato: linkedWork },
    })).map((row) => ({ id: row.id, nome: row.contrato.projetoObra.nome }))],
  ["processo_regularizacao", async (ids) =>
    (await prisma.processo_regularizacao.findMany({
      where: { id: { in: ids } }, select: { id: true, bloqueioRepasse: linkedWork },
    })).map((row) => ({ id: row.id, nome: row.bloqueioRepasse.projetoObra.nome }))],
  ["decisao_financeira", async (ids) => {
    const decisions = await prisma.decisao_financeira.findMany({
      where: { id: { in: ids } },
      select: { id: true, tipoOperacao: true, operacaoId: true },
    });
    const results = await Promise.all(
      [["PAGAMENTO", "pagamento"], ["LIBERACAO", "liberacao_recurso"]].map(async ([type, table]) => {
        const entries = decisions.filter((decision) => decision.tipoOperacao === type);
        const names = await findAuditWorkNames(table, entries.map((entry) => entry.operacaoId));
        return entries.flatMap((entry) => {
          const nome = names.get(entry.operacaoId);
          return nome ? [{ id: entry.id, nome }] : [];
        });
      }),
    );
    return results.flat();
  }],
]);

export function hasAuditWorkLink(table: string): boolean {
  return lookups.has(table);
}

export async function findAuditWorkNames(table: string, ids: number[]): Promise<Map<number, string>> {
  const lookup = lookups.get(table);
  const rows = lookup && ids.length ? await lookup([...new Set(ids)]) : [];
  return new Map(rows.map(({ id, nome }) => [id, nome]));
}

export async function snapshotAuditWork(table: string, id: number): Promise<{ obraNome: string } | undefined> {
  try {
    const nome = (await findAuditWorkNames(table, [id])).get(id);
    return nome ? { obraNome: nome } : undefined;
  } catch (error) {
    console.error("Erro ao consultar a obra para a auditoria:", error);
    return undefined;
  }
}
