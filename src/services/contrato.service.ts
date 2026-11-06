import { EmpresaRepository } from "@/repositories/empresa.repository";
import { ProjetoRepository } from "@/repositories/projeto.repository";
import { ContratoRepository } from "@/repositories/contrato.repository";
import { VerbaPublicaRepository } from "@/repositories/verba-publica.repository";
import type {
  ContratoResponseDTO,
  CreateContratoDTO,
  UpdateContratoDTO,
} from "@/types/contrato";

export class ContratoService {
  private contratoRepository: ContratoRepository;
  private empresaRepository: EmpresaRepository;
  private projetoRepository: ProjetoRepository;
  private verbaPublicaRepository: VerbaPublicaRepository;

  constructor() {
    this.contratoRepository = new ContratoRepository();
    this.empresaRepository = new EmpresaRepository();
    this.projetoRepository = new ProjetoRepository();
    this.verbaPublicaRepository = new VerbaPublicaRepository();
  }

  private async ensureEmpresaExists(id: number): Promise<void> {
    if (!(await this.empresaRepository.findById(id))) {
      throw new Error("Empresa não encontrada.");
    }
  }

  private async ensureProjetoExists(id: number): Promise<void> {
    if (!(await this.projetoRepository.findById(id))) {
      throw new Error("Projeto não encontrado.");
    }
  }

  private async ensureVerbaPublicaExists(id: number): Promise<void> {
    if (!(await this.verbaPublicaRepository.existsById(id))) {
      throw new Error("Verba pública não encontrada.");
    }
  }

  private async ensureReferencesExist(data: {
    empresaId?: number;
    projetoObraId?: number;
    verbaPublicaId?: number;
  }): Promise<void> {
    if (data.empresaId !== undefined) {
      await this.ensureEmpresaExists(data.empresaId);
    }
    if (data.projetoObraId !== undefined) {
      await this.ensureProjetoExists(data.projetoObraId);
    }
    if (data.verbaPublicaId !== undefined) {
      await this.ensureVerbaPublicaExists(data.verbaPublicaId);
    }
  }

  async create(data: CreateContratoDTO): Promise<ContratoResponseDTO> {
    await this.ensureReferencesExist(data);
    return this.contratoRepository.create(data);
  }

  async findAll(): Promise<ContratoResponseDTO[]> {
    return this.contratoRepository.findAll();
  }

  async findById(id: number): Promise<ContratoResponseDTO> {
    const contrato = await this.contratoRepository.findById(id);

    if (!contrato) {
      throw new Error("Contrato não encontrado.");
    }

    return contrato;
  }

  async update(
    id: number,
    data: UpdateContratoDTO,
  ): Promise<ContratoResponseDTO> {
    const currentContrato = await this.findById(id);
    await this.ensureReferencesExist(data);

    const dataInicio = data.dataInicio ?? currentContrato.dataInicio;
    const dataFim = data.dataFim ?? currentContrato.dataFim;
    if (dataInicio > dataFim) {
      throw new Error("A data de início não pode ser posterior à data de fim.");
    }

    return this.contratoRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.contratoRepository.delete(id);
  }
}
