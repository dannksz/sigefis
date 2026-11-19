import prisma from "@/lib/prisma";
import { PagamentoRepository } from "@/repositories/pagamento.repository";
import type {
  CreatePagamentoDTO,
  PagamentoResponseDTO,
  UpdatePagamentoDTO,
} from "@/types/pagamento";

function cents(value: string): bigint {
  const [integer, decimal = ""] = value.split(".");
  return BigInt(integer) * BigInt("100") + BigInt(decimal.padEnd(2, "0"));
}

function assertFinancialLimits(
  paid: string,
  amount: string,
  limit: string,
  message: string,
): void {
  if (cents(paid) + cents(amount) > cents(limit)) throw new Error(message);
}

export class PagamentoService {
  private repository = new PagamentoRepository();

  async create(
    data: CreatePagamentoDTO,
    criadoPorUsuarioId: number,
  ): Promise<PagamentoResponseDTO> {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM contrato WHERE id = ${data.contratoId} FOR UPDATE`;
      const contrato = await tx.contrato.findUnique({ where: { id: data.contratoId } });
      if (!contrato) throw new Error("Contrato não encontrado.");
      const etapa = await tx.etapa_cronograma.findUnique({ where: { id: data.etapaCronogramaId } });
      if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
      if (contrato.projetoObraId !== etapa.projetoObraId) {
        throw new Error("A etapa não pertence ao projeto do contrato.");
      }
      const duplicate = await tx.pagamento.findFirst({
        where: { numeroNotaFiscal: data.numeroNotaFiscal },
        select: { id: true },
      });
      if (duplicate) throw new Error("A nota fiscal já está cadastrada.");
      const paid = await tx.pagamento.aggregate({
        _sum: { valorPagamento: true },
        where: { contratoId: data.contratoId },
      });
      const paidForStage = await tx.pagamento.aggregate({
        _sum: { valorPagamento: true },
        where: {
          etapaCronogramaId: data.etapaCronogramaId,
          contrato: { verbaPublicaId: contrato.verbaPublicaId },
        },
      });
      const released = await tx.liberacao_recurso.aggregate({
        _sum: { valorLiberacao: true },
        where: {
          etapaCronogramaId: data.etapaCronogramaId,
          verbaPublicaId: contrato.verbaPublicaId,
        },
      });
      assertFinancialLimits(
        paid._sum.valorPagamento?.toString() ?? "0.00",
        data.valorPagamento,
        contrato.valorContrato.toString(),
        "O total de pagamentos excede o valor do contrato.",
      );
      assertFinancialLimits(
        paidForStage._sum.valorPagamento?.toString() ?? "0.00",
        data.valorPagamento,
        released._sum.valorLiberacao?.toString() ?? "0.00",
        "O pagamento excede o recurso liberado para a etapa.",
      );
      return this.repository.createWithClient(tx, { ...data, criadoPorUsuarioId });
    });
  }

  findAll(): Promise<PagamentoResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<PagamentoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Pagamento não encontrado.");
    return item;
  }

  async update(id: number, data: UpdatePagamentoDTO): Promise<PagamentoResponseDTO> {
    return prisma.$transaction(async (tx) => {
      const current = await tx.pagamento.findUnique({ where: { id } });
      if (!current) throw new Error("Pagamento não encontrado.");
      const contratoId = data.contratoId ?? current.contratoId;
      const etapaCronogramaId = data.etapaCronogramaId ?? current.etapaCronogramaId;
      const numeroNotaFiscal = data.numeroNotaFiscal ?? current.numeroNotaFiscal;
      const valorPagamento = data.valorPagamento ?? current.valorPagamento.toString();
      await tx.$queryRaw`SELECT id FROM contrato WHERE id = ${contratoId} FOR UPDATE`;
      const contrato = await tx.contrato.findUnique({ where: { id: contratoId } });
      if (!contrato) throw new Error("Contrato não encontrado.");
      const etapa = await tx.etapa_cronograma.findUnique({ where: { id: etapaCronogramaId } });
      if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
      if (contrato.projetoObraId !== etapa.projetoObraId) {
        throw new Error("A etapa não pertence ao projeto do contrato.");
      }
      const duplicate = await tx.pagamento.findFirst({
        where: { numeroNotaFiscal },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== id) {
        throw new Error("A nota fiscal já está cadastrada.");
      }
      const paid = await tx.pagamento.aggregate({
        _sum: { valorPagamento: true },
        where: { contratoId, id: { not: id } },
      });
      const paidForStage = await tx.pagamento.aggregate({
        _sum: { valorPagamento: true },
        where: {
          etapaCronogramaId,
          id: { not: id },
          contrato: { verbaPublicaId: contrato.verbaPublicaId },
        },
      });
      const released = await tx.liberacao_recurso.aggregate({
        _sum: { valorLiberacao: true },
        where: { etapaCronogramaId, verbaPublicaId: contrato.verbaPublicaId },
      });
      assertFinancialLimits(
        paid._sum.valorPagamento?.toString() ?? "0.00",
        valorPagamento,
        contrato.valorContrato.toString(),
        "O total de pagamentos excede o valor do contrato.",
      );
      assertFinancialLimits(
        paidForStage._sum.valorPagamento?.toString() ?? "0.00",
        valorPagamento,
        released._sum.valorLiberacao?.toString() ?? "0.00",
        "O pagamento excede o recurso liberado para a etapa.",
      );
      return this.repository.updateWithClient(tx, id, data);
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
  async approve(id: number, aprovadoPorUsuarioId: number): Promise<PagamentoResponseDTO> {
    const current = await this.findById(id);
    if (current.status !== "PENDENTE") throw new Error("O pagamento não está pendente.");
    if (current.criadoPorUsuarioId === aprovadoPorUsuarioId) {
      throw new Error("Quem criou o pagamento não pode aprová-lo.");
    }
    await prisma.pagamento.update({
      where: { id },
      data: {
        status: "APROVADA",
        aprovadoPorUsuarioId,
        dataAprovacao: new Date(),
      },
    });
    return this.repository.findById(id).then((response) => {
      if (!response) throw new Error("Pagamento não encontrado.");
      return response;
    });
  }
}
