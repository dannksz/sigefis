export interface CreateBloqueioRepasseDTO {
  motivoBloqueio: string;
  statusBloqueio: string;
  projetoObraId: number;
  alertaFiscalizacaoId: number;
}

export interface UpdateBloqueioRepasseDTO {
  motivoBloqueio: string;
  statusBloqueio: string;
  dataDesbloqueio?: string | null;
  projetoObraId: number;
  alertaFiscalizacaoId: number;
}

export interface BloqueioRepasseResponseDTO
  extends CreateBloqueioRepasseDTO {
  id: number;
  dataBloqueio: string;
  dataDesbloqueio?: string | null;
}
