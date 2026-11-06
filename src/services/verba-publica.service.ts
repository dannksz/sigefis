import { OrgaoPublicoRepository } from "@/repositories/orgao-publico.repository";
import { VerbaPublicaRepository } from "@/repositories/verba-publica.repository";
import type {
  CreateVerbaPublicaDTO,
  UpdateVerbaPublicaDTO,
  VerbaPublicaResponseDTO,
} from "@/types/verba-publica";

export class VerbaPublicaService {
  private verbaPublicaRepository: VerbaPublicaRepository;
  private orgaoPublicoRepository: OrgaoPublicoRepository;

  constructor() {
    this.verbaPublicaRepository = new VerbaPublicaRepository();
    this.orgaoPublicoRepository = new OrgaoPublicoRepository();
  }

  private async ensureOrgaoExists(orgaoId: number): Promise<void> {
    const orgao = await this.orgaoPublicoRepository.findById(orgaoId);

    if (!orgao) {
      throw new Error("Órgão público não encontrado.");
    }
  }

  async create(data: CreateVerbaPublicaDTO): Promise<VerbaPublicaResponseDTO> {
    await this.ensureOrgaoExists(data.orgaoId);
    return this.verbaPublicaRepository.create(data);
  }

  async findAll(): Promise<VerbaPublicaResponseDTO[]> {
    return this.verbaPublicaRepository.findAll();
  }

  async findById(id: number): Promise<VerbaPublicaResponseDTO> {
    const verba = await this.verbaPublicaRepository.findById(id);

    if (!verba) {
      throw new Error("Verba pública não encontrada.");
    }

    return verba;
  }

  async update(
    id: number,
    data: UpdateVerbaPublicaDTO,
  ): Promise<VerbaPublicaResponseDTO> {
    await this.findById(id);

    if (data.orgaoId !== undefined) {
      await this.ensureOrgaoExists(data.orgaoId);
    }

    return this.verbaPublicaRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.verbaPublicaRepository.delete(id);
  }
}
