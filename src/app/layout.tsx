import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "TÁNAMÃO | Encontre profissionais", description: "Encontre profissionais perto de você e fale diretamente pelo WhatsApp." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
