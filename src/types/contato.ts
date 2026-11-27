export const motivosContato = {
  DUVIDA_OBRA: "Dúvida sobre uma obra",
  CORRECAO_DADOS: "Correção de informações",
  IRREGULARIDADE: "Possível irregularidade",
  PROBLEMA_PORTAL: "Problema no portal",
  SUGESTAO: "Sugestão",
  OUTRO: "Outro",
} as const;

export type MotivoContato = keyof typeof motivosContato;

export type ContatoInput = {
  nome: string;
  email: string;
  telefone: string;
  motivo: MotivoContato;
  mensagem: string;
};

export type MensagemContato = Omit<ContatoInput, "motivo"> & { id: number; motivo: string; criadoEm: string };
