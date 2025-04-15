"use client";

import Image from "next/image";
import Link from "next/link";
import "@/app/globals.css";
import { useState, useEffect } from "react";

export default function ListingDetails({ params }) {
  const [listingData, setData] = useState({});
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); // Which image is focused
  const [itemID, setID] = useState();
  const [currPage, setPage] = useState();

  // ---- NEW: color options + selected color state
  const colorOptions = ["White", "Grey", "Black", "Brown", "Teal (Matte)", "Magenta", "Pink", "Rattan Purple", "Ice Blue", "Milk Green", "Red", "Green", "Blue", "Yellow", "Silk Blue Purple", "Silk Red Green", "Silk Galaxy Blue", "Silk Galaxy Purple", "Silk Mint", "Silk Purple", "Silk Gold", "Silk Silver"];
  const [selectedColor, setSelectedColor] = useState("");  

  // 1) Load data from backend
  useEffect(() => {
    const fetchData = async () => {
      const body = new FormData();
      let items = params.gecko.split("-");
      body.append("id", items[1]);
      body.append("sitePage", items[0]);
      setID(items[1]);
      setPage(items[0]);

      const result = await fetch("/api/forsale/getlisting", {
        method: "POST",
        body,
        cache: "force-cache",
      });
      const dat = await result.json();

      // "images" should be an array from the backend
      setData(dat);

      // If there's at least one image, set the first as focused
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
  }, [params.gecko]);

  // 2) Build array of images (filter out empty if needed)
  const images = Array.isArray(listingData.images)
    ? listingData.images.filter((img) => img !== "")
    : [];

  // Utility to highlight the focused thumbnail
  const getBorderStyle = (imageUrl) => {
    return imageUrl === focused
      ? "outline outline-4 outline-white scale-105 brightness-50"
      : "outline outline-4 outline-white";
  };

  // 3) Add to Cart
  const handleAdd = () => {
    const btn = document.getElementById("addbutton");
    if (btn) {
      btn.innerHTML = "Adding...";
      btn.classList.add("brightness-50");
      btn.classList.remove("hover:brightness-75");
      btn.classList.remove("cursor-pointer");
    }

    let current = localStorage.getItem("Cart");
    if (current == null) {
      localStorage.setItem("Cart", "{}");
      current = "{}";
    }
    const cartObj = JSON.parse(current);

    const listingID = params.gecko.split("-")[1];

    if (listingID in cartObj) {
      // Already in cart, just increment quantity
      if (currPage != "prints")
      {
        cartObj[listingID].quantity += 1;
      }
      else
      {
        cartObj[listingID].quantity += 1;

        if (selectedColor in cartObj[listingID].chosenColors)
        {
          cartObj[listingID].chosenColors[selectedColor] += 1
        }
        else
        {
          cartObj[listingID].chosenColors[selectedColor] = 1
        }
      }
    } else {
      // If there's at least one image, pick the first for cart preview
      const mainImage = images.length > 0 ? images[0] : "";

      if (currPage != "prints")
      {
        cartObj[listingID] = {
          name: listingData.name,
          price: listingData.price,
          image: mainImage,
          quantity: 1,
          priceID: listingData.priceid,
          currpage: currPage,
          id: itemID,
        };
      }
      else
      {
        cartObj[listingID] = {
          name: listingData.name,
          price: listingData.price,
          image: mainImage,
          quantity: 1,
          priceID: listingData.priceid,
          currpage: currPage,
          id: itemID,
          chosenColors: {},
        };
        cartObj[listingID].chosenColors[selectedColor] = 1;
      }
    }

    localStorage.setItem("Cart", JSON.stringify(cartObj));
    location.reload();
  };

  // 4) Modal (lightbox) logic
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

  // 5) Handle loading skeleton
  if (loading) {
    return (
      <div>
        <div className="flex relative md:h-screen md:max-h-[1000px] justify-center md:pt-[100px] md:mb-0">
          <div className="flex justify-center md:scale-110">
            {/* Loading Skeleton */}
            <div className="absolute top-[-10px] md:static md:flex md:scale-90 scale-[80%] md:mt-0 md:pt-0 md:pb-0">
              <div className="md:scale-110 scale-90">
                <div className="relative w-[400px] h-[400px]">
                  <div className="table m-auto md:m-0 transition ease-in-out w-[400px] h-[400px] outline outline-4 outline-[#202020] bg-[#2c2c2c] rounded-xl drop-shadow-xl duration-200 md:mr-[100px] md:ml-[100px] animate-pulse"></div>
                </div>
                <div className="flex pt-[20px] md:mr-[100px] md:ml-[100px] space-x-5 w-[400px] justify-center">
                  <div className="transition h-[80px] w-[80px] ease-in-out rounded-md drop-shadow-xl outline-[#202020] bg-[#2c2c2c] animate-pulse"></div>
                  <div className="transition h-[80px] w-[80px] ease-in-out rounded-md drop-shadow-xl outline-[#202020] bg-[#2c2c2c] animate-pulse"></div>
                  <div className="transition h-[80px] w-[80px] ease-in-out rounded-md drop-shadow-xl outline-[#2c2c2c] bg-[#2c2c2c] animate-pulse"></div>
                  <div className="transition h-[80px] w-[80px] ease-in-out rounded-md drop-shadow-xl outline-[#2c2c2c] bg-[#2c2c2c] animate-pulse"></div>
                </div>
              </div>
              <div className="absolute md:static pr-[140px] md:pb-[80px]">
                <div className="w-[125px] h-[40px] rounded-lg bg-[#2c2c2c] animate-pulse"></div>
                <br />
                <p className="w-[330px] h-[40px] rounded-lg bg-[#2c2c2c] animate-pulse"></p>
                <br />
                <p className="w-[350px] h-[120px] rounded-lg bg-[#2c2c2c] animate-pulse" />
                <br />
                <br />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6) Render final product page
  return (
    <div>
      <div className="flex relative justify-center md:pt-[75px] md:mb-0">
        <div className="flex justify-center md:scale-110 mb-[150px]">
          <div className="absolute top-[-30px] md:static md:flex md:scale-90 scale-[80%]">
            {/* LEFT COLUMN (images) */}
            <div className="md:scale-110 scale-90">
              {/* Focused (main) image */}
              <div className="relative w-[400px] h-[400px]">
                {focused ? (
                  <img
                    src={focused}
                    alt="Listing"
                    width={400}
                    height={400}
                    className="table m-auto md:m-0 transition ease-in-out w-[400px] h-[400px] outline outline-4 outline-white rounded-xl drop-shadow-xl duration-200 md:mr-[100px] md:ml-[100px] cursor-zoom-in"
                    onClick={() => openModal(currentIndex)}
                  />
                ) : (
                  <div className="w-[400px] h-[400px] bg-gray-600 flex items-center justify-center text-white text-xl">
                    No image
                  </div>
                )}
              </div>

              {/* Thumbnails Row (show max 4) */}
              <div className="flex pt-[20px] md:mr-[100px] md:ml-[100px] space-x-5 w-[400px] justify-center">
                {/* First 3 images */}
                {images.slice(0, 3).map((imageUrl, index) => {
                  const thumbUrl = imageUrl.replace(
                    "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
                    "d3ke37ygqgdiqe.cloudfront.net/"
                  );
                  return (
                    <img
                      key={index}
                      src={thumbUrl}
                      width={80}
                      height={80}
                      alt="Thumbnail"
                      className={`transition h-[80px] w-[80px] ease-in-out ${getBorderStyle(
                        thumbUrl
                      )} rounded-md drop-shadow-xl cursor-pointer hover:scale-105 hover:brightness-50 duration-200`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setFocused(thumbUrl);
                      }}
                    />
                  );
                })}

                {/* 4th slot (if there is a 4th image) */}
                {images.length >= 4 && (() => {
                  const fourthImageUrl = images[3].replace(
                    "vintage-reptiles-storage.s3.us-east-2.amazonaws.com/",
                    "d3ke37ygqgdiqe.cloudfront.net/"
                  );

                  return (
                    <div
                      key="fourth-img"
                      className={`relative transition h-[80px] w-[80px] ease-in-out rounded-md drop-shadow-xl cursor-pointer hover:scale-105 hover:brightness-50 duration-200 ${getBorderStyle(
                        fourthImageUrl
                      )}`}
                      onClick={() => {
                        // If user clicks the 4th, focus that image & open modal
                        setCurrentIndex(3);
                        setFocused(fourthImageUrl);
                      }}
                    >
                      <img
                        src={fourthImageUrl}
                        alt="Thumbnail"
                        className="w-[80px] h-[80px] object-cover rounded-md"
                      />
                      {images.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                          <span className="text-white text-lg font-bold">
                            +{images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* RIGHT COLUMN (Details) */}
            <div className="absolute md:static md:pr-[140px] md:pb-[80px] pb-[140px]">
              {listingData.price !== "" &&
                parseInt(listingData.stock) > 0 && (
                  <div className="absolute right-[40px] top-[5px] text-white text-lg font-bold md:right-[150px]">
                    Stock: {listingData.stock}
                  </div>
                )}

              <div className="relative">
                {listingData.issale === "true" && (
                  <div className="absolute top-[50px] left-[315px] md:-top-[36px] md:left-[10px] scale-[150%] bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    Sale!
                  </div>
                )}
              </div>

              {/* Price */}
              {listingData.price !== "" && (
                <p
                  className={
                    listingData.issale === "true"
                      ? "text-red-500 text-3xl"
                      : "text-white text-3xl"
                  }
                >
                  ${parseFloat(listingData.price).toFixed(2)}
                </p>
              )}
              {listingData.issale === "true" && (
                <div className="line-through text-white text-3xl">
                  ${parseFloat(listingData.oldprice).toFixed(2)}
                </div>
              )}
              <br />

              {/* Name */}
              <p className="text-white align-top text-4xl font-bold md:w-[200px]">
                {listingData.name}
              </p>
              <div className="w-full h-[1px] bg-white mt-[15px] mb-[15px]" />

              {/* Description */}
              <p
                className="text-white align-top text-xl w-[400px] w-[300px]"
                dangerouslySetInnerHTML={{
                  __html: listingData.description?.replace(
                    /(\n)+/g,
                    "<br />"
                  ),
                }}
              />
              <br />

              {/* NEW: 3D Print Color Dropdown */}
              {currPage == "prints" && (<div className="mb-5">
                <label className="block mb-2 text-white text-lg font-bold">
                  Colour
                </label>
                <select
                  className="bg-gray-700 text-white border border-gray-600 p-2.5 rounded"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                >
                  <option value="">Choose a colour</option>
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>)}

              <br />

              {/* Add to cart button or out of stock */}
              {listingData.price !== "" && parseInt(listingData.stock) > 0 && (
                <div
                  id="addbutton"
                  className="font-bold text-white bg-[#9d00ff] w-[175px] h-[50px] flex items-center justify-center rounded-full text-lg outline outline-3 scale-[110%] cursor-pointer hover:brightness-75 drop-shadow-md"
                  onClick={handleAdd}
                >
                  Add to cart
                </div>
              )}
              {parseInt(listingData.stock) <= 0 && (
                <div className="font-bold text-white bg-[#9d00ff] w-[175px] h-[50px] flex items-center justify-center rounded-full text-lg outline outline-3 scale-[110%] brightness-50 drop-shadow-md">
                  Out of Stock!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {images.length > 0 && (
        <div
          className={`transition ease-in-out duration-0 fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${
            isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white text-4xl drop-shadow-lg"
            onClick={closeModal}
          >
            ×
          </button>

          {/* Prev Button */}
          <button
            className="absolute left-4 text-white text-4xl drop-shadow-lg py-[250px]"
            onClick={prevImage}
          >
            ←
          </button>

          {/* Focused Image */}
          <img
            src={focused}
            alt="Expanded Image"
            className={`absolute transition ease-in-out duration-200 max-w-full max-h-full ${
              isModalOpen ? "opacity-100" : "opacity-0 translate-y-10"
            }`}
          />

          {/* Next Button */}
          <button
            className="absolute right-4 text-white text-4xl drop-shadow-lg py-[250px]"
            onClick={nextImage}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
