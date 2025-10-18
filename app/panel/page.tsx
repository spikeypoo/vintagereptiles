"use client";

import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

type AdminCustomOption = {
  label?: string;
  price?: string;
  priceid?: string;
  imageIndex?: number;
  isColourOption?: boolean;
  colourIds?: string[];
  groupName?: string;
  id?: string;
};

type AdminItem = {
  id: string;
  name: string;
  description?: string;
  price: string;
  stock: string;
  oldprice?: string;
  issale: string;
  images?: string[];
  customOptions?: AdminCustomOption[];
};

type ProductColour = {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CustomOptionChoiceForm = {
  id: string;
  label: string;
  price: string;
  imageIndex: number | "";
};

type CustomOptionGroupForm = {
  id: string;
  title: string;
  type: "standard" | "colour";
  options: CustomOptionChoiceForm[];
  colourIds: string[];
};

const PRINT_COLOURS_ROUTE = "/api/product-colours";

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function inflateCustomOptionsToGroups(options?: AdminCustomOption[]): CustomOptionGroupForm[] {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const groupOrder: string[] = [];
  const groupMap = new Map<string, CustomOptionGroupForm>();

  options.forEach((opt) => {
    if (opt?.isColourOption) {
      const title = (opt.groupName || opt.label || "Colour Option").trim();
      const key = `colour:${title}`;
      if (!groupMap.has(key)) {
        groupOrder.push(key);
        groupMap.set(key, {
          id: opt.id || generateId(),
          title,
          type: "colour",
          options: [],
          colourIds: Array.isArray(opt.colourIds) ? opt.colourIds.map(String) : [],
        });
      } else {
        const existing = groupMap.get(key)!;
        if (Array.isArray(opt.colourIds)) {
          const current = new Set(existing.colourIds);
          opt.colourIds.forEach((id) => current.add(String(id)));
          existing.colourIds = Array.from(current);
        }
      }
    } else {
      const title = (opt?.groupName || "Custom Option").trim();
      const key = `standard:${title}`;
      if (!groupMap.has(key)) {
        groupOrder.push(key);
        groupMap.set(key, {
          id: generateId(),
          title,
          type: "standard",
          options: [],
          colourIds: [],
        });
      }
      const group = groupMap.get(key)!;
      group.options.push({
        id: opt?.id || generateId(),
        label: opt?.label ?? "",
        price: opt?.price ?? "",
        imageIndex:
          typeof opt?.imageIndex === "number" && !Number.isNaN(opt.imageIndex)
            ? opt.imageIndex
            : "",
      });
    }
  });

  return groupOrder
    .map((key) => groupMap.get(key)!)
    .map((group) => {
      if (group.type === "standard" && group.options.length === 0) {
        return {
          ...group,
          options: [
            {
              id: generateId(),
              label: "",
              price: "",
              imageIndex: "",
            },
          ],
        };
      }
      return group;
    });
}

function flattenCustomOptionGroups(
  groups: CustomOptionGroupForm[],
  allowColourGroups: boolean
): AdminCustomOption[] {
  const flattened: AdminCustomOption[] = [];

  groups.forEach((group) => {
    const title = group.title.trim() || (group.type === "colour" ? "Colour Option" : "Custom Option");
    if (group.type === "standard") {
      group.options.forEach((opt) => {
        const label = opt.label.trim();
        const priceValue = opt.price.trim();
        if (!label && !priceValue) {
          return;
        }
        flattened.push({
          id: opt.id,
          label,
          price: priceValue || undefined,
          imageIndex:
            opt.imageIndex === "" || Number.isNaN(Number(opt.imageIndex))
              ? undefined
              : Number(opt.imageIndex),
          groupName: title,
        });
      });
    } else if (allowColourGroups) {
      const colourIds = group.colourIds.filter(Boolean);
      flattened.push({
        id: group.id,
        label: title,
        isColourOption: true,
        colourIds,
        groupName: title,
      });
    }
  });

  return flattened;
}

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
  const [customOptionGroups, setCustomOptionGroups] = useState<CustomOptionGroupForm[]>([]);


  // Sale state for ADD
  const [isSale, setSale] = useState(false);
  const [olderPrice, setOldPrice] = useState("Not Used");

  // Up to 16 images in ADD
  const [files, setFiles] = useState([]);

  // The selected route (category)
  const [routeData, setRoute] = useState("/api/forsale/availability");

  const [items, setItems] = useState<AdminItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequests = useRef(0);
  const [productColours, setProductColours] = useState<ProductColour[]>([]);
  const [isLoadingColours, setIsLoadingColours] = useState(false);
  const [colourLoadError, setColourLoadError] = useState<string | null>(null);

  // A simple array of categories (label + route)
  const categories = [
    { label: "Geckos", value: "/api/forsale/availability" },
    { label: "3D Prints", value: "/api/forsale/prints" },
    { label: "Print Colours", value: PRINT_COLOURS_ROUTE },
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
  const [activeOp, setActiveOp] = useState<"add" | "edit" | "remove">("add"); // default to "add"
  const isPrintColoursRoute = routeData === PRINT_COLOURS_ROUTE;
  const isPrintsCategory = routeData === "/api/forsale/prints";

  // Handle category clicks
  function handleCategoryClick(newRoute) {
    // Only set loading and fetch data if the route is different
    if (newRoute !== routeData) {
      setRoute(newRoute); // triggers useEffect for fetch
      setSearchTerm("");
    }
  }

  // Function to refresh items for the current category
  const refreshItems = useCallback(
    async (signal?: AbortSignal) => {
      setErrorMessage(null);
      if (routeData === PRINT_COLOURS_ROUTE) {
        setItems([]);
        return [];
      }
      try {
        if (activeRequests.current === 0) {
          setLoading(true);
        }
        activeRequests.current += 1;
        const response = await fetch(routeData, {
          signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const itemsArray = Array.isArray(data) ? data : [];

        setItems(itemsArray as AdminItem[]);
        return itemsArray as AdminItem[];
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return [];
        }
        console.error("Error refreshing items:", err);
        setErrorMessage("Failed to load items. Please try again.");
        return [];
      } finally {
        activeRequests.current = Math.max(0, activeRequests.current - 1);
        if (activeRequests.current === 0) {
          setLoading(false);
        }
      }
    },
    [routeData]
  );

  // Load data when the route changes
  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setErrorMessage(null);
    refreshItems(controller.signal);

    return () => controller.abort();
  }, [refreshItems]);

  useEffect(() => {
    setFormData({ name: "", description: "", price: "", stock: "" });
    setSale(false);
    setOldPrice("Not Used");
    setFiles([]);
    setHasCustomOptions(false);
    setCustomOptionGroups([]);
    setSearchTerm("");
  }, [routeData]);

  useEffect(() => {
    let cancelled = false;

    async function loadColours() {
      setColourLoadError(null);
      setIsLoadingColours(true);
      try {
        const response = await fetch(PRINT_COLOURS_ROUTE, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = (await response.json()) as ProductColour[];
        if (!cancelled) {
          setProductColours(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load product colours:", error);
          setColourLoadError("Failed to load colour list.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingColours(false);
        }
      }
    }

    loadColours();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasCustomOptions) {
      setCustomOptionGroups([]);
    }
  }, [hasCustomOptions]);

  useEffect(() => {
    if (!isPrintsCategory) {
      setCustomOptionGroups((prev) => prev.filter((group) => group.type !== "colour"));
    }
  }, [isPrintsCategory]);

  useEffect(() => {
    const availableIds = new Set(productColours.map((colour) => colour.id));
    setCustomOptionGroups((prev) =>
      prev.map((group) => {
        if (group.type !== "colour") {
          return group;
        }
        const filtered = group.colourIds.filter((id) => availableIds.has(id));
        const nextIds =
          filtered.length > 0 || availableIds.size === 0
            ? filtered
            : Array.from(availableIds);
        if (filtered.length === group.colourIds.length) {
          return group;
        }
        return {
          ...group,
          colourIds: nextIds,
        };
      })
    );
  }, [productColours]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }

    const lowered = searchTerm.toLowerCase();
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(lowered);
      const idMatch = item.id?.toLowerCase().includes(lowered);
      return nameMatch || idMatch;
    });
  }, [items, searchTerm]);

  const panelClassName = (panel: "add" | "edit" | "remove") =>
    activeOp === panel ? "" : "hidden pointer-events-none";

  const allColourIds = useMemo(
    () => productColours.map((colour) => colour.id),
    [productColours]
  );

  // Handle text changes in the "Add" form
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Toggle sale
  function handleSaleChange() {
    const newValue = !isSale;
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

  const handleColoursChange = useCallback((colours: ProductColour[]) => {
    setColourLoadError(null);
    setProductColours(colours);
  }, []);

  // Submit new item
  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file, index) => {
          const sanitizedName = file.name.replace(/\s+/g, "-");
          const key = `${Date.now()}-${index}-${sanitizedName}`;
          const body = new FormData();
          body.append("imagename", key);

          const signedResp = await fetch("/api/forsale/awsupload", {
            method: "POST",
            body,
          });

          if (!signedResp.ok) {
            throw new Error("Failed to obtain upload URL");
          }

          const { presignedUrl } = await signedResp.json();

          const resizedImage = (await resizeFile(file)) as string;
          const blob = await fetch(resizedImage).then((res) => res.blob());

          await fetch(presignedUrl, {
            method: "PUT",
            body: blob,
          });

          return `https://vintage-reptiles-storage.s3.us-east-2.amazonaws.com/${key}`;
        })
      );

      const finalBody = new FormData();
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

      finalBody.append("images", JSON.stringify(uploadedUrls));

      if (hasCustomOptions) {
        const flattened = flattenCustomOptionGroups(customOptionGroups, isPrintsCategory);
        if (flattened.length > 0) {
          finalBody.append("customOptions", JSON.stringify(flattened));
        }
      }

      const resp = await fetch(routeData, { method: "POST", body: finalBody });

      if (!resp.ok) {
        throw new Error(`Request failed with status ${resp.status}`);
      }

      await refreshItems();

      toast("Item Uploaded", {
        description: "The new item has been added successfully.",
      });

      setFormData({ name: "", description: "", price: "", stock: "" });
      setSale(false);
      setOldPrice("Not Used");
      setFiles([]);
      setHasCustomOptions(false);
      setCustomOptionGroups([]);
    } catch (err) {
      console.error("Failed to create item:", err);
      toast("Upload failed", {
        description: "Failed to upload item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Toggle which panel is visible (add, edit, remove) + setActiveOp
  function handleOptions(button: "add" | "edit" | "remove") {
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
                      ${isActive
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
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${activeOp === "add" ? "scale-110" : ""
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
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${activeOp === "edit" ? "scale-110" : ""
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
                className={`cursor-pointer transition ease-in-out hover:scale-105 relative ${activeOp === "remove" ? "scale-110" : ""
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

            {isPrintColoursRoute ? (
              <PrintColoursPanels
                activeOp={activeOp}
                initialColours={productColours}
                onColoursChange={handleColoursChange}
              />
            ) : (
              <>
            {/* ---------------- ADD PANEL ---------------- */}
            {/* Replace the current ADD form with this improved version */}
            <div id="add" className={`${panelClassName("add")} space-y-4`}>
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
                    <div className="mb-6 space-y-3">
                      <p className="text-gray-400 text-sm">Define the dropdowns for this product.</p>
                      <CustomOptionGroupsEditor
                        groups={customOptionGroups}
                        onChange={setCustomOptionGroups}
                        imageOptionsCount={files.length}
                        productColours={productColours}
                        allowColourGroups={isPrintsCategory}
                        isLoadingColours={isLoadingColours}
                        colourLoadError={colourLoadError}
                      />
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
                    disabled={isSubmitting}
                    className={`bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg transition duration-300 flex items-center justify-center w-full md:w-auto ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitting ? "Uploading…" : "Add Product"}
                  </button>
                </div>
              </form>
            </div>

            {/* ---------------- EDIT PANEL ---------------- */}
            <div
              id="edit"
              className={`relative pt-4 transition-opacity ${panelClassName("edit")}`}
            >
              <h2 className="text-xl font-bold mb-4">Edit Existing Item</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID"
                  className="w-full md:flex-1 rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <button
                  type="button"
                  onClick={() => refreshItems()}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm transition border border-purple-500/60 ${
                    loading ? "opacity-60 cursor-not-allowed" : "hover:bg-purple-500/10"
                  }`}
                >
                  Refresh
                </button>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
                </span>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-6 pt-2 justify-center items-start">
                {filteredItems.length > 0 ? (
                  filteredItems.map((element) => (
                    <CardEdit
                      key={element.id}
                      routeData={routeData}
                      onItemUpdated={refreshItems}
                      productColours={productColours}
                      productColoursLoading={isLoadingColours}
                      colourLoadError={colourLoadError}
                      {...element}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-10">
                    {items.length === 0
                      ? "No items in this category yet."
                      : "No results match your search."}
                  </div>
                )}
              </div>
            </div>

            {/* ---------------- REMOVE PANEL ---------------- */}
            <div
              id="remove"
              className={`relative pt-4 transition-opacity ${panelClassName("remove")}`}
            >
              <h2 className="text-xl font-bold mb-4">Remove Item</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID"
                  className="w-full md:flex-1 rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <button
                  type="button"
                  onClick={() => refreshItems()}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm transition border border-purple-500/60 ${
                    loading ? "opacity-60 cursor-not-allowed" : "hover:bg-purple-500/10"
                  }`}
                >
                  Refresh
                </button>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
                </span>
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-6 pt-2 justify-center items-start">
                {filteredItems.length > 0 ? (
                  filteredItems.map((element) => (
                    <CardRemove
                      key={element.id}
                      routeData={routeData}
                      onItemDeleted={refreshItems}
                      {...element}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-10">
                    {items.length === 0
                      ? "No items in this category yet."
                      : "No results match your search."}
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type PrintColoursPanelsProps = {
  activeOp: "add" | "edit" | "remove";
  initialColours?: ProductColour[];
  onColoursChange?: (colours: ProductColour[]) => void;
};

function PrintColoursPanels({
  activeOp,
  initialColours,
  onColoursChange,
}: PrintColoursPanelsProps) {
  const newDraft = () => ({
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    file: null as File | null,
    preview: null as string | null,
  });
  const [colours, setColours] = useState<ProductColour[]>(initialColours ?? []);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [colourDrafts, setColourDrafts] = useState(() => [newDraft()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftsRef = useRef(colourDrafts);

  useEffect(() => {
    if (initialColours) {
      setColours(initialColours);
    }
  }, [initialColours]);

  useEffect(() => {
    draftsRef.current = colourDrafts;
  }, [colourDrafts]);

  useEffect(() => {
    return () => {
      draftsRef.current.forEach((draft) => {
        if (draft.preview) {
          URL.revokeObjectURL(draft.preview);
        }
      });
    };
  }, []);

  const refreshColours = useCallback(async () => {
    setErrorMessage(null);
    setIsFetching(true);
    try {
      const response = await fetch(PRINT_COLOURS_ROUTE, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = (await response.json()) as ProductColour[];
      setColours(data);
      onColoursChange?.(data);
    } catch (error) {
      console.error("Failed to load product colours:", error);
      setErrorMessage("Failed to load colours. Please try again.");
    } finally {
      setIsFetching(false);
    }
  }, [onColoursChange]);

  useEffect(() => {
    refreshColours();
  }, [refreshColours]);

  const filteredColours = useMemo(() => {
    if (!searchTerm.trim()) {
      return colours;
    }
    const lowered = searchTerm.toLowerCase();
    return colours.filter((colour) =>
      colour.name?.toLowerCase().includes(lowered)
    );
  }, [colours, searchTerm]);

  const uploadImage = useCallback(async (file: File) => {
    const sanitizedName = file.name.replace(/\s+/g, "-");
    const key = `product-colours/${Date.now()}-${sanitizedName}`;
    const formData = new FormData();
    formData.append("imagename", key);

    const signedResp = await fetch("/api/forsale/awsupload", {
      method: "POST",
      body: formData,
    });

    if (!signedResp.ok) {
      throw new Error("Failed to obtain upload URL");
    }

    const { presignedUrl } = await signedResp.json();
    const resizedImage = (await resizeFile(file)) as string;
    const blob = await fetch(resizedImage).then((res) => res.blob());

    await fetch(presignedUrl, {
      method: "PUT",
      body: blob,
    });

    return `https://vintage-reptiles-storage.s3.us-east-2.amazonaws.com/${key}`;
  }, []);

  const updateColour = useCallback(
    async (
      id: string,
      updates: { name?: string; imageUrl?: string }
    ): Promise<ProductColour> => {
      const response = await fetch(PRINT_COLOURS_ROUTE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const updated = (await response.json()) as ProductColour;

      setColours((prev) => {
        const updatedList = prev.map((colour) =>
          colour.id === id ? updated : colour
        );
        onColoursChange?.(updatedList);
        return updatedList;
      });

      return updated;
    },
    [onColoursChange]
  );

  const deleteColour = useCallback(async (id: string) => {
    const response = await fetch(PRINT_COLOURS_ROUTE, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    setColours((prev) => {
      const updatedList = prev.filter((colour) => colour.id !== id);
      onColoursChange?.(updatedList);
      return updatedList;
    });
  }, [onColoursChange]);

  function handleDraftNameChange(id: string, value: string) {
    setColourDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id ? { ...draft, name: value } : draft
      )
    );
  }

  function handleDraftFileChange(id: string, event) {
    const file = event.target.files?.[0] ?? null;
    setColourDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== id) {
          return draft;
        }
        if (draft.preview) {
          URL.revokeObjectURL(draft.preview);
        }
        return {
          ...draft,
          file,
          preview: file ? URL.createObjectURL(file) : null,
        };
      })
    );
  }

  function handleAddDraft() {
    setColourDrafts((prev) => [...prev, newDraft()]);
  }

  function handleRemoveDraft(id: string) {
    setColourDrafts((prev) => {
      const draftToRemove = prev.find((draft) => draft.id === id);
      if (draftToRemove?.preview) {
        URL.revokeObjectURL(draftToRemove.preview);
      }
      const next = prev.filter((draft) => draft.id !== id);
      if (next.length === 0) {
        return [newDraft()];
      }
      return next;
    });
  }

  async function handleAddColour(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setFormError(null);

    const draftsToSubmit = colourDrafts.filter(
      (draft) => draft.name.trim() !== "" || draft.file !== null
    );

    if (draftsToSubmit.length === 0) {
      setFormError("Add at least one colour with a name and image.");
      return;
    }

    for (const draft of draftsToSubmit) {
      if (!draft.name.trim()) {
        setFormError("Every colour needs a name.");
        return;
      }
      if (!draft.file) {
        setFormError("Every colour needs an image selected.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      for (const draft of draftsToSubmit) {
        const imageUrl = await uploadImage(draft.file as File);
        const response = await fetch(PRINT_COLOURS_ROUTE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: draft.name.trim(),
            imageUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      await refreshColours();
      toast("Colours added", {
        description: `${draftsToSubmit.length} new colour${
          draftsToSubmit.length === 1 ? "" : "s"
        } saved successfully.`,
      });
      colourDrafts.forEach((draft) => {
        if (draft.preview) {
          URL.revokeObjectURL(draft.preview);
        }
      });
      setColourDrafts([newDraft()]);
    } catch (error) {
      console.error("Failed to add colour:", error);
      setFormError("Failed to add colour. Please try again.");
      toast("Upload failed", {
        description: "Could not add the colour. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {activeOp === "add" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Add New Print Colour
          </h2>
          <form onSubmit={handleAddColour} className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              {colourDrafts.map((draft, index) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-gray-700 p-4 space-y-4 bg-gray-900/40"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Colour {index + 1}
                    </h3>
                    {colourDrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(draft.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">
                      Colour Name
                    </label>
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        handleDraftNameChange(draft.id, event.target.value)
                      }
                      className="block w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      type="text"
                      placeholder="e.g. Galaxy Purple"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-300 text-sm">
                      Colour Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleDraftFileChange(draft.id, event)
                      }
                      className="block w-full text-sm text-gray-200 file:mr-4 file:rounded-md file:border-0 file:bg-[#9d00ff] file:px-4 file:py-2 file:text-white file:cursor-pointer"
                    />
                    {draft.preview && (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={draft.preview}
                          alt={`Preview for ${draft.name || `Colour ${index + 1}`}`}
                          className="h-32 w-32 object-cover rounded-lg border border-gray-700 shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAddDraft}
                className="px-4 py-2 rounded-lg border border-purple-500/60 text-sm text-purple-200 hover:bg-purple-500/10 transition"
              >
                + More colours
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg bg-[#9d00ff] hover:bg-[#7b00c5] transition ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting
                  ? "Saving..."
                  : `Add ${colourDrafts.length} Colour${
                      colourDrafts.length === 1 ? "" : "s"
                    }`}
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </div>
            )}
          </form>
        </div>
      )}

      {(activeOp === "edit" || activeOp === "remove") && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by colour name"
              className="w-full md:flex-1 rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
            <button
              type="button"
              onClick={() => refreshColours()}
              disabled={isFetching}
              className={`px-4 py-2 rounded-lg text-sm transition border border-purple-500/60 ${
                isFetching
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-purple-500/10"
              }`}
            >
              Refresh
            </button>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {filteredColours.length} colour
              {filteredColours.length === 1 ? "" : "s"}
            </span>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-6 pt-2 justify-center items-start">
            {isFetching && colours.length === 0 ? (
              <div className="text-gray-400 py-10">Loading colours...</div>
            ) : filteredColours.length > 0 ? (
              filteredColours.map((colour) =>
                activeOp === "edit" ? (
                  <ColourEditCard
                    key={colour.id}
                    colour={colour}
                    onSave={updateColour}
                    uploadImage={uploadImage}
                  />
                ) : (
                  <ColourRemoveCard
                    key={colour.id}
                    colour={colour}
                    onDelete={deleteColour}
                  />
                )
              )
            ) : (
              <div className="text-center text-gray-400 py-10">
                {colours.length === 0
                  ? "No colours added yet."
                  : "No results match your search."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ColourEditCardProps = {
  colour: ProductColour;
  onSave: (
    id: string,
    updates: { name?: string; imageUrl?: string }
  ) => Promise<ProductColour>;
  uploadImage: (file: File) => Promise<string>;
};

function ColourEditCard({ colour, onSave, uploadImage }: ColourEditCardProps) {
  const [name, setName] = useState(colour.name ?? "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(colour.name ?? "");
  }, [colour.name]);

  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview]
  );

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setNewFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const updates: { name?: string; imageUrl?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== colour.name) {
      updates.name = trimmedName;
    }

    try {
      setIsSaving(true);
      if (newFile) {
        updates.imageUrl = await uploadImage(newFile);
      }

      if (Object.keys(updates).length === 0) {
        toast("No changes to save", {
          description: "Update the name or choose a new image first.",
        });
        return;
      }

      const updated = await onSave(colour.id, updates);
      setName(updated.name ?? "");
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      setNewFile(null);
      toast("Colour updated", {
        description: "Changes saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update colour:", error);
      toast("Update failed", {
        description: "Could not update the colour. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md w-[220px] border border-transparent hover:border-purple-900/40 transition-all">
      <div className="h-[150px] relative">
        <img
          src={preview || colour.imageUrl}
          alt={colour.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 text-sm"
          placeholder="Colour name"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-gray-600 file:px-3 file:py-1.5 file:text-white file:cursor-pointer"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-1.5 text-sm transition ${
            isSaving ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

type ColourRemoveCardProps = {
  colour: ProductColour;
  onDelete: (id: string) => Promise<void>;
};

function ColourRemoveCard({ colour, onDelete }: ColourRemoveCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(colour.id);
      toast("Colour removed", {
        description: `${colour.name || "Colour"} deleted successfully.`,
      });
    } catch (error) {
      console.error("Failed to delete colour:", error);
      toast("Delete failed", {
        description: "Could not delete the colour. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md w-[220px] border border-transparent hover:border-red-900/40 transition-all">
      <div className="h-[150px] relative">
        <img
          src={colour.imageUrl}
          alt={colour.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-medium text-white truncate text-center">
          {colour.name || "Untitled Colour"}
        </h3>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`w-full bg-red-700 hover:bg-red-600 text-white rounded-lg py-1.5 text-sm transition ${
            isDeleting ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isDeleting ? "Removing..." : "Remove Colour"}
        </button>
      </div>
    </div>
  );
}

type CustomOptionGroupsEditorProps = {
  groups: CustomOptionGroupForm[];
  onChange: React.Dispatch<React.SetStateAction<CustomOptionGroupForm[]>>;
  imageOptionsCount: number;
  productColours: ProductColour[];
  allowColourGroups: boolean;
  isLoadingColours: boolean;
  colourLoadError: string | null;
};

function CustomOptionGroupsEditor({
  groups,
  onChange,
  imageOptionsCount,
  productColours,
  allowColourGroups,
  isLoadingColours,
  colourLoadError,
}: CustomOptionGroupsEditorProps) {
  const imageIndices = useMemo(
    () => Array.from({ length: imageOptionsCount }, (_, i) => i),
    [imageOptionsCount]
  );

  const allColourIds = useMemo(
    () => productColours.map((colour) => colour.id),
    [productColours]
  );

  const addGroup = useCallback(
    (type: "standard" | "colour") => {
      if (type === "colour" && !allowColourGroups) {
        return;
      }
      onChange((prev) => [
        ...prev,
        type === "standard"
          ? {
              id: generateId(),
              title: `Option Group ${prev.filter((g) => g.type === "standard").length + 1}`,
              type: "standard" as const,
              options: [
                {
                  id: generateId(),
                  label: "",
                  price: "",
                  imageIndex: "" as const,
                },
              ],
              colourIds: [],
            }
          : {
              id: generateId(),
              title: `Colour`,
              type: "colour" as const,
              options: [],
              colourIds: [...allColourIds],
            },
      ]);
    },
    [allowColourGroups, onChange, allColourIds]
  );

  const updateGroupTitle = useCallback(
    (groupId: string, title: string) => {
      onChange((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                title,
              }
            : group
        )
      );
    },
    [onChange]
  );

  const changeGroupType = useCallback(
    (groupId: string, type: "standard" | "colour") => {
      if (type === "colour" && !allowColourGroups) {
        return;
      }
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId) {
            return group;
          }
          if (group.type === type) {
            return group;
          }
          if (type === "standard") {
            return {
              ...group,
              type,
              options: [
                {
                  id: generateId(),
                  label: "",
                  price: "",
                  imageIndex: "" as const,
                },
              ],
              colourIds: [],
            };
          }
          return {
            ...group,
            type,
            options: [],
            colourIds: [...allColourIds],
          };
        })
      );
    },
    [allowColourGroups, allColourIds, onChange]
  );

  const removeGroup = useCallback(
    (groupId: string) => {
      onChange((prev) => prev.filter((group) => group.id !== groupId));
    },
    [onChange]
  );

  const addChoiceToGroup = useCallback(
    (groupId: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "standard") {
            return group;
          }
          return {
            ...group,
            options: [
              ...group.options,
              {
                id: generateId(),
                label: "",
                price: "",
                imageIndex: "" as const,
              },
            ],
          };
        })
      );
    },
    [onChange]
  );

  const updateChoiceField = useCallback(
    (groupId: string, choiceId: string, field: "label" | "price" | "imageIndex", value: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "standard") {
            return group;
          }
          return {
            ...group,
            options: group.options.map((choice) => {
              if (choice.id !== choiceId) {
                return choice;
              }
              if (field === "label") {
                return { ...choice, label: value };
              }
              if (field === "price") {
                return { ...choice, price: value };
              }
              return {
                ...choice,
                imageIndex: value === "" || Number.isNaN(Number(value)) ? "" : Number(value),
              };
            }),
          };
        })
      );
    },
    [onChange]
  );

  const removeChoiceFromGroup = useCallback(
    (groupId: string, choiceId: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "standard") {
            return group;
          }
          const remaining = group.options.filter((choice) => choice.id !== choiceId);
          return {
            ...group,
            options:
              remaining.length > 0
                ? remaining
                : [
                    {
                      id: generateId(),
                      label: "",
                      price: "",
                      imageIndex: "" as const,
                    },
                  ],
          };
        })
      );
    },
    [onChange]
  );

  const toggleColourInGroup = useCallback(
    (groupId: string, colourId: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "colour") {
            return group;
          }
          const selected = new Set(group.colourIds);
          if (selected.has(colourId)) {
            selected.delete(colourId);
          } else {
            selected.add(colourId);
          }
          return {
            ...group,
            colourIds: Array.from(selected),
          };
        })
      );
    },
    [onChange]
  );

  const selectAllColoursForGroup = useCallback(
    (groupId: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "colour") {
            return group;
          }
          return {
            ...group,
            colourIds: [...allColourIds],
          };
        })
      );
    },
    [allColourIds, onChange]
  );

  const clearColoursForGroup = useCallback(
    (groupId: string) => {
      onChange((prev) =>
        prev.map((group) => {
          if (group.id !== groupId || group.type !== "colour") {
            return group;
          }
          return {
            ...group,
            colourIds: [],
          };
        })
      );
    },
    [onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addGroup("standard")}
          className="rounded border border-purple-500/60 px-3 py-2 text-sm text-purple-200 transition hover:bg-purple-500/10"
        >
          + Add standard option group
        </button>
        <button
          type="button"
          onClick={() => addGroup("colour")}
          disabled={!allowColourGroups}
          className={`rounded border px-3 py-2 text-sm transition ${
            allowColourGroups
              ? "border-blue-500/60 text-blue-200 hover:bg-blue-500/10"
              : "border-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          + Add colour dropdown
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 text-sm text-gray-300">
          No custom option groups yet. Use the buttons above to add a dropdown.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isColour = group.type === "colour";
            const selectedCount = group.colourIds.length;
            const totalColours = productColours.length;

            return (
              <div
                key={group.id}
                className="space-y-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4"
              >
                <div className="flex flex-col gap-3 md:items-start">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-300 mb-1">Group title</label>
                    <input
                      value={group.title}
                      onChange={(event) => updateGroupTitle(group.id, event.target.value)}
                      placeholder={isColour ? "e.g. Primary Colour" : "e.g. Size"}
                      className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                    />
                  </div>
                  <div className="md:w-48">
                    <label className="block text-sm text-gray-300 mb-1">Group type</label>
                    <select
                      value={group.type}
                      onChange={(event) =>
                        changeGroupType(group.id, event.target.value as "standard" | "colour")
                      }
                      className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                    >
                      <option value="standard">Standard</option>
                      <option value="colour" disabled={!allowColourGroups}>
                        Colour
                      </option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="text-red-400 transition hover:text-red-300 md:self-center"
                  >
                    Remove group
                  </button>
                </div>

              {group.type === "standard" ? (
                <div className="space-y-3">
                  {group.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex flex-col gap-2 md:items-center md:gap-3"
                    >
                      <input
                        type="text"
                        value={option.label}
                        onChange={(event) =>
                          updateChoiceField(group.id, option.id, "label", event.target.value)
                        }
                        placeholder="Option label"
                        className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      />
                      <select
                        value={option.imageIndex}
                        onChange={(event) =>
                          updateChoiceField(group.id, option.id, "imageIndex", event.target.value)
                        }
                        className="w-full md:w-32 rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5"
                      >
                        <option value="">Image #</option>
                        {imageIndices.map((index) => (
                          <option key={index} value={index}>
                            #{index + 1}
                          </option>
                        ))}
                      </select>
                      <div className="relative w-full md:w-32">
                        <span className="absolute left-2 top-2 text-gray-400">$</span>
                        <input
                          type="text"
                          value={option.price}
                          onChange={(event) =>
                            updateChoiceField(group.id, option.id, "price", event.target.value)
                          }
                          placeholder="0.00"
                          className="w-full rounded-md bg-gray-700 text-gray-200 border border-gray-600 p-2.5 pl-6"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChoiceFromGroup(group.id, option.id)}
                        className="text-red-400 transition hover:text-red-300 md:self-center"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addChoiceToGroup(group.id)}
                    className="text-sm text-purple-400 transition hover:underline"
                  >
                    + Add option
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <span>
                      Select colours ({selectedCount}/{totalColours})
                    </span>
                    <button
                      type="button"
                      onClick={() => selectAllColoursForGroup(group.id)}
                      className="rounded border border-purple-500/60 px-2 py-1 text-xs text-purple-200 transition hover:bg-purple-500/10"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => clearColoursForGroup(group.id)}
                      className="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 transition hover:bg-gray-700/60"
                    >
                      Clear
                    </button>
                    {colourLoadError && (
                      <span className="text-xs text-red-400">{colourLoadError}</span>
                    )}
                  </div>

                  {isLoadingColours && totalColours === 0 ? (
                    <div className="text-sm text-gray-400">Loading colour list...</div>
                  ) : totalColours === 0 ? (
                    <div className="text-sm text-gray-400">
                      No colours available. Add colours in the &ldquo;Print Colours&rdquo; tab.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {productColours.map((colour) => {
                        const isSelected = group.colourIds.includes(colour.id);
                        return (
                          <label
                            key={colour.id}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-gray-700 hover:border-purple-500/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                              checked={isSelected}
                              onChange={() => toggleColourInGroup(group.id, colour.id)}
                            />
                            <span className="text-gray-200">
                              {colour.name || "Untitled colour"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}
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
          allowColourOptions={props.routeData === "/api/forsale/prints"}
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
  productColours = [],
  productColoursLoading = false,
  colourLoadError,
  allowColourOptions = false,
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

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });

  const initialOptionGroups = useMemo(() => {
    const groups = inflateCustomOptionsToGroups(customOptions);
    return allowColourOptions ? groups : groups.filter((group) => group.type !== "colour");
  }, [customOptions, allowColourOptions]);
  const [optionGroups, setOptionGroups] = useState<CustomOptionGroupForm[]>(initialOptionGroups);
  const [hasCustomOptions, setHasCustomOptions] = useState(initialOptionGroups.length > 0);

  useEffect(() => {
    if (!hasCustomOptions) {
      setOptionGroups([]);
    }
  }, [hasCustomOptions]);

  useEffect(() => {
    if (!allowColourOptions) {
      setOptionGroups((prev) => prev.filter((group) => group.type !== "colour"));
    }
  }, [allowColourOptions]);

  useEffect(() => {
    const availableIds = new Set(productColours.map((colour) => colour.id));
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (group.type !== "colour") {
          return group;
        }
        const filtered = group.colourIds.filter((id) => availableIds.has(id));
        const nextIds =
          filtered.length > 0 || availableIds.size === 0
            ? filtered
            : Array.from(availableIds);
        if (filtered.length === group.colourIds.length) {
          return group;
        }
        return {
          ...group,
          colourIds: nextIds,
        };
      })
    );
  }, [productColours]);
  const [isSaving, setIsSaving] = useState(false);

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...localImages];
    const draggedImage = newImages[draggedIndex];

    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);

    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);

    setLocalImages(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  // Touch handlers for mobile
  function handleTouchStart(e, index) {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedIndex(index);
  }

  function handleTouchMove(e) {
    if (draggedIndex === null) return;

    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Find the closest image container
    const imageContainer = element?.closest('[data-image-index]');
    if (imageContainer) {
      const newIndex = parseInt(imageContainer.dataset.imageIndex);
      setDragOverIndex(newIndex);
    }
  }

  function handleTouchEnd(e) {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedIndex !== dragOverIndex) {
      const newImages = [...localImages];
      const draggedImage = newImages[draggedIndex];

      // Remove the dragged image from its original position
      newImages.splice(draggedIndex, 1);

      // Insert it at the new position
      newImages.splice(dragOverIndex, 0, draggedImage);

      setLocalImages(newImages);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  }


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
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      let newUrls: string[] = [];

      if (newFiles.length > 0) {
        newUrls = await Promise.all(
          newFiles.map(async (file, index) => {
            const sanitizedName = file.name.replace(/\s+/g, "-");
            const key = `${Date.now()}-${index}-${sanitizedName}`;
            const body = new FormData();
            body.append("imagename", key);

            const signedResp = await fetch("/api/forsale/awsupload", {
              method: "POST",
              body,
            });

            if (!signedResp.ok) {
              throw new Error("Failed to obtain upload URL");
            }

            const { presignedUrl } = await signedResp.json();

            const resized = (await resizeFile(file)) as string;
            const blob = await fetch(resized).then((res) => res.blob());

            await fetch(presignedUrl, {
              method: "PUT",
              body: blob,
            });

            return `https://vintage-reptiles-storage.s3.us-east-2.amazonaws.com/${key}`;
          })
        );
      }

      const updatedImages = [...localImages, ...newUrls].slice(0, 16);

      const finalBody = new FormData();
      finalBody.append("id2", id);
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
        const flattened = flattenCustomOptionGroups(optionGroups, allowColourOptions);
        finalBody.append("customOptions", JSON.stringify(flattened));
      } else {
        finalBody.append("customOptions", JSON.stringify([]));
      }

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
    } catch (error) {
      console.error("Failed to update item:", error);
      toast("Edit failed", {
        description: "Failed to edit item. Please try again.",
      });
    } finally {
      setIsSaving(false);
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
                <div className="mt-3 space-y-3">
                  <CustomOptionGroupsEditor
                    groups={optionGroups}
                    onChange={setOptionGroups}
                    imageOptionsCount={dropdownCount}
                    productColours={productColours}
                    allowColourGroups={allowColourOptions}
                    isLoadingColours={productColoursLoading}
                    colourLoadError={colourLoadError}
                  />
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
              <label className="block mb-1 text-sm text-gray-400">Current Images (drag to reorder)</label>
              <div className="border border-gray-700 rounded-lg p-3 bg-gray-800">
                {localImages && localImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {localImages.map((url, idx) => (
                      <div
                        key={idx}
                        data-image-index={idx}
                        className={`relative group cursor-move select-none ${draggedIndex === idx ? 'opacity-50 scale-95 z-10' : ''
                          } ${dragOverIndex === idx && draggedIndex !== idx ? 'ring-2 ring-purple-500' : ''
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, idx)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ touchAction: 'none' }}
                      >
                        <img
                          src={url}
                          alt="Current"
                          className="w-full aspect-square object-cover rounded-md border border-gray-700 group-hover:opacity-75 transition pointer-events-none"
                        />

                        {/* Enhanced drag indicator for mobile */}
                        <div className="absolute top-1 left-1 bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                        </div>

                        {/* Image number indicator */}
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs rounded px-1.5 py-0.5">
                          #{idx + 1}
                        </div>

                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition z-20"
                          onClick={() => removeExistingImage(idx)}
                          onTouchStart={(e) => e.stopPropagation()}
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

              {/* Mobile instructions */}
              <div className="mt-2 text-xs text-gray-500 md:hidden">
                💡 Touch and hold an image, then drag to reorder
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
              disabled={isSaving}
              className={`bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2.5 rounded-lg transition shadow-lg ${
                isSaving ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
            >
              {isSaving ? "Saving…" : "Save Changes"}
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
function ModalRemove({ onClose, isClicked, name, id, routeData, images = [], description, price, stock, issale, oldprice, onItemDeleted }) {
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
