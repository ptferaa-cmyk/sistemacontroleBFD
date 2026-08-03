import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./_components/AppShell";

export const metadata: Metadata = {
  title: "Marte Dashboard",
  description: "Sistema de Gestão de Estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
