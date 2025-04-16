"use client";

import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import Resizer from "react-image-file-resizer";

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
    setLoading(true); // show spinner
    setRoute(newRoute); // triggers useEffect for fetch
  }

  // Load data from DB each time routeData changes
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetch(routeData);
        const dat = await result.json();
        console.log("Loaded data:", dat);

        const items = Array.isArray(dat) ? dat : [];

        // 1) Render "Edit" cards
        let cardsForEdit = items.map((element) => (
          <CardEdit key={element.id} routeData={routeData} {...element} />
        ));
        let container = document.getElementById("edit2");
        let to_inject = ReactDOM.createRoot(container);
        to_inject.render(cardsForEdit);

        // 2) Render "Remove" cards
        let cardsForRemove = items.map((element) => (
          <CardRemove key={element.id} routeData={routeData} {...element} />
        ));
        container = document.getElementById("remove2");
        to_inject = ReactDOM.createRoot(container);
        to_inject.render(cardsForRemove);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // hide spinner after fetch completes
      }
    }

    fetchData();
  }, [routeData]);

  // Handle text changes in the "Add" form
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Toggle sale
  function handleSaleChange() {
    setSale(!isSale);
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

    const resp = await fetch(routeData, { method: "POST", body: finalBody });
    console.log("Created new item. Resp:", resp);
    alert("Item Uploaded!");

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
            <div id="add">
              <h2 className="text-xl font-bold mb-4">Add New Item</h2>
              <form onSubmit={handleSubmit}>
                {/* Name */}
                <label className="block mb-2 text-white text-lg">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 mb-4"
                  type="text"
                />

                {/* Price */}
                <label className="block mb-2 text-white text-lg">Price</label>
                <input
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 mb-4"
                  type="text"
                />

                {/* Sale toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-white text-lg">On Sale?</label>
                  <input
                    type="checkbox"
                    className="rounded-lg"
                    checked={isSale}
                    onChange={handleSaleChange}
                  />
                </div>
                {isSale && (
                  <div className="mb-4">
                    <label className="block mb-2 text-white text-lg">
                      Old Price
                    </label>
                    <input
                      type="text"
                      onChange={handleSaleChange2}
                      className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                    />
                  </div>
                )}

                {/* Stock */}
                <label className="block mb-2 text-white text-lg">Stock</label>
                <input
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 mb-4"
                  type="text"
                />

                {/* Description */}
                <label className="block mb-2 text-white text-lg">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 mb-4"
                />

                {/* MULTIPLE FILE INPUT (max 16) */}
                <label className="block mb-2 text-white text-lg">
                  Images (up to 16)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesChange}
                  className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 mb-4"
                />

                {/* Preview of selected images (with red "X" to remove) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {files.map((file, idx) => {
                    const preview = URL.createObjectURL(file);
                    return (
                      <div key={idx} className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-md border border-gray-600"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition ease-in-out hover:bg-red-900"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  className="bg-gray-700 border border-gray-600 text-gray-200 px-6 py-2 rounded-lg hover:scale-105"
                >
                  Post
                </button>
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
    <div className="mb-8">
      <div className="relative text-center">
        <p className="text-white text-lg mb-2 max-w-[200px]">{props.name}</p>
        {Array.isArray(props.images) && props.images.length > 0 ? (
          <img
            src={props.images[0]}
            alt="Preview"
            width={200}
            height={200}
            className="outline outline-4 outline-white rounded-lg cursor-pointer transition hover:scale-105"
            onClick={openModal}
          />
        ) : (
          <div
            className="w-[200px] h-[200px] bg-gray-600 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={openModal}
          >
            No Image
          </div>
        )}

        {/* Price */}
        {props.price && props.price !== "" && (
          <p
            className={
              props.issale === "true"
                ? "text-red-500 text-lg pt-2"
                : "text-white text-lg pt-2"
            }
          >
            ${parseFloat(props.price).toFixed(2)}
          </p>
        )}
        {/* If on sale, show old price */}
        {props.issale === "true" && props.oldprice && (
          <div className="line-through text-center text-white text-lg -mt-1">
            ${parseFloat(props.oldprice).toFixed(2)}
          </div>
        )}
      </div>

      {/* Actual Modal */}
      {isModalOpen && (
        <ModalEdit
          {...props}
          onClose={() => {
            setIsModalOpen(false);
            document.body.classList.remove("overflow-hidden");
          }}
          isClicked={isModalOpen}
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

  return (
    <div className="mb-8">
      <div className="relative text-center">
        <p className="text-white text-lg mb-2 max-w-[200px]">{props.name}</p>
        {Array.isArray(props.images) && props.images.length > 0 ? (
          <img
            src={props.images[0]}
            alt="Preview"
            width={200}
            height={200}
            className="outline outline-4 outline-white rounded-lg cursor-pointer transition hover:scale-105"
            onClick={openModal}
          />
        ) : (
          <div
            className="w-[200px] h-[200px] bg-gray-600 flex items-center justify-center rounded-lg cursor-pointer"
            onClick={openModal}
          >
            No Image
          </div>
        )}
      </div>

      {/* Modal to confirm remove */}
      {isModalOpen && (
        <ModalRemove
          {...props}
          onClose={() => {
            setIsModalOpen(false);
            document.body.classList.remove("overflow-hidden");
          }}
          isClicked={isModalOpen}
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

    // 4) Send to DB route
    const resp = await fetch(routeData, { method: "PUT", body: finalBody });
    console.log("Edit response:", resp);
    alert("Item Edited!");
    handleExit();
  }

  return (
    <div
      className={
        isClicked
          ? "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex justify-center opacity-100 duration-150 overflow-y-auto"
          : "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex justify-center opacity-0 pointer-events-none duration-150"
      }
    >
      <div className="relative w-[90%] max-w-[600px] bg-[#1c1a1b] rounded-3xl p-6 border border-[#111010] drop-shadow-xl h-fit mt-[50px]">
        <button
          onClick={handleExit}
          className="absolute right-6 top-6 text-xl text-gray-400 hover:text-gray-200"
        >
          ✕
        </button>
        <div className="flex justify-center">
          <h2 className="text-xl font-bold mb-4 text-center flex justify-center w-[200px]">
            <div>Edit Item (ID: {id})</div>
          </h2>
        </div>

        {/* Show existing images with red "X" */}
        {localImages && localImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {localImages.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt="Current"
                  className="w-24 h-24 object-cover border border-gray-600 rounded-md"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition ease-in-out hover:bg-red-900"
                  onClick={() => removeExistingImage(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-white">Name</label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Price</label>
            <input
              type="text"
              name="price"
              value={editData.price}
              onChange={handleEditPrice}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          {/* Sale toggle */}
          <div className="flex items-center gap-2">
            <label>On Sale?</label>
            <input type="checkbox" checked={isSale} onChange={handleSaleToggle} />
          </div>
          {isSale && (
            <div>
              <input className="w-full p-2 rounded bg-gray-700 border border-gray-600 mb-[10px]" onChange={handleEditDiscountChange} placeholder="Discount %" />
              <label className="block mb-1 text-white">Old Price</label>
              <input
                type="text"
                value={editData.oldprice}
                onChange={handleOldPrice}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block mb-1 text-white">Stock</label>
            <input
              type="text"
              name="stock"
              value={editData.stock}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-white">Description</label>
            <textarea
              name="description"
              rows={4}
              value={editData.description}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          {/* Add new images (up to 16) */}
          <div>
            <label className="block mb-1 text-white">Add More Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
            {/* Preview new images with "X" */}
            <div className="flex flex-wrap gap-2 mt-2">
              {newFiles.map((file, idx) => {
                const previewUrl = URL.createObjectURL(file);
                return (
                  <div key={idx} className="relative">
                    <img
                      src={previewUrl}
                      alt="New"
                      className="w-16 h-16 object-cover border border-gray-600 rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => removeNewFile(idx)}
                    >
                      X
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="block w-full mt-4 bg-gray-700 text-gray-200 px-4 py-2 rounded hover:scale-105"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   ModalRemove: Confirm item deletion
------------------------------------------------------------------ */
function ModalRemove({ onClose, isClicked, name, id, routeData }) {
  function handleExit() {
    onClose();
  }

  async function handleDelete() {
    const body = new FormData();
    body.append("id", id);
    const resp = await fetch(routeData, { method: "DELETE", body });
    console.log("Delete response:", resp);
    alert(`Deleted "${name}"!`);
    handleExit();
  }

  return (
    <div
      className={
        isClicked
          ? "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex items-center justify-center opacity-100 duration-150"
          : "transition ease-in-out fixed inset-0 z-50 backdrop-blur-lg flex items-center justify-center opacity-0 pointer-events-none duration-150"
      }
    >
      <div className="relative w-[90%] max-w-[600px] bg-[#1c1a1b] rounded-3xl p-6 border border-[#111010] drop-shadow-xl flex flex-col items-center justify-center">
        <button
          onClick={handleExit}
          className="absolute right-6 top-6 text-xl text-gray-400 hover:text-gray-200"
        >
          ✕
        </button>
        <h2 className="text-2xl mb-8 text-center">
          Delete {name} (ID: {id})?
        </h2>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:scale-105"
        >
          Confirm Delete
        </button>
      </div>
    </div>
  );
}
