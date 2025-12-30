import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Toaster as CustomToaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexPrep - AI Certification Prep & Practice Tests",
  description: "Streamline your prep for Microsoft, AWS, and Google - AI certifications. Our intelligent microlearning and adaptive practice tests ensure you're exam-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
            <CustomToaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
