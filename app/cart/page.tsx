"use client";

import Image from "next/image";
import Link from "next/link";
import "@/app/globals.css";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";

export default function CartDetails() {
  const [cards, setCards] = useState<any[]>([]);
  const [totalPrice, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const rawCart = localStorage.getItem("Cart");
    if (!rawCart) return;

    const holder = JSON.parse(rawCart);

    let count = 0;
    for (const [, value] of Object.entries<any>(holder)) {
      count += value.price * value.quantity;
    }
    setTotal(count);
    setCards(Object.entries(holder));
  }, []);

  const redirectToCheckout = async () => {
    try {
      const stripe = await loadStripe(
        "pk_live_51PQlcqRsYE4iOwmAYRRGhtl24Vnvc9mkZ37LB5PlJl8XcHVbTf0B0T3h7Ey7y28URqdIITb48aM9jjZ7wjuCPKKb00utiqhUVv"
      );

      const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
      const details: Record<string, any> = {};

      for (const [key, value] of Object.entries<any>(holder)) {
        const usePriceID = value.chosenOptionPriceID ?? value.priceID;
        details[key] = {
          product: {
            name: value.name,
            price: usePriceID,
            quantity: value.quantity,
          },
          stocktrack: { id: value.id, currpage: value.currpage },
          chosenOption: value.chosenOption || "",
        };

        // Format chosen colors into readable text for checkout
        if (value.chosenColors) {
          if (Array.isArray(value.chosenColors)) {
            const combos = value.chosenColors.map((combo, i) => {
              const comboList = Object.entries(combo)
                .map(([c, q]) => `${c} (${q})`)
                .join(", ");
              return `Set ${i + 1}: ${comboList}`;
            });
            details[key].product.colors = combos.join("; ");
          } else {
            const arr = Object.entries(value.chosenColors).map(
              ([c, q]) => `${c} (${q})`
            );
            details[key].product.colors = arr.join(", ");
          }
        }
      }

      const checkoutResponse = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details }),
      });

      const ses = await checkoutResponse.json();
      if (ses.error === "At least one item isn't in stock!") {
        alert(ses.error);
        return;
      }

      router.push(`/checkout`);
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
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 bg-[#161414] text-gray-300 p-4 border-b border-gray-800">
              <div className="col-span-6 font-semibold">Product</div>
              <div className="col-span-2 font-semibold text-center">Price</div>
              <div className="col-span-2 font-semibold text-center">Quantity</div>
              <div className="col-span-2 font-semibold text-right">Total</div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-800">
              {cards.map(([id, data]: any, i) => (
                <CartCard
                  key={id}
                  cartKey={id}
                  index={i + 1}
                  name={data.name}
                  price={data.price}
                  quantity={data.quantity}
                  image={data.image?.replace(
                    "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
                    "d3ke37ygqgdiqe.cloudfront.net/"
                  )}
                  colors={data.chosenColors}
                  chosenOption={data.chosenOption}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 bg-[#1a1718] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between text-white mb-4">
                <span className="text-xl">Subtotal</span>
                <span className="text-xl font-semibold">
                  ${totalPrice.toFixed(2)} CAD
                </span>
              </div>
              <div className="text-gray-400 text-sm mb-6">
                Taxes and shipping calculated during checkout
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

// -----------------------------------------------------------------------------
// CartCard
// -----------------------------------------------------------------------------
function CartCard({ cartKey, index, name, price, quantity, image, colors, chosenOption }) {
  const [itemPrice, setItemPrice] = useState(price);

  const hasColorsArray = Array.isArray(colors);
  const hasColorsObject =
    colors && typeof colors === "object" && !Array.isArray(colors);
  const colorSets = hasColorsArray ? colors : hasColorsObject ? [colors] : [];

  useEffect(() => {
    if (colorSets.length > 0) recalcOverallQuantity();
  }, []);

  const handleItemQuantityChange = (e: any) => {
    const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    holder[cartKey].quantity = parseInt(e.target.value, 10) || 1;
    localStorage.setItem("Cart", JSON.stringify(holder));
    setItemPrice(price);
    location.reload();
  };

  const handleDelete = () => {
    const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    delete holder[cartKey];
    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  };

  function recalcOverallQuantity() {
    const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    const colorArray = holder[cartKey]?.chosenColors || [];
    let total = 0;
    for (const set of colorArray) {
      const colorCount = Object.keys(set).length;
      const qtyValues = Object.values(set).map(Number);
      total += colorCount > 1 ? 1 : qtyValues.reduce((a, b) => a + b, 0);
    }
    holder[cartKey].quantity = total;
    localStorage.setItem("Cart", JSON.stringify(holder));
  }

  const handleColorChange = (setIndex: number, colorName: string, newQty: any) => {
    const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    const chosenColors = holder[cartKey].chosenColors || [];
    if (!Array.isArray(chosenColors)) return;

    const targetSet = chosenColors[setIndex] || {};
    const parsedQty = parseInt(String(newQty), 10) || 0;

    if (parsedQty <= 0) {
      delete targetSet[colorName];
    } else {
      targetSet[colorName] = parsedQty;
    }

    if (Object.keys(targetSet).length === 0) {
      chosenColors.splice(setIndex, 1);
    } else {
      chosenColors[setIndex] = targetSet;
    }

    // Recalculate total quantity
    let totalQty = 0;
    for (const set of chosenColors) {
      const colorCount = Object.keys(set).length;
      const qtyValues = Object.values(set).map(Number);
      totalQty += colorCount > 1 ? 1 : qtyValues.reduce((a, b) => a + b, 0);
    }

    if (chosenColors.length === 0) {
      delete holder[cartKey];
    } else {
      holder[cartKey].chosenColors = chosenColors;
      holder[cartKey].quantity = totalQty;

      const optionSummaryParts: string[] = [];
      const existing = holder[cartKey];
      if (existing?.chosenOption) {
        const nonColorParts = existing.chosenOption
          .split(";")
          .map((s) => s.trim())
          .filter((s) => !s.toLowerCase().startsWith("colour"));
        optionSummaryParts.push(...nonColorParts);
      }

      chosenColors.forEach((combo) => {
        Object.keys(combo).forEach((label) => optionSummaryParts.push(label));
      });

      holder[cartKey].chosenOption = optionSummaryParts.join("; ");
    }

    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  };


  const handleCombinationRemove = (setIndex: number) => {
    const holder = JSON.parse(localStorage.getItem("Cart") || "{}");
    const colorArray = holder[cartKey]?.chosenColors || [];
    colorArray.splice(setIndex, 1);

    // Recalculate quantity
    let totalQty = 0;
    for (const set of colorArray) {
      const colorCount = Object.keys(set).length;
      const qtyValues = Object.values(set).map(Number);
      totalQty += colorCount > 1 ? 1 : qtyValues.reduce((a, b) => a + b, 0);
    }

    if (colorArray.length === 0) {
      // remove entire product
      delete holder[cartKey];
    } else {
      holder[cartKey].chosenColors = colorArray;
      holder[cartKey].quantity = totalQty;

      const optionSummaryParts: string[] = [];

      const existing = holder[cartKey];
      if (existing?.chosenOption) {
        const nonColorParts = existing.chosenOption
          .split(";")
          .map((s) => s.trim())
          .filter((s) => !s.toLowerCase().startsWith("colour"));
        optionSummaryParts.push(...nonColorParts);
      }

      colorArray.forEach((combo) => {
        Object.keys(combo).forEach((label) => optionSummaryParts.push(label));
      });

      holder[cartKey].chosenOption = optionSummaryParts.join("; ");
    }

    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  };


  const itemTotal = price * quantity;

  // --- Desktop Layout ---
  return (
    <div className="group transition duration-150 hover:bg-[#22201f]" id={`card-${index}`}>
      <div className="hidden md:grid md:grid-cols-12 p-4 items-center">
        <div className="col-span-6 flex items-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white">
            {image && <img src={image} alt={name} className="object-cover w-full h-full" />}
          </div>
          <div className="ml-4">
            <div className="text-white font-medium">{name}</div>
            {chosenOption && (
              <div className="text-gray-400 text-sm mt-1">Selected: {chosenOption}</div>
            )}
            <button
              onClick={handleDelete}
              className="text-[#9d00ff] text-sm font-semibold hover:text-[#cb18db] flex items-center mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="mr-1">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
              Remove
            </button>
          </div>
        </div>

        <div className="col-span-2 text-white text-center">
          ${parseFloat(price).toFixed(2)}
        </div>

        <div className="col-span-2 flex justify-center">
          <input
            type="number"
            min={1}
            defaultValue={quantity}
            disabled={colorSets.length > 0}
            className={`w-16 text-center text-white rounded border border-gray-700 py-1 ${colorSets.length > 0
              ? "bg-gray-700 opacity-50 cursor-not-allowed"
              : "bg-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              }`}
            onBlur={handleItemQuantityChange}
          />
        </div>

        <div className="col-span-2 text-white text-right font-medium">
          ${parseFloat(itemTotal).toFixed(2)}
        </div>
      </div>

      {/* --- Mobile Layout --- */}
      <div className="md:hidden p-4 flex flex-col gap-3 border-gray-800">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white flex-shrink-0">
            {image && <img src={image} alt={name} className="object-cover w-full h-full" />}
          </div>
          <div className="ml-4 flex-1">
            <div className="text-white font-medium">{name}</div>
            {chosenOption && (
              <div className="text-gray-400 text-sm mt-1">{chosenOption}</div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-white font-medium">${parseFloat(price).toFixed(2)}</div>
          <input
            type="number"
            min={1}
            defaultValue={quantity}
            disabled={colorSets.length > 0}
            className={`w-16 text-center text-white rounded border border-gray-700 py-1 ${colorSets.length > 0
              ? "bg-gray-700 opacity-50 cursor-not-allowed"
              : "bg-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              }`}
            onBlur={handleItemQuantityChange}
          />
        </div>

        <button
          onClick={handleDelete}
          className="text-[#9d00ff] text-sm font-semibold hover:text-[#cb18db] flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="mr-1">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          Remove
        </button>
      </div>

      {/* --- Colors Section --- */}
      {colorSets.length > 0 && (
        <div className="px-4 pb-4">
          <div className="pl-4 md:pl-20 border-l-2 border-gray-700">
            <div className="text-white font-medium text-sm mb-2">Colour Options:</div>
            {colorSets.map((colorMap, setIndex) => {
              const entries = Object.entries(colorMap);
              const isCombination = entries.length > 1;
              return (
                <div
                  key={`colorset-${setIndex}`}
                  className="mb-3 bg-[#1c1a1b] p-3 rounded-lg border border-gray-800"
                >
                  {isCombination && (
                    <div className="text-gray-400 text-xs mb-2">
                      Combination {setIndex + 1}
                    </div>
                  )}

                  {isCombination ? (
                    <>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {entries.map(([colorName]) => (
                          <span
                            key={colorName}
                            className="text-white text-sm bg-[#161414] px-3 py-1 rounded-md border border-gray-800"
                          >
                            {colorName.split(": ")[1]}
                          </span>
                        ))}
                      </div>
                      <button
                        className="bg-red-900 text-white rounded-md px-3 py-1 text-xs hover:bg-red-800 transition"
                        onClick={() => handleCombinationRemove(setIndex)}
                      >
                        Remove Combination
                      </button>
                    </>
                  ) : (
                    entries.map(([colorName, colQty]) => (
                      <div
                        key={colorName}
                        className="flex items-center justify-between p-2 bg-[#161414] rounded-md border border-gray-800"
                      >
                        <span className="text-white text-sm">
                          {colorName.split(": ")[1]}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            defaultValue={colQty}
                            className="w-16 text-center bg-gray-800 text-white rounded border border-gray-700 py-1 text-sm"
                            onBlur={(e) => handleColorChange(setIndex, colorName, e.target.value)}
                          />
                          <button
                            className="bg-red-900 text-white rounded-md px-2 py-1 text-xs hover:bg-red-800 transition"
                            onClick={() => handleColorChange(setIndex, colorName, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

