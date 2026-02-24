import type { Metadata } from "next";
import { Geist, Geist_Mono , Saira_Stencil_One, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import SessionWrapper from "@/components/SessionWrapper";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sairaStencil = Saira_Stencil_One({
  subsets: ['latin'],
  weight: ['400'], // The font only has one weight
  variable: '--font-saira-stencil-one',
});

export const metadata: Metadata = {
  title: "Kayapalat Desi Interior | Transform Your Home in Style",
  description: "Kayapalat  Interior Designing brand offering free 3D design, up to 25 yrs warranty & flat 5% off on 2BHK, 10% off on 3BHK & bungalows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sairaStencil.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionWrapper>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 1750,
              style: {
                background: "#333",
                color: "#fff",
              },
            }}
          />
        </SessionWrapper>


      </body>
    </html>
  );
}
