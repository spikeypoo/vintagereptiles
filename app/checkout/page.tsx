"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider } from '@stripe/react-stripe-js';
import CheckoutForm from '../checkoutform';
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Keep your existing Stripe public key
const stripePromise = loadStripe('pk_live_51PQlcqRsYE4iOwmAYRRGhtl24Vnvc9mkZ37LB5PlJl8XcHVbTf0B0T3h7Ey7y28URqdIITb48aM9jjZ7wjuCPKKb00utiqhUVv', {
  betas: ['custom_checkout_server_updates_1'],
});

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get("clientSecret") || "";
  const [orderData, setOrderData] = useState({
    items: [],
    subtotal: 0,
    shipping: null,
    tax: 0,
    total: 0
  });

  const [isCheckoutReady, setIsCheckoutReady] = useState(false);

  const updateShipping = (shippingCost) => {
    setOrderData(prevData => {
      const newTotal = prevData.subtotal + + shippingCost;
      return {
        ...prevData,
        shipping: shippingCost,
        total: newTotal
      };
    });
  };
  
  // Load cart data from localStorage using the same format as CartDetails.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Get the Cart from localStorage
        const rawCart = localStorage.getItem("Cart");
        if (!rawCart) return;
        
        const cartData = JSON.parse(rawCart);
        
        // Format cart items
        const cartItems = [];
        let subtotal = 0;
        
        // Process each item in the cart
        for (const [key, value] of Object.entries(cartData)) {
          // Calculate item total
          const itemTotal = value.price * value.quantity;
          subtotal += itemTotal;
          
          // Format variant information
          let variant = "";
          
          // Handle color options
          if (value.chosenColors) {
            if (
              typeof value.chosenColors === "object" &&
              !Array.isArray(value.chosenColors)
            ) {
              const colorArr = Object.entries(value.chosenColors).map(
                ([colName, colQty]) => `${colName} (${colQty})`
              );
              variant = colorArr.join(", ");
            } else if (typeof value.chosenColors === "string") {
              variant = value.chosenColors;
            }
          }
          
          // Add chosen option if it exists
          if (value.chosenOption) {
            variant = variant 
              ? `${variant}, ${value.chosenOption}` 
              : value.chosenOption;
          }
          
          // Format image URL if needed
          let imageUrl = value.image;
          if (imageUrl && imageUrl.includes("vintage-reptiles-storage.s3.us-east-2.amazonaws.com")) {
            imageUrl = imageUrl.replace(
              "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
              "d3ke37ygqgdiqe.cloudfront.net/"
            );
          }
          
          // Create the item object
          const item = {
            id: key,
            name: value.name,
            price: parseFloat(value.price),
            quantity: value.quantity,
            image: imageUrl,
            variant: variant,
            priceID: value.priceID,
            chosenOptionPriceID: value.chosenOptionPriceID
          };
          
          cartItems.push(item);
        }
        
        // Calculate tax (example: 7% tax rate)
        const taxRate = 0.07;
        const tax = subtotal * taxRate;
        
        // Set shipping to null initially (will be set by CheckoutForm)
        const shipping = null;
        
        // Calculate total without shipping initially
        const total = subtotal;
        
        // Update order data
        setOrderData({
          items: cartItems,
          subtotal,
          shipping,
          tax,
          total
        });
        
      } catch (error) {
        console.error("Error loading cart data:", error);
      }
    }
  }, []);

  // Format currency
  const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Stripe appearance customization
  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#cb18db',
      colorBackground: '#1a1718',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        boxShadow: '0 0 0 1px rgba(203, 24, 219, 0.1)',
        transition: 'box-shadow 0.15s ease',
      },
      '.Input:focus': {
        boxShadow: '0 0 0 2px rgba(203, 24, 219, 0.4)',
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
      },
      '.Tab': {
        padding: '10px 12px',
        border: '1px solid #332f30',
      },
      '.Tab:hover': {
        border: '1px solid rgba(203, 24, 219, 0.5)',
      },
      '.Tab--selected': {
        borderColor: '#cb18db',
        boxShadow: '0 0 0 1px rgba(203, 24, 219, 0.5)',
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1c1a1b] to-[#0f0d0e] min-h-screen py-8 px-4">
      {/* Loading Spinner Overlay */}
    {!isCheckoutReady && (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 z-50">
        <div className="w-20 h-20 mb-8 relative animate-pulse">
          <Image src="/images/logo-bg.png" fill className="object-contain" alt="Vintage Reptiles" />
        </div>
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-900/30 p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#cb18db] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-[#cb18db]/50 animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-t-2 border-[#cb18db]/30 animate-spin animation-delay-300"></div>
            </div>
            <p className="text-white text-lg mt-6 font-medium">Setting up your secure checkout...</p>
            <p className="text-gray-400 text-sm mt-2">This will only take a moment</p>
          </div>
        </div>
      </div>
    )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/cart" className="text-gray-400 hover:text-[#cb18db] transition duration-200 flex items-center group">
            <div className="bg-black/30 backdrop-blur-sm p-2 rounded-full mr-3 group-hover:bg-[#cb18db]/20 transition-all duration-300">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span>Back to Cart</span>
          </Link>
          
          <div className="flex items-center">
            <Image 
              src="/images/logo-bg.png" 
              width={36} 
              height={36} 
              alt="Vintage Reptiles" 
              className="mr-3"
            />
            <span className="text-white font-semibold">Vintage Reptiles</span>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Order Summary Section */}
          <div className="lg:col-span-4 lg:order-2">
            <div className="sticky top-8">
              <div className="bg-black/30 backdrop-blur-md rounded-2xl shadow-xl border border-purple-900/20 overflow-hidden">
                <div className="bg-gradient-to-r from-[#2a1f2c] to-[#231b24] p-4 border-b border-purple-900/30">
                  <div className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-[#cb18db]" />
                    <h3 className="text-xl font-bold text-white">Order Summary</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Items list */}
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#cb18db]/30 scrollbar-track-gray-800/20">
                    {orderData.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-800/50">
                        <div className="relative h-16 w-16 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              fill 
                              className="object-cover" 
                              alt={item.name} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <span className="text-sm text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                          {item.variant && (
                            <p className="text-gray-400 text-xs mt-1">{item.variant}</p>
                          )}
                          <div className="flex justify-between mt-2">
                            <span className="text-gray-300 text-sm">Qty: {item.quantity}</span>
                            <motion.span 
                              key={`${item.id}-price-${item.price * item.quantity}`}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-white font-medium"
                            >
                              {formatPrice(item.price * item.quantity)}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order totals */}
                  <div className="space-y-3 py-4 border-t border-gray-800/50">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal</span>
                      <motion.span 
                        key={`subtotal-${orderData.subtotal}`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white"
                      >
                        {formatPrice(orderData.subtotal)}
                      </motion.span>
                    </div>
                    
                    {/* Shipping Row - Only shown when shipping is not null */}
                    <AnimatePresence>
                      {orderData.shipping !== null && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex justify-between overflow-hidden"
                        >
                          <span className="text-gray-400">Shipping</span>
                          <motion.span 
                            key={`shipping-${orderData.shipping}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-white"
                          >
                            {orderData.shipping === 0 ? 'Free' : formatPrice(orderData.shipping)}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-800">
                      <span className="text-white font-semibold">Total</span>
                      <motion.span 
                        key={`total-${orderData.total}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="text-xl font-bold text-[#cb18db]"
                      >
                        {formatPrice(orderData.total)}
                      </motion.span>
                    </div>
                  </div>
                  
                  {/* Trust badges */}
                  <div className="mt-6 pt-6 border-t border-gray-800/50">
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="flex items-center text-gray-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure Checkout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Checkout Form Section */}
          <div className="lg:col-span-8 lg:order-1">
            <CheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret: async () => {
                  const rawCart = localStorage.getItem("Cart") || "{}";
                  const holder = JSON.parse(rawCart);
                  const details = {};
            
                  for (const [key, value] of Object.entries(holder)) {
                    const usePriceID = value.chosenOptionPriceID ?? value.priceID;
            
                    details[key] = {
                      product: {
                        name: value.name,
                        price: usePriceID,
                        quantity: value.quantity,
                      },
                      stocktrack: {
                        id: value.id,
                        currpage: value.currpage,
                      },
                    };
            
                    details[key].chosenOption = value.chosenOption || "";
            
                    let colorDisplay = "";
                    if (value.chosenColors) {
                      if (typeof value.chosenColors === "object" && !Array.isArray(value.chosenColors)) {
                        const arr = Object.entries(value.chosenColors).map(
                          ([colName, colQty]) => `${colName} (${colQty})`
                        );
                        colorDisplay = arr.join(", ");
                      } else if (typeof value.chosenColors === "string") {
                        colorDisplay = value.chosenColors;
                      }
                    }
                    details[key].product.colors = colorDisplay;
                  }
            
                  const res = await fetch("/api/checkout_sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ details }),
                  });
            
                  const { clientSecret } = await res.json();
                  setIsCheckoutReady(true);
                  return clientSecret;
                },
                elementsOptions: { appearance },
              }}
            >
              <CheckoutForm 
                orderTotal={formatPrice(orderData.total)} 
                updateShipping={updateShipping} 
              />
            </CheckoutProvider>
          </div>
        </div>
      </div>
    </div>
  );
}