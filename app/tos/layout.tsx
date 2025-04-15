import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "dev",
};

export default function TOSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
