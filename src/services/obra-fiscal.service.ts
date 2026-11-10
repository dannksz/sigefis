import { ProjetoRepository } from "@/repositories/projeto.repository";
import { UserRepository } from "@/repositories/user.repository";
import { ObraFiscalRepository } from "@/repositories/obra-fiscal.repository";
import type {
  CreateObraFiscalDTO,
  ObraFiscalResponseDTO,
  UpdateObraFiscalDTO,
} from "@/types/obra-fiscal";

export class ObraFiscalService {
  private repository = new ObraFiscalRepository();
  private userRepository = new UserRepository();
  private projetoRepository = new ProjetoRepository();

  private async ensureReferences(data: {
    usuarioId?: number;
    projetoObraId?: number;
  }): Promise<void> {
    if (
      data.usuarioId !== undefined &&
      !(await this.userRepository.findById(data.usuarioId))
    ) {
      throw new Error("Usuário não encontrado.");
    }
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
  }

  async create(data: CreateObraFiscalDTO): Promise<ObraFiscalResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  findAll(): Promise<ObraFiscalResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<ObraFiscalResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Obra fiscal não encontrada.");
    return item;
  }

  async update(
    id: number,
    data: UpdateObraFiscalDTO,
  ): Promise<ObraFiscalResponseDTO> {
    await this.findById(id);
    await this.ensureReferences(data);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
