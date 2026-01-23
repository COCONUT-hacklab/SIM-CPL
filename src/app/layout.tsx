import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Font default Next.js
import "./globals.css"; // Import CSS Global (Tailwind)

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIM-CPL FT Unismuh",
  description: "Sistem Informasi Manajemen Capaian Pembelajaran Lulusan",
  icons: {
    icon: "/favicon.ico", // Pastikan ada favicon di folder public jika mau
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}