export interface CreateProjetoVerbaDTO {
  projetoObraId: number;
  verbaPublicaId: number;
  valorAlocado: string;
}

export interface UpdateProjetoVerbaDTO {
  projetoObraId?: number;
  verbaPublicaId?: number;
  valorAlocado?: string;
}

export interface ProjetoVerbaResponseDTO extends CreateProjetoVerbaDTO {
  id: number;
  dataVinculacao: string;
}
