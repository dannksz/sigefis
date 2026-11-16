export interface CreateProcessoRegularizacaoDTO {
  descricaoJustificativa: string;
  statusProcesso: string;
  bloqueioRepasseId: number;
  usuarioId: number;
}

export type UpdateProcessoRegularizacaoDTO =
  Partial<CreateProcessoRegularizacaoDTO>;

export interface ProcessoRegularizacaoResponseDTO
  extends CreateProcessoRegularizacaoDTO {
  id: number;
  dataEnvio: string;
}
