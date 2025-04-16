"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="w-full bg-[#161414] border-t border-gray-800 mt-16">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Logo & About */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/">
              <div className="mb-4 w-24 h-24 relative">
                <img 
                  src="/images/logo-bg.png" 
                  alt="Vintage Reptiles" 
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm text-center md:text-left">
              Specializing in high quality reptiles in addition to Isopods, Plants and 3D Prints.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="md:ml-auto">
            <h3 className="text-white font-semibold mb-4 text-center md:text-left">Shop</h3>
            <ul className="text-gray-400 space-y-2 text-center md:text-left">
              <li>
                <Link href="/shop/availability" className="hover:text-[#cb18db] transition duration-200">
                  Geckos
                </Link>
              </li>
              <li>
                <Link href="/shop/isopods" className="hover:text-[#cb18db] transition duration-200">
                  Isopods
                </Link>
              </li>
              <li>
                <Link href="/shop/plants" className="hover:text-[#cb18db] transition duration-200">
                  Plants
                </Link>
              </li>
              <li>
                <Link href="/shop/prints" className="hover:text-[#cb18db] transition duration-200">
                  3D Prints
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Info Pages */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-left">Information</h3>
            <ul className="text-gray-400 space-y-2 text-center md:text-left">
              <li>
                <Link href="/tos" className="hover:text-[#cb18db] transition duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/printcolours" className="hover:text-[#cb18db] transition duration-200">
                  3D Print Colours
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-left">Connect</h3>
            <div className="flex justify-center md:justify-start space-x-4 mb-4">
              {/* Instagram */}
              <a href="https://instagram.com/vintage_reptiles" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#cb18db] transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Facebook
              <a href="https://facebook.com/vintagereptiles" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#cb18db] transition duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a> */}
            </div>
            <div className="text-gray-400 text-sm space-y-2 text-center md:text-left">
              <p>Email: contact@vintagereptiles.com</p>
              <p>Located in Ontario, Canada</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="bg-[#121010] py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm text-center md:text-left mb-2 md:mb-0">
            © {year} Vintage Reptiles. All rights reserved.
          </div>
        </div>
      </div>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-16 right-6 bg-[#6d229b] hover:bg-[#55197a] text-white p-3 rounded-full shadow-lg transition-all duration-300"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      )}
    </footer>
  );
}