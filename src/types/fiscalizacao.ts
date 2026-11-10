export interface CreateFiscalizacaoDTO {
  dataVistoria: string;
  percentualExecutado: string;
  parecerTecnico: string;
  statusVistoria: string;
  projetoObraId: number;
  usuarioId: number;
  etapaCronogramaId: number;
}

export type UpdateFiscalizacaoDTO = Partial<CreateFiscalizacaoDTO>;

export interface FiscalizacaoResponseDTO extends CreateFiscalizacaoDTO {
  id: number;
}
