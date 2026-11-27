import type { ListQuery } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import { FiscalizacaoRepository } from "@/repositories/fiscalizacao.repository";
import { EvidenciaFiscalizacaoRepository } from "@/repositories/evidencia-fiscalizacao.repository";
import type {
  CreateEvidenciaFiscalizacaoDTO,
  EvidenciaFiscalizacaoResponseDTO,
  UpdateEvidenciaFiscalizacaoDTO,
} from "@/types/evidencia-fiscalizacao";

export class EvidenciaFiscalizacaoService {
  private repository = new EvidenciaFiscalizacaoRepository();
  private fiscalizacaoRepository = new FiscalizacaoRepository();

  async isAssignedInspector(usuarioId: number, fiscalizacaoId: number): Promise<boolean> {
    return Boolean(await prisma.obra_fiscal.findFirst({
      where: { usuarioId, projetoObra: { fiscalizacoes: { some: { id: fiscalizacaoId } } } },
      select: { id: true },
    }));
  }

  private async ensureFiscalizacao(fiscalizacaoId: number): Promise<void> {
    if (!(await this.fiscalizacaoRepository.findById(fiscalizacaoId))) {
      throw new Error("Fiscalização não encontrada.");
    }
  }

  async create(
    data: CreateEvidenciaFiscalizacaoDTO,
  ): Promise<EvidenciaFiscalizacaoResponseDTO> {
    await this.ensureFiscalizacao(data.fiscalizacaoId);
    return this.repository.create(data);
  }

  async findAll(query: ListQuery) {
    return this.repository.findAll(query);
  }

  async findById(id: number): Promise<EvidenciaFiscalizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Evidência não encontrada.");
    return item;
  }

  async findByFileUrl(url: string, legacyUrl: string): Promise<EvidenciaFiscalizacaoResponseDTO | null> {
    return (await this.repository.findByFileUrl(url)) ?? this.repository.findByFileUrl(legacyUrl);
  }

  async update(
    id: number,
    data: UpdateEvidenciaFiscalizacaoDTO,
  ): Promise<EvidenciaFiscalizacaoResponseDTO> {
    await this.findById(id);
    if (data.fiscalizacaoId !== undefined) {
      await this.ensureFiscalizacao(data.fiscalizacaoId);
    }
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}
