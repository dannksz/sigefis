import { EtapaCronogramaRepository } from "@/repositories/etapa-cronograma.repository";
import { FiscalizacaoRepository } from "@/repositories/fiscalizacao.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { UserRepository } from "@/repositories/user.repository";
import type {
  CreateFiscalizacaoDTO,
  FiscalizacaoResponseDTO,
  UpdateFiscalizacaoDTO,
} from "@/types/fiscalizacao";

export class FiscalizacaoService {
  private repository = new FiscalizacaoRepository();
  private etapaRepository = new EtapaCronogramaRepository();
  private projetoRepository = new ProjetoRepository();
  private userRepository = new UserRepository();

  private async ensureReferences(data: {
    projetoObraId?: number;
    usuarioId?: number;
    etapaCronogramaId?: number;
  }): Promise<void> {
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
    if (
      data.usuarioId !== undefined &&
      !(await this.userRepository.findById(data.usuarioId))
    ) {
      throw new Error("Usuário não encontrado.");
    }
    if (data.etapaCronogramaId !== undefined) {
      const etapa = await this.etapaRepository.findById(data.etapaCronogramaId);
      if (!etapa) throw new Error("Etapa do cronograma não encontrada.");
      if (
        data.projetoObraId !== undefined &&
        etapa.projetoObraId !== data.projetoObraId
      ) {
        throw new Error("A etapa não pertence ao projeto informado.");
      }
    }
  }

  async create(data: CreateFiscalizacaoDTO): Promise<FiscalizacaoResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  findAll(): Promise<FiscalizacaoResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<FiscalizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Fiscalização não encontrada.");
    return item;
  }

  async update(
    id: number,
    data: UpdateFiscalizacaoDTO,
  ): Promise<FiscalizacaoResponseDTO> {
    const current = await this.findById(id);
    await this.ensureReferences({
      projetoObraId: data.projetoObraId ?? current.projetoObraId,
      usuarioId: data.usuarioId,
      etapaCronogramaId: data.etapaCronogramaId ?? current.etapaCronogramaId,
    });
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
