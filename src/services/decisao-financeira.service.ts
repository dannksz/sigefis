import type { ListQuery } from "@/lib/pagination";
import { DecisaoFinanceiraRepository } from "@/repositories/decisao-financeira.repository";
import type { DecisaoFinanceiraResponseDTO } from "@/types/decisao-financeira";

export class DecisaoFinanceiraService {
  private repository = new DecisaoFinanceiraRepository();

  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<DecisaoFinanceiraResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Decisão financeira não encontrada.");
    return item;
  }

  findByOperation(
    tipoOperacao: "PAGAMENTO" | "LIBERACAO",
    operacaoId: number,
  ): Promise<DecisaoFinanceiraResponseDTO[]> {
    return this.repository.findByOperation(tipoOperacao, operacaoId);
  }
}
