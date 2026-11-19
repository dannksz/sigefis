import prisma from "@/lib/prisma";

export interface ObraPublicaDTO {
  id: number;
  nome: string;
  descricao: string;
  finalidade: string;
  contratos: Array<{
    id: number;
    numeroContrato: string;
    valorContrato: string;
    dataInicio: string;
    dataFim: string;
    empresa: string;
  }>;
  pagamentosAprovados: Array<{
    id: number;
    valorPagamento: string;
    dataPagamento: string;
    numeroNotaFiscal: string;
  }>;
  liberacoesAprovadas: Array<{
    id: number;
    valorLiberacao: string;
    dataLiberacao: string;
  }>;
  fiscalizacoes: Array<{
    id: number;
    dataVistoria: string;
    percentualExecutado: string;
    statusVistoria: string;
  }>;
  alertas: Array<{
    id: number;
    tipoAlerta: string;
    severidade: string;
    statusAlerta: string;
  }>;
}

export interface TransparenciaPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: ObraPublicaDTO[];
}

export interface TransparenciaFilters {
  busca?: string;
  finalidade?: string;
  page: number;
  pageSize: number;
}

export class TransparenciaRepository {
  async findAll(filters: TransparenciaFilters): Promise<TransparenciaPagination> {
    const where = {
      ...(filters.busca
        ? {
            OR: [
              { nome: { contains: filters.busca } },
              { descricao: { contains: filters.busca } },
            ],
          }
        : {}),
      ...(filters.finalidade
        ? { finalidade: { equals: filters.finalidade } }
        : {}),
    };
    const [total, obras] = await prisma.$transaction([
      prisma.projeto_obra.count({ where }),
      prisma.projeto_obra.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { id: "asc" },
        include: {
          contratos: {
            select: {
              id: true,
              numeroContrato: true,
              valorContrato: true,
              dataInicio: true,
              dataFim: true,
              empresa: { select: { nome: true } },
            },
          },
          etapas: {
            select: {
              id: true,
              liberacoes: {
                where: { status: "APROVADA" },
                select: {
                  id: true,
                  valorLiberacao: true,
                  dataLiberacao: true,
                },
              },
              pagamentos: {
                where: { status: "APROVADA" },
                select: {
                  id: true,
                  valorPagamento: true,
                  dataPagamento: true,
                  numeroNotaFiscal: true,
                },
              },
            },
          },
          fiscalizacoes: {
            select: {
              id: true,
              dataVistoria: true,
              percentualExecutado: true,
              statusVistoria: true,
            },
          },
          alertas: {
            select: {
              id: true,
              tipoAlerta: true,
              severidade: true,
              statusAlerta: true,
            },
          },
        },
      }),
    ]);
    const items = obras.map((obra) => ({
      id: obra.id,
      nome: obra.nome,
      descricao: obra.descricao,
      finalidade: obra.finalidade,
      contratos: obra.contratos.map((contrato) => ({
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        valorContrato: contrato.valorContrato.toString(),
        dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
        dataFim: contrato.dataFim.toISOString().slice(0, 10),
        empresa: contrato.empresa.nome,
      })),
      pagamentosAprovados: obra.etapas.flatMap((etapa) =>
        etapa.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          valorPagamento: pagamento.valorPagamento.toString(),
          dataPagamento: pagamento.dataPagamento.toISOString().slice(0, 10),
          numeroNotaFiscal: pagamento.numeroNotaFiscal,
        })),
      ),
      liberacoesAprovadas: obra.etapas.flatMap((etapa) =>
        etapa.liberacoes.map((liberacao) => ({
          id: liberacao.id,
          valorLiberacao: liberacao.valorLiberacao.toString(),
          dataLiberacao: liberacao.dataLiberacao.toISOString().slice(0, 10),
        })),
      ),
      fiscalizacoes: obra.fiscalizacoes.map((item) => ({
        id: item.id,
        dataVistoria: item.dataVistoria.toISOString().slice(0, 10),
        percentualExecutado: item.percentualExecutado.toString(),
        statusVistoria: item.statusVistoria,
      })),
      alertas: obra.alertas.map((item) => ({
        id: item.id,
        tipoAlerta: item.tipoAlerta,
        severidade: item.severidade,
        statusAlerta: item.statusAlerta,
      })),
    }));
    return {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize),
      items,
    };
  }

  async findById(id: number): Promise<ObraPublicaDTO | null> {
    const obras = await prisma.projeto_obra.findMany({
      where: { id },
      take: 1,
      orderBy: { id: "asc" },
      include: {
        contratos: {
          select: {
            id: true,
            numeroContrato: true,
            valorContrato: true,
            dataInicio: true,
            dataFim: true,
            empresa: { select: { nome: true } },
          },
        },
        etapas: {
          select: {
            id: true,
            liberacoes: {
              where: { status: "APROVADA" },
              select: {
                id: true,
                valorLiberacao: true,
                dataLiberacao: true,
              },
            },
            pagamentos: {
              where: { status: "APROVADA" },
              select: {
                id: true,
                valorPagamento: true,
                dataPagamento: true,
                numeroNotaFiscal: true,
              },
            },
          },
        },
        fiscalizacoes: {
          select: {
            id: true,
            dataVistoria: true,
            percentualExecutado: true,
            statusVistoria: true,
          },
        },
        alertas: {
          select: {
            id: true,
            tipoAlerta: true,
            severidade: true,
            statusAlerta: true,
          },
        },
      },
    });
    const obra = obras[0];
    if (!obra) return null;
    return {
      id: obra.id,
      nome: obra.nome,
      descricao: obra.descricao,
      finalidade: obra.finalidade,
      contratos: obra.contratos.map((contrato) => ({
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        valorContrato: contrato.valorContrato.toString(),
        dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
        dataFim: contrato.dataFim.toISOString().slice(0, 10),
        empresa: contrato.empresa.nome,
      })),
      pagamentosAprovados: obra.etapas.flatMap((etapa) =>
        etapa.pagamentos.map((pagamento) => ({
          id: pagamento.id,
          valorPagamento: pagamento.valorPagamento.toString(),
          dataPagamento: pagamento.dataPagamento.toISOString().slice(0, 10),
          numeroNotaFiscal: pagamento.numeroNotaFiscal,
        })),
      ),
      liberacoesAprovadas: obra.etapas.flatMap((etapa) =>
        etapa.liberacoes.map((liberacao) => ({
          id: liberacao.id,
          valorLiberacao: liberacao.valorLiberacao.toString(),
          dataLiberacao: liberacao.dataLiberacao.toISOString().slice(0, 10),
        })),
      ),
      fiscalizacoes: obra.fiscalizacoes.map((item) => ({
        id: item.id,
        dataVistoria: item.dataVistoria.toISOString().slice(0, 10),
        percentualExecutado: item.percentualExecutado.toString(),
        statusVistoria: item.statusVistoria,
      })),
      alertas: obra.alertas.map((item) => ({
        id: item.id,
        tipoAlerta: item.tipoAlerta,
        severidade: item.severidade,
        statusAlerta: item.statusAlerta,
      })),
    };
  }
}
