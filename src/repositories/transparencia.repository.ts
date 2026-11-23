import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface TransparenciaFilters {
  busca?: string;
  finalidade?: string;
  regiao?: string;
  estadoId?: number;
  cidadeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  conclusaoInicio?: Date;
  conclusaoFim?: Date;
  entregaInicio?: Date;
  entregaFim?: Date;
  status?: string;
  ordem?: "antiga" | "recente";
  buscaDetalhada?: boolean;
  page: number;
  pageSize: number;
}

const selecaoPublica = {
  id: true,
  nome: true,
  descricao: true,
  finalidade: true,
  dataConclusao: true,
  endereco: {
    select: { cidade: { select: { id: true, nome: true, estado: { select: { sigla: true, regiao: true } } } } },
  },
  projetosVerba: { select: { valorAlocado: true } },
  contratos: {
    select: {
      id: true, numeroContrato: true, valorContrato: true, dataInicio: true, dataFim: true,
      empresa: { select: { nome: true } },
    },
  },
  etapas: {
    orderBy: [{ ordemEtapa: "asc" }, { id: "asc" }],
    select: {
      id: true, nomeEtapa: true, status: true, dataInicioPrevista: true, dataFimPrevista: true,
      liberacoes: {
        where: { status: "APROVADA" },
        select: { id: true, valorLiberacao: true, dataLiberacao: true },
      },
      pagamentos: {
        where: { status: "APROVADA" },
        select: { id: true, valorPagamento: true, dataPagamento: true, numeroNotaFiscal: true },
      },
    },
  },
  fiscalizacoes: {
    orderBy: [{ dataVistoria: "desc" }, { id: "desc" }],
    select: { id: true, etapaCronogramaId: true, dataVistoria: true, percentualExecutado: true, statusVistoria: true },
  },
  alertas: {
    where: { publicado: true },
    select: { id: true, tipoAlerta: true, severidade: true, statusAlerta: true },
  },
} satisfies Prisma.projeto_obraSelect;

type ObraSelecionada = Prisma.projeto_obraGetPayload<{ select: typeof selecaoPublica }>;

function total(valores: Prisma.Decimal[]): string {
  return valores.reduce((soma, valor) => soma.plus(valor), new Prisma.Decimal(0)).toFixed(2);
}

function toPublicDTO(obra: ObraSelecionada) {
  const liberacoes = obra.etapas.flatMap((etapa) => etapa.liberacoes);
  const pagamentos = obra.etapas.flatMap((etapa) => etapa.pagamentos);
  const cidade = obra.endereco.cidade;

  return {
    id: obra.id,
    nome: obra.nome,
    descricao: obra.descricao,
    finalidade: obra.finalidade,
    dataConclusao: obra.dataConclusao?.toISOString().slice(0, 10) ?? null,
    municipio: { id: cidade.id, nome: cidade.nome, uf: cidade.estado.sigla, regiao: cidade.estado.regiao },
    etapas: obra.etapas.map((etapa) => ({
      id: etapa.id,
      nomeEtapa: etapa.nomeEtapa,
      status: etapa.status,
      dataInicioPrevista: etapa.dataInicioPrevista.toISOString().slice(0, 10),
      dataFimPrevista: etapa.dataFimPrevista.toISOString().slice(0, 10),
    })),
    totaisFinanceiros: {
      alocado: total(obra.projetosVerba.map((item) => item.valorAlocado)),
      contratado: total(obra.contratos.map((item) => item.valorContrato)),
      liberado: total(liberacoes.map((item) => item.valorLiberacao)),
      pago: total(pagamentos.map((item) => item.valorPagamento)),
    },
    contratos: obra.contratos.map((contrato) => ({
      ...contrato,
      valorContrato: contrato.valorContrato.toString(),
      dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
      dataFim: contrato.dataFim.toISOString().slice(0, 10),
      empresa: contrato.empresa.nome,
    })),
    pagamentosAprovados: pagamentos.map((pagamento) => ({
      ...pagamento,
      valorPagamento: pagamento.valorPagamento.toString(),
      dataPagamento: pagamento.dataPagamento.toISOString().slice(0, 10),
    })),
    liberacoesAprovadas: liberacoes.map((liberacao) => ({
      ...liberacao,
      valorLiberacao: liberacao.valorLiberacao.toString(),
      dataLiberacao: liberacao.dataLiberacao.toISOString().slice(0, 10),
    })),
    fiscalizacoes: obra.fiscalizacoes.map((vistoria) => ({
      ...vistoria,
      dataVistoria: vistoria.dataVistoria.toISOString().slice(0, 10),
      percentualExecutado: vistoria.percentualExecutado.toString(),
    })),
    alertas: obra.alertas,
  };
}

export type ObraPublicaDTO = ReturnType<typeof toPublicDTO>;

