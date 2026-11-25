export class ContratoBudgetError extends Error {
  constructor(disponivel: number) {
    const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(disponivel);
    super(`O valor do contrato excede o saldo disponível da verba (${amount}).`);
  }
}
