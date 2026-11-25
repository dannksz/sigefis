export class VerbaPublicaBudgetError extends Error {
  constructor(minimum: number) {
    const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(minimum);
    super(`O valor da verba não pode ficar abaixo do total comprometido em contratos (${amount}).`);
  }
}
