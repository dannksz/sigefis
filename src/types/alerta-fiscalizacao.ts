export interface CreateAlertaFiscalizacaoDTO {
  tipoAlerta: string;
  descricao: string;
  severidade: string;
  statusAlerta: string;
  projetoObraId: number;
  fiscalizacaoId: number;
}

export type UpdateAlertaFiscalizacaoDTO = Partial<CreateAlertaFiscalizacaoDTO>;

export interface AlertaFiscalizacaoResponseDTO
  extends CreateAlertaFiscalizacaoDTO {
  id: number;
  dataGeracao: string;
}
