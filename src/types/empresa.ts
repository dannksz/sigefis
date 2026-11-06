export interface CreateEmpresaDTO {
  nome: string;
  cnpj: string;
  representanteLegal: string;
  telefone: string;
  email: string;
  enderecoId: number;
}

export interface UpdateEmpresaDTO {
  nome?: string;
  cnpj?: string;
  representanteLegal?: string;
  telefone?: string;
  email?: string;
  enderecoId?: number;
}

export interface EmpresaResponseDTO {
  id: number;
  nome: string;
  cnpj: string;
  representanteLegal: string;
  telefone: string;
  email: string;
  enderecoId: number;
}
