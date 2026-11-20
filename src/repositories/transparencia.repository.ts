import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface TransparenciaFilters {
  busca?: string;
  finalidade?: string;
  cidadeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  page: number;
  pageSize: number;
}

const selecaoPublica = {
  id: true,
  nome: true,
  descricao: true,
  finalidade: true,
  endereco: {
    select: { cidade: { select: { id: true, nome: true, estado: { select: { sigla: true } } } } },
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
    select: { id: true, dataVistoria: true, percentualExecutado: true, statusVistoria: true },
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
    municipio: { id: cidade.id, nome: cidade.nome, uf: cidade.estado.sigla },
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

export class TransparenciaRepository {
  async findAll(filters: TransparenciaFilters): Promise<TransparenciaPagination> {
    const etapa: Prisma.etapa_cronogramaWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.dataInicio && { dataFimPrevista: { gte: filters.dataInicio } }),
      ...(filters.dataFim && { dataInicioPrevista: { lte: filters.dataFim } }),
    };
    const where: Prisma.projeto_obraWhereInput = {
      publicado: true,
      ...(filters.busca && {
        OR: [
          { nome: { contains: filters.busca } },
          { descricao: { contains: filters.busca } },
        ],
      }),
      ...(filters.finalidade && { finalidade: filters.finalidade }),
      ...(filters.cidadeId && { endereco: { cidadeId: filters.cidadeId } }),
      ...(Object.keys(etapa).length > 0 && { etapas: { some: etapa } }),
    };
    const [total, obras] = await prisma.$transaction([
      prisma.projeto_obra.count({ where }),
      prisma.projeto_obra.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { id: "asc" },
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

  async findById(id: number): Promise<ObraPublicaDTO | null> {
    const obra = await prisma.projeto_obra.findFirst({
      where: { id, publicado: true },
      select: selecaoPublica,
    });
    return obra ? toPublicDTO(obra) : null;
  }
}
