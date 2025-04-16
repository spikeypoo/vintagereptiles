import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from 'next/link';
import MenuButton from './menubutton';
import CartNumber from './cartnum';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from './footer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vintage Reptiles",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  function openModal() {}

  return (
    <html lang="en">
      <body className="bg-[#1c1a1b] flex flex-col min-h-screen h-[100%] w-[100%]">
        <div className="flex bg-[#161414] w-screen h-[66px] md:h-28 border-b justify-center sticky top-0 z-10">
          <div className="hidden md:flex md:text-white md:text-xl md:space-x-10 md:items-center md:whitespace-nowrap">
            <div className="w-[90px] h-[83.5px]">
              <Link href="/"><Image className="transition ease-in-out hover:scale-105 duration-200 cursor-pointer overflow-hidden" src='/images/logo-bg.png' width={90} height={83.5} alt="Vintage Reptiles"></Image></Link>
            </div>
            <Link href="/"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">Home</button></Link>
            <Link href="/tos"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">Terms of Service</button></Link>
            <Link href="/shop/availability"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">Geckos</button></Link>
            <Link href="/shop/isopods"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">Isopods</button></Link>
            <Link href="/shop/plants"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">Plants</button></Link>
            <Link href="/shop/prints"><button className="transition ease-in-out hover:text-[#cb18db] hover:scale-95 duration-200">3D Prints</button></Link>
            <div className="group relative">
              <button className="transition ease-in-out group-hover:text-[#cb18db] group-hover:scale-95 duration-200">Pairings</button>
              <ul className="transition opacity-0 ease-in-out absolute block top-[-20%] group-hover:translate-y-[30px] group-hover:opacity-100 group-hover:pointer-events-auto group-hover:pt-4 duration-100 pointer-events-none scale-110 drop-shadow-xl">
                <div className="divide-y bg-[#161414] outline-double outline-1 py-1 rounded-md">
                  <li><Link href="/pairings2024"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200">2024</button></Link></li>
                  <li><Link href="/pairings2023"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200">2023</button></Link></li>
                  <li><Link href="/pairings2022"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200">2022</button></Link></li>
                </div>
              </ul>
            </div>
            <div className="group relative">
              <button className="transition ease-in-out group-hover:text-[#cb18db] group-hover:scale-95 duration-200">Breeders</button>
              <ul className="transition opacity-0 ease-in-out absolute block top-[-20%] group-hover:translate-y-[30px] group-hover:opacity-100 group-hover:pointer-events-auto group-hover:pt-4 duration-100 pointer-events-none scale-110 drop-shadow-xl">
                <div className="divide-y bg-[#161414] outline-double outline-1 py-1 rounded-md text-center">
                  <li><Link href="/breeders/malecrestedgeckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Male Crested Geckos</button></Link></li>
                  <li><Link href="/breeders/femalecrestedgeckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Female Crested Geckos</button></Link></li>
                  <li><Link href="/breeders/malegargoylegeckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Male Gargoyle Geckos</button></Link></li>
                  <li><Link href="/breeders/femalegargoylegeckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Female Gargoyle Geckos</button></Link></li>
                  <li><Link href="/breeders/malechahouageckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Male Chahoua Geckos</button></Link></li>
                  <li><Link href="/breeders/femalechahouageckos"><button className="transition ease-in-out relative px-7 hover:text-[#cb18db] duration-200 text-[18px]">Female Chahoua Geckos</button></Link></li>
                </div>
              </ul>
            </div>
            <Link href="/cart" className="relative"><img src="/images/shoppingbag.png" className="w-[30px] transition ease-in-out fill-white hover:text-[#cb18db] hover:scale-95 duration-200"></img><CartNumber></CartNumber></Link>
          </div>
          <div className="flex-1 md:hidden"></div>
          <div className="flex items-center md:hidden">
            <div className="flex-1"></div>
            <Link href="./"><Image className="transition ease-in-out hover:scale-105 duration-200 cursor-pointer" src='/images/logo-bg.png' width={55} height={124.25} alt="Vintage Reptiles"></Image></Link>
          </div>
          <div className="flex-1 md:hidden">
            <MenuButton></MenuButton>
          </div>
        </div>
        <div className="flex-1">
          {children}
          <SpeedInsights />
        </div>
        <Footer/>
      </body>
    </html>
  );
}
