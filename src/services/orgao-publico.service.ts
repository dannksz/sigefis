import { EnderecoRepository } from "@/repositories/endereco.repository";
import { OrgaoPublicoRepository } from "@/repositories/orgao-publico.repository";
import type {
  CreateOrgaoPublicoDTO,
  OrgaoPublicoResponseDTO,
  UpdateOrgaoPublicoDTO,
} from "@/types/orgao-publico";

export class OrgaoPublicoService {
  private orgaoPublicoRepository: OrgaoPublicoRepository;
  private enderecoRepository: EnderecoRepository;

  constructor() {
    this.orgaoPublicoRepository = new OrgaoPublicoRepository();
    this.enderecoRepository = new EnderecoRepository();
  }

  private async ensureEnderecoExists(enderecoId: number): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);

    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }
  }

  async create(
    data: CreateOrgaoPublicoDTO,
  ): Promise<OrgaoPublicoResponseDTO> {
    if (data.enderecoId != null) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    return this.orgaoPublicoRepository.create(data);
  }

  async findAll(): Promise<OrgaoPublicoResponseDTO[]> {
    return this.orgaoPublicoRepository.findAll();
  }

  async findById(id: number): Promise<OrgaoPublicoResponseDTO> {
    const orgaoPublico = await this.orgaoPublicoRepository.findById(id);

    if (!orgaoPublico) {
      throw new Error("Órgão público não encontrado.");
    }

    return orgaoPublico;
  }

  async update(
    id: number,
    data: UpdateOrgaoPublicoDTO,
  ): Promise<OrgaoPublicoResponseDTO> {
    await this.findById(id);

    if (data.enderecoId != null) {
      await this.ensureEnderecoExists(data.enderecoId);
    }

    return this.orgaoPublicoRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.orgaoPublicoRepository.delete(id);
  }
}