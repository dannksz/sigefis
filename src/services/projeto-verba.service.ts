import { ProjetoRepository } from "@/repositories/projeto.repository";
import { ProjetoVerbaRepository } from "@/repositories/projeto-verba.repository";
import { VerbaPublicaRepository } from "@/repositories/verba-publica.repository";
import type {
  CreateProjetoVerbaDTO,
  ProjetoVerbaResponseDTO,
  UpdateProjetoVerbaDTO,
} from "@/types/projeto-verba";

export class ProjetoVerbaService {
  private repository = new ProjetoVerbaRepository();
  private projetoRepository = new ProjetoRepository();
  private verbaRepository = new VerbaPublicaRepository();

  private async ensureReferences(data: {
    projetoObraId?: number;
    verbaPublicaId?: number;
  }): Promise<void> {
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
    if (
      data.verbaPublicaId !== undefined &&
      !(await this.verbaRepository.existsById(data.verbaPublicaId))
    ) {
      throw new Error("Verba pública não encontrada.");
    }
  }

  async create(data: CreateProjetoVerbaDTO): Promise<ProjetoVerbaResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  findAll(): Promise<ProjetoVerbaResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<ProjetoVerbaResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Vínculo projeto-verba não encontrado.");
    return item;
  }

  async update(
    id: number,
    data: UpdateProjetoVerbaDTO,
  ): Promise<ProjetoVerbaResponseDTO> {
    await this.findById(id);
    await this.ensureReferences(data);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
