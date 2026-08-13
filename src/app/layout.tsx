import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import "./liquid-glass.css";
import "./liquid-glass-dark.css";
import { LanguageProvider } from "@/lib/language-context";
import { ChunkErrorReload } from "@/components/ChunkErrorReload";
import type { Language } from "@/types";

const inter = Inter({ subsets: ["latin"] });

// Heading face for the Liquid Glass theme (design system §13). Exposed as a CSS
// variable only — the glass stylesheets opt into it, so accounts outside the
// glass scope keep Inter headings and never download this file.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

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
  const initialLang: Language =
    rawLang === "en" || rawLang === "it" ? rawLang : "tr";

  const themeScript = `
    (function () {
      var saved = localStorage.getItem('app_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
    })();
  `;

  return (
    <html lang={initialLang} className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <Script src="/api/liquid-ui.js" strategy="afterInteractive" />
        <ChunkErrorReload />
        <LanguageProvider initialLang={initialLang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
