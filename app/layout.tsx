import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Sistem Administrasi Padukuhan Majegan",
  description: "Pandowoharjo, Sleman, D.I. Yogyakarta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#1a6b3c', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#e63946', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
