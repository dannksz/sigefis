import { ContratoRepository } from "@/repositories/contrato.repository";
import { EtapaCronogramaRepository } from "@/repositories/etapa-cronograma.repository";
import { LiberacaoRecursoRepository } from "@/repositories/liberacao-recurso.repository";
import { PagamentoRepository } from "@/repositories/pagamento.repository";
import type { CreatePagamentoDTO, PagamentoResponseDTO, UpdatePagamentoDTO } from "@/types/pagamento";

function cents(value: string): bigint {
  const [integer, decimal = ""] = value.split(".");
  return BigInt(integer) * BigInt("100") + BigInt(decimal.padEnd(2, "0"));
}
export class PagamentoService {
  private repository = new PagamentoRepository();
  private contratoRepository = new ContratoRepository();
  private etapaRepository = new EtapaCronogramaRepository();
  private liberacaoRepository = new LiberacaoRecursoRepository();

  private async ensureRules(data: {
    contratoId: number; etapaCronogramaId: number; valorPagamento: string; numeroNotaFiscal: string;
  }, excludeId?: number): Promise<void> {
    const contrato = await this.contratoRepository.findById(data.contratoId);
    if (!contrato) throw new Error("Contrato não encontrado.");
    const etapa = await this.etapaRepository.findById(data.etapaCronogramaId);
    if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
    if (contrato.projetoObraId !== etapa.projetoObraId) {
      throw new Error("A etapa não pertence ao projeto do contrato.");
    }
    if (await this.repository.existsByInvoice(data.numeroNotaFiscal, excludeId)) {
      throw new Error("A nota fiscal já está cadastrada.");
    }
    const totalContrato = cents(await this.repository.sumByContrato(data.contratoId, excludeId));
    if (totalContrato + cents(data.valorPagamento) > cents(contrato.valorContrato)) {
      throw new Error("O total de pagamentos excede o valor do contrato.");
    }
    const totalEtapa = cents(await this.repository.sumByEtapaAndVerba(
      data.etapaCronogramaId, contrato.verbaPublicaId, excludeId,
    ));
    const liberado = cents(await this.liberacaoRepository.sumByEtapaAndVerba(
      data.etapaCronogramaId, contrato.verbaPublicaId,
    ));
    if (totalEtapa + cents(data.valorPagamento) > liberado) {
      throw new Error("O pagamento excede o recurso liberado para a etapa.");
    }
  }
  async create(data: CreatePagamentoDTO): Promise<PagamentoResponseDTO> {
    await this.ensureRules(data);
    return this.repository.create(data);
  }
  findAll() { return this.repository.findAll(); }
  async findById(id: number): Promise<PagamentoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Pagamento não encontrado.");
    return item;
  }
  async update(id: number, data: UpdatePagamentoDTO): Promise<PagamentoResponseDTO> {
    const current = await this.findById(id);
    await this.ensureRules({
      contratoId: data.contratoId ?? current.contratoId,
      etapaCronogramaId: data.etapaCronogramaId ?? current.etapaCronogramaId,
      valorPagamento: data.valorPagamento ?? current.valorPagamento,
      numeroNotaFiscal: data.numeroNotaFiscal ?? current.numeroNotaFiscal,
    }, id);
    return this.repository.update(id, data);
  }
  async delete(id: number) { await this.findById(id); return this.repository.delete(id); }
}