export interface TransparenciaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: ObraPublicaDTO[];
}

type FiltrosDeObras = Omit<TransparenciaFilters, "page" | "pageSize" | "ordem">;

function filtroObras(filters: FiltrosDeObras): Prisma.projeto_obraWhereInput {
  const fimMinimo = filters.dataInicio && filters.conclusaoInicio
    ? new Date(Math.max(filters.dataInicio.getTime(), filters.conclusaoInicio.getTime()))
    : filters.dataInicio ?? filters.conclusaoInicio;
  const etapa: Prisma.etapa_cronogramaWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...((fimMinimo || filters.conclusaoFim) && {
      dataFimPrevista: { gte: fimMinimo, lte: filters.conclusaoFim },
    }),
    ...(filters.dataFim && { dataInicioPrevista: { lte: filters.dataFim } }),
  };
  return {
    publicado: true,
    ...((filters.entregaInicio || filters.entregaFim) && {
      dataConclusao: { gte: filters.entregaInicio, lte: filters.entregaFim },
    }),
    ...(filters.busca && {
      OR: [
        { nome: { contains: filters.busca } },
        { descricao: { contains: filters.busca } },
        ...(filters.buscaDetalhada ? [
          { finalidade: { contains: filters.busca } },
          { endereco: { cidade: { nome: { contains: filters.busca } } } },
          { endereco: { cidade: { estado: { OR: [
            { nome: { contains: filters.busca } },
            { sigla: filters.busca },
            { regiao: { contains: filters.busca } },
          ] } } } },
        ] : []),
      ],
    }),
    ...(filters.finalidade && { finalidade: filters.finalidade }),
    ...((filters.cidadeId || filters.estadoId || filters.regiao) && {
      endereco: {
        cidade: {
          id: filters.cidadeId,
          estadoId: filters.estadoId,
          ...(filters.regiao && { estado: { regiao: filters.regiao } }),
        },
      },
    }),
    ...(Object.keys(etapa).length > 0 && { etapas: { some: etapa } }),
  };
}

export class TransparenciaRepository {
  async findAll(filters: TransparenciaFilters): Promise<TransparenciaPagination> {
    const where = filtroObras(filters);
    const [total, obras] = await prisma.$transaction([
      prisma.projeto_obra.count({ where }),
      prisma.projeto_obra.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { id: filters.ordem === "recente" ? "desc" : "asc" },
        select: selecaoPublica,
      }),
    ]);
    return {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
      items: obras.map(toPublicDTO),
    };
  }

  async listFilterOptions({ busca, buscaDetalhada, regiao, estadoId, cidadeId, finalidade, status }: FiltrosDeObras = {}) {
    const buscaBase = { busca, buscaDetalhada };
    const localizacao = { ...buscaBase, regiao, estadoId, cidadeId };
    const [cidades, finalidades, etapas, entregas] = await prisma.$transaction([
      prisma.cidade.findMany({
        where: { enderecos: { some: { projetos: { some: filtroObras(buscaBase) } } } },
        select: {
          id: true,
          nome: true,
          estado: { select: { id: true, nome: true, sigla: true, regiao: true } },
        },
        orderBy: [{ nome: "asc" }, { id: "asc" }],
      }),
      prisma.projeto_obra.groupBy({
        by: ["finalidade"],
        where: filtroObras(localizacao),
        orderBy: { finalidade: "asc" },
      }),
      prisma.etapa_cronograma.groupBy({
        by: ["status"],
        where: { projetoObra: filtroObras({ ...localizacao, finalidade }) },
        orderBy: { status: "asc" },
      }),
      prisma.projeto_obra.groupBy({
        by: ["dataConclusao"],
        where: { ...filtroObras({ ...localizacao, finalidade, status }), dataConclusao: { not: null } },
        orderBy: { dataConclusao: "asc" },
      }),
    ]);
    const estados = [...new Map(cidades.map(({ estado }) => [estado.id, estado])).values()]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return {
      regioes: [...new Set(estados.map(({ regiao }) => regiao))].sort((a, b) => a.localeCompare(b, "pt-BR")),
      estados,
      cidades: cidades.map(({ id, nome, estado }) => ({ id, nome, estadoId: estado.id })),
      finalidades: finalidades.map(({ finalidade }) => finalidade),
      status: etapas.map(({ status }) => status),
      entregas: entregas.flatMap(({ dataConclusao }) => dataConclusao ? [dataConclusao.toISOString().slice(0, 10)] : []),
    };
  }

  async findById(id: number): Promise<ObraPublicaDTO | null> {
    const obra = await prisma.projeto_obra.findFirst({
      where: { id, publicado: true },
      select: selecaoPublica,
    });
    return obra ? toPublicDTO(obra) : null;
  }
}
