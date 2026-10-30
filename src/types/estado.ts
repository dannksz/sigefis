export interface CreateEstadoDTO {
    nome: string;
    sigla: string;
    regiao: string;
}

export interface UpdateEstadoDTO {
    nome?: string;
    sigla?: string;
    regiao?: string;
}

export interface EstadoResponseDTO {
    id: number;
    nome: string;
    sigla: string;
    regiao: string;
}