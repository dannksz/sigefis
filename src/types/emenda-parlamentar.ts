export interface CreateEmendaParlamentarDTO {
  numero: string;
  autor: string;
  valor: string;
  verbaId: number;
}

export interface UpdateEmendaParlamentarDTO {
  numero?: string;
  autor?: string;
  valor?: string;
  verbaId?: number;
}

export interface EmendaParlamentarResponseDTO
  extends CreateEmendaParlamentarDTO {
  id: number;
}
