import type { estado } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { CreateEstadoDTO, UpdateEstadoDTO, EstadoResponseDTO } from '../types/estado';

function toResponseDTO(estado: estado): EstadoResponseDTO {
    return {
        id: estado.id,
        nome: estado.nome,
        sigla: estado.sigla,
        regiao: estado.regiao,
    };
}

export class EstadoRepository {
    async create(data: CreateEstadoDTO): Promise<EstadoResponseDTO> {
        const estado = await prisma.estado.create({
            data: {
                nome: data.nome,
                sigla: data.sigla,
                regiao: data.regiao,
            }
        });

        return toResponseDTO(estado);
    }

    async findAll(): Promise<EstadoResponseDTO[]> {
        const estados = await prisma.estado.findMany();
        return estados.map(toResponseDTO);
    }

    async findById(id: number): Promise<EstadoResponseDTO | null> {
        const estado = await prisma.estado.findUnique({
            where: { id },
        });
        return estado ? toResponseDTO(estado) : null;
    }

    async update(id: number, data: UpdateEstadoDTO): Promise<EstadoResponseDTO> {
        const estado = await prisma.estado.update({
            where: { id },
            data: {
            ...(data.nome !== undefined && { nome: data.nome }),
            ...(data.sigla !== undefined && { sigla: data.sigla }),
            ...(data.regiao !== undefined && { regiao: data.regiao }),
            },
        });

        return toResponseDTO(estado);
    }

    async delete(id: number): Promise<void> {
        await prisma.estado.delete({
            where: { id },
        });
    }
}
    
