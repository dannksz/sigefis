import { paginate, type ListQuery, type PaginatedResult } from "@/lib/pagination";
import type { orgao_publico } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { CreateOrgaoPublicoDTO, OrgaoPublicoResponseDTO, UpdateOrgaoPublicoDTO } from "@/types/orgao-publico";

function toResponseDTO(
    orgaoPublico: orgao_publico,
): OrgaoPublicoResponseDTO {
    return {
        id: orgaoPublico.id,
        nome: orgaoPublico.nome,
        sigla: orgaoPublico.sigla,
        enderecoId: orgaoPublico.enderecoId,
    };
}

export class OrgaoPublicoRepository {
    async create(
        data: CreateOrgaoPublicoDTO,
    ): Promise<OrgaoPublicoResponseDTO> {
        const orgaoPublico = await prisma.orgao_publico.create({
            data: {
                nome: data.nome,
                sigla: data.sigla,
                enderecoId: data.enderecoId,
            },
        });

        return toResponseDTO(orgaoPublico); 
    }

    async findAll(query: ListQuery): Promise<PaginatedResult<OrgaoPublicoResponseDTO>> {
      const where = {
        ...(query.busca ? { OR: [{ nome: { contains: query.busca } }, { sigla: { contains: query.busca } }] } : {}),
        ...(query.cidadeId || query.estadoId ? {
          endereco: {
            cidade: {
              ...(query.cidadeId ? { id: query.cidadeId } : {}),
              ...(query.estadoId ? { estadoId: query.estadoId } : {}),
            },
          },
        } : {}),
      };
    return paginate({
      query,
        count: () => prisma.orgao_publico.count({ where }),
        findMany: ({ skip, take }) => prisma.orgao_publico.findMany({ skip, take, where }),
      map: toResponseDTO,
    });
  }

    async findById(id: number): Promise<OrgaoPublicoResponseDTO | null> {
        const orgaoPublico = await prisma.orgao_publico.findUnique({
            where: { id },
        });

        return orgaoPublico ? toResponseDTO(orgaoPublico) : null;
    }

    async update(
        id: number,
        data: UpdateOrgaoPublicoDTO,
    ): Promise<OrgaoPublicoResponseDTO> {
        const orgaoPublico = await prisma.orgao_publico.update({
        where: { id },
        data: {
            ...(data.nome !== undefined && { nome: data.nome }),
            ...(data.sigla !== undefined && { sigla: data.sigla }),
            ...(data.enderecoId !== undefined && {
            enderecoId: data.enderecoId,
            }),
        },
        });

        return toResponseDTO(orgaoPublico);
    }

    async delete(id: number): Promise<void> {
        await prisma.orgao_publico.delete({
        where: { id },
        });
    }
}