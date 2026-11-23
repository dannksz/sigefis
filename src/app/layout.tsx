import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGEFIS | Transparência em obras públicas",
  description: "Consulte obras públicas, contratos e informações sobre a aplicação dos recursos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
