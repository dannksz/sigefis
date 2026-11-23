import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro | SIGEFIS",
  description: "Crie sua conta de acesso ao SIGEFIS.",
};

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
