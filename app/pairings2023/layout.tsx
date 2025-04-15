import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "2023 Pairings",
  description: "dev",
};

export default function Pairings2023Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
