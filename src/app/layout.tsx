import type { Metadata } from "next";
import { Inter, Noto_Color_Emoji } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoColorEmoji = Noto_Color_Emoji({
  subsets: ["emoji"],
  weight: "400",
  variable: "--font-noto-color-emoji",
});

export const metadata: Metadata = {
  title: "Ryan Jackman | Portfolio",
  description: "Ryan Jackman's personal portfolio site",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${notoColorEmoji.variable} bg-stone-50 text-neutral-900`}>
        {children}
      </body>
    </html>
  );
}
