export interface CreateObraFiscalDTO {
  dataDesignacao: string;
  usuarioId: number;
  projetoObraId: number;
}

export interface UpdateObraFiscalDTO {
  dataDesignacao?: string;
  usuarioId?: number;
  projetoObraId?: number;
}

export interface ObraFiscalResponseDTO extends CreateObraFiscalDTO {
  id: number;
}
