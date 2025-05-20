"use client";

import Image from "next/image";
import Link from 'next/link';
import '@/app/globals.css';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Filter, Search } from 'lucide-react';
import { use } from "react";

export default function PageDetails({ params }: { params: Promise<{ geckos: string }> }) {
  const { geckos } = use(params);
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [visibleCards, setVisibleCards] = useState(20);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const observer = useRef();
  const sortMenuRef = useRef();
  const filterMenuRef = useRef();

  return (
    <div className="px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto mt-6 mb-[100px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                <Card
                        name={"Male Crested Geckos"}
                        image1={"/images/geckotest.jpeg"}
                        link={"/breeders/malecrestedgeckos"}
                />
            </div>
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div role="status">
              <svg aria-hidden="true" className="w-10 h-10 text-gray-600 animate-spin fill-[#cb18db]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>
  );
}

const Card = ({name, image1, link}) => {
  const [hovering, setHovering] = useState(false);

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="bg-[#242122] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 md:hover:scale-105 hover:shadow-xl">
        <div className="relative">
          <Link href={link}>
            <div className="aspect-square overflow-hidden relative">
              <Image 
                src={image1} 
                priority={true} 
                width={400} 
                height={400} 
                alt={name}
                className={`object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110`}
              />
              
              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 transition-opacity duration-300 ${hovering ? 'opacity-100' : ''}`}>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-medium text-lg text-center truncate">{name}</h3>
          
          <div className="mt-2 flex justify-center items-center">
          </div>
        </div>
      </div>
    </div>
  );
};

const TempCard = () => {
  return (
    <div className="bg-[#242122] rounded-lg overflow-hidden shadow-lg">
      <div className="aspect-square bg-[#2c2c2c] animate-pulse"></div>
      <div className="p-4">
        <div className="h-6 bg-[#2c2c2c] rounded animate-pulse mb-2"></div>
        <div className="flex justify-center">
          <div className="h-6 w-20 bg-[#2c2c2c] rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};