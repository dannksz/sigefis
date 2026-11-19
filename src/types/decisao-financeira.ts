export interface DecisaoFinanceiraResponseDTO {
  id: number;
  tipoOperacao: "PAGAMENTO" | "LIBERACAO";
  operacaoId: number;
  status: "APROVADA" | "REJEITADA";
  justificativa: string;
  usuarioId: number;
  dataDecisao: string;
}
