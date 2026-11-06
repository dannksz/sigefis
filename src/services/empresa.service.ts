import { EnderecoRepository } from "@/repositories/endereco.repository";
import { EmpresaRepository } from "@/repositories/empresa.repository";
import type {
  CreateEmpresaDTO,
  EmpresaResponseDTO,
  UpdateEmpresaDTO,
} from "@/types/empresa";

export class EmpresaService {
  private empresaRepository: EmpresaRepository;
  private enderecoRepository: EnderecoRepository;

  constructor() {
    this.empresaRepository = new EmpresaRepository();
    this.enderecoRepository = new EnderecoRepository();
  }

  private async ensureEnderecoExists(enderecoId: number): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);

    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }
  }

  async create(data: CreateEmpresaDTO): Promise<EmpresaResponseDTO> {
    await this.ensureEnderecoExists(data.enderecoId);
    return this.empresaRepository.create(data);
  }

  async findAll(): Promise<EmpresaResponseDTO[]> {
    return this.empresaRepository.findAll();
  }

  async findById(id: number): Promise<EmpresaResponseDTO> {
    const empresa = await this.empresaRepository.findById(id);

    if (!empresa) {
      throw new Error("Empresa não encontrada.");
    }

    return empresa;
  }

  async update(
    id: number,
    data: UpdateEmpresaDTO,
  ): Promise<EmpresaResponseDTO> {
    await this.findById(id);

    if (data.enderecoId !== undefined) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    return this.empresaRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.empresaRepository.delete(id);
  }
}
