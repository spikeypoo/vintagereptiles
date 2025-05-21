"use client";

import Image from "next/image";
import Link from 'next/link';
import '@/app/globals.css';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Filter, Search } from 'lucide-react';
import { use } from "react";

export default function PageDetails({ params }: { params: Promise<{ pages: string }> }) {
  const { pages } = use(params);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await fetch('/api/forsale/' + pages, {cache: 'force-cache'});
      const data = await result.json();
      setCards(data);
      setFilteredCards(data);
      setLoading(false);
      setMoreLoading(false);
    };

    fetchData();
  }, [pages]);

  useEffect(() => {
    // Filter and sort cards based on current selections
    let results = [...cards];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price range filter
    results = results.filter(card => {
      const cardPrice = parseFloat(card.price);
      return cardPrice >= priceRange[0] && cardPrice <= priceRange[1];
    });

    // Apply stock filter
    if (showInStock) {
      results = results.filter(card => parseInt(card.stock) > 0);
    }

    // Apply sale filter
    if (showOnSale) {
      results = results.filter(card => card.issale === "true");
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-low':
        results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredCards(results);
    setVisibleCards(20); // Reset visible cards when filters change
  }, [cards, searchTerm, sortOption, priceRange, showInStock, showOnSale]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadMoreCards = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && filteredCards.length > visibleCards) {
        setLoading(true);
        setTimeout(() => {
          setVisibleCards((prevVisibleCards) => prevVisibleCards + 10);
          setLoading(false);
        }, 500);
      }
    };

    observer.current = new IntersectionObserver(loadMoreCards, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    const target = document.querySelector(`#card-${visibleCards - 1}`);
    if (target) {
      observer.current.observe(target);
    }

    return () => {
      if (observer.current && target) {
        observer.current.unobserve(target);
      }
    };
  }, [visibleCards, filteredCards]);

  const handlePriceRangeChange = (event, index) => {
    const newRange = [...priceRange];
    newRange[index] = Number(event.target.value);
    setPriceRange(newRange);
  };

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
  ];

  const tempCards = Array.from({ length: 20 }, (_, index) => (
    <TempCard key={index} />
  ));

  if (moreLoading) {
    return (
      <div className="px-4 py-8 md:px-8">
        <div className="flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl w-full">
            {tempCards}
          </div>
        </div>
      </div>
    );
  }

  const maxPrice = Math.max(...cards.map(card => parseFloat(card.price) || 0));

  return (
    <div className="px-4 py-8 md:px-8">
      {pages === "prints" && (
        <div className="text-center text-white text-xl font-bold">
          To see all 3D Print colours, <span className="text-[#cb18db] cursor-pointer underline underline-offset-2"><Link href={"/printcolours"}>click here</Link></span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto mt-6 mb-[100px]">
        {/* Search and filter bar */}
        <div className="bg-[#242122] rounded-lg p-4 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="bg-[#1c1a1b] text-white w-full py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb18db] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Sort dropdown */}
            <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center justify-between bg-[#1c1a1b] text-white px-4 py-2 rounded-lg w-56 flex-shrink-0 overflow-hidden hover:bg-[#2a2829] transition duration-200"
            >
              <span className="truncate">
                Sort by: {sortOptions.find(o => o.value === sortOption)?.label}
              </span>
              <ChevronDown
                size={16}
                className={`ml-2 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`}
              />
            </button>

              
              {showSortMenu && (
                <div className="absolute z-50 mt-2 w-full md:w-48 bg-[#242122] border border-[#3a3839] rounded-lg shadow-xl">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortOption(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-white hover:bg-[#3a3839] transition duration-200 ${
                        sortOption === option.value ? 'bg-[#3a3839] text-[#cb18db]' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Filter button */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center justify-between bg-[#1c1a1b] text-white px-4 py-2 rounded-lg w-full md:w-48 hover:bg-[#2a2829] transition duration-200"
              >
                <span>Filter</span>
                <Filter size={16} className="ml-2" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 z-50 mt-2 w-64 bg-[#242122] border border-[#3a3839] rounded-lg shadow-xl p-4">
                  <div className="mb-4">
                    <label className="block text-white text-sm font-medium mb-2">Price Range</label>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="number"
                        min="0"
                        max={maxPrice}
                        value={priceRange[0]}
                        onChange={(e) => handlePriceRangeChange(e, 0)}
                        className="bg-[#1c1a1b] text-white w-20 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-[#cb18db]"
                      />
                      <span className="text-white">to</span>
                      <input
                        type="number"
                        min="0"
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(e, 1)}
                        className="bg-[#1c1a1b] text-white w-20 py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-[#cb18db]"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={showInStock}
                        onChange={() => setShowInStock(!showInStock)}
                        className="form-checkbox h-4 w-4 text-[#cb18db] transition duration-150 ease-in-out"
                      />
                      <span className="ml-2">In Stock Only</span>
                    </label>
                  </div>
                  
                  <div className="mb-4">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={showOnSale}
                        onChange={() => setShowOnSale(!showOnSale)}
                        className="form-checkbox h-4 w-4 text-[#cb18db] transition duration-150 ease-in-out"
                      />
                      <span className="ml-2">On Sale</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-white mb-4">
          Showing {Math.min(visibleCards, filteredCards.length)} of {filteredCards.length} products
        </div>
        
        {/* Product grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredCards.slice(0, visibleCards).map((element, index) => (
              <Card
                key={element.id}
                index={index}
                name={element.name}
                price={element.price}
                image1={element.images[0].replace("vintage-reptiles-storage.s3.us-east-2.amazonaws.com/", "d3ke37ygqgdiqe.cloudfront.net/")}
                issale={element.issale}
                oldprice={element.oldprice}
                id={element.id}
                params={params}
                stock={element.stock}
                pages={pages}
                customOptions={element.customOptions}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-white py-12">
            <p className="text-xl">No products found matching your criteria</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setPriceRange([0, maxPrice]);
                setShowInStock(false);
                setShowOnSale(false);
                setSortOption('default');
              }}
              className="mt-4 bg-[#cb18db] hover:bg-[#a814b6] text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Clear filters
            </button>
          </div>
        )}
        
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
    </div>
  );
}

const Card = ({ index, name, price, image1, issale, oldprice, id, params, stock, pages, customOptions }) => {
  const [hovering, setHovering] = useState(false);
  const toListing = "/shop/" + pages + "/" + pages + "-" + id;
  const isOutOfStock = parseInt(stock) <= 0;
  const hasOptions = customOptions && customOptions.length > 0;

  return (
    <div 
      id={`card-${index}`}
      className="group relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="bg-[#242122] rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 md:hover:scale-105 hover:shadow-xl">
        <div className="relative">
          <Link href={toListing}>
            <div className="aspect-square overflow-hidden relative">
              <Image 
                src={image1} 
                priority={true} 
                width={400} 
                height={400} 
                alt={name}
                className={`object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110 ${isOutOfStock ? 'brightness-50' : ''}`}
              />
              
              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
              {issale === "true" && oldprice && price && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
                    {`${Math.round(((parseFloat(oldprice) - parseFloat(price)) / parseFloat(oldprice)) * 100)}% OFF`}
                  </div>
                )}
                {isOutOfStock && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
                    Out of Stock!
                  </div>
                )}
              </div>
              
              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 transition-opacity duration-300 ${hovering ? 'opacity-100' : ''}`}>
                <div className="bg-[#cb18db] hover:bg-[#a814b6] text-white font-medium py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105">
                  View Details
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-medium text-lg text-center truncate">{name}</h3>
          
          <div className="mt-2 flex flex-col items-center">
            {hasOptions ? (
              <>
                <span className="text-white font-bold text-lg">From ${parseFloat(price).toFixed(2)}</span>
                <span className="text-gray-400 text-sm">{customOptions.length} options available</span>
              </>
            ) : (
              issale === "true" ? (
                <div className="flex items-center">
                  <span className="text-red-500 font-bold text-lg">${parseFloat(price).toFixed(2)}</span>
                  <span className="text-gray-400 line-through text-sm ml-2">${parseFloat(oldprice).toFixed(2)}</span>
                </div>
              ) : (
                price !== "" && <span className="text-white font-bold text-lg">${parseFloat(price).toFixed(2)}</span>
              )
            )}
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