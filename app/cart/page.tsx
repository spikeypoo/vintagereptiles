"use client";

import Image from "next/image";
import Link from "next/link";
import "@/app/globals.css";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

export default function CartDetails() {
  const [cards, setCards] = useState([]);
  const [totalPrice, setTotal] = useState(0);

  useEffect(() => {
    const rawCart = localStorage.getItem("Cart");
    if (!rawCart) return;

    const holder = JSON.parse(rawCart);

    // Calculate subtotal
    let count = 0;
    for (const [_, value] of Object.entries(holder)) {
      count += value.price * value.quantity;
    }
    setTotal(count);

    // Convert the cart object into an array of [id, itemData]
    const current = Object.entries(holder);
    setCards(current);
  }, []);

  const redirectToCheckout = async () => {
    try {
      const stripe = await loadStripe(
        "pk_live_51PQlcqRsYE4iOwmAYRRGhtl24Vnvc9mkZ37LB5PlJl8XcHVbTf0B0T3h7Ey7y28URqdIITb48aM9jjZ7wjuCPKKb00utiqhUVv"
      );

      let holder = JSON.parse(localStorage.getItem("Cart") || "{}");
      let details = {};

      for (const [key, value] of Object.entries(holder)) {
        details[key] = {
          product: {
            name: value.name,
            price: value.priceID,
            quantity: value.quantity,
          },
          stocktrack: {
            id: value.id,
            currpage: value.currpage,
          },
        };

        // Combine color data into a string, if needed for your checkout
        let colorDisplay = "";
        if (value.chosenColors) {
          if (
            typeof value.chosenColors === "object" &&
            !Array.isArray(value.chosenColors)
          ) {
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

      const checkoutResponse = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ details }),
      });

      const ses = await checkoutResponse.json();
      const { sessionId } = ses;

      if (ses.error === "At least one item isn't in stock!") {
        alert(ses.error);
        return;
      }

      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-[60vh] container mx-auto px-4 py-8 mb-[100px]">
      <h1 className="text-white text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
        Your Cart
      </h1>
      
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16">
          <div className="text-white text-3xl mb-8">Your cart is empty!</div>
          <Link href="/shop/availability">
            <div className="bg-[#6d229b] text-white px-6 py-3 rounded-md font-bold 
                        transition duration-200 hover:bg-[#55197a] cursor-pointer">
              Continue Shopping
            </div>
          </Link>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1a1718] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
            {/* Cart header */}
            <div className="hidden md:grid md:grid-cols-12 bg-[#161414] text-gray-300 p-4 border-b border-gray-800">
              <div className="col-span-6 font-semibold">Product</div>
              <div className="col-span-2 font-semibold text-center">Price</div>
              <div className="col-span-2 font-semibold text-center">Quantity</div>
              <div className="col-span-2 font-semibold text-right">Total</div>
            </div>

            {/* Cart items */}
            <div className="divide-y divide-gray-800">
              {cards.map(([id, data], index) => (
                <CartCard
                  key={id}
                  cartKey={id}
                  index={index + 1}
                  name={data.name}
                  price={data.price}
                  quantity={data.quantity}
                  image={data.image?.replace(
                    "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
                    "d3ke37ygqgdiqe.cloudfront.net/"
                  )}
                  colors={data.chosenColors}
                />
              ))}
            </div>
          </div>

          {/* Cart summary */}
          <div className="mt-8 bg-[#1a1718] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between text-white mb-4">
                <span className="text-xl">Subtotal</span>
                <span className="text-xl font-semibold">
                  ${totalPrice.toFixed(2)} CAD
                </span>
              </div>
              
              <div className="text-gray-400 text-sm mb-6">
                Taxes and shipping are calculated during checkout
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={redirectToCheckout}
                  className="w-full bg-[#6d229b] text-white py-3 px-4 rounded-md font-bold 
                           transition duration-200 hover:bg-[#55197a] cursor-pointer"
                >
                  CHECKOUT
                </button>
                <Link href="/" className="w-full">
                  <button className="w-full border border-[#9d00ff] text-[#9d00ff] py-3 px-4 rounded-md
                                  font-bold transition duration-200 hover:bg-[#9d00ff20] cursor-pointer">
                    CONTINUE SHOPPING
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartCard({ cartKey, index, name, price, quantity, image, colors }) {
  const [itemPrice, setItemPrice] = useState(price);
  
  // For a 3D print item, "colors" is presumably an object like { Red: 2, Blue: 1 }
  // If no "colors", it's a normal item => user can edit top-level quantity
  const hasColors =
    colors && typeof colors === "object" && !Array.isArray(colors)
      ? true
      : false;

  useEffect(() => {
    // On mount/update, if hasColors => sum them up => store as overall quantity
    if (hasColors) {
      recalcOverallQuantity();
    }
  }, []);

  // Overall item quantity only editable if !hasColors
  function handleItemQuantityChange(e) {
    let holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    holder[cartKey].quantity = parseInt(e.target.value, 10) || 1;
    localStorage.setItem("Cart", JSON.stringify(holder));
    setItemPrice(price);
    location.reload();
  }

  function handleDelete() {
    let holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    delete holder[cartKey];
    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  }

  // ---------- 3D Print Color Logic ----------
  const colorEntries = hasColors ? Object.entries(colors) : [];

  // Recalc item.quantity from sub-colors
  function recalcOverallQuantity() {
    let holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    const cObj = holder[cartKey]?.chosenColors || {};
    let sum = 0;
    for (const cQty of Object.values(cObj)) {
      sum += cQty;
    }
    holder[cartKey].quantity = sum;
    localStorage.setItem("Cart", JSON.stringify(holder));
  }

  function handleColorChange(colorName, newQty) {
    let holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    const cObj = holder[cartKey].chosenColors || {};
    newQty = parseInt(newQty, 10) || 0;

    if (newQty <= 0) {
      // remove color
      delete cObj[colorName];
    } else {
      cObj[colorName] = newQty;
    }

    // if cObj is empty => quantity=0 => optionally remove item entirely
    if (Object.keys(cObj).length === 0) {
      // remove item or keep quantity=0
      delete holder[cartKey];
    } else {
      let sum = 0;
      for (const val of Object.values(cObj)) {
        sum += val;
      }
      holder[cartKey].quantity = sum;
      holder[cartKey].chosenColors = cObj;
    }

    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  }

  function handleRemoveColor(colorName) {
    handleColorChange(colorName, 0);
  }

  const itemTotal = price * quantity;

  return (
    <div className="group transition duration-150 hover:bg-[#22201f]" id={`card-${index}`}>
      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-12 p-4 items-center">
        <div className="col-span-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white relative">
              {image && (
                <img
                  src={image}
                  alt={name}
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <div className="ml-4">
              <div className="text-white font-medium">{name}</div>
              
              {/* Delete button */}
              <button
                onClick={handleDelete}
                className="text-[#9d00ff] text-sm font-semibold hover:text-[#cb18db] flex items-center mt-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-span-2 text-white text-center">
          ${parseFloat(price).toFixed(2)}
        </div>

        
        <div className="col-span-2 flex justify-center">
          {hasColors ? (
            <input
              type="number"
              min={0}
              value={quantity}
              disabled
              className="w-16 text-center bg-gray-700 text-white rounded border border-gray-600 py-1 opacity-50 cursor-not-allowed"
            />
          ) : (
            <input
              type="number" 
              min={1}
              defaultValue={quantity}
              className="w-16 text-center bg-gray-800 text-white rounded border border-gray-700 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              onBlur={handleItemQuantityChange}
            />
          )}
        </div>
        
        <div className="col-span-2 text-white text-right font-medium">
          ${parseFloat(itemTotal).toFixed(2)}
        </div>

      </div>
      
      {/* Mobile layout */}
      <div className="md:hidden p-4">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white">
            {image && (
              <img
                src={image}
                alt={name}
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <div className="ml-3 flex-1">
            <div className="text-white font-medium mb-1">{name}</div>
            <div className="text-white">${parseFloat(price).toFixed(2)}</div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-gray-400 mr-2">Qty:</div>
            {hasColors ? (
              <input
                type="number"
                min={0}
                value={quantity}
                disabled
                className="w-16 text-center bg-gray-700 text-white rounded border border-gray-600 py-1 opacity-50 cursor-not-allowed"
              />
            ) : (
              <input
                type="number"
                min={1} 
                defaultValue={quantity}
                className="w-16 text-center bg-gray-800 text-white rounded border border-gray-700 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                onBlur={handleItemQuantityChange}
              />
            )}
          </div>
          
          <div className="text-white font-medium">
            Total: ${parseFloat(itemTotal).toFixed(2)}
          </div>

        </div>
        
        <button
          onClick={handleDelete}
          className="mt-3 text-[#9d00ff] text-sm font-semibold hover:text-[#cb18db] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Remove
        </button>
      </div>
      
      {/* 3D Print Colors Section - For both mobile and desktop */}
      {hasColors && colorEntries.length > 0 && (
        <div className="px-4 pb-4 -mt-1">
          <div className="pl-4 md:pl-20 border-l-2 border-gray-700">
            <div className="text-white font-medium text-sm mb-2">Color Options:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
              {colorEntries.map(([colorName, colQty]) => (
                <div
                  key={colorName}
                  className="flex items-center justify-between p-2 bg-[#161414] rounded-md border border-gray-800"
                >
                  <span className="text-white text-sm max-w-[120px] overflow-hidden whitespace-nowrap text-ellipsis">
                    {colorName}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={colQty}
                      className="w-16 text-center bg-gray-800 text-white rounded border border-gray-700 py-1 text-sm"
                      onBlur={(e) => handleColorChange(colorName, e.target.value)}
                    />
                    <button
                      className="bg-red-900 text-white rounded-md px-2 py-1 text-xs hover:bg-red-800 transition ease-in-out"
                      onClick={() => handleRemoveColor(colorName)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}