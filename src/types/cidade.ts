export interface CreateCidadeDTO {
    nome: string;
    estadoId: number;
}

export interface UpdateCidadeDTO {
    nome?: string;
    estadoId?: number;
}

export interface CidadeResponseDTO {
    id: number;
    nome: string;
    estadoId: number;
}
