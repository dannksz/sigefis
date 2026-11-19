import prisma from "@/lib/prisma";
import { FiscalizacaoRepository } from "@/repositories/fiscalizacao.repository";
import { RevisaoFiscalizacaoRepository } from "@/repositories/revisao-fiscalizacao.repository";
import { UserRepository } from "@/repositories/user.repository";
import type {
  CreateRevisaoFiscalizacaoDTO,
  RevisaoFiscalizacaoResponseDTO,
  UpdateRevisaoFiscalizacaoDTO,
} from "@/types/revisao-fiscalizacao";

export class RevisaoFiscalizacaoService {
  private repository = new RevisaoFiscalizacaoRepository();
  private fiscalizacaoRepository = new FiscalizacaoRepository();
  private userRepository = new UserRepository();

  async create(
    data: CreateRevisaoFiscalizacaoDTO,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    const fiscalizacao = await this.fiscalizacaoRepository.findById(
      data.fiscalizacaoId,
    );
    if (!fiscalizacao) throw new Error("Fiscalização não encontrada.");
    if (fiscalizacao.usuarioId === data.fiscalExternoId) {
      throw new Error("O fiscal não pode revisar a própria fiscalização.");
    }
    const fiscal = await this.userRepository.findById(data.fiscalExternoId);
    if (!fiscal) throw new Error("Fiscal externo não encontrado.");
    if (fiscal.role !== "FISCAL") {
      throw new Error("Usuário informado não possui o papel FISCAL.");
    }
    const designacao = await prisma.obra_fiscal.findFirst({
      where: {
        usuarioId: data.fiscalExternoId,
        projetoObraId: fiscalizacao.projetoObraId,
        tipoFiscal: "EXTERNO",
      },
    });
    if (!designacao) {
      throw new Error("O fiscal externo não está designado para esta obra.");
    }
    return this.repository.create(data);
  }

  findAll(): Promise<RevisaoFiscalizacaoResponseDTO[]> {
    return this.repository.findAll();
  }

  async findById(id: number): Promise<RevisaoFiscalizacaoResponseDTO> {
    const item = await this.repository.findById(id);
    if (!item) throw new Error("Revisão de fiscalização não encontrada.");
    return item;
  }

  async update(
    id: number,
    data: UpdateRevisaoFiscalizacaoDTO,
  ): Promise<RevisaoFiscalizacaoResponseDTO> {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }

  findByFiscalizacao(
    fiscalizacaoId: number,
  ): Promise<RevisaoFiscalizacaoResponseDTO[]> {
    return this.repository.findByFiscalizacao(fiscalizacaoId);
  }
}
