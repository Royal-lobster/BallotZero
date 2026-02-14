import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

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
    default: "BallotZero",
    template: "%s | BallotZero",
  },
  description:
    "Run elections and polls where every vote is private and every result is provably fair. Trustless, verifiable elections with homomorphic encryption.",
  metadataBase: new URL("https://ballotzero.vercel.app"),
  openGraph: {
    title: "BallotZero",
    description:
      "Trustless, verifiable elections with homomorphic encryption. No one — not even the organizer — can see how you voted.",
    siteName: "BallotZero",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BallotZero",
    description:
      "Trustless, verifiable elections with homomorphic encryption. No one — not even the organizer — can see how you voted.",
  },
  keywords: [
    "voting",
    "election",
    "privacy",
    "homomorphic encryption",
    "verifiable",
    "trustless",
    "anonymous voting",
    "cryptographic voting",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
