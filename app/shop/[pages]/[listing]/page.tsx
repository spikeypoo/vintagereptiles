"use client";

import Image from "next/image";
import Link from "next/link";
import "@/app/globals.css";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ShoppingCart } from "lucide-react";
import { use } from 'react';

export default function ListingDetails({ params }) {
  const [listingData, setData] = useState({});
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemID, setID] = useState();
  const [currPage, setPage] = useState();
  const [addingToCart, setAddingToCart] = useState(false);

  const [selectedOption, setSelectedOption] = useState("");

  const [quantity, setQuantity] = useState(1);

  const { listing } = use(params);
  const items = listing.split("-");
  const id = items[1];
  const page = items[0];

  // Color options + selected color state
  const colorOptions = ["Canada Day (Red and White)", "Canada Day (Red Glitter)", "White", "Grey", "Black", "Brown", "Teal (Matte)", "Magenta", "Pink", "Rattan Purple", "Ice Blue", "Milk Green", "Red", "Green", "Blue", "Yellow", "Silk Blue Purple", "Silk Red Green", "Silk Galaxy Blue", "Silk Galaxy Purple", "Silk Mint", "Silk Purple", "Silk Gold", "Silk Silver", "Silk Bronze", "Silk Red/Blue/Cyan", "Silk Red/Gold/Purple", "Silk Pink/Gold", "Morandi", "Glacier", "Shiny Silk Blue", "Wood", "Marble", "Sandal Wood", "Yellow Pear Wood", "White Pine Wood", "Ebony Wood"];
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const body = new FormData();
      body.append("id", id);
      body.append("sitePage", page);
      setID(id);
      setPage(page);
  
      const result = await fetch("/api/forsale/getlisting", {
        method: "POST",
        body,
        cache: "force-cache",
      });
  
      const dat = await result.json();
      setData(dat);
  
      if (Array.isArray(dat.images) && dat.images.length > 0) {
        const first = dat.images[0].replace(
          "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
          "d3ke37ygqgdiqe.cloudfront.net/"
        );
        setFocused(first);
      }
  
      setLoading(false);
    };
  
    fetchData();
  }, [id, page]);

  // Find the minimum price from all options
  const getMinOptionPrice = () => {
    if (!Array.isArray(listingData.customOptions) || listingData.customOptions.length === 0) {
      return parseFloat(listingData.price).toFixed(2);
    }
    
    const prices = listingData.customOptions.map(opt => parseFloat(opt.price || 0));
    return Math.min(...prices).toFixed(2);
  };

  // Display the selected option's price or the base price
  const displayPrice = () => {
    if (selectedOption && Array.isArray(listingData.customOptions)) {
      const opt = listingData.customOptions.find(o => o.label === selectedOption);
      if (opt && opt.price) return parseFloat(opt.price).toFixed(2);
    }
    return parseFloat(listingData.price).toFixed(2);
  };
  
  // Check if we have multiple options
  const hasMultipleOptions = Array.isArray(listingData.customOptions) && listingData.customOptions.length > 0;

  // Build array of images (filter out empty if needed)
  const images = Array.isArray(listingData.images)
    ? listingData.images.filter((img) => img !== "")
    : [];

    const handleOptionChange = (label) => {
      setSelectedOption(label);
      const opt = listingData.customOptions.find(o => o.label === label);
      if (opt && images[opt.imageIndex]) {
        setCurrentIndex(opt.imageIndex);
        setFocused(
          images[opt.imageIndex].replace(
            "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
            "d3ke37ygqgdiqe.cloudfront.net/"
          )
        );
      }
    };

  // Add to Cart
  const handleAdd = () => {
    setAddingToCart(true);
  
    // 1) Grab (or init) cart
    const raw = localStorage.getItem("Cart") || "{}";
    const cartObj = JSON.parse(raw);
  
    // 2) Build a composite key:
    //    base is the product ID, then append option & colour if set
    const baseId = params.listing.split("-")[1];
    let cartKey = baseId;
    if (selectedOption)    cartKey += `:${selectedOption}`;
    if (currPage === "prints" && selectedColor) cartKey += `:${selectedColor}`;
  
    // 3) Ensure quantity is a valid number
    const numQuantity = parseInt(quantity) || 1;
  
    // 4) Increment existing or create new entry under cartKey
    if (cartObj[cartKey]) {
      // already in cart — add selected quantity
      cartObj[cartKey].quantity += numQuantity;
      if (currPage === "prints") {
        cartObj[cartKey].chosenColors[selectedColor] =
          (cartObj[cartKey].chosenColors[selectedColor] || 0) + numQuantity;
      }
    } else {
      // brand new slot in cart
      const mainImage = images[0] || "";
  
      // always store both the display price *and* the Stripe Price ID
      const entry = {
        name:        listingData.name,
        price:       displayPrice(),        // string or number
        priceID:     listingData.priceid,   // fallback
        image:       mainImage,
        quantity:    numQuantity,
        currpage:    currPage,
        id:          itemID,
        chosenOption:    selectedOption || null,
        chosenOptionPriceID: null,
      };
  
      // if we have customOptions, save its Stripe price ID too
      if (selectedOption) {
        const opt = listingData.customOptions.find(o => o.label === selectedOption);
        if (opt) {
          entry.chosenOptionPriceID = opt.priceid;
        }
      }
  
      // prints also track colours per-colour
      if (currPage === "prints") {
        entry.chosenColors = { [selectedColor]: numQuantity };
      }
  
      cartObj[cartKey] = entry;
    }
  
    // 5) persist & refresh
    localStorage.setItem("Cart", JSON.stringify(cartObj));
    setTimeout(() => {
      setAddingToCart(false);
      location.reload();
    }, 600);
  };


  // Modal (lightbox) logic
  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
    document.body.classList.add("overflow-hidden");
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.classList.remove("overflow-hidden");
  };

  const nextImage = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);

    const newUrl = images[newIndex].replace(
      "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
      "d3ke37ygqgdiqe.cloudfront.net/"
    );
    setFocused(newUrl);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);

    const newUrl = images[newIndex].replace(
      "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
      "d3ke37ygqgdiqe.cloudfront.net/"
    );
    setFocused(newUrl);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column skeleton (image) */}
          <div className="w-full md:w-1/2">
            <div className="bg-[#2c2c2c] rounded-xl h-96 animate-pulse mb-6"></div>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-[#2c2c2c] rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Right column skeleton (details) */}
          <div className="w-full md:w-1/2">
            <div className="h-10 w-32 bg-[#2c2c2c] animate-pulse mb-4"></div>
            <div className="h-8 w-48 bg-[#2c2c2c] animate-pulse mb-6"></div>
            <div className="h-1 bg-[#3a3839] mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-[#2c2c2c] animate-pulse w-full"></div>
              <div className="h-6 bg-[#2c2c2c] animate-pulse w-full"></div>
              <div className="h-6 bg-[#2c2c2c] animate-pulse w-3/4"></div>
            </div>
            <div className="mt-8 h-12 w-40 bg-[#2c2c2c] animate-pulse rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Format price with discount percentage if on sale
  const calculateDiscount = () => {
    if (listingData.issale === "true") {
      const oldPrice = parseFloat(listingData.oldprice);
      const newPrice = parseFloat(listingData.price);
      const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      return discount;
    }
    return 0;
  };

  const isOutOfStock = parseInt(listingData.stock) <= 0;
  const inStock = parseInt(listingData.stock) > 0;
  const discount = calculateDiscount();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 mb-[100px]">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center mb-8 text-sm">
        <Link href={`/shop/${currPage}`} className="text-gray-400 hover:text-white transition">
          {currPage && currPage.charAt(0).toUpperCase() + currPage.slice(1)}
        </Link>
        <ChevronRight size={16} className="mx-2 text-gray-400" />
        <span className="text-white font-medium truncate max-w-xs">
          {listingData.name}
        </span>
      </nav>

      <div className="bg-[#242122] rounded-xl p-4 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column (images) */}
          <div className="w-full md:w-1/2">
            {/* Main image */}
            <div className="relative mb-6 aspect-square">
              {focused ? (
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  <img
                    src={focused}
                    alt={listingData.name}
                    className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                    onClick={() => openModal(currentIndex)}
                  />
                  {/* Navigation arrows */}
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
                  
                  {/* Sale badge */}
                  {listingData.issale === "true" && (
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

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 justify-center">
                {images.slice(0, 5).map((imageUrl, index) => {
                  const thumbUrl = imageUrl.replace(
                    "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
                    "d3ke37ygqgdiqe.cloudfront.net/"
                  );
                  const isActive = thumbUrl === focused;
                  
                  return (
                    <div 
                      key={index}
                      className={`relative h-20 w-20 rounded-lg overflow-hidden cursor-pointer
                      ${isActive ? 'ring-2 ring-[#cb18db]' : 'ring-2 ring-transparent hover:ring-white'}
                      ${index === 4 && images.length > 5 ? 'relative' : ''}`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setFocused(thumbUrl);
                      }}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-200
                        ${isActive ? 'brightness-100' : 'brightness-75 hover:brightness-100'}`}
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

          {/* Right column (details) */}
          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            {/* Title and price */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{listingData.name}</h1>
              
              <div className="flex items-center mb-2">
                {listingData.price !== "" && (
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className={`text-2xl font-bold ${listingData.issale === "true" ? "text-red-500" : "text-white"}`}>
                        {hasMultipleOptions && !selectedOption 
                          ? `$${getMinOptionPrice()}`
                          : `$${displayPrice()}`
                        }
                      </span>
                      
                      {listingData.issale === "true" && (
                        <span className="text-gray-400 line-through text-lg ml-3">
                          ${parseFloat(listingData.oldprice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    {/* Show options count if multiple options exist */}
                    {hasMultipleOptions && (
                      <span className="text-sm text-gray-300 mt-1">
                        {listingData.customOptions.length} options available
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Stock indicator */}
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="ml-2 text-sm text-gray-300">
                  {inStock ? `In Stock (${listingData.stock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>
            
            <div className="h-px bg-[#3a3839] mb-6"></div>
            
            {/* Description */}
            <div className="mb-8">
              <div
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: listingData.description?.replace(/(\n)+/g, "<br />"),
                }}
              />
            </div>

            {/* Custom Options Dropdown */}
            {hasMultipleOptions && (
              <div className="mb-6">
                <label className="block mb-2 text-white font-medium">
                  Select Option
                </label>
                <select
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#cb18db]"
                  value={selectedOption}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  required
                >
                  <option value="">Choose an option</option>
                  {listingData.customOptions.map((opt, idx) => (
                    <option key={idx} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {!selectedOption && (
                  <p className="text-sm text-yellow-500 mt-1">
                    Please select an option
                  </p>
                )}
              </div>
            )}
            
            {/* Color selection for prints */}
            {currPage == "prints" && (
              <div className="mb-6">
                <label className="block mb-2 text-white font-medium">
                  Select Colour
                </label>
                <select
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#cb18db] focus:border-transparent"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  required={currPage === "prints"}
                >
                  <option value="">Choose a colour</option>
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                {currPage === "prints" && selectedColor === "" && (
                  <p className="text-sm text-yellow-500 mt-1">
                    Please select a colour before adding to cart
                  </p>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block mb-2 text-white font-medium">
                Quantity
              </label>
              <div className="flex items-center">
                <button 
                  type="button"
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] px-3 py-2 rounded-l-lg hover:bg-[#2c2a2b] transition-colors"
                  onClick={() => setQuantity(prev => Math.max(1, (typeof prev === 'number' ? prev : parseInt(prev) || 1) - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  type="number"
                  className="bg-[#1c1a1b] text-white border-y border-[#3a3839] py-2 px-3 w-16 text-center focus:outline-none"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    
                    // Allow empty string temporarily (for clearing the input)
                    if (val === '') {
                      setQuantity('');
                      return;
                    }
                    
                    // Parse and validate the number
                    const numVal = parseInt(val);
                    if (!isNaN(numVal) && numVal > 0) {
                      setQuantity(Math.min(numVal, parseInt(listingData.stock) || 999));
                    }
                  }}
                  onBlur={(e) => {
                    // If empty on blur, set to 1
                    const val = e.target.value;
                    if (val === '' || parseInt(val) < 1 || isNaN(parseInt(val))) {
                      setQuantity(1);
                    }
                  }}
                  min="1"
                  max={listingData.stock || 999}
                />
                <button 
                  type="button"
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] px-3 py-2 rounded-r-lg hover:bg-[#2c2a2b] transition-colors"
                  onClick={() => setQuantity(prev => {
                    const currentQty = typeof prev === 'number' ? prev : parseInt(prev) || 0;
                    return Math.min(parseInt(listingData.stock) || 999, currentQty + 1);
                  })}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {quantity > (parseInt(listingData.stock) || 0) && (
                <p className="text-sm text-red-500 mt-1">
                  Only {listingData.stock} available in stock
                </p>
              )}
            </div>
            
            {/* Add to cart button */}
            <div className="mt-6">
              <button
                className={`flex items-center justify-center gap-2 font-bold text-white bg-[#cb18db] w-full sm:w-auto px-8 py-3 rounded-full text-lg transition-all duration-300
                ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#a814b6]'}
                ${((currPage === "prints" && selectedColor === "") || (hasMultipleOptions && !selectedOption)) ? 'opacity-50 cursor-not-allowed' : ''}
                ${addingToCart ? 'animate-pulse' : ''}`}
                onClick={handleAdd}
                disabled={
                  isOutOfStock || 
                  (currPage === "prints" && selectedColor === "") || 
                  (hasMultipleOptions && !selectedOption) ||
                  addingToCart ||
                  // Fixed quantity validation
                  (quantity === '' || quantity === null || quantity === undefined || 
                  (typeof quantity === 'number' && quantity < 1) || 
                  (typeof quantity === 'string' && (quantity === '' || parseInt(quantity) < 1 || isNaN(parseInt(quantity)))))
                }
              >
                <ShoppingCart size={20} />
                {addingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              {currPage === "prints" && (
                <div className="mt-4">
                  <Link 
                    href="/printcolours"
                    className="text-[#cb18db] hover:text-[#a814b6] underline underline-offset-2 transition"
                  >
                    View all available colour options
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all z-10"
              onClick={closeModal}
            >
              <X size={24} />
            </button>
            
            {/* Navigation */}
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
            
            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={focused}
                alt={listingData.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}