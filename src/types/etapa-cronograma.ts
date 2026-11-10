export interface CreateEtapaCronogramaDTO {
  projetoObraId: number;
  nomeEtapa: string;
  ordemEtapa: number;
  percentualPrevisto: string;
  percentualExecutado: string;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataInicioReal?: string | null;
  dataFimReal?: string | null;
  status: string;
}

export type UpdateEtapaCronogramaDTO = Partial<
  Omit<CreateEtapaCronogramaDTO, "projetoObraId">
> & { projetoObraId?: number };

export interface EtapaCronogramaResponseDTO extends CreateEtapaCronogramaDTO {
  id: number;
}
