'use client';

import '@/app/globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type GeckoListingData = {
  id: string;
  name: string;
  price: string;
  oldprice?: string;
  description: string;
  stock: string;
  images: string[];
  issale: string;
  priceid?: string | null;
  stripeid?: string | null;
};

type GeckoListingClientProps = {
  page: string;
  initialData: GeckoListingData;
};

const transformImageUrl = (url?: string) =>
  url?.replace('vintage-reptiles-storage.s3.us-east-2.amazonaws.com/', 'd3ke37ygqgdiqe.cloudfront.net/') ?? '';

export default function GeckoListingClient({ page, initialData }: GeckoListingClientProps) {
  const [listingData] = useState(initialData);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focused, setFocused] = useState(() => transformImageUrl(initialData.images?.[0]) || '');

  const images = useMemo(() => {
    if (!Array.isArray(listingData.images)) {
      return [];
    }

    return listingData.images
      .filter((img): img is string => Boolean(img))
      .map((img) => transformImageUrl(img))
      .filter(Boolean);
  }, [listingData.images]);

  useEffect(() => {
    if (!focused && images.length > 0) {
      setFocused(images[0]);
    }
  }, [focused, images]);

  const discount = useMemo(() => {
    if (listingData.issale === 'true') {
      const oldPrice = Number.parseFloat(listingData.oldprice || '0');
      const newPrice = Number.parseFloat(listingData.price || '0');
      if (oldPrice > 0 && newPrice >= 0) {
        return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      }
    }
    return 0;
  }, [listingData]);

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalOpen(true);
    document.body.classList.add('overflow-hidden');
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const nextImage = () => {
    if (!images.length) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    setFocused(images[newIndex]);
  };

  const prevImage = () => {
    if (!images.length) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    setFocused(images[newIndex]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 mb-[100px]">
      <nav className="flex items-center mb-8 text-sm">
        <Link href={`/breeders/${page}`} className="text-gray-400 hover:text-white transition">
          {page.charAt(0).toUpperCase() + page.slice(1)}
        </Link>
        <ChevronRight size={16} className="mx-2 text-gray-400" />
        <span className="text-white font-medium truncate max-w-xs">{listingData.name}</span>
      </nav>

      <div className="bg-[#242122] rounded-xl p-4 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="relative mb-6 aspect-square">
              {focused ? (
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  <Image
                    src={focused}
                    alt={listingData.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                    onClick={() => openModal(currentIndex)}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {listingData.issale === 'true' && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg shadow-md">
                      {discount}% OFF
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xl rounded-lg">
                  No image available
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 justify-center">
                {images.slice(0, 5).map((imageUrl, index) => {
                  const isActive = imageUrl === focused;
                  return (
                    <div
                      key={`${imageUrl}-${index}`}
                      className={`relative h-20 w-20 rounded-lg overflow-hidden cursor-pointer ${
                        isActive ? 'ring-2 ring-[#cb18db]' : 'ring-2 ring-transparent hover:ring-white'
                      } ${index === 4 && images.length > 5 ? 'relative' : ''}`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setFocused(imageUrl);
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="80px"
                        className={`object-cover transition-all duration-200 ${
                          isActive ? 'brightness-100' : 'brightness-75 hover:brightness-100'
                        }`}
                      />
                      {index === 4 && images.length > 5 && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                          <span className="text-white font-bold">+{images.length - 5}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{listingData.name}</h1>
            </div>

            <div className="h-px bg-[#3a3839] mb-6" />

            <div className="mb-8">
              <div
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (listingData.description || '').replace(/(\n)+/g, '<br />'),
                }}
              />
            </div>

            <div className="rounded-lg border border-[#3a3839] bg-[#1c1a1b] px-4 py-3 text-sm text-gray-300">
              These breeders are showcased for reference and are not currently for sale.
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all z-10"
              onClick={closeModal}
            >
              <X size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 text-white p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className="absolute right-4 text-white p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all z-10"
                  onClick={nextImage}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="w-full h-full flex items-center justify-center p-4">
              <Image
                src={focused || 'https://via.placeholder.com/800'}
                alt={listingData.name}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
