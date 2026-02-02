import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: [
    {
      path: "../public/fonts/Geist-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Geist-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geist",
});

const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/GeistMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Aplikasi Tugas",
  description: "Untuk Mengatur tugas, dan absensi siswa, sehingga diakhir sudha ada rekapannya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
