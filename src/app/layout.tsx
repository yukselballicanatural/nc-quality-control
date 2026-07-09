import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { ChunkErrorReload } from "@/components/ChunkErrorReload";
import type { Language } from "@/types";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Natural Clinic QC",
  description: "Natural Clinic Kalite Kontrol Sistemi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLang = cookieStore.get("lang")?.value;
  const initialLang: Language = rawLang === "en" ? "en" : "tr";

  return (
    <html lang={initialLang}>
      <body className={inter.className}>
        <ChunkErrorReload />
        <LanguageProvider initialLang={initialLang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
