import { EmendaParlamentarRepository } from "@/repositories/emenda-parlamentar.repository";
import { VerbaPublicaRepository } from "@/repositories/verba-publica.repository";
import type {
  CreateEmendaParlamentarDTO,
  EmendaParlamentarResponseDTO,
  UpdateEmendaParlamentarDTO,
} from "@/types/emenda-parlamentar";

export class EmendaParlamentarService {
  private emendaRepository: EmendaParlamentarRepository;
  private verbaRepository: VerbaPublicaRepository;

  constructor() {
    this.emendaRepository = new EmendaParlamentarRepository();
    this.verbaRepository = new VerbaPublicaRepository();
  }

  private async ensureVerbaExists(verbaId: number): Promise<void> {
    if (!(await this.verbaRepository.existsById(verbaId))) {
      throw new Error("Verba pública não encontrada.");
    }
  }

  async create(
    data: CreateEmendaParlamentarDTO,
  ): Promise<EmendaParlamentarResponseDTO> {
    await this.ensureVerbaExists(data.verbaId);
    return this.emendaRepository.create(data);
  }

  async findAll(): Promise<EmendaParlamentarResponseDTO[]> {
    return this.emendaRepository.findAll();
  }

  async findById(id: number): Promise<EmendaParlamentarResponseDTO> {
    const emenda = await this.emendaRepository.findById(id);
    if (!emenda) {
      throw new Error("Emenda parlamentar não encontrada.");
    }
    return emenda;
  }

  async update(
    id: number,
    data: UpdateEmendaParlamentarDTO,
  ): Promise<EmendaParlamentarResponseDTO> {
    await this.findById(id);
    if (data.verbaId !== undefined) {
      await this.ensureVerbaExists(data.verbaId);
    }
    return this.emendaRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.emendaRepository.delete(id);
  }
}
