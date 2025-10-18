'use client';

import '@/app/globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export type BreederCard = {
  id: string;
  name: string;
  price: string;
  oldprice?: string;
  description: string;
  stock: string;
  images: string[];
  issale: string;
};

type BreedersPageClientProps = {
  geckos: string;
  initialCards: BreederCard[];
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const transformImageUrl = (url?: string) =>
  url?.replace('vintage-reptiles-storage.s3.us-east-2.amazonaws.com/', 'd3ke37ygqgdiqe.cloudfront.net/') ??
  'https://via.placeholder.com/400';

export default function BreedersPageClient({ geckos, initialCards }: BreedersPageClientProps) {
  const [cards, setCards] = useState<BreederCard[]>(initialCards);
  const [filteredCards, setFilteredCards] = useState<BreederCard[]>(initialCards);
  const [visibleCards, setVisibleCards] = useState(() => Math.min(20, initialCards.length));
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCards(initialCards);
    setFilteredCards(initialCards);
    setVisibleCards(Math.min(20, initialCards.length));
    setSearchTerm('');
    setSortOption('default');
  }, [initialCards]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasPriceData = useMemo(() => cards.some((card) => card.price !== ''), [cards]);

  useEffect(() => {
    let results = [...cards];

    if (searchTerm) {
      const lowered = searchTerm.toLowerCase();
      results = results.filter((card) => card.name.toLowerCase().includes(lowered));
    }

    switch (sortOption) {
      case 'price-low':
        results.sort((a, b) => Number.parseFloat(a.price || '0') - Number.parseFloat(b.price || '0'));
        break;
      case 'price-high':
        results.sort((a, b) => Number.parseFloat(b.price || '0') - Number.parseFloat(a.price || '0'));
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredCards(results);
    setVisibleCards(Math.min(20, results.length || 20));
  }, [cards, searchTerm, sortOption]);

  useEffect(() => {
    const loadMoreCards: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting && filteredCards.length > visibleCards) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCards((prev) => prev + 10);
          setLoadingMore(false);
        }, 500);
      }
    };

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(loadMoreCards, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    const target = document.querySelector<HTMLDivElement>(`#card-${visibleCards - 1}`);
    if (target) {
      observer.current.observe(target);
    }

    return () => {
      observer.current?.disconnect();
    };
  }, [visibleCards, filteredCards]);

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto mt-6 mb-[100px]">
        <div className="bg-[#242122] rounded-lg p-4 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search geckos..."
                className="bg-[#1c1a1b] text-white w-full py-2 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cb18db] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search geckos"
              />
            </div>

            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu((prev) => !prev)}
                className="flex items-center justify-between bg-[#1c1a1b] text-white px-4 py-2 rounded-lg w-56 flex-shrink-0 overflow-hidden hover:bg-[#2a2829] transition duration-200"
              >
                <span className="truncate">
                  Sort by: {SORT_OPTIONS.find((o) => o.value === sortOption)?.label}
                </span>
                <ChevronDown
                  size={16}
                  className={`ml-2 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showSortMenu && (
                <div className="absolute z-50 mt-2 w-full md:w-48 bg-[#242122] border border-[#3a3839] rounded-lg shadow-xl">
                  {SORT_OPTIONS.filter((option) => option.value.startsWith('price') ? hasPriceData : true).map(
                    (option) => (
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
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-white mb-4">
          Showing {Math.min(visibleCards, filteredCards.length)} of {filteredCards.length} geckos
        </div>

        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredCards.slice(0, visibleCards).map((element, index) => (
              <BreederCardComponent
                key={element.id}
                index={index}
                name={element.name}
                price={element.price}
                image1={element.images?.[0]}
                issale={element.issale}
                oldprice={element.oldprice}
                id={element.id}
                geckos={geckos}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-white py-12">
            <p className="text-xl">No geckos found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSortOption('default');
              }}
              className="mt-4 bg-[#cb18db] hover:bg-[#a814b6] text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Clear filters
            </button>
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-10 h-10 text-gray-600 animate-spin fill-[#cb18db]"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type CardProps = {
  index: number;
  name: string;
  price: string;
  oldprice?: string;
  image1?: string;
  issale: string;
  id: string;
  geckos: string;
};

const BreederCardComponent = ({ index, name, price, oldprice, image1, issale, id, geckos }: CardProps) => {
  const [hovering, setHovering] = useState(false);
  const toListing = `/breeders/${geckos}/${geckos}-${id}`;

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
                src={transformImageUrl(image1)}
                priority
                width={400}
                height={400}
                alt={name}
                className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
              />

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {issale === 'true' && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">Sale!</div>
                )}
              </div>

              <div
                className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 transition-opacity duration-300 ${
                  hovering ? 'opacity-100' : ''
                }`}
              >
                <div className="bg-[#cb18db] hover:bg-[#a814b6] text-white font-medium py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105">
                  View Details
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="p-4">
          <h3 className="text-white font-medium text-lg text-center truncate">{name}</h3>

          <div className="mt-2 flex justify-center items-center">
            {issale === 'true' && oldprice ? (
              <div className="flex items-center">
                <span className="text-red-500 font-bold text-lg">${Number.parseFloat(price || '0').toFixed(2)}</span>
                <span className="text-gray-400 line-through text-sm ml-2">
                  ${Number.parseFloat(oldprice || '0').toFixed(2)}
                </span>
              </div>
            ) : (
              price !== '' && <span className="text-white font-bold text-lg">${Number.parseFloat(price || '0').toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
