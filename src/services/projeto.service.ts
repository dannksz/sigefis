import type { ListQuery } from "@/lib/pagination";
import { EnderecoRepository } from "@/repositories/endereco.repository";
import { CidadeRepository } from "@/repositories/cidade.repository";
import { EstadoRepository } from "@/repositories/estado.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import type {
  CreateProjetoDTO,
  ProjetoResponseDTO,
  UpdateProjetoDTO,
} from "@/types/projeto";

export class ProjetoService {
  private projetoRepository: ProjetoRepository;
  private enderecoRepository: EnderecoRepository;
  private cidadeRepository: CidadeRepository;
  private estadoRepository: EstadoRepository;

  constructor() {
    this.projetoRepository = new ProjetoRepository();
    this.enderecoRepository = new EnderecoRepository();
    this.cidadeRepository = new CidadeRepository();
    this.estadoRepository = new EstadoRepository();
  }

  private async ensureEnderecoExists(enderecoId: number): Promise<void> {
    const endereco = await this.enderecoRepository.findById(enderecoId);

    if (!endereco) {
      throw new Error("Endereço não encontrado.");
    }
  }

  async create(data: CreateProjetoDTO): Promise<ProjetoResponseDTO> {
    if (data.enderecoId !== undefined) {
      await this.ensureEnderecoExists(data.enderecoId);
    } else if (data.endereco.cidadeId !== undefined) {
      if (!(await this.cidadeRepository.findById(data.endereco.cidadeId))) {
        throw new Error("Cidade não encontrada.");
      }
    } else if (!(await this.estadoRepository.findById(data.endereco.cidade.estadoId))) {
      throw new Error("Estado não encontrado.");
    }
    return this.projetoRepository.create(data);
  }

  async findAll(query: ListQuery) {
    return this.projetoRepository.findAll(query);
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
    if (data.endereco?.cidadeId !== undefined && !(await this.cidadeRepository.findById(data.endereco.cidadeId))) {
      throw new Error("Cidade não encontrada.");
    }
    if (data.endereco && data.endereco.cidadeId === undefined && !(await this.estadoRepository.findById(data.endereco.cidade.estadoId))) {
      throw new Error("Estado não encontrado.");
    }

    return this.projetoRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.projetoRepository.delete(id);
  }
}
