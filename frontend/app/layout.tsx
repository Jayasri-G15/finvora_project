import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finvora AI — Autonomous Financial Management",
  description: "Enterprise-grade AI-powered financial management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // No className here — ThemeToggle manages 'dark'/'light' class client-side
    // :root is dark by default, .light class activates light mode
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(var(--bg-elevated))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
