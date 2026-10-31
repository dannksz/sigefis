export interface CreateOrgaoPublicoDTO {
    nome: string;
    sigla: string;
    enderecoId?: number | null;
}

export interface UpdateOrgaoPublicoDTO {
    nome?: string;
    sigla?: string;
    enderecoId?: number | null;
}

export interface OrgaoPublicoResponseDTO {
    id: number;
    nome: string;
    sigla:string;
    enderecoId: number | null;
}