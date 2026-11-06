export interface CreateContratoDTO {
  numeroContrato: string;
  valorContrato: string;
  dataAssinatura: string;
  dataInicio: string;
  dataFim: string;
  projetoObraId: number;
  empresaId: number;
  verbaPublicaId: number;
}

export interface UpdateContratoDTO {
  numeroContrato?: string;
  valorContrato?: string;
  dataAssinatura?: string;
  dataInicio?: string;
  dataFim?: string;
  projetoObraId?: number;
  empresaId?: number;
  verbaPublicaId?: number;
}

export interface ContratoResponseDTO extends CreateContratoDTO {
  id: number;
}
