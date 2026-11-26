import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { evidencia_fiscalizacao, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  CreateEvidenciaFiscalizacaoDTO,
  EvidenciaFiscalizacaoResponseDTO,
  UpdateEvidenciaFiscalizacaoDTO,
} from "@/types/evidencia-fiscalizacao";

function toResponseDTO(
  item: evidencia_fiscalizacao,
): EvidenciaFiscalizacaoResponseDTO {
  return {
    id: item.id,
    publicado: item.publicado,
    tipoEvidencia: item.tipoEvidencia,
    caminhoArquivo: item.caminhoArquivo,
    latitude: item.latitude,
    longitude: item.longitude,
    dataRegistro: item.dataRegistro.toISOString(),
    fiscalizacaoId: item.fiscalizacaoId,
  };
}

function toCreateData(
  data: CreateEvidenciaFiscalizacaoDTO,
): Prisma.evidencia_fiscalizacaoUncheckedCreateInput {
  return data;
}

function toUpdateData(
  data: UpdateEvidenciaFiscalizacaoDTO,
): Prisma.evidencia_fiscalizacaoUncheckedUpdateInput {
  return { ...data, ...(data.caminhoArquivo !== undefined && { publicado: false }) };
}

export class EvidenciaFiscalizacaoRepository {
  async create(
    data: CreateEvidenciaFiscalizacaoDTO,
  ): Promise<EvidenciaFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.evidencia_fiscalizacao.create({ data: toCreateData(data) }),
    );
  }

  async findAll(query: ListQuery): Promise<PaginatedResult<EvidenciaFiscalizacaoResponseDTO>> {
    const where = {
      ...(query.busca ? { tipoEvidencia: { contains: query.busca } } : {}),
      ...(query.fiscalizacaoId ? { fiscalizacaoId: Number(query.fiscalizacaoId) } : {}),
    };
    return paginate({
      query,
      count: () => prisma.evidencia_fiscalizacao.count({ where }),
      findMany: ({ skip, take }) => prisma.evidencia_fiscalizacao.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

  async findById(
    id: number,
  ): Promise<EvidenciaFiscalizacaoResponseDTO | null> {
    const item = await prisma.evidencia_fiscalizacao.findUnique({ where: { id } });
    return item ? toResponseDTO(item) : null;
  }

  async findByFileUrl(url: string): Promise<EvidenciaFiscalizacaoResponseDTO | null> {
    const item = await prisma.evidencia_fiscalizacao.findFirst({
      where: { caminhoArquivo: url },
    });
    return item ? toResponseDTO(item) : null;
  }

  async update(
    id: number,
    data: UpdateEvidenciaFiscalizacaoDTO,
  ): Promise<EvidenciaFiscalizacaoResponseDTO> {
    return toResponseDTO(
      await prisma.evidencia_fiscalizacao.update({
        where: { id },
        data: toUpdateData(data),
      }),
    );
  }

  async delete(id: number): Promise<void> {
    await prisma.evidencia_fiscalizacao.delete({ where: { id } });
  }
}
