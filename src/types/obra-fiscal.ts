export interface CreateObraFiscalDTO {
  dataDesignacao: string;
  usuarioId: number;
  projetoObraId: number;
  tipoFiscal: "INTERNO" | "EXTERNO";
}

export interface UpdateObraFiscalDTO {
  dataDesignacao: string;
  usuarioId: number;
  projetoObraId: number;
  tipoFiscal: "INTERNO" | "EXTERNO";
}

export interface ObraFiscalResponseDTO extends CreateObraFiscalDTO {
  id: number;
  tipoFiscal: "INTERNO" | "EXTERNO";
}
