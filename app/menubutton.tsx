"use client";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { useState, useEffect } from "react";

export default function MenuButton() {
  const [modalOpen, setModalOpen] = useState(false);
  // Instead of separate booleans for Pairings and Breeders, track the current menu
  const [activeMenu, setActiveMenu] = useState("main");
  const [numCart, setNumCart] = useState(0);

  // Load the cart item count on mount
  useEffect(() => {
    if (localStorage.getItem("Cart") != null) {
      const holder = JSON.parse(localStorage.getItem("Cart"));
      let count = 0;
      for (const [_, value] of Object.entries(holder)) {
        count += parseInt(value.quantity);
      }
      setNumCart(count);
    }
  }, []);

  /** Toggle the entire menu on/off */
  function toggleMenu() {
    const next = !modalOpen;
    setModalOpen(next);
    document.body.classList.toggle("overflow-hidden", next);

    if (!next) {
      // If we are closing the menu, reset to "main"
      setActiveMenu("main");
    }
  }

  /** If menu is open and user goes to cart, close the menu first */
  function closeMenuBeforeCart() {
    if (modalOpen) {
      setModalOpen(false);
      document.body.classList.remove("overflow-hidden");
      setActiveMenu("main");
    }
  }

  return (
    <div>
      {/* Fullscreen Menu Overlay */}
      <ul
        className={
          modalOpen
            ? "transition ease-in-out duration-[500ms] absolute transform text-white opacity-100 shadow-xl bg-[#161414] w-screen left-0 h-screen top-0 z-40"
            : "transition ease-in-out duration-[500ms] absolute transform text-white opacity-0 pointer-events-none blur-sm bg-[#1c1a1b] w-screen left-0 h-screen top-0 z-40"
        }
      >
        {/* ---------- MAIN MENU ---------- */}
        {activeMenu === "main" && (
          <div className="pt-[60px]">
            {/* 1. Home (no delay) */}
            <li>
              <Link href="/">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl transition cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? // OPEN STATE
                          "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100"
                        : // CLOSED STATE
                          "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">Home</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 2. Terms of Service (delay-[70ms]) */}
            <li>
              <Link href="/tos">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[70ms]"
                        : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">Terms of Service</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 3. Geckos (delay-[140ms]) */}
            <li>
              <Link href="/shop/availability">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[140ms]"
                        : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">Geckos</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 4. Isopods (delay-[210ms]) */}
            <li>
              <Link href="/shop/isopods">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[210ms]"
                        : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">Isopods</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 5. Plants (delay-[280ms]) */}
            <li>
              <Link href="/shop/plants">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[280ms]"
                        : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">Plants</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 6. 3D Prints (delay-[350ms]) */}
            <li>
              <Link href="/shop/prints">
                <div
                  onClick={toggleMenu}
                  className="relative left-1/2 -translate-x-1/2 w-96 h-16 pt-4 text-2xl cursor-pointer"
                >
                  <div
                    className={
                      modalOpen
                        ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[350ms]"
                        : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                    }
                  >
                    <div className="hover:text-[#cb18db] transition ease-out duration-[100ms]">3D Prints</div>
                  </div>
                </div>
              </Link>
            </li>

            {/* 7. Pairings (delay-[420ms]) --> goes to Pairings sub-menu */}
            <li>
              <div
                onClick={() => setActiveMenu("pairings")}
                className="relative w-96 left-1/2 -translate-x-1/2 h-16 pt-4 text-2xl cursor-pointer"
              >
                <div
                  className={
                    modalOpen
                      ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[420ms]"
                      : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                  }
                >
                  <div className="hover:text-[#cb18db] transition ease-out duration-[100ms] text-white">Pairings</div>
                </div>
              </div>
            </li>

            {/* 8. Breeders (delay-[490ms]) --> goes to Breeders sub-menu */}
            <li>
              <div
                onClick={() => setActiveMenu("breeders")}
                className="relative w-96 left-1/2 -translate-x-1/2 h-16 pt-4 text-2xl cursor-pointer"
              >
                <div
                  className={
                    modalOpen
                      ? "transition ease-out duration-[350ms] absolute left-1/2 -translate-x-1/2 opacity-100 delay-[490ms]"
                      : "transition ease-out duration-[500ms] absolute left-1/2 -translate-x-1/2 -translate-y-10 opacity-0"
                  }
                >
                  <div className="hover:text-[#cb18db] transition ease-out duration-[100ms] text-white">Breeders</div>
                </div>
              </div>
            </li>
          </div>
        )}

        {/* ---------- PAIRINGS SUB-MENU ---------- */}
        {activeMenu === "pairings" && (
          <div className="pt-[60px]">
            {/* Back Arrow (no delay so it appears instantly) */}
            <div
              onClick={() => setActiveMenu("main")}
              className="ml-4 mb-6 cursor-pointer text-2xl hover:text-[#cb18db]"
            >
              ← Back
            </div>
            {/* Sub-menu items for Pairings with delays */}
            <div className="flex flex-col items-center justify-center">
              {/* 2024 (delay-0) */}
              <li>
                <Link href="/pairings2025">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "relative w-24 h-16 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : // in theory, we'd hide it if menu is closed, but if user closes the menu,
                          // we also reset activeMenu to "main" anyway
                          "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">2025</div>
                  </div>
                </Link>
              </li>
              {/* 2024 (delay-0) */}
              <li>
                <Link href="/pairings2024">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "relative w-24 h-16 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : // in theory, we'd hide it if menu is closed, but if user closes the menu,
                          // we also reset activeMenu to "main" anyway
                          "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">2024</div>
                  </div>
                </Link>
              </li>
              {/* 2023 (delay-[70ms]) */}
              <li>
                <Link href="/pairings2023">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "relative w-24 h-16 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">2023</div>
                  </div>
                </Link>
              </li>
              {/* 2022 (delay-[140ms]) */}
              <li>
                <Link href="/pairings2022">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "relative w-24 h-16 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">2022</div>
                  </div>
                </Link>
              </li>
            </div>
          </div>
        )}

        {/* ---------- BREEDERS SUB-MENU ---------- */}
        {activeMenu === "breeders" && (
          <div className="pt-[60px]">
            {/* Back Arrow */}
            <div
              onClick={() => setActiveMenu("main")}
              className="ml-4 mb-6 cursor-pointer text-2xl hover:text-[#cb18db]"
            >
              ← Back
            </div>
            {/* We’ll show each breeder link with a staggered delay */}
            <div className="flex flex-col items-center">
              {/* 1. Male Crested (0ms) */}
              <li>
                <Link href="/breeders/malecrestedgeckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className="text-center w-full">
                      Male Crested Geckos
                    </div>
                  </div>
                </Link>
              </li>
              {/* 2. Female Crested (delay-[70ms]) */}
              <li>
                <Link href="/breeders/femalecrestedgeckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">
                      Female Crested Geckos
                    </div>
                  </div>
                </Link>
              </li>
              {/* 3. Male Gargoyle (delay-[140ms]) */}
              <li>
                <Link href="/breeders/malegargoylegeckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">
                      Male Gargoyle Geckos
                    </div>
                  </div>
                </Link>
              </li>
              {/* 4. Female Gargoyle (delay-[210ms]) */}
              <li>
                <Link href="/breeders/femalegargoylegeckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">
                      Female Gargoyle Geckos
                    </div>
                  </div>
                </Link>
              </li>
              {/* 5. Male Chahoua (delay-[280ms]) */}
              <li>
                <Link href="/breeders/malechahouageckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">
                      Male Chahoua Geckos
                    </div>
                  </div>
                </Link>
              </li>
              {/* 6. Female Chahoua (delay-[350ms]) */}
              <li>
                <Link href="/breeders/femalechahouageckos">
                  <div
                    onClick={toggleMenu}
                    className={
                      modalOpen
                        ? "h-20 text-2xl flex items-center cursor-pointer opacity-100 hover:text-[#cb18db] transition ease-out duration-[100ms] text-white"
                        : "opacity-0 pointer-events-none hidden"
                    }
                  >
                    <div className=" text-center w-full">
                      Female Chahoua Geckos
                    </div>
                  </div>
                </Link>
              </li>
            </div>
          </div>
        )}
      </ul>

      {/* ---------- CART ICON + BADGE ---------- */}
      <Link onClick={closeMenuBeforeCart} href="/cart" className="z-50">
        <img
          className="w-[40px] absolute right-[90px] top-[12px] cursor-pointer z-50"
          src="/images/shoppingbag.png"
          alt="Cart Icon"
        />
        {numCart > 0 && (
          <div className="absolute right-[85px] top-[6px] z-[100]">
            <div className="bg-[#9d00ff] w-[25px] h-[25px] flex justify-center items-center rounded-full font-bold text-sm text-white scale-[80%]">
              {numCart}
            </div>
          </div>
        )}
      </Link>

      {/* ---------- HAMBURGER ICON ---------- */}
      <div
        id="burger"
        className={
          modalOpen
            ? "absolute right-[35px] top-[23px] hamburger--spring cursor-pointer is-active z-50"
            : "absolute right-[35px] top-[23px] hamburger--spring cursor-pointer z-50"
        }
        onClick={toggleMenu}
      >
        <div className="hamburger-box">
          <div className="hamburger-inner"></div>
        </div>
      </div>
    </div>
  );
}
