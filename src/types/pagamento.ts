export interface CreatePagamentoDTO {
  valorPagamento: string;
  dataPagamento: string;
  numeroNotaFiscal: string;
  contratoId: number;
  etapaCronogramaId: number;
}

export type UpdatePagamentoDTO = Partial<CreatePagamentoDTO>;

export interface PagamentoResponseDTO extends CreatePagamentoDTO {
  id: number;
}
