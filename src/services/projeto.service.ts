import { EnderecoRepository } from "@/repositories/endereco.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import type {
  CreateProjetoDTO,
  ProjetoResponseDTO,
  UpdateProjetoDTO,
} from "@/types/projeto";

export class ProjetoService {
  private projetoRepository: ProjetoRepository;
  private enderecoRepository: EnderecoRepository;

  constructor() {
    this.projetoRepository = new ProjetoRepository();
    this.enderecoRepository = new EnderecoRepository();
  }

  private async ensureEnderecoExists(enderecoId: number): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);

    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }
  }

  async create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO> {
    await this.ensureEnderecoExists(data.enderecoId);
    return this.projetoRepository.create(data);
  }

  async findAll(): Promise<ProjetoResponseDTO[]> {
    return this.projetoRepository.findAll();
  }

  async findById(id: number): Promise<ProjetoResponseDTO> {
    const projeto = await this.projetoRepository.findById(id);

    if (!projeto) {
      throw new Error("Projeto não encontrado.");
    }

    return projeto;
  }

  async update(
    id: number,
    data: UpdateProjetoDTO,
  ): Promise<ProjetoResponseDTO> {
    await this.findById(id);

    if (data.enderecoId !== undefined) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    return this.projetoRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.projetoRepository.delete(id);
  }
}
