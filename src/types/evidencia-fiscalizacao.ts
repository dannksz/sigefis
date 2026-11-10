export interface CreateEvidenciaFiscalizacaoDTO {
  tipoEvidencia: string;
  caminhoArquivo: string;
  latitude: string;
  longitude: string;
  fiscalizacaoId: number;
}

export type UpdateEvidenciaFiscalizacaoDTO =
  Partial<CreateEvidenciaFiscalizacaoDTO>;

export interface EvidenciaFiscalizacaoResponseDTO
  extends CreateEvidenciaFiscalizacaoDTO {
  id: number;
  dataRegistro: string;
}
