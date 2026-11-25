export class ContratoBudgetError extends Error {
  constructor(disponivel: number, limit: "verba" | "obra" = "verba") {
    const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(disponivel);
    super(limit === "obra"
      ? `O valor do contrato excede o saldo da verba alocada a esta obra (${amount}).`
      : `O valor do contrato excede o saldo disponível da verba (${amount}).`);
  }
}
