import type { decisao_financeira } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { DecisaoFinanceiraResponseDTO } from "@/types/decisao-financeira";

function toResponseDTO(
  item: decisao_financeira,
): DecisaoFinanceiraResponseDTO {
  return {
    id: item.id,
    tipoOperacao: item.tipoOperacao as "PAGAMENTO" | "LIBERACAO",
    operacaoId: item.operacaoId,
    status: item.status as "APROVADA" | "REJEITADA",
    justificativa: item.justificativa,
    usuarioId: item.usuarioId,
    dataDecisao: item.dataDecisao.toISOString(),
  };
}

export class DecisaoFinanceiraRepository {
  async findAll(): Promise<DecisaoFinanceiraResponseDTO[]> {
    return (
      await prisma.decisao_financeira.findMany({
        orderBy: { dataDecisao: "desc" },
      })
    ).map(toResponseDTO);
  }

  async findById(id: number): Promise<DecisaoFinanceiraResponseDTO | null> {
    const item = await prisma.decisao_financeira.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async findByOperation(
    tipoOperacao: "PAGAMENTO" | "LIBERACAO",
    operacaoId: number,
  ): Promise<DecisaoFinanceiraResponseDTO[]> {
    return (
      await prisma.decisao_financeira.findMany({
        where: { tipoOperacao, operacaoId },
        orderBy: { dataDecisao: "desc" },
      })
    ).map(toResponseDTO);
  }
}
