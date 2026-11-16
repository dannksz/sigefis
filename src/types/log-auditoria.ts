export interface CreateLogAuditoriaDTO {
  acao: string;
  tabelaAfetada: string;
  registroId: number;
  detalhes: string;
  ipOrigem: string;
  usuarioId: number;
}

export type CreateLogAuditoriaInputDTO = Omit<
  CreateLogAuditoriaDTO,
  "ipOrigem" | "usuarioId"
>;

export type UpdateLogAuditoriaDTO = Partial<CreateLogAuditoriaDTO>;

export interface LogAuditoriaResponseDTO extends CreateLogAuditoriaDTO {
  id: number;
  dataHora: string;
}
