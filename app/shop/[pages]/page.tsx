"use client";

import Image from "next/image";
import Link from 'next/link';
import '@/app/globals.css';
import { useState, useEffect, useRef } from 'react';

export default function PageDetails({ params }) {
  const [cards, setCards] = useState([]);
  const [visibleCards, setVisibleCards] = useState(20);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(true);
  const [sortOption, setSortOption] = useState('default');
  const [viewMode, setViewMode] = useState('grid');
  const [filterInStock, setFilterInStock] = useState(false);
  const observer = useRef();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await fetch('/api/forsale/' + params.pages, {cache: 'force-cache'});
      const data = await result.json();
      setCards(data);
      setLoading(false);
      setMoreLoading(false);
    };

    fetchData();
  }, [params.pages]);

  useEffect(() => {
    const loadMoreCards = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setLoading(true);
        setTimeout(() => {
          setVisibleCards((prevVisibleCards) => prevVisibleCards + 10);
          setLoading(false);
        }, 1000);
      }
    };

    observer.current = new IntersectionObserver(loadMoreCards, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0,
    });

    const target = document.querySelector(`#card-${visibleCards}`);
    if (target) {
      observer.current.observe(target);
    }

    return () => {
      if (observer.current && target) {
        observer.current.unobserve(target);
      }
    };
  }, [visibleCards, cards]);

  useEffect(() => {
    if (visibleCards > cards.length) {
      setLoading(false);
    }
  }, [visibleCards, cards.length]);

  const getSortedCards = () => {
    if (!cards.length) return [];
    
    let filteredCards = [...cards];
    
    // Apply in-stock filter if enabled
    if (filterInStock) {
      filteredCards = filteredCards.filter(card => parseInt(card.stock) > 0);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'price-low':
        return filteredCards.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-high':
        return filteredCards.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'name-asc':
        return filteredCards.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return filteredCards.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filteredCards;
    }
  };

  const tempCards = Array.from({ length: 20 }, (_, index) => (
    <TempCard key={index} viewMode={viewMode} />
  ));

  if (moreLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6 max-w-7xl w-full`}>
              {tempCards}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortedCards = getSortedCards();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {params.pages === "prints" && (
          <div className="text-center mb-6">
            <p className="text-white text-xl font-bold">
              To see all 3D Print colours, <Link href="/printcolours" className="text-pink-500 hover:text-pink-400 underline underline-offset-2 transition-colors">click here</Link>
            </p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gray-800 p-4 rounded-lg">
          <h1 className="text-2xl font-bold text-white mb-4 md:mb-0 capitalize">{params.pages}</h1>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center">
              <label htmlFor="sort" className="text-white mr-2">Sort by:</label>
              <select 
                id="sort" 
                className="bg-gray-700 text-white py-2 px-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="view" className="text-white mr-2">View:</label>
              <div className="flex bg-gray-700 rounded-md">
                <button 
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-pink-500 text-white' : 'text-gray-300'} rounded-l-md transition-colors`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </button>
                <button 
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-pink-500 text-white' : 'text-gray-300'} rounded-r-md transition-colors`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={filterInStock}
                  onChange={() => setFilterInStock(!filterInStock)}
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                <span className="ms-3 text-sm font-medium text-white">In Stock Only</span>
              </label>
            </div>
          </div>
        </div>
        
        {sortedCards.length === 0 && !moreLoading && (
          <div className="text-center py-12">
            <p className="text-white text-lg">No products found matching your criteria.</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl w-full" 
            : "flex flex-col w-full max-w-5xl gap-4"
          }>
            {sortedCards.slice(0, visibleCards).map((element, index) => (
              <Card
                key={element.id}
                index={index + 1}
                name={element.name}
                price={element.price}
                image1={element.images[0].replace("vintage-reptiles-storage.s3.us-east-2.amazonaws.com/", "d3ke37ygqgdiqe.cloudfront.net/")}
                issale={element.issale}
                oldprice={element.oldprice}
                id={element.id}
                params={params}
                stock={element.stock}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-70">
          <div role="status">
            <svg aria-hidden="true" className="w-16 h-16 text-gray-600 animate-spin fill-pink-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const Card = ({ index, name, price, image1, issale, oldprice, id, params, stock, viewMode }) => {
  const toListing = "/shop/" + params.pages + "/" + params.pages + "-" + id;
  const isOutOfStock = parseInt(stock) <= 0;

  if (viewMode === 'list') {
    return (
      <div id={`card-${index}`} className="group">
        <div className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${isOutOfStock ? 'border-red-500/30' : 'border-transparent'} hover:border-pink-500`}>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 relative">
              <Link href={toListing}>
                <div className="aspect-square relative">
                  <Image 
                    src={image1} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={index < 4}
                    alt={name}
                    className="object-cover transition-all duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            </div>
            
            <div className="p-6 md:w-3/4 flex flex-col justify-between">
              <div>
                <Link href={toListing} className="hover:text-pink-400 transition-colors">
                  <h2 className="text-xl font-bold text-white mb-2">{name}</h2>
                </Link>
                
                <div className="flex items-center mb-4">
                  {issale === "true" ? (
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-red-500 mr-2">${parseFloat(price).toFixed(2)}</span>
                      <span className="text-lg text-gray-400 line-through">${parseFloat(oldprice).toFixed(2)}</span>
                    </div>
                  ) : (
                    price !== "" && <span className="text-xl font-bold text-white">${parseFloat(price).toFixed(2)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 items-center mt-2">
                {issale === "true" && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Sale!</span>
                )}
                
                {isOutOfStock ? (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</span>
                ) : (
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">In Stock</span>
                )}
                
                <Link href={toListing} className="ml-auto">
                  <button className={`px-4 py-2 rounded font-medium ${isOutOfStock 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white transition-colors'}`}>
                    View Details
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div id={`card-${index}`} className="group">
      <div className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col border-2 ${isOutOfStock ? 'border-red-500/30' : 'border-transparent'} hover:border-pink-500`}>
        <div className="relative aspect-square">
          <Link href={toListing}>
            <Image 
              src={image1} 
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={index < 8}
              alt={name}
              className="object-cover transition-all duration-300 group-hover:scale-105"
            />
            {issale === "true" && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                Sale!
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="bg-red-500 text-white font-bold px-3 py-1 rounded shadow-md">
                  Out of Stock
                </span>
              </div>
            )}
          </Link>
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <Link href={toListing} className="hover:text-pink-400 transition-colors">
            <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2">{name}</h2>
          </Link>
          
          <div className="mt-auto flex items-center justify-between">
            {issale === "true" ? (
              <div className="flex flex-col">
                <span className="font-bold text-red-500">${parseFloat(price).toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">${parseFloat(oldprice).toFixed(2)}</span>
              </div>
            ) : (
              price !== "" && <span className="font-bold text-white">${parseFloat(price).toFixed(2)}</span>
            )}
            
            <Link href={toListing}>
              <button className="w-8 h-8 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const TempCard = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg w-full animate-pulse">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4">
            <div className="aspect-square bg-gray-700"></div>
          </div>
          <div className="p-6 md:w-3/4">
            <div className="h-6 bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="h-5 bg-gray-700 rounded mb-6 w-1/4"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-700 rounded w-24"></div>
              <div className="h-8 bg-gray-700 rounded w-24 ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse h-full flex flex-col">
      <div className="aspect-square bg-gray-700"></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="h-5 bg-gray-700 rounded mb-2 w-3/4"></div>
        <div className="h-5 bg-gray-700 rounded mb-4 w-1/2"></div>
        <div className="mt-auto flex justify-between items-center">
          <div className="h-5 bg-gray-700 rounded w-16"></div>
          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};