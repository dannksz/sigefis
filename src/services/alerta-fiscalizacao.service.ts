import { AlertaFiscalizacaoRepository } from "@/repositories/alerta-fiscalizacao.repository";
import { FiscalizacaoRepository } from "@/repositories/fiscalizacao.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import type {
  AlertaFiscalizacaoResponseDTO,
  CreateAlertaFiscalizacaoDTO,
  UpdateAlertaFiscalizacaoDTO,
} from "@/types/alerta-fiscalizacao";

export class AlertaFiscalizacaoService {
  private repository = new AlertaFiscalizacaoRepository();
  private fiscalizacaoRepository = new FiscalizacaoRepository();
  private projetoRepository = new ProjetoRepository();

  private async ensureReferences(data: {
    projetoObraId?: number;
    fiscalizacaoId?: number;
  }): Promise<void> {
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
    if (data.fiscalizacaoId !== undefined) {
      const fiscalizacao = await this.fiscalizacaoRepository.findById(
        data.fiscalizacaoId,
      );
      if (!fiscalizacao) throw new Error("Fiscalização não encontrada.");
      if (
        data.projetoObraId !== undefined &&
        fiscalizacao.projetoObraId !== data.projetoObraId
      ) {
        throw new Error("A fiscalização não pertence ao projeto informado.");
      }
    }
  }

  async create(
    data: CreateAlertaFiscalizacaoDTO,
  ): Promise<AlertaFiscalizacaoResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  findAll(): Promise<AlertaFiscalizacaoResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<AlertaFiscalizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Alerta de fiscalização não encontrado.");
    return item;
  }

  async update(
    id: number,
    data: UpdateAlertaFiscalizacaoDTO,
  ): Promise<AlertaFiscalizacaoResponseDTO> {
    const current = await this.findById(id);
    await this.ensureReferences({
      projetoObraId: data.projetoObraId ?? current.projetoObraId,
      fiscalizacaoId: data.fiscalizacaoId ?? current.fiscalizacaoId,
    });
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
