import { ProjetoRepository } from "@/repositories/projeto.repository";
import { EtapaCronogramaRepository } from "@/repositories/etapa-cronograma.repository";
import type {
  CreateEtapaCronogramaDTO,
  EtapaCronogramaResponseDTO,
  UpdateEtapaCronogramaDTO,
} from "@/types/etapa-cronograma";

export class EtapaCronogramaService {
  private repository = new EtapaCronogramaRepository();
  private projetoRepository = new ProjetoRepository();

  private async ensureProjeto(id: number) {
    if (!(await this.projetoRepository.findById(id))) {
      throw new Error("Projeto não encontrado.");
    }
  }

  async create(data: CreateEtapaCronogramaDTO): Promise<EtapaCronogramaResponseDTO> {
    await this.ensureProjeto(data.projetoObraId);
    return this.repository.create(data);
  }
  findAll() {
    return this.repository.findAll();
  }
  async findById(id: number) {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Etapa do cronograma não encontrada.");
    return item;
  }
  async update(id: number, data: UpdateEtapaCronogramaDTO) {
    await this.findById(id);
    if (data.projetoObraId !== undefined) await this.ensureProjeto(data.projetoObraId);
    return this.repository.update(id, data);
  }
  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
