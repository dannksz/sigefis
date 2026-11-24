export function formatCnpj(value: string) {
  return value.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
    .replace(/(\/\d{4})(\d)/, "$1-$2");
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const split = digits.length === 11 ? 5 : 4;
  const prefix = number.slice(0, split);
  const suffix = number.slice(split);
  return `(${areaCode}) ${prefix}${suffix ? `-${suffix}` : ""}`;
}
