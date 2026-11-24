interface ViaCepResponse {
  erro?: boolean | string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export async function consultarCep(cep: string, signal?: AbortSignal) {
  const input = cep.trim();
  if (!/^\d{5}-?\d{3}$/.test(input)) {
    throw new Error("O CEP deve ter oito dígitos.");
  }

  const digits = input.replace("-", "");
  const timeout = AbortSignal.timeout(5000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let data: ViaCepResponse;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: requestSignal,
      credentials: "omit",
    });
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Não foi possível consultar o CEP agora.");
  }

  if (data?.erro === true || data?.erro === "true") throw new Error("CEP não encontrado.");
  if (typeof data?.localidade !== "string" || typeof data.uf !== "string") {
    throw new Error("O serviço de CEP não retornou uma localização válida.");
  }
  return {
    cep: digits,
    logradouro: data.logradouro ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade,
    uf: data.uf,
  };
}
