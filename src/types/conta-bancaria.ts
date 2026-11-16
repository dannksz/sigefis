export interface CreateContaBancariaDTO {
  banco: string;
  agencia: string;
  numeroConta: string;
  tipoConta: string;
  orgaoPublicoId: number;
  projetoObraId: number;
}

export type UpdateContaBancariaDTO = Partial<CreateContaBancariaDTO>;

export interface ContaBancariaResponseDTO extends CreateContaBancariaDTO {
  id: number;
}
