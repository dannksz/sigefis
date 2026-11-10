export interface CreateLiberacaoRecursoDTO {
  valorLiberacao: string;
  dataLiberacao: string;
  verbaPublicaId: number;
  etapaCronogramaId: number;
}

export type UpdateLiberacaoRecursoDTO = Partial<CreateLiberacaoRecursoDTO>;

export interface LiberacaoRecursoResponseDTO
  extends CreateLiberacaoRecursoDTO {
  id: number;
}
