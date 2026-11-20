import type { ListQuery } from "@/lib/pagination";
import { AlertaFiscalizacaoRepository } from "@/repositories/alerta-fiscalizacao.repository";
import { BloqueioRepasseRepository } from "@/repositories/bloqueio-repasse.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import type {
  BloqueioRepasseResponseDTO,
  CreateBloqueioRepasseDTO,
  UpdateBloqueioRepasseDTO,
} from "@/types/bloqueio-repasse";

export class BloqueioRepasseService {
  private repository = new BloqueioRepasseRepository();
  private alertaRepository = new AlertaFiscalizacaoRepository();
  private projetoRepository = new ProjetoRepository();

  private async ensureReferences(data: {
    projetoObraId?: number;
    alertaFiscalizacaoId?: number;
  }): Promise<void> {
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
    if (data.alertaFiscalizacaoId !== undefined) {
      const alerta = await this.alertaRepository.findById(data.alertaFiscalizacaoId);
      if (!alerta) throw new Error("Alerta de fiscalização não encontrado.");
      if (
        data.projetoObraId !== undefined &&
        alerta.projetoObraId !== data.projetoObraId
      ) {
        throw new Error("O alerta não pertence ao projeto informado.");
      }
    }
  }

  async create(data: CreateBloqueioRepasseDTO): Promise<BloqueioRepasseResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<BloqueioRepasseResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Bloqueio de repasse não encontrado.");
    return item;
  }

  async update(
    id: number,
    data: UpdateBloqueioRepasseDTO,
  ): Promise<BloqueioRepasseResponseDTO> {
    const current = await this.findById(id);
    await this.ensureReferences({
      projetoObraId: data.projetoObraId ?? current.projetoObraId,
      alertaFiscalizacaoId: data.alertaFiscalizacaoId ?? current.alertaFiscalizacaoId,
    });
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
