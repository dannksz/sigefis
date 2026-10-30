import { CidadeRepository } from "@/repositories/cidade.repository";
import { EnderecoRepository } from "@/repositories/endereco.repository";
import type {
  CreateEnderecoDTO,
  EnderecoResponseDTO,
  UpdateEnderecoDTO,
} from "@/types/endereco";

export class EnderecoService {
  private enderecoRepository: EnderecoRepository;
  private cidadeRepository: CidadeRepository;

  constructor() {
    this.enderecoRepository = new EnderecoRepository();
    this.cidadeRepository = new CidadeRepository();
  }

  private async ensureCidadeExists(cidadeId: number): Promise<void> {
    const cidade = await this.cidadeRepository.findById(cidadeId);

    if (!cidade) {
      throw new Error("Cidade não encontrada.");
    }
  }

  async create(data: CreateEnderecoDTO): Promise<EnderecoResponseDTO> {
    await this.ensureCidadeExists(data.cidadeId);
    return this.enderecoRepository.create(data);
  }

  async findAll(): Promise<EnderecoResponseDTO[]> {
    return this.enderecoRepository.findAll();
  }

  async findById(id: number): Promise<EnderecoResponseDTO> {
    const endereco = await this.enderecoRepository.findById(id);

    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }

    return endereco;
  }

  async update(
    id: number,
    data: UpdateEnderecoDTO,
  ): Promise<EnderecoResponseDTO> {
    await this.findById(id);

    if (data.cidadeId !== undefined) {
      await this.ensureCidadeExists(data.cidadeId);
    }

    return this.enderecoRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.enderecoRepository.delete(id);
  }
}