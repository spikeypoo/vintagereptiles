import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Panel",
  description: "dev",
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
