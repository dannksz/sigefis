export interface CreateProjetoDTO {
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}

export interface UpdateProjetoDTO {
  publicado?: boolean;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}

export interface ProjetoResponseDTO {
  publicado: boolean;
  id: number;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}
