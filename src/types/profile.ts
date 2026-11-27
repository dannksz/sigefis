export type ProfileAddress = {
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
};

export type Profile = {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  cnpj: string | null;
  dataNascimento: string | null;
  endereco: ProfileAddress | null;
};
