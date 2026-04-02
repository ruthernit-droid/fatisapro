import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fatisa Pro - Mimarlık Ofisi Yönetimi",
  description: "Proje, kişi ve finans yönetimi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${geist.className} antialiased bg-neutral-50 h-full`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#6366f1", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
