"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider } from '@stripe/react-stripe-js';
import CheckoutForm from '../checkoutform';
import Link from "next/link";
import Image from "next/image";

// Keep your existing Stripe public key
const stripePromise = loadStripe(
  "pk_live_51PQlcqRsYE4iOwmAYRRGhtl24Vnvc9mkZ37LB5PlJl8XcHVbTf0B0T3h7Ey7y28URqdIITb48aM9jjZ7wjuCPKKb00utiqhUVv"
);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get("clientSecret") || "";
  const [orderData, setOrderData] = useState({
    items: [],
    subtotal: 0,
    shipping: 5.99, // Default shipping cost
    tax: 0,
    total: 0
  });
  
  // Load cart data from localStorage using the same format as CartDetails.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
        
        // Set shipping cost based on subtotal (free shipping over $50)
        const shipping = subtotal > 50 ? 0 : 5.99;
        
        // Calculate total
        const total = subtotal + tax + shipping;
        
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

  if (!clientSecret) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#1c1a1b]">
        <div className="w-16 h-16 mb-6">
          <Image src="/images/logo-bg.png" width={64} height={64} alt="Vintage Reptiles" />
        </div>
        <div className="bg-[#161414] rounded-lg shadow-xl border border-gray-800 p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-[#cb18db] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white text-lg">Initializing checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Stripe appearance customization
  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#cb18db',
      colorBackground: '#2a2728',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
  };

  return (
    <div className="bg-[#1c1a1b] min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/cart" className="text-gray-400 hover:text-[#cb18db] transition duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Cart
          </Link>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form Section */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <CheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret: () => clientSecret,
                elementsOptions: { appearance },
              }}
            >
              <CheckoutForm />
            </CheckoutProvider>
          </div>
        </div>
      </div>
    </div>
  );
}