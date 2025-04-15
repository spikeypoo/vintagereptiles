"use client";

import Image from "next/image";
import Link from 'next/link'
import '../globals.css'
import { AppProps } from 'next/app'
import { useState } from 'react'
import { useEffect } from 'react'

export default function Home() {
  return (
    <div className="mb-[100px]">
      <div className="text-center text-white text-xl flex justify-center pt-[90px]">
        <div className="w-[90%] max-w-[900px] pt-[35px] text-3xl">
          <div>Thank you for your order!</div>

          <div className="text-2xl pt-[20px] scale-[90%]">
            <div>You will receive an email confirmation of your order.</div>
          </div>

          <div className="flex justify-center text-white text-md pt-[30px]"><Link href="/" className="w-[320px] bg-[#cb18db] text-center py-[10px] rounded-full font-bold transition outline outline-white outline-3 ease-in-out duration-200 hover:bg-[#a321af] cursor-pointer scale-[75%]">Return to Home</Link></div>
        </div>
      </div>
    </div>
  );
}
