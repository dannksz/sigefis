export const logAuditoriaCategorias = [
  "login",
  "obras",
  "financeiro",
  "fiscalizacao",
] as const;

export type LogAuditoriaCategoria = (typeof logAuditoriaCategorias)[number];

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

export interface LogAuditoriaResponseDTO extends Omit<CreateLogAuditoriaDTO, "usuarioId"> {
  usuarioNome?: string | null;
  obraNome?: string | null;
  id: number;
  dataHora: string;
  usuarioId: number | null;
}
