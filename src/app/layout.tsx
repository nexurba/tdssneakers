import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TDSSNEAKERS - Sneakers. Style. Attitude.",
    template: "%s | TDSSNEAKERS",
  },
  description:
    "Ta destination n°1 pour les sneakers et vêtements sport & casual au Canada. Air Jordan, Nike, New Balance, Yeezy et plus.",
  keywords: [
    "sneakers",
    "streetwear",
    "vêtements",
    "Jordan",
    "Nike",
    "Canada",
    "mode",
    "TDSSNEAKERS",
  ],
  authors: [{ name: "TDSSNEAKERS" }],
  creator: "TDSSNEAKERS",
  metadataBase: new URL("https://tdssneakers.ca"),
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: "https://tdssneakers.ca",
    siteName: "TDSSNEAKERS",
    title: "TDSSNEAKERS - Sneakers. Style. Attitude.",
    description:
      "Ta destination n°1 pour les sneakers et vêtements sport & casual au Canada.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TDSSNEAKERS - Sneakers. Style. Attitude.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TDSSNEAKERS - Sneakers. Style. Attitude.",
    description:
      "Ta destination n°1 pour les sneakers et vêtements sport & casual au Canada.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
