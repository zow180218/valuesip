import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ValueSip — 飲食コスパマップ",
  description:
    "今夜どこで飲む？幹事も一人飲みも、価格から逆算して最適な店を即決できる飲食コスパマップ",
  keywords: ["居酒屋", "ハッピーアワー", "コスパ", "渋谷", "新宿", "幹事"],
  openGraph: {
    title: "ValueSip — 飲食コスパマップ",
    description: "価格から逆算して最適な店を即決",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="h-screen overflow-hidden bg-white">{children}</body>
    </html>
  );
}
