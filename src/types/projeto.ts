import type { CreateEnderecoDTO } from "@/types/endereco";

export type CreateProjetoEnderecoDTO =
  | CreateEnderecoDTO
  | (Omit<CreateEnderecoDTO, "cidadeId"> & {
      cidade: { nome: string; estadoId: number };
      cidadeId?: never;
    });

interface CreateProjetoBaseDTO {
  dataConclusao?: string | null;
  nome: string;
  descricao: string;
  finalidade: string;
}

export type CreateProjetoDTO = CreateProjetoBaseDTO &
  (
    | { enderecoId: number; endereco?: never }
    | { endereco: CreateProjetoEnderecoDTO; enderecoId?: never }
  );

export interface UpdateProjetoDTO {
  dataConclusao?: string | null;
  publicado?: boolean;
  nome?: string;
  descricao?: string;
  finalidade?: string;
  enderecoId?: number;
  endereco?: CreateProjetoEnderecoDTO;
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
