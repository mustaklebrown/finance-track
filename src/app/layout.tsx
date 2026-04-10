import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Finance Hub",
    template: "%s | Finance Hub"
  },
  description: "L'application ultime de gestion de tableaux de bord financiers, d'analyses commerciales et de suivi des ventes pour les entreprises dynamiques.",
  applicationName: "Finance Hub",
  keywords: ["Finance", "Dashboard", "Sales", "Analytics", "Business Management", "Accounting", "SaaS", "Comores"],
  authors: [{ name: "Finance Hub Team" }],
  creator: "Finance Hub Team",
  publisher: "Finance Hub",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://finance-track.com",
    title: "Finance Hub - Le Tableau de Bord Financier de Référence",
    description: "Plateforme centralisée pour vos données financières, le suivi des ventes et l'analytique commerciale.",
    siteName: "Finance Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finance Hub Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance Hub - Analyse et Suivi Financier",
    description: "Améliorez votre gestion avec un tableau de bord financier complet et intelligent.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex text-zinc-900 dark:text-zinc-50 dark:bg-black bg-zinc-50">
        <Sidebar />
        <main className="flex-1 lg:pl-64 flex flex-col min-h-screen relative w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
