//Contratos de Entrada e Saída para o modulo de Usuários (SIGEFIS)

export type UserRole = 'ADMIN' | 'FISCAL' | 'GESTOR' | 'USER';

export interface CreateUserDTO {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  cnpj?: string | null;
  dataNascimento?: Date | string | null;
  role: UserRole;
  enderecoId?: number | null;
}

export interface UpdateUserDTO {
  nome?: string;
  email?: string;
  senha?: string;
  cpf?: string;
  cnpj?: string | null;
  dataNascimento?: Date | string | null;
  role?: UserRole;
  enderecoId?: number | null;
}

export interface UserResponseDTO {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  cnpj?: string | null;
  role: UserRole;
  criadoEm: Date;
  atualizadoEm: Date;
}