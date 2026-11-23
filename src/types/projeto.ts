export interface CreateProjetoDTO {
  dataConclusao?: string | null;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}

export interface UpdateProjetoDTO {
  dataConclusao?: string | null;
  publicado?: boolean;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}

export interface ProjetoResponseDTO {
  dataConclusao: string | null;
  publicado: boolean;
  id: number;
  nome: string;
  descricao: string;
  finalidade: string;
  enderecoId: number;
}
