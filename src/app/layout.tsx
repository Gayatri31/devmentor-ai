import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevMentor AI",
  description: "Your personal AI career intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-zinc-950 antialiased`}>
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}