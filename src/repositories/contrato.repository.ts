import type { contrato } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  ContratoResponseDTO,
  CreateContratoDTO,
  UpdateContratoDTO,
} from "@/types/contrato";

function toResponseDTO(contrato: contrato): ContratoResponseDTO {
  return {
    id: contrato.id,
    numeroContrato: contrato.numeroContrato,
    valorContrato: contrato.valorContrato.toString(),
    dataAssinatura: contrato.dataAssinatura.toISOString().slice(0, 10),
    dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
    dataFim: contrato.dataFim.toISOString().slice(0, 10),
    projetoObraId: contrato.projetoObraId,
    empresaId: contrato.empresaId,
    verbaPublicaId: contrato.verbaPublicaId,
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export class ContratoRepository {
  async create(data: CreateContratoDTO): Promise<ContratoResponseDTO> {
    const contrato = await prisma.contrato.create({
      data: {
        numeroContrato: data.numeroContrato,
        valorContrato: data.valorContrato,
        dataAssinatura: toDate(data.dataAssinatura),
        dataInicio: toDate(data.dataInicio),
        dataFim: toDate(data.dataFim),
        projetoObraId: data.projetoObraId,
        empresaId: data.empresaId,
        verbaPublicaId: data.verbaPublicaId,
      },
    });

    return toResponseDTO(contrato);
  }

  async findAll(): Promise<ContratoResponseDTO[]> {
    const contratos = await prisma.contrato.findMany();
    return contratos.map(toResponseDTO);
  }

  async findById(id: number): Promise<ContratoResponseDTO | null> {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
    });

    return contrato ? toResponseDTO(contrato) : null;
  }

  async update(
    id: number,
    data: UpdateContratoDTO,
  ): Promise<ContratoResponseDTO> {
    const contrato = await prisma.contrato.update({
      where: { id },
      data: {
        ...(data.numeroContrato !== undefined && {
          numeroContrato: data.numeroContrato,
        }),
        ...(data.valorContrato !== undefined && {
          valorContrato: data.valorContrato,
        }),
        ...(data.dataAssinatura !== undefined && {
          dataAssinatura: toDate(data.dataAssinatura),
        }),
        ...(data.dataInicio !== undefined && {
          dataInicio: toDate(data.dataInicio),
        }),
        ...(data.dataFim !== undefined && {
          dataFim: toDate(data.dataFim),
        }),
        ...(data.projetoObraId !== undefined && {
          projetoObraId: data.projetoObraId,
        }),
        ...(data.empresaId !== undefined && { empresaId: data.empresaId }),
        ...(data.verbaPublicaId !== undefined && {
          verbaPublicaId: data.verbaPublicaId,
        }),
      },
    });

    return toResponseDTO(contrato);
  }

  async delete(id: number): Promise<void> {
    await prisma.contrato.delete({
      where: { id },
    });
  }
}
