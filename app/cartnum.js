"use client";
import Image from "next/image";
import Link from 'next/link'
import "./globals.css"
import { useState, useEffect } from 'react'
import Hamburger from './hamburger'

export default function CartNumber() {
    const [numCart, setCartNum] = useState(0)

    useEffect(() => {
        if (localStorage.getItem("Cart") != null)
        {
            let holder = JSON.parse(localStorage.getItem("Cart"))
                let count = parseInt("0")
                for (const [key, value] of Object.entries(holder))
                {
                    let toadd = parseInt(value.quantity)
                    count = count + toadd
                }
                setCartNum(count)
        }
        else
        {
            setCartNum(0)
        }
    })

    return (
        <div>
            {(numCart > 0  && <div className="absolute right-[-8px] top-[-8px]"><div className="bg-[#9d00ff] w-[25px] h-[25px] flex justify-center items-center rounded-full font-bold text-sm scale-[80%] text-white">{numCart}</div></div>)}
        </div>
    )
}
