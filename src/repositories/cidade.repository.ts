import type { cidade } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { CidadeResponseDTO, CreateCidadeDTO, UpdateCidadeDTO } from '@/types/cidade';

function toResponseDTO(cidade: cidade): CidadeResponseDTO {
    return {
        id: cidade.id,
        nome: cidade.nome,
        estadoId: cidade.estadoId,
    };
}

export class CidadeRepository {
    async create(data: CreateCidadeDTO): Promise<CidadeResponseDTO> {
        const cidade = await prisma.cidade.create({
            data: {
                nome: data.nome,
                estadoId: data.estadoId,
            },
        });

        return toResponseDTO(cidade);
    }

    async findAll(): Promise<CidadeResponseDTO[]> {
        const cidades = await prisma.cidade.findMany();
        return cidades.map(toResponseDTO);
    }

    async findById(id: number): Promise<CidadeResponseDTO | null> {
        const cidade = await prisma.cidade.findUnique({
            where: { id },
        });

        return cidade ? toResponseDTO(cidade) : null;
    }

    async update(id: number, data: UpdateCidadeDTO): Promise<CidadeResponseDTO> {
        const cidade = await prisma.cidade.update({
            where: { id },
            data: {
                ...(data.nome !== undefined && { nome: data.nome }),
                ...(data.estadoId !== undefined && { estadoId: data.estadoId }),
            },
        });

        return toResponseDTO(cidade);
    }

    async delete(id: number): Promise<void> {
        await prisma.cidade.delete({
            where: { id },
        });
    }
}
