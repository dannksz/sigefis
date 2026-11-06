export interface CreateVerbaPublicaDTO {
  valor: string;
  origem: string;
  finalidade: string;
  orgaoId: number;
}

export interface UpdateVerbaPublicaDTO {
  valor?: string;
  origem?: string;
  finalidade?: string;
  orgaoId?: number;
}

export interface VerbaPublicaResponseDTO extends CreateVerbaPublicaDTO {
  id: number;
}
