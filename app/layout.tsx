import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import ReduxProvider from "@/store/ReduxProvider";
import ToastProvider from "@/lib/ToastProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fahim Academy - Coaching Management System",
  description: "Professional coaching management system for Fahim Academy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <AuthProvider>{children}</AuthProvider>
          <ToastProvider />
        </ReduxProvider>
      </body>
    </html>
  );
}
