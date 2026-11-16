import { BloqueioRepasseRepository } from "@/repositories/bloqueio-repasse.repository";
import { ProcessoRegularizacaoRepository } from "@/repositories/processo-regularizacao.repository";
import { UserRepository } from "@/repositories/user.repository";
import type {
  CreateProcessoRegularizacaoDTO,
  ProcessoRegularizacaoResponseDTO,
  UpdateProcessoRegularizacaoDTO,
} from "@/types/processo-regularizacao";

export class ProcessoRegularizacaoService {
  private repository = new ProcessoRegularizacaoRepository();
  private bloqueioRepository = new BloqueioRepasseRepository();
  private userRepository = new UserRepository();

  private async ensureReferences(data: {
    bloqueioRepasseId?: number;
    usuarioId?: number;
  }): Promise<void> {
    if (
      data.bloqueioRepasseId !== undefined &&
      !(await this.bloqueioRepository.findById(data.bloqueioRepasseId))
    ) {
      throw new Error("Bloqueio de repasse não encontrado.");
    }
    if (
      data.usuarioId !== undefined &&
      !(await this.userRepository.findById(data.usuarioId))
    ) {
      throw new Error("Usuário não encontrado.");
    }
  }

  async create(
    data: CreateProcessoRegularizacaoDTO,
  ): Promise<ProcessoRegularizacaoResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  findAll(): Promise<ProcessoRegularizacaoResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<ProcessoRegularizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Processo de regularização não encontrado.");
    return item;
  }

  async update(
    id: number,
    data: UpdateProcessoRegularizacaoDTO,
  ): Promise<ProcessoRegularizacaoResponseDTO> {
    await this.findById(id);
    await this.ensureReferences(data);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
