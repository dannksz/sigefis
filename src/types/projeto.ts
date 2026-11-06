export interface CreateProjetoDTO {
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}

export interface UpdateProjetoDTO {
  nome?: string;
  descricao?: string;
  finalidade?: string;
  enderecoId?: number;
}

export interface ProjetoResponseDTO {
  id: number;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}
