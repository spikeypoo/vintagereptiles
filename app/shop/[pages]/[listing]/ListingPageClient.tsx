'use client';

import '@/app/globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, ShoppingCart, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type CustomOption = {
  label?: string;
  price?: string;
  priceid?: string;
  imageIndex?: number;
  isColourOption?: boolean;
  colourIds?: string[];
  groupName?: string;
};

type ProductColour = {
  id: string;
  name: string;
  imageUrl: string;
};

export type ListingPageData = {
  id: string;
  name: string;
  price: string;
  oldprice?: string;
  description: string;
  stock: string;
  images: string[];
  issale: string;
  customOptions?: CustomOption[];
  priceid?: string | null;
  stripeid?: string | null;
};

type ListingPageClientProps = {
  page: string;
  listingId: string;
  initialData: ListingPageData;
  productColours: ProductColour[];
};

const transformImageUrl = (url?: string) =>
  url?.replace('vintage-reptiles-storage.s3.us-east-2.amazonaws.com/', 'd3ke37ygqgdiqe.cloudfront.net/') ?? '';

export default function ListingPageClient({ page, listingId, initialData, productColours }: ListingPageClientProps) {
  const [listingData, setListingData] = useState<ListingPageData>(initialData);
  const [selectedStandardOptions, setSelectedStandardOptions] = useState<Record<string, CustomOption>>({});
  const [selectedColourSelections, setSelectedColourSelections] = useState<Record<string, ProductColour>>({});
  const [quantity, setQuantity] = useState<number | string>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focused, setFocused] = useState(() => transformImageUrl(initialData.images?.[0]));
  const [isModalOpen, setModalOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [openStandardDropdown, setOpenStandardDropdown] = useState<string | null>(null);
  const [openColourDropdown, setOpenColourDropdown] = useState<string | null>(null);
  const standardDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const colourDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setListingData(initialData);
    setSelectedStandardOptions({});
    setSelectedColourSelections({});
    setQuantity(1);
    setCurrentIndex(0);
    setFocused(transformImageUrl(initialData.images?.[0]));
  }, [initialData]);

  const images = useMemo(() => {
    if (!Array.isArray(listingData.images)) {
      return [];
    }
    return listingData.images
      .filter((img): img is string => Boolean(img))
      .map((img) => transformImageUrl(img))
      .filter(Boolean);
  }, [listingData.images]);

  useEffect(() => {
    if (!focused && images.length > 0) {
      setFocused(images[0]);
    }
  }, [focused, images]);

  const standardOptionGroups = useMemo(() => {
    if (!Array.isArray(listingData.customOptions)) {
      return [] as { title: string; options: CustomOption[] }[];
    }
    const order: string[] = [];
    const map = new Map<string, { title: string; options: CustomOption[] }>();
    listingData.customOptions.forEach((opt) => {
      if (opt?.isColourOption) return;
      const title = opt?.groupName || opt?.label || 'Option';
      const key = `standard:${title}`;
      if (!map.has(key)) {
        order.push(key);
        map.set(key, { title, options: [] });
      }
      map.get(key)!.options.push(opt);
    });
    return order.map((key) => map.get(key)!);
  }, [listingData.customOptions]);

  const colourOptionGroups = useMemo(() => {
    if (!Array.isArray(listingData.customOptions)) {
      return [] as { title: string; colourIds: string[] }[];
    }
    const order: string[] = [];
    const map = new Map<string, { title: string; colourIds: string[] }>();
    listingData.customOptions.forEach((opt) => {
      if (!opt?.isColourOption) return;
      const title = opt?.groupName || opt?.label || 'Colour Option';
      const key = `colour:${title}`;
      if (!map.has(key)) {
        order.push(key);
        map.set(key, {
          title,
          colourIds: Array.isArray(opt.colourIds) ? opt.colourIds.map(String) : [],
        });
      } else if (Array.isArray(opt.colourIds)) {
        const existing = map.get(key)!;
        const set = new Set(existing.colourIds);
        opt.colourIds.forEach((id) => set.add(String(id)));
        existing.colourIds = Array.from(set);
      }
    });
    return order.map((key) => map.get(key)!);
  }, [listingData.customOptions]);

  const colourChoicesByGroup = useMemo(() => {
    const map: Record<string, ProductColour[]> = {};
    colourOptionGroups.forEach((group) => {
      if (!group.colourIds.length) {
        map[group.title] = productColours;
        return;
      }
      const allowedIds = new Set(group.colourIds.map(String));
      map[group.title] = productColours.filter((colour) => allowedIds.has(colour.id));
    });
    return map;
  }, [colourOptionGroups, productColours]);

  const hasStandardOptions = standardOptionGroups.length > 0;
  const hasColourOptions = colourOptionGroups.length > 0;
  const allStandardSelected = standardOptionGroups.every((group) => selectedStandardOptions[group.title]);
  const allColourSelected = colourOptionGroups.every((group) => selectedColourSelections[group.title]);
  const totalStandardOptions = standardOptionGroups.reduce(
    (sum, group) => sum + group.options.length,
    0
  );

  useEffect(() => {
    setSelectedStandardOptions((prev) => {
      const next: Record<string, CustomOption> = {};
      standardOptionGroups.forEach((group) => {
        const selected = prev[group.title];
        if (selected && group.options.some((opt) => opt.label === selected.label)) {
          next[group.title] = selected;
        }
      });
      return next;
    });
  }, [standardOptionGroups]);

  useEffect(() => {
    if (!hasColourOptions) {
      if (Object.keys(selectedColourSelections).length > 0) {
        setSelectedColourSelections({});
      }
      return;
    }
    setSelectedColourSelections((prev) => {
      const next: Record<string, ProductColour> = {};
      colourOptionGroups.forEach((group) => {
        const selected = prev[group.title];
        const choices = colourChoicesByGroup[group.title] ?? [];
        if (selected && choices.some((colour) => colour.id === selected.id)) {
          next[group.title] = selected;
        }
      });
      return next;
    });
  }, [colourOptionGroups, colourChoicesByGroup, hasColourOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStandardDropdown) {
        const node = standardDropdownRefs.current[openStandardDropdown];
        if (node && !node.contains(event.target as Node)) {
          setOpenStandardDropdown(null);
        }
      }
      if (openColourDropdown) {
        const node = colourDropdownRefs.current[openColourDropdown];
        if (node && !node.contains(event.target as Node)) {
          setOpenColourDropdown(null);
        }
      }
    };

    if (openStandardDropdown || openColourDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openStandardDropdown, openColourDropdown]);

  const getMinOptionPrice = () => {
    const basePrice = Number.parseFloat(listingData.price || '0');
    const allOptions = standardOptionGroups.flatMap((group) => group.options);
    if (allOptions.length === 0) {
      return basePrice.toFixed(2);
    }
    const prices = allOptions
      .map((opt) => Number.parseFloat(opt.price || `${basePrice}`))
      .filter((val) => !Number.isNaN(val));
    const minPrice = prices.length ? Math.min(...prices) : basePrice;
    return minPrice.toFixed(2);
  };

  const displayPrice = () => {
    const basePrice = Number.parseFloat(listingData.price || '0');
    const priceOption = Object.values(selectedStandardOptions).find((opt) => opt?.price);
    if (priceOption?.price) {
      return Number.parseFloat(priceOption.price).toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  const handleStandardOptionSelect = (groupTitle: string, option: CustomOption) => {
    setSelectedStandardOptions((prev) => ({ ...prev, [groupTitle]: option }));
    setOpenStandardDropdown(null);
    if (typeof option.imageIndex === 'number' && images[option.imageIndex]) {
      setCurrentIndex(option.imageIndex);
      setFocused(images[option.imageIndex]);
    }
  };

  const handleColourSelect = (groupTitle: string, colour: ProductColour) => {
    setSelectedColourSelections((prev) => ({ ...prev, [groupTitle]: colour }));
    setOpenColourDropdown(null);
  };

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setModalOpen(true);
    document.body.classList.add('overflow-hidden');
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.classList.remove('overflow-hidden');
  };

  const nextImage = () => {
    if (!images.length) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    setFocused(images[newIndex]);
  };

  const prevImage = () => {
    if (!images.length) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    setFocused(images[newIndex]);
  };

  const calculateDiscount = () => {
    if (listingData.issale === 'true') {
      const oldPrice = Number.parseFloat(listingData.oldprice || '0');
      const newPrice = Number.parseFloat(listingData.price || '0');
      if (oldPrice > 0 && newPrice >= 0) {
        return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      }
    }
    return 0;
  };

  const isOutOfStock = Number.parseInt(listingData.stock || '0', 10) <= 0;
  const inStock = Number.parseInt(listingData.stock || '0', 10) > 0;
  const discount = calculateDiscount();

  const handleAdd = () => {
    setAddingToCart(true);
    if (!allStandardSelected || !allColourSelected) {
      setAddingToCart(false);
      alert('Please select all required options before adding to cart.');
      return;
    }

    const raw = localStorage.getItem('Cart') || '{}';
    const cartObj = JSON.parse(raw);

    let cartKey = listingId;
    standardOptionGroups.forEach((group) => {
      const selected = selectedStandardOptions[group.title];
      if (selected?.label) {
        cartKey += `|${encodeURIComponent(group.title)}=${encodeURIComponent(selected.label)}`;
      }
    });

    const numQuantity =
      typeof quantity === 'number' ? quantity : Number.parseInt(quantity || '1', 10) || 1;

    const priceOption = Object.values(selectedStandardOptions).find((opt) => opt?.price);
    const rawPrice = priceOption?.price ?? listingData.price ?? '0';
    const priceIdToUse = priceOption?.priceid ?? listingData.priceid ?? null;
    const numericPrice = Number.parseFloat(String(rawPrice));
    const displayPriceValue = Number.isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);

    const mainImage = listingData.images?.[0] ? transformImageUrl(listingData.images[0]) : '';

    const optionSummaryParts: string[] = [];
    standardOptionGroups.forEach((group) => {
      const selected = selectedStandardOptions[group.title];
      if (selected?.label) {
        optionSummaryParts.push(`${group.title}: ${selected.label}`);
      }
    });
    colourOptionGroups.forEach((group) => {
      const selected = selectedColourSelections[group.title];
      if (selected?.name) {
        optionSummaryParts.push(`${group.title}:
          ${selected.name}`);
      }
    });
    const optionSummary = optionSummaryParts.join('; ');

    const colourCountEntries: Record<string, number> = {};
    colourOptionGroups.forEach((group) => {
      const selected = selectedColourSelections[group.title];
      if (selected?.name) {
        const keyLabel = `${group.title}: ${selected.name}`;
        colourCountEntries[keyLabel] = numQuantity;
      }
    });

    if (cartObj[cartKey]) {
      cartObj[cartKey].quantity += numQuantity;

      if (page === 'prints' && Object.keys(colourCountEntries).length > 0) {
        if (!Array.isArray(cartObj[cartKey].chosenColors)) {
          cartObj[cartKey].chosenColors = [];
        }

        const chosenColorsArray = cartObj[cartKey].chosenColors as Record<string, number>[];

        const existingIndex = chosenColorsArray.findIndex(
          (combo) => JSON.stringify(combo) === JSON.stringify(colourCountEntries)
        );

        if (existingIndex !== -1) {
          Object.keys(colourCountEntries).forEach((key) => {
            chosenColorsArray[existingIndex][key] =
              (chosenColorsArray[existingIndex][key] || 0) + colourCountEntries[key];
          });
        } else {
          chosenColorsArray.push(colourCountEntries);
        }

        const colorText = Object.keys(colourCountEntries).join('; ');
        if (!cartObj[cartKey].chosenOption?.includes(colorText)) {
          cartObj[cartKey].chosenOption =
            (cartObj[cartKey].chosenOption || '') + `; ${colorText}`;
        }
      }
    }
    else {
      const entry: Record<string, unknown> = {
        name: listingData.name,
        price: displayPriceValue,
        priceID: priceIdToUse ?? listingData.priceid,
        productID: listingData.stripeid,
        image: mainImage,
        quantity: numQuantity,
        currpage: page,
        id: listingId,
        chosenOption: optionSummary || null,
        chosenOptionPriceID: priceIdToUse,
        chosenOptions: standardOptionGroups.reduce<Record<string, string>>((acc, group) => {
          const selected = selectedStandardOptions[group.title];
          if (selected?.label) acc[group.title] = selected.label;
          return acc;
        }, {}),
      };

      if (page === 'prints' && Object.keys(colourCountEntries).length > 0) {
        // Start array with the first colour combo
        entry.chosenColors = [colourCountEntries];
      }

      cartObj[cartKey] = entry;
    }


    localStorage.setItem('Cart', JSON.stringify(cartObj));
    setTimeout(() => {
      setAddingToCart(false);
      location.reload();
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 mb-[100px]">
      <nav className="flex items-center mb-8 text-sm">
        <Link href={`/shop/${page}`} className="text-gray-400 hover:text-white transition">
          {page.charAt(0).toUpperCase() + page.slice(1)}
        </Link>
        <ChevronRight size={16} className="mx-2 text-gray-400" />
        <span className="text-white font-medium truncate max-w-xs">{listingData.name}</span>
      </nav>

      <div className="bg-[#242122] rounded-xl p-4 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="relative mb-6 aspect-square">
              {focused ? (
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  <Image
                    src={focused}
                    alt={listingData.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                    onClick={() => openModal(currentIndex)}
                  />
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
                  {listingData.issale === 'true' && (
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

            {images.length > 1 && (
              <div className="flex gap-4 justify-center">
                {images.slice(0, 5).map((imageUrl, index) => {
                  const isActive = imageUrl === focused;

                  return (
                    <div
                      key={imageUrl}
                      className={`relative h-20 w-20 rounded-lg overflow-hidden cursor-pointer ${isActive ? 'ring-2 ring-[#cb18db]' : 'ring-2 ring-transparent hover:ring-white'
                        } ${index === 4 && images.length > 5 ? 'relative' : ''}`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setFocused(imageUrl);
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="80px"
                        className={`object-cover transition-all duration-200 ${isActive ? 'brightness-100' : 'brightness-75 hover:brightness-100'
                          }`}
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

          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{listingData.name}</h1>

              <div className="flex items-center mb-2">
                {listingData.price !== '' && (
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span
                        className={`text-2xl font-bold ${listingData.issale === 'true' ? 'text-red-500' : 'text-white'}`}
                      >
                        {hasStandardOptions && !allStandardSelected ? `$${getMinOptionPrice()}` : `$${displayPrice()}`}
                      </span>

                      {listingData.issale === 'true' && listingData.oldprice && (
                        <span className="text-gray-400 line-through text-lg ml-3">
                          ${Number.parseFloat(listingData.oldprice || '0').toFixed(2)}
                        </span>
                      )}
                    </div>

                    {hasStandardOptions && (
                      <span className="text-sm text-gray-300 mt-1">
                        {totalStandardOptions} {totalStandardOptions === 1 ? 'option' : 'options'} across {standardOptionGroups.length} {standardOptionGroups.length === 1 ? 'dropdown' : 'dropdowns'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="ml-2 text-sm text-gray-300">
                  {inStock ? `In Stock (${listingData.stock} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="h-px bg-[#3a3839] mb-6" />

            <div className="mb-8">
              <div
                className="text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (listingData.description || '').replace(/(\n)+/g, '<br />'),
                }}
              />
            </div>

            {standardOptionGroups.map((group) => {
              const selected = selectedStandardOptions[group.title];
              return (
                <div
                  key={group.title}
                  className="mb-6"
                  ref={(node) => {
                    standardDropdownRefs.current[group.title] = node;
                  }}
                >
                  <label className="block mb-2 text-white font-medium">{group.title}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenStandardDropdown((open) => (open === group.title ? null : group.title))
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-[#3a3839] bg-[#1c1a1b] px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-[#cb18db]"
                  >
                    <span>{selected?.label || 'Choose an option'}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${openStandardDropdown === group.title ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openStandardDropdown === group.title && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[#3a3839] bg-[#1c1a1b] shadow-lg">
                      {group.options.map((option) => (
                        <button
                          key={`${group.title}-${option.label}`}
                          type="button"
                          onClick={() => handleStandardOptionSelect(group.title, option)}
                          className={`flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-[#2c2a2b] ${selected?.label === option.label ? 'bg-[#341233] text-[#cb18db]' : 'text-gray-200'
                            }`}
                        >
                          <span>{option.label || 'Untitled option'}</span>
                          {option.price && (
                            <span className="text-xs text-gray-400">${Number.parseFloat(option.price).toFixed(2)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {!selected && (
                    <p className="mt-2 text-sm text-yellow-500">Please select {group.title.toLowerCase()}</p>
                  )}
                </div>
              );
            })}

            {colourOptionGroups.map((group) => {
              const selected = selectedColourSelections[group.title];
              const colourChoices = colourChoicesByGroup[group.title] ?? productColours;
              return (
                <div
                  key={group.title}
                  className="mb-6"
                  ref={(node) => {
                    colourDropdownRefs.current[group.title] = node;
                  }}
                >
                  <label className="block mb-2 text-white font-medium">{group.title}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenColourDropdown((open) => (open === group.title ? null : group.title))
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-[#3a3839] bg-[#1c1a1b] px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-[#cb18db]"
                  >
                    <span>{selected?.name || 'Choose a colour'}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${openColourDropdown === group.title ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openColourDropdown === group.title && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[#3a3839] bg-[#1c1a1b] shadow-lg">
                      {colourChoices.map((colour) => (
                        <button
                          key={`${group.title}-${colour.id}`}
                          type="button"
                          onClick={() => handleColourSelect(group.title, colour)}
                          className={`w-full px-4 py-2 text-left text-sm transition hover:bg-[#2c2a2b] ${selected?.id === colour.id ? 'bg-[#341233] text-[#cb18db]' : 'text-gray-200'
                            }`}
                        >
                          {colour.name || 'Untitled colour'}
                        </button>
                      ))}
                    </div>
                  )}
                  {!selected && (
                    <p className="mt-2 text-sm text-yellow-500">
                      Please select {group.title.toLowerCase()} before adding to cart
                    </p>
                  )}
                </div>
              );
            })}

            <div className="mb-6">
              <label className="block mb-2 text-white font-medium">Quantity</label>
              <div className="flex items-center">
                <button
                  type="button"
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] px-3 py-2 rounded-l-lg hover:bg-[#2c2a2b] transition-colors"
                  onClick={() =>
                    setQuantity((prev) => Math.max(1, (typeof prev === 'number' ? prev : Number.parseInt(prev || '1', 10)) - 1))
                  }
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
                    if (val === '') {
                      setQuantity('');
                      return;
                    }
                    const numVal = Number.parseInt(val, 10);
                    if (!Number.isNaN(numVal) && numVal > 0) {
                      const stock = Number.parseInt(listingData.stock || '0', 10) || 999;
                      setQuantity(Math.min(numVal, stock));
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val === '' || Number.parseInt(val, 10) < 1 || Number.isNaN(Number.parseInt(val, 10))) {
                      setQuantity(1);
                    }
                  }}
                  min={1}
                  max={listingData.stock || undefined}
                />
                <button
                  type="button"
                  className="bg-[#1c1a1b] text-white border border-[#3a3839] px-3 py-2 rounded-r-lg hover:bg-[#2c2a2b] transition-colors"
                  onClick={() =>
                    setQuantity((prev) => {
                      const currentQty = typeof prev === 'number' ? prev : Number.parseInt(prev || '0', 10) || 0;
                      const stock = Number.parseInt(listingData.stock || '0', 10) || 999;
                      return Math.min(stock, currentQty + 1);
                    })
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {Number(quantity) > (Number.parseInt(listingData.stock || '0', 10) || 0) && (
                <p className="text-sm text-red-500 mt-1">
                  Only {listingData.stock} available in stock
                </p>
              )}
            </div>

            <div className="mt-6">
              <button
                className={`flex items-center justify-center gap-2 font-bold text-white bg-[#cb18db] w-full sm:w-auto px-8 py-3 rounded-full text-lg transition-all duration-300 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#a814b6]'
                  } ${(hasColourOptions && !allColourSelected) || (hasStandardOptions && !allStandardSelected)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  } ${addingToCart ? 'animate-pulse' : ''}`}
                onClick={handleAdd}
                disabled={
                  isOutOfStock ||
                  (hasColourOptions && !allColourSelected) ||
                  (hasStandardOptions && !allStandardSelected) ||
                  addingToCart ||
                  quantity === '' ||
                  Number(quantity) < 1
                }
              >
                <ShoppingCart size={20} />
                {addingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {page === 'prints' && (
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all z-10"
              onClick={closeModal}
            >
              <X size={24} />
            </button>

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

            <div className="w-full h-full flex items-center justify-center p-4">
              <Image src={focused} alt={listingData.name} width={1200} height={1200} className="max-w-full max-h-full object-contain" />
            </div>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
