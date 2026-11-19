export type StatusRevisaoFiscalizacao =
  | "PENDENTE"
  | "APROVADA"
  | "CONTESTADA"
  | "CORRECAO_SOLICITADA";

export interface CreateRevisaoFiscalizacaoDTO {
  fiscalizacaoId: number;
  fiscalExternoId: number;
  statusRevisao: StatusRevisaoFiscalizacao;
  parecer: string;
}

export interface UpdateRevisaoFiscalizacaoDTO {
  statusRevisao?: StatusRevisaoFiscalizacao;
  parecer?: string;
}

export interface RevisaoFiscalizacaoResponseDTO
  extends CreateRevisaoFiscalizacaoDTO {
  id: number;
  dataRevisao: string;
}
