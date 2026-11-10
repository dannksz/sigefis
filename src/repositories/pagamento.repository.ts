import type { pagamento, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { CreatePagamentoDTO, PagamentoResponseDTO, UpdatePagamentoDTO } from "@/types/pagamento";

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
function response(item: pagamento): PagamentoResponseDTO {
  return {
    id: item.id, valorPagamento: item.valorPagamento.toString(),
    dataPagamento: item.dataPagamento.toISOString().slice(0, 10),
    numeroNotaFiscal: item.numeroNotaFiscal, contratoId: item.contratoId,
    etapaCronogramaId: item.etapaCronogramaId,
  };
}
function createData(data: CreatePagamentoDTO): Prisma.pagamentoUncheckedCreateInput {
  return {
    valorPagamento: data.valorPagamento, dataPagamento: toDate(data.dataPagamento),
    numeroNotaFiscal: data.numeroNotaFiscal, contratoId: data.contratoId,
    etapaCronogramaId: data.etapaCronogramaId,
  };
}
function updateData(data: UpdatePagamentoDTO): Prisma.pagamentoUncheckedUpdateInput {
  return {
    ...(data.valorPagamento !== undefined && { valorPagamento: data.valorPagamento }),
    ...(data.dataPagamento !== undefined && { dataPagamento: toDate(data.dataPagamento) }),
    ...(data.numeroNotaFiscal !== undefined && { numeroNotaFiscal: data.numeroNotaFiscal }),
    ...(data.contratoId !== undefined && { contratoId: data.contratoId }),
    ...(data.etapaCronogramaId !== undefined && { etapaCronogramaId: data.etapaCronogramaId }),
  };
}
export class PagamentoRepository {
  async create(data: CreatePagamentoDTO) { return response(await prisma.pagamento.create({ data: createData(data) })); }
  async findAll() { return (await prisma.pagamento.findMany()).map(response); }
  async findById(id: number) {
    const item = await prisma.pagamento.findUnique({ where: { id } });
    return item ? response(item) : null;
  }
  async update(id: number, data: UpdatePagamentoDTO) {
    return response(await prisma.pagamento.update({ where: { id }, data: updateData(data) }));
  }
  async delete(id: number) { await prisma.pagamento.delete({ where: { id } }); }
  async sumByContrato(contratoId: number, excludeId?: number): Promise<string> {
    const result = await prisma.pagamento.aggregate({
      _sum: { valorPagamento: true },
      where: { contratoId, ...(excludeId !== undefined && { id: { not: excludeId } }) },
    });
    return result._sum.valorPagamento?.toString() ?? "0.00";
  }
  async sumByEtapaAndVerba(etapaCronogramaId: number, verbaPublicaId: number, excludeId?: number): Promise<string> {
    const result = await prisma.pagamento.aggregate({
      _sum: { valorPagamento: true },
      where: {
        etapaCronogramaId, contrato: { verbaPublicaId },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
    });
    return result._sum.valorPagamento?.toString() ?? "0.00";
  }
  async existsByInvoice(numeroNotaFiscal: string, excludeId?: number): Promise<boolean> {
    return (await prisma.pagamento.findFirst({
      where: { numeroNotaFiscal, ...(excludeId !== undefined && { id: { not: excludeId } }) },
      select: { id: true },
    })) !== null;
  }
}
