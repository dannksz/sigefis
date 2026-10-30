export interface CreateEnderecoDTO {
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cep: string;
    cidadeId: number;
}

export interface UpdateEnderecoDTO {
    logradouro?: string;
    numero?: string;
    complemento?: string | null;
    bairro?: string;
    cep?: string;
    cidadeId?: number;
}

export interface EnderecoResponseDTO {
    id: number;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cep: string;
    cidadeId: number;
}