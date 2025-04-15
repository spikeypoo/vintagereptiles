"use client";
import Image from "next/image";
import Link from 'next/link'
import "./globals.css"
import { useState } from 'react'
import "./hamburgers.css"

export default function Hamburger() {

    return (
        <div id="burger" className="hamburger--spring cursor-pointer">
            <div className="hamburger-box">
                <div className="hamburger-inner"></div>
            </div>
        </div>
    )
}
