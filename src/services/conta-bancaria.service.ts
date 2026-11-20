import type { ListQuery } from "@/lib/pagination";
import { ContaBancariaRepository } from "@/repositories/conta-bancaria.repository";
import { OrgaoPublicoRepository } from "@/repositories/orgao-publico.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import type {
  ContaBancariaResponseDTO,
  CreateContaBancariaDTO,
  UpdateContaBancariaDTO,
} from "@/types/conta-bancaria";

export class ContaBancariaService {
  private repository = new ContaBancariaRepository();
  private orgaoRepository = new OrgaoPublicoRepository();
  private projetoRepository = new ProjetoRepository();

  private async ensureReferences(data: {
    orgaoPublicoId?: number;
    projetoObraId?: number;
  }): Promise<void> {
    if (
      data.orgaoPublicoId !== undefined &&
      !(await this.orgaoRepository.findById(data.orgaoPublicoId))
    ) {
      throw new Error("Órgão público não encontrado.");
    }
    if (
      data.projetoObraId !== undefined &&
      !(await this.projetoRepository.findById(data.projetoObraId))
    ) {
      throw new Error("Projeto não encontrado.");
    }
  }

  async create(data: CreateContaBancariaDTO): Promise<ContaBancariaResponseDTO> {
    await this.ensureReferences(data);
    return this.repository.create(data);
  }

  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<ContaBancariaResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Conta bancária não encontrada.");
    return item;
  }

  async update(
    id: number,
    data: UpdateContaBancariaDTO,
  ): Promise<ContaBancariaResponseDTO> {
    await this.findById(id);
    await this.ensureReferences(data);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
