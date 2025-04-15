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
    <div>
      <br />
      <br />
      <div className="flex justify-center">
        <div className="text-white text-4xl font-bold">Your Cart</div>
        {cards.length > 0 && (
          <div
            id="products"
            className="absolute max-w-[1000px] w-[100%] pb-[50px] pt-[80px]"
          >
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

            {cards.length > 0 && (
              <div className="flex justify-center">
                <div className="w-[90%] max-w-[1000px] h-[1px] bg-gray-400"></div>
              </div>
            )}

            {/* Subtotal / checkout */}
            <div className="md:ml-auto md:w-[500px]">
              <div className="flex justify-center text-white text-xl pt-[40px]">
                Subtotal
                <span className="pl-[30px] text-lg">
                  ${totalPrice.toFixed(2)} CAD
                </span>
              </div>
              <div className="flex justify-center text-white text-sm pt-[15px]">
                Taxes and shipping are calculated during checkout
              </div>
              <div
                onClick={redirectToCheckout}
                className="flex justify-center text-white text-md pt-[45px]"
              >
                <div className="w-[320px] bg-[#6d229b] text-center py-[10px] rounded-md font-bold transition ease-in-out duration-200 hover:bg-[#55197a] cursor-pointer">
                  CHECK OUT
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {cards.length === 0 && (
        <div className="flex justify-center text-white text-3xl pt-[40px]">
          ...is empty!
        </div>
      )}
    </div>
  );
}

/**
 * CartCard representing a single cart item.
 * If it has chosenColors (i.e. it's a 3D print), we treat overall quantity 
 * as sum of sub-color quantities. 
 * Otherwise, user can directly edit item quantity.
 */
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
      sum += cQty as number;
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
      holder[cartKey].quantity = 0;
    } else {
      let sum = 0;
      for (const val of Object.values(cObj)) {
        sum += val as number;
      }
      holder[cartKey].quantity = sum;
    }

    holder[cartKey].chosenColors = cObj;
    localStorage.setItem("Cart", JSON.stringify(holder));
    location.reload();
  }

  function handleRemoveColor(colorName) {
    handleColorChange(colorName, 0);
  }

  return (
    <div>
      <div className="flex justify-center">
        <div className="w-[90%] max-w-[1000px] h-[1px] bg-gray-400"></div>
      </div>

      <div className="flex" id={`card-${index}`}>
        <div className="flex mr-auto pl-[40px] pt-[25px] pb-[20px]">
          <img
            className="w-[70px] h-[70px] rounded-lg outline outline-white outline-3"
            src={image}
            alt="Cart item"
          />
          <div className="text-white text-md pl-[20px] max-w-[100px] mb-[10px]">
            {name}
          </div>
        </div>

        <div className="ml-auto">
          <div className="pr-[40px] pt-[20px] text-white text-lg text-right">
            ${itemPrice}.00
          </div>

          {/* If it's a normal item, user can edit quantity. 
              If it's a 3D print (hasColors), quantity is read-only. */}
          <div className="pr-[40px] pt-[15px] text-white text-sm">
            Qty
            {hasColors ? (
              // read-only derived quantity
              <input
                type="number"
                min={0}
                value={quantity}
                disabled
                className="w-[60px] ml-[5px] rounded-sm text-black text-lg text-center opacity-50 cursor-not-allowed"
              />
            ) : (
              // user can edit
              <input
                type="number"
                min={1}
                defaultValue={quantity}
                className="w-[60px] ml-[5px] rounded-sm text-black text-lg text-center"
                onBlur={handleItemQuantityChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* If it's a 3D print => show sub-colors */}
      {hasColors && (
      <div className="ml-[50px] mb-2">
        <div className="text-white font-bold text-md mb-1">Colors:</div>
        {colorEntries.map(([colorName, colQty]) => (
          <div
            key={colorName}
            className="flex items-center mb-1 w-[240px] justify-between"
          >
            {/* 
              The color name on the left, truncated if very long 
              so it won't push the right side away.
            */}
            <span className="text-white mr-2 max-w-[180px] overflow-hidden whitespace-nowrap text-ellipsis">
              {colorName}:
            </span>

            {/* 
              The quantity input + remove button on the right,
              in their own small container. 
            */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                defaultValue={colQty}
                className="w-[60px] rounded-sm text-black text-md text-center"
                onBlur={(e) => handleColorChange(colorName, e.target.value)}
              />
              <button
                className="bg-red-600 text-white rounded-md px-2 py-1 text-xs hover:bg-red-800 transition ease-in-out"
                onClick={() => handleRemoveColor(colorName)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    )}


      {/* Remove entire item */}
      <div
        className="text-[#9d00ff] font-bold underline underline-offset-[5px] ml-[50px] mb-[15px] w-[60px] h-[30px] cursor-pointer hover:text-[#6d229b]"
        onClick={handleDelete}
      >
        Remove
      </div>
    </div>
  );
}
