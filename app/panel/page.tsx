"use client";

import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import Resizer from "react-image-file-resizer";
import { Switch } from '@/components/ui/switch';
import { toast } from "sonner";

// Helper to resize an image file client-side
const resizeFile = (file) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      1200,
      1200,
      "JPEG",
      75,
      0,
      (uri) => {
        resolve(uri);
      },
      "base64"
    );
  });

export default function Home() {
  // Basic form data for ADD
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  // Whether custom options are enabled
  const [hasCustomOptions, setHasCustomOptions] = useState(false);
  // An array of { label: string, imageIndex: number }
  const [customOptions, setCustomOptions] = useState<
    { label: string; imageIndex: number; price: string }[]
  >([]);


  // Sale state for ADD
  const [isSale, setSale] = useState(false);
  const [olderPrice, setOldPrice] = useState("Not Used");

  // Up to 16 images in ADD
  const [files, setFiles] = useState([]);

  // The selected route (category)
  const [routeData, setRoute] = useState("/api/forsale/availability");

  // A simple array of categories (label + route)
  const categories = [
    { label: "Geckos", value: "/api/forsale/availability" },
    { label: "Plants", value: "/api/forsale/plants" },
    { label: "3D Prints", value: "/api/forsale/prints" },
    { label: "Isopods", value: "/api/forsale/isopods" },
    { label: "Male Crestie", value: "/api/forsale/breeders/malecrestedgeckos" },
    { label: "Female Crestie", value: "/api/forsale/breeders/femalecrestedgeckos" },
    { label: "Male Garg", value: "/api/forsale/breeders/malegargoylegeckos" },
    { label: "Female Garg", value: "/api/forsale/breeders/femalegargoylegeckos" },
    { label: "Male Chewie", value: "/api/forsale/breeders/malechahouageckos" },
    { label: "Female Chewie", value: "/api/forsale/breeders/femalechahouageckos" },
  ];

  // Loading spinner while switching categories
  const [loading, setLoading] = useState(false);

  // NEW: track which operation is selected: "add", "edit", or "remove"
  const [activeOp, setActiveOp] = useState("add"); // default to "add"

  // Handle category clicks
  function handleCategoryClick(newRoute) {
    // Only set loading and fetch data if the route is different
    if (newRoute !== routeData) {
      setLoading(true); // show spinner
      setRoute(newRoute); // triggers useEffect for fetch
    }
  }

  // Function to refresh items for the current category
  async function refreshItems() {
    try {
      const result = await fetch(routeData);
      const dat = await result.json();
      console.log("Refreshed data:", dat);

      const items = Array.isArray(dat) ? dat : [];

      // 1) Render "Edit" cards
      let cardsForEdit = items.map((element) => (
        <CardEdit 
          key={element.id} 
          routeData={routeData} 
          onItemUpdated={refreshItems} 
          {...element} 
        />
      ));
      let container = document.getElementById("edit2");
      if (container) {
        let to_inject = ReactDOM.createRoot(container);
        to_inject.render(cardsForEdit);
      }

      // 2) Render "Remove" cards
      let cardsForRemove = items.map((element) => (
        <CardRemove 
          key={element.id} 
          routeData={routeData} 
          onItemDeleted={refreshItems} 
          {...element} 
        />
      ));
      container = document.getElementById("remove2");
      if (container) {
        let to_inject = ReactDOM.createRoot(container);
        to_inject.render(cardsForRemove);
      }
    } catch (err) {
      console.error("Error refreshing items:", err);
    }
  }

  // Load data from DB each time routeData changes
  useEffect(() => {
    if (routeData) {
      setLoading(true);
      refreshItems().finally(() => {
        setLoading(false); // hide spinner after refresh completes
      });
    }
  }, [routeData]);

  // Handle text changes in the "Add" form
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Toggle sale
  function handleSaleChange() {
    const newValue = !isSale;
    console.log("Sale toggle changed to:", newValue);
    setSale(newValue);
  }
  
  // Old price input
  function handleSaleChange2(e) {
    setOldPrice(e.target.value);
  }

  // When user selects images (up to 16) in ADD
  function handleFilesChange(e) {
    const selected = Array.from(e.target.files);
    const combined = [...files, ...selected].slice(0, 16);
    setFiles(combined);
  }

  // Remove one file from ADD
  function handleRemoveFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Submit new item
  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitting new item...");

    // 1) Upload each file to S3
    let uploadedUrls = [];
    for (const file of files) {
      let body = new FormData();
      const extension = Date.now() + file.name;
      body.append("imagename", extension);

      const signedResp = await fetch("/api/forsale/awsupload", {
        method: "POST",
        body,
      });
      const { presignedUrl } = await signedResp.json();

      const newimage = await resizeFile(file);
      const base64Data = Buffer.from(
        newimage.replace(/^data:\w+\/[a-zA-Z+\-.]+;base64,/, ""),
        "base64"
      );

      await fetch(presignedUrl, {
        method: "PUT",
        body: base64Data,
      });

      const finalUrl =
        "https://vintage-reptiles-storage.s3.us-east-2.amazonaws.com/" +
        extension;
      uploadedUrls.push(finalUrl);
    }

    // 2) Build final FormData
    let finalBody = new FormData();
    finalBody.append("name", formData.name);
    finalBody.append("description", formData.description);
    finalBody.append("price", formData.price);
    finalBody.append("stock", formData.stock);

    if (isSale) {
      finalBody.append("issale", "true");
      finalBody.append("oldprice", olderPrice);
    } else {
      finalBody.append("issale", "false");
      finalBody.append("oldprice", "Not Used");
    }

    // Append the images array
    finalBody.append("images", JSON.stringify(uploadedUrls));

    if (hasCustomOptions) {
      finalBody.append("customOptions", JSON.stringify(customOptions));
    }    

    const resp = await fetch(routeData, { method: "POST", body: finalBody });
    console.log("Created new item. Resp:", resp);

     // Refresh the displayed items after successful add
     if (resp.ok) {
      refreshItems();
      toast("Item Uploaded", {
        description: "The new item has been added successfully.",
      });
    } else {
      toast("Upload failed", {
        description: "Failed to upload item. Please try again.",
      });
    }

    // Reset form
    setFormData({ name: "", description: "", price: "", stock: "" });
    setSale(false);
    setOldPrice("Not Used");
    setFiles([]);
  }

  // Toggle which panel is visible (add, edit, remove) + setActiveOp
  function handleOptions(button) {
    ["add", "edit", "remove"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add("hidden", "pointer-events-none");
    });

    const target = document.getElementById(button);
    target?.classList.remove("hidden", "pointer-events-none");

    // Record which operation is selected
    setActiveOp(button);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 relative">
      {/* If loading is true, show an overlay with spinner */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          {/* Simple Tailwind spinner */}
          <div className="w-12 h-12 border-4 border-gray-300 rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Vintage Reptiles Admin Panel</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* ---------- LEFT COLUMN: Custom Category Selector ---------- */}
          <div className="bg-gray-800 p-4 rounded-xl md:w-1/3 w-full">
            <h2 className="text-xl font-semibold mb-4">Choose Category</h2>

            {/* Custom category buttons instead of radios */}
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                // If the user has selected this route, we highlight it
                const isActive = routeData === cat.value;
                return (
                  <div
                    key={cat.value}
                    onClick={() => handleCategoryClick(cat.value)}
                    className={`rounded-md px-3 py-2 border border-gray-600 text-center cursor-pointer transition
                      ${
                        isActive
                          ? "bg-[#9d00ff] text-white scale-105"
                          : "bg-gray-700 text-gray-200 hover:scale-105"
                      }`}
                  >
                    {cat.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- RIGHT COLUMN: Add/Edit/Remove Panels ---------- */}
          <div className="md:w-2/3 w-full bg-gray-800 p-4 rounded-xl relative">
            {/* Icons to switch panels */}
            <div className="flex justify-center md:justify-end gap-6 mb-6 pt-5 md:pr-5">
              {/* ADD ICON */}
              <div
                onClick={() => handleOptions("add")}
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${
                  activeOp === "add" ? "scale-110" : ""
                }`}
              >
                <img
                  src="/images/add.png"
                  alt="Add"
                  className="w-[70px]"
                />
                {activeOp === "add" && (
                  <div className="absolute top-[75px] left-1/2 -translate-x-1/2 text-xs font-bold bg-[#9d00ff] w-[65px] h-[2px]"></div>
                )}
              </div>

              {/* EDIT ICON */}
              <div
                onClick={() => handleOptions("edit")}
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${
                  activeOp === "edit" ? "scale-110" : ""
                }`}
              >
                <img
                  src="/images/edit.png"
                  alt="Edit"
                  className="w-[50px]"
                />
                {activeOp === "edit" && (
                  <div className="absolute top-[75px] left-1/2 -translate-x-1/2 text-xs font-bold bg-[#9d00ff] w-[65px] h-[2px]"></div>
                )}
              </div>

              {/* REMOVE ICON */}
              <div
                onClick={() => handleOptions("remove")}
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${
                  activeOp === "remove" ? "scale-110" : ""
                }`}
              >
                <img
                  src="/images/remove.png"
                  alt="Remove"
                  className="w-[70px]"
                />
                {activeOp === "remove" && (
                  <div className="absolute top-[75px] left-1/2 -translate-x-1/2 text-xs font-bold bg-[#9d00ff] w-[65px] h-[2px]"></div>
                )}
              </div>
            </div>

            {/* ---------------- ADD PANEL ---------------- */}
            {/* Replace the current ADD form with this improved version */}
            <div id="add">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                Add New Item
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {/* Left column */}
                <div>
                  {/* Name */}
                  <div className="mb-4">
                    <label className="block mb-2 text-gray-300 text-sm">Name</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      type="text"
                      placeholder="Product name"
                    />
                  </div>
                  
                  {/* Price Section */}
                  <div className="mb-4">
                  <label className="block mb-2 text-gray-300 text-sm">Price</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                      <input
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 pl-7"
                        type="text"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-700 rounded-md border border-gray-600 px-3">
                      <label className="text-gray-300 text-sm whitespace-nowrap">On Sale</label>
                      <Switch
                        checked={isSale}
                        onCheckedChange={setSale}
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-700 rounded-md border border-gray-600 px-3">
                      <label className="text-gray-300 text-sm">Custom Options</label>
                      <Switch
                        checked={hasCustomOptions}
                        onCheckedChange={setHasCustomOptions}
                      />
                    </div>
                  </div>
                </div>

                {hasCustomOptions && (
                  <div className="mb-6 space-y-2">
                    <p className="text-gray-400 text-sm">Define Options:</p>
                    {customOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        {/* Option Label */}
                        <input
                          type="text"
                          placeholder="Option name"
                          value={opt.label}
                          onChange={e => {
                            const newOpts = [...customOptions];
                            newOpts[idx].label = e.target.value;
                            setCustomOptions(newOpts);
                          }}
                          className="flex-1 p-2 rounded bg-gray-700 text-gray-200"
                        />

                        {/* Image selector */}
                        <select
                          value={opt.imageIndex}
                          onChange={e => {
                            const newOpts = [...customOptions];
                            newOpts[idx].imageIndex = Number(e.target.value);
                            setCustomOptions(newOpts);
                          }}
                          className="p-2 rounded bg-gray-700 text-gray-200"
                        >
                          <option value="">Image #</option>
                          {files.map((_, i) => (
                            <option key={i} value={i}>
                              #{i+1}
                            </option>
                          ))}
                        </select>

                        {/* NEW: Price for this option */}
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-gray-400">$</span>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={opt.price}
                            onChange={e => {
                              const newOpts = [...customOptions];
                              newOpts[idx].price = e.target.value;
                              setCustomOptions(newOpts);
                            }}
                            className="w-20 pl-6 p-2 rounded bg-gray-700 text-gray-200"
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() =>
                            setCustomOptions(customOptions.filter((_, i) => i !== idx))
                          }
                          className="text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setCustomOptions([...customOptions, { label: "", imageIndex: 0, price: ""}])
                      }
                      className="text-sm text-purple-400 hover:underline"
                    >
                      + Add another option
                    </button>
                  </div>
                )}

                  
                  {/* Old Price (only if on sale) */}
                  {isSale && (
                    <div className="mb-4">
                      <label className="block mb-2 text-gray-300 text-sm">Original Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                        <input
                          type="text"
                          onChange={handleSaleChange2}
                          className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Stock */}
                  <div className="mb-4">
                    <label className="block mb-2 text-gray-300 text-sm">Stock</label>
                    <input
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      type="text"
                      placeholder="Quantity available"
                    />
                  </div>
                </div>
                
                {/* Right column */}
                <div>
                  {/* Description */}
                  <div className="mb-4">
                    <label className="block mb-2 text-gray-300 text-sm">Description</label>
                    <textarea
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      placeholder="Product description..."
                    />
                  </div>
                  
                  {/* Images */}
                  <div className="mb-4">
                    <label className="block mb-2 text-gray-300 text-sm">Images (up to 16)</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 transition duration-300">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFilesChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                          <p className="text-gray-400">Drag & drop or click to upload</p>
                          <p className="text-gray-500 text-xs">(JPG, PNG, WebP - max 5MB each)</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Image previews - full width */}
                <div className="col-span-full">
                  {files.length > 0 && (
                    <div className="mt-2 mb-4">
                      <p className="text-sm text-gray-400 mb-2">{files.length} image(s) selected</p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, idx) => {
                          const preview = URL.createObjectURL(file);
                          return (
                            <div key={idx} className="relative group">
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-md border border-gray-600 group-hover:opacity-75 transition"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                                onClick={() => handleRemoveFile(idx)}
                              >
                                ✕
                              </button>
                              <p className="text-xs text-gray-400 mt-1 truncate max-w-[80px]">{file.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Submit Button - full width */}
                <div className="col-span-full mt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:scale-[1.02] transition duration-300 flex items-center justify-center w-full md:w-auto"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>

            {/* ---------------- EDIT PANEL ---------------- */}
            <div
              id="edit"
              className="hidden pointer-events-none relative pt-4 transition-opacity"
            >
              <h2 className="text-xl font-bold mb-4">Edit Existing Item</h2>
              <div
                id="edit2"
                className="flex flex-wrap gap-[40px] pt-4 justify-center items-center"
              >
                {/* Dynamically populated by ReactDOM.createRoot(...) */}
              </div>
            </div>

            {/* ---------------- REMOVE PANEL ---------------- */}
            <div
              id="remove"
              className="hidden pointer-events-none relative pt-4 transition-opacity"
            >
              <h2 className="text-xl font-bold mb-4">Remove Item</h2>
              <div
                id="remove2"
                className="flex flex-wrap gap-[40px] pt-4 justify-center items-center"
              >
                {/* Dynamically populated by ReactDOM.createRoot(...) */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   CardEdit: Display item in "Edit" panel, with a modal to actually edit
------------------------------------------------------------------ */
function CardEdit(props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openModal() {
    setIsModalOpen(true);
    document.body.classList.add("overflow-hidden");
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md w-[220px] transition-all hover:shadow-purple-900/20 hover:shadow-lg">
      <div className="relative text-center">
        {/* Sale tag */}
        {props.issale === "true" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            SALE
          </div>
        )}
        
        {/* Stock indicator */}
        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full z-10 
          ${parseInt(props.stock) > 5 
            ? "bg-green-500/80 text-white" 
            : parseInt(props.stock) > 0 
              ? "bg-yellow-500/80 text-white" 
              : "bg-red-500/80 text-white"}`
        }>
          {parseInt(props.stock) > 0 ? `${props.stock} in stock` : "Out of stock"}
        </div>
        
        {/* Image with gradient overlay */}
        <div className="relative h-[150px] cursor-pointer" onClick={openModal}>
          {Array.isArray(props.images) && props.images.length > 0 ? (
            <>
              <img
                src={props.images[0]}
                alt={props.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-4 text-left">
          <h3 className="font-medium text-white truncate" title={props.name}>{props.name}</h3>
          
          <div className="flex items-baseline mt-1">
            {props.issale === "true" ? (
              <>
                <span className="text-red-400 font-bold">${parseFloat(props.price).toFixed(2)}</span>
                <span className="ml-2 text-sm text-gray-400 line-through">${parseFloat(props.oldprice).toFixed(2)}</span>
              </>
            ) : (
              <span className="text-white font-bold">${parseFloat(props.price).toFixed(2)}</span>
            )}
          </div>
          
          <button
            onClick={openModal}
            className="mt-3 w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-1.5 text-sm transition"
          >
            Edit Item
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ModalEdit
          {...props}
          onClose={() => {
            setIsModalOpen(false);
            document.body.classList.remove("overflow-hidden");
          }}
          isClicked={isModalOpen}
          onUpdate={props.onItemUpdated} // Pass the refresh callback to the modal
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   CardRemove: Display item in "Remove" panel, with a modal to confirm
------------------------------------------------------------------ */
function CardRemove(props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openModal() {
    setIsModalOpen(true);
    document.body.classList.add("overflow-hidden");
  }

  // Calculate price display based on sale status
  const priceDisplay = () => {
    if (props.issale === "true") {
      return (
        <>
          <span className="text-red-400 font-bold">${parseFloat(props.price).toFixed(2)}</span>
          <span className="ml-2 text-sm text-gray-400 line-through">${parseFloat(props.oldprice).toFixed(2)}</span>
        </>
      );
    } else {
      return <span className="text-white font-bold">${parseFloat(props.price).toFixed(2)}</span>;
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md w-[220px] transition-all hover:shadow-red-900/30 hover:shadow-lg border border-transparent hover:border-red-900/30">
      <div className="relative text-center">
        {/* Sale tag */}
        {props.issale === "true" && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            SALE
          </div>
        )}
        
        {/* Stock indicator */}
        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full z-10 
          ${parseInt(props.stock) > 5 
            ? "bg-green-500/80 text-white" 
            : parseInt(props.stock) > 0 
              ? "bg-yellow-500/80 text-white" 
              : "bg-red-500/80 text-white"}`
        }>
          {parseInt(props.stock) > 0 ? `${props.stock} in stock` : "Out of stock"}
        </div>
        
        {/* Image with gradient overlay */}
        <div className="relative h-[150px] cursor-pointer" onClick={openModal}>
          {Array.isArray(props.images) && props.images.length > 0 ? (
            <>
              <img
                src={props.images[0]}
                alt={props.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-4 text-left">
          <h3 className="font-medium text-white truncate" title={props.name}>{props.name}</h3>
          
          <div className="flex items-baseline mt-1">
            {priceDisplay()}
          </div>
          
          <button
            onClick={openModal}
            className="mt-3 w-full bg-red-700 hover:bg-red-600 text-white rounded-lg py-1.5 text-sm transition flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Item
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ModalRemove
          {...props}
          onClose={() => {
            setIsModalOpen(false);
            document.body.classList.remove("overflow-hidden");
          }}
          isClicked={isModalOpen}
          onItemDeleted={props.onItemDeleted}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   ModalEdit: The actual edit modal, showing existing images + a form
------------------------------------------------------------------ */
function ModalEdit({
  onClose,
  isClicked,
  name,
  description,
  price,
  images = [],
  issale,
  oldprice,
  stock,
  id,
  routeData,
  onUpdate,
  customOptions = [],
}) {
  // We clone the existing images into state so we can remove them
  const [localImages, setLocalImages] = useState([...images]);

  // For editing text
  const [editData, setEditData] = useState({
    name: name || "",
    description: description || "",
    price: price || "",
    oldprice: oldprice || "Not Used",
    stock: stock || "",
  });

  // Sale state
  const [isSale, setIsSale] = useState(issale === "true");

  // For newly selected images (the user might add more)
  const [newFiles, setNewFiles] = useState([]);

  const [hasCustomOptions, setHasCustomOptions] = useState(
    Array.isArray(customOptions) && customOptions.length > 0
  );
  // The array of { label, imageIndex }
  const [options, setOptions] = useState<
    { label: string; imageIndex: number; price: string }[]
  >(
    (customOptions || []).map(opt => ({
      label: opt.label,
      imageIndex: opt.imageIndex,
      price: opt.price ?? ""
    }))
  );

  const dropdownCount = localImages.length + newFiles.length;

  function handleExit() {
    onClose();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSaleToggle() {
    setIsSale(!isSale);
  }

  function handleOldPrice(e) {
    let input = e.target.value.trim();
    setEditData((prev) => ({ ...prev, oldprice: input }));
  }
  
  function handleEditPrice(e) {
    let input = e.target.value.trim();
  
    // Regular number input
    setEditData((prev) => ({ ...prev, price: input }));
  }

  function handleEditDiscountChange(e) {
    const input = e.target.value.trim();
    const percent = parseFloat(input);
    const old = parseFloat(editData.oldprice);
  
    if (!isNaN(percent) && !isNaN(old)) {
      const newPrice = (old * (1 - percent / 100)).toFixed(2);
      setEditData((prev) => ({ ...prev, price: newPrice }));
    }
  }

  // Add new images
  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    const combined = [...newFiles, ...selected].slice(0, 16);
    setNewFiles(combined);
  }

  // Remove new images
  function removeNewFile(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Remove an existing image
  function removeExistingImage(index) {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Editing item:", id);

    // 1) If user selected new images, upload them
    let newUrls = [];
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        let body = new FormData();
        const extension = Date.now() + file.name;
        body.append("imagename", extension);

        const signedResp = await fetch("/api/forsale/awsupload", {
          method: "POST",
          body,
        });
        const { presignedUrl } = await signedResp.json();

        const resized = await resizeFile(file);
        const base64Data = Buffer.from(
          resized.replace(/^data:\w+\/[a-zA-Z+\-.]+;base64,/, ""),
          "base64"
        );
        await fetch(presignedUrl, {
          method: "PUT",
          body: base64Data,
        });
        newUrls.push(
          "https://vintage-reptiles-storage.s3.us-east-2.amazonaws.com/" +
            extension
        );
      }
    }

    // 2) Combine existing images + newly uploaded (both can be removed/added)
    const updatedImages = [...localImages, ...newUrls].slice(0, 16);

    // 3) Build the form data
    const finalBody = new FormData();
    finalBody.append("id2", id); // or "id"? depends on your server
    finalBody.append("name", editData.name);
    finalBody.append("description", editData.description);
    finalBody.append("price", editData.price);
    finalBody.append("stock", editData.stock);

    if (isSale) {
      finalBody.append("issale", "true");
      finalBody.append("oldprice", editData.oldprice);
    } else {
      finalBody.append("issale", "false");
      finalBody.append("oldprice", "Not Used");
    }

    finalBody.append("images", JSON.stringify(updatedImages));

    if (hasCustomOptions) {
      finalBody.append("customOptions", JSON.stringify(options));
    }

    // 4) Send to DB route
    const resp = await fetch(routeData, { method: "PUT", body: finalBody });
    if (resp.ok) {
      onUpdate();
      toast("Item Edited", {
        description: "Your changes have been saved successfully.",
      });
      handleExit();
    } else {
      toast("Edit failed", {
        description: "Failed to edit item. Please try again.",
      });
    }
  }

  return (
    <div
      className={
        isClicked
          ? "transition ease-in-out fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex justify-center items-start opacity-100 duration-150 overflow-y-auto py-8"
          : "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex justify-center opacity-0 pointer-events-none duration-150"
      }
    >
      <div className="relative w-[90%] max-w-[800px] bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-xl h-fit">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Edit Product</h2>
          <button
            onClick={handleExit}
            className="rounded-full bg-gray-800 p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Product ID badge */}
        <div className="inline-block mb-4 bg-gray-800 rounded-full px-3 py-1 text-xs text-gray-400">
          Product ID: {id}
        </div>

        {/* Main content in grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - form fields */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400">Product Name</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-400">Price ($)</label>
                <input
                  type="text"
                  name="price"
                  value={editData.price}
                  onChange={handleEditPrice}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm text-gray-400">Stock</label>
                <input
                  type="text"
                  name="stock"
                  value={editData.stock}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700"
                />
              </div>
            </div>

            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Custom Options</label>
                <Switch
                  checked={hasCustomOptions}
                  onCheckedChange={setHasCustomOptions}
                />
              </div>

              {hasCustomOptions && (
                <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      {/* Option label */}
                      <input
                        type="text"
                        value={opt.label}
                        onChange={e => {
                          const arr = [...options];
                          arr[idx].label = e.target.value;
                          setOptions(arr);
                        }}
                        placeholder="Option name"
                        className="flex-1 min-w-0 p-2 rounded bg-gray-700 text-gray-200"
                      />

                      {/* Image picker */}
                      <select
                        value={opt.imageIndex}
                        onChange={e => {
                          const arr = [...options];
                          arr[idx].imageIndex = Number(e.target.value);
                          setOptions(arr);
                        }}
                        className="p-2 rounded bg-gray-700 text-gray-200 flex-shrink-0"
                      >
                        <option value="">Image #</option>
                        {Array.from({ length: dropdownCount }).map((_, i) => (
                          <option key={i} value={i}>{`#${i + 1}`}</option>
                        ))}
                      </select>

                      {/* Per-option price */}
                      <div className="relative flex-shrink-0">
                        <span className="absolute left-2 top-2 text-gray-400">$</span>
                        <input
                          type="text"
                          value={opt.price}
                          onChange={e => {
                            const arr = [...options];
                            arr[idx].price = e.target.value;
                            setOptions(arr);
                          }}
                          placeholder="0.00"
                          className="w-20 pl-6 p-2 rounded bg-gray-700 text-gray-200"
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          setOptions(options.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add another option */}
                  <button
                    type="button"
                    onClick={() =>
                      setOptions([...options, { label: "", imageIndex: 0, price: "" }])
                    }
                    className="text-sm text-purple-400 hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              )}

            </div>

            {/* Sale toggle with slider */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Enable Sale Price</label>
                <Switch
                  checked={isSale}
                  onCheckedChange={setIsSale}
                />
              </div>
              
              {isSale && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block mb-1 text-xs text-gray-400">Discount %</label>
                    <input
                      className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-sm" 
                      onChange={handleEditDiscountChange} 
                      placeholder="Enter discount percentage"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs text-gray-400">Original Price ($)</label>
                    <input
                      type="text"
                      value={editData.oldprice}
                      onChange={handleOldPrice}
                      className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-400">Description</label>
              <textarea
                name="description"
                rows={4}
                value={editData.description}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700"
              />
            </div>
          </div>
          
          {/* Right column - images */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-400">Current Images</label>
              <div className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                {localImages && localImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {localImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt="Current"
                          className="w-full aspect-square object-cover rounded-md border border-gray-700 group-hover:opacity-75 transition"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          onClick={() => removeExistingImage(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No images available</div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm text-gray-400">Add More Images</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-purple-500 transition cursor-pointer">
                <input
                  type="file"
                  id="new-images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="new-images" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400">Click to upload</p>
                  </div>
                </label>
              </div>
              
              {/* Preview new images */}
              {newFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">New images to upload:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {newFiles.map((file, idx) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={previewUrl}
                            alt="New"
                            className="w-full aspect-square object-cover rounded-md border border-gray-700"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                            onClick={() => removeNewFile(idx)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons - full width */}
          <div className="col-span-full flex gap-4 justify-end mt-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={handleExit}
              className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2.5 rounded-lg hover:scale-[1.02] transition shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ModalRemove: Confirm item deletion
------------------------------------------------------------------ */
function ModalRemove({ onClose, isClicked, name, id, routeData, images = [], description, price, stock, issale, oldprice, onItemDeleted}) {
  const [isDeleting, setIsDeleting] = useState(false);

  function handleExit() {
    onClose();
  }

  async function handleDelete() {
    setIsDeleting(true);
    
    try {
      const body = new FormData();
      body.append("id", id);
      const resp = await fetch(routeData, { method: "DELETE", body });
      
      // Check if response was OK
      if (resp.ok) {
        onItemDeleted();
        toast("Item Deleted", {
          description: `Successfully deleted "${name}".`,
        });
        handleExit();
      } else {
        throw new Error(`Server returned ${resp.status}`);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast("Delete failed", {
        description: `Failed to delete "${name}". Please try again.`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className={
        isClicked
          ? "transition ease-in-out fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex justify-center items-center opacity-100 duration-150"
          : "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex justify-center items-center opacity-0 pointer-events-none duration-150"
      }
    >
      <div className="relative w-[90%] max-w-[500px] bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center mb-4 pb-3 border-b border-gray-800">
          <h2 className="text-xl font-semibold">Confirm Deletion</h2>
          <button
            onClick={handleExit}
            className="ml-auto rounded-full bg-gray-800 p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-4">
          {/* Item image */}
          <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
            {Array.isArray(images) && images.length > 0 ? (
              <img
                src={images[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>
          
          {/* Item details */}
          <div className="flex-grow">
            <h3 className="font-medium text-lg mb-1">{name}</h3>
            <div className="text-sm text-gray-400 mb-1">ID: {id}</div>
            <div className="flex items-baseline">
              {issale === "true" ? (
                <>
                  <span className="text-red-400 font-bold">${parseFloat(price).toFixed(2)}</span>
                  <span className="ml-2 text-xs text-gray-400 line-through">${parseFloat(oldprice).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-white font-bold">${parseFloat(price).toFixed(2)}</span>
              )}
              <span className="ml-2 text-xs text-gray-400">• {stock} in stock</span>
            </div>
          </div>
        </div>
        
        {/* Confirmation message */}
        <div className="mt-4 mb-5 text-gray-300 text-sm">
          Are you sure you want to delete this item? This action cannot be undone.
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleExit}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-800 text-red-400 hover:bg-red-500 hover:text-white transition"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
