import connect from "@/app/utils/startMongo";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import stripe from "@/app/lib/stripe";
import { mongoDbName } from "@/app/lib/db-server";
import { ObjectId } from "bson";

type CartLineProduct = {
  name?: string;
  price?: string;
  quantity?: number;
  colors?: string;
};

type CartLineDetail = {
  product?: CartLineProduct;
  chosenOption?: string;
  chosenOptions?: Record<string, string>;
  chosenColors?: unknown;
  stocktrack?: {
    id?: string;
    currpage?: string;
  };
};

type ValidatedCartEntry = {
  cartKey: string;
  product: CartLineProduct;
  chosenOption?: string;
  chosenColors?: unknown;
  category?: string;
};

type CartValidationUpdate = {
  cartKey: string;
  action: "keep" | "update" | "remove";
  quantity?: number;
  price?: string;
  priceID?: string;
  chosenOptionPriceID?: string | null;
  chosenColors?: unknown;
};

function formatChosenColors(
  chosenColors: unknown,
  fallbackColors?: string
) {
  if (Array.isArray(chosenColors)) {
    const combos = chosenColors
      .filter(
        (combo): combo is Record<string, number> =>
          Boolean(combo) && typeof combo === "object" && !Array.isArray(combo)
      )
      .map((combo, index) => {
        const comboList = Object.entries(combo)
          .map(([colorName, qty]) => `${colorName} (${qty})`)
          .join(", ");

        return Object.keys(combo).length > 1
          ? `Set ${index + 1}: ${comboList}`
          : comboList;
      })
      .filter(Boolean);

    if (combos.length > 0) {
      return combos.join("; ");
    }
  }

  if (chosenColors && typeof chosenColors === "object") {
    const colorList = Object.entries(chosenColors as Record<string, number>)
      .map(([colorName, qty]) => `${colorName} (${qty})`)
      .join(", ");

    if (colorList) {
      return colorList;
    }
  }

  return fallbackColors || "";
}

function resolveCollectionName(currpage?: string) {
  switch ((currpage || "").toLowerCase()) {
    case "availability":
      return "Availability";
    case "prints":
      return "Prints";
    case "plants":
      return "Plants";
    case "isopods":
      return "Isopods";
    case "males":
      return "Males";
    case "females":
      return "Females";
    case "malecrestedgeckos":
      return "Malecrestedgeckos";
    case "femalecrestedgeckos":
      return "Femalecrestedgeckos";
    case "malegargoylegeckos":
      return "Malegargoylegeckos";
    case "femalegargoylegeckos":
      return "Femalegargoylegeckos";
    case "malechahouageckos":
      return "Malechahouageckos";
    case "femalechahouageckos":
      return "Femalechahouageckos";
    default:
      return null;
  }
}

function formatCategoryLabel(currpage?: string) {
  switch ((currpage || "").toLowerCase()) {
    case "availability":
      return "Reptile";
    case "prints":
      return "3D Print";
    case "plants":
      return "Plant";
    case "isopods":
      return "Isopod";
    case "males":
      return "Male";
    case "females":
      return "Female";
    case "malecrestedgeckos":
      return "Breeder - Male Crested Gecko";
    case "femalecrestedgeckos":
      return "Breeder - Female Crested Gecko";
    case "malegargoylegeckos":
      return "Breeder - Male Gargoyle Gecko";
    case "femalegargoylegeckos":
      return "Breeder - Female Gargoyle Gecko";
    case "malechahouageckos":
      return "Breeder - Male Chahoua Gecko";
    case "femalechahouageckos":
      return "Breeder - Female Chahoua Gecko";
    default:
      return currpage || "Unknown";
  }
}

function formatPriceValue(price: unknown) {
  const numericPrice = Number.parseFloat(String(price ?? ""));
  if (Number.isNaN(numericPrice)) {
    return null;
  }

  return numericPrice.toFixed(2);
}

function normalizeChosenColorsToStock(chosenColors: unknown, stockLimit: number) {
  if (stockLimit <= 0) {
    return null;
  }

  if (Array.isArray(chosenColors)) {
    const normalized: Record<string, number>[] = [];
    let remaining = stockLimit;

    for (const combo of chosenColors) {
      if (!combo || typeof combo !== "object" || Array.isArray(combo) || remaining <= 0) {
        continue;
      }

      const entries = Object.entries(combo as Record<string, number>);
      if (entries.length === 0) {
        continue;
      }

      if (entries.length > 1) {
        normalized.push(
          Object.fromEntries(entries.map(([key, value]) => [key, Number(value) || 1]))
        );
        remaining -= 1;
        continue;
      }

      const [key, value] = entries[0];
      const nextQty = Math.min(Number(value) || 0, remaining);
      if (nextQty > 0) {
        normalized.push({ [key]: nextQty });
        remaining -= nextQty;
      }
    }

    return normalized.length > 0 ? normalized : null;
  }

  if (chosenColors && typeof chosenColors === "object") {
    const normalized: Record<string, number> = {};
    let remaining = stockLimit;

    for (const [key, value] of Object.entries(chosenColors as Record<string, number>)) {
      if (remaining <= 0) {
        break;
      }

      const nextQty = Math.min(Number(value) || 0, remaining);
      if (nextQty > 0) {
        normalized[key] = nextQty;
        remaining -= nextQty;
      }
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  return chosenColors;
}

function resolveCurrentPrice(
  currentRecord: any,
  chosenOptions?: Record<string, string>
) {
  const fallbackPrice = formatPriceValue(currentRecord?.price);
  const fallbackPriceId =
    typeof currentRecord?.priceid === "string" && currentRecord.priceid
      ? currentRecord.priceid
      : null;

  if (!Array.isArray(currentRecord?.customOptions) || !chosenOptions) {
    return {
      price: fallbackPrice,
      priceId: fallbackPriceId,
      chosenOptionPriceId: null,
    };
  }

  for (const [groupName, selectedLabel] of Object.entries(chosenOptions)) {
    const match = currentRecord.customOptions.find((option: any) => {
      const optionGroup = option?.groupName || option?.label;
      return optionGroup === groupName && option?.label === selectedLabel;
    });

    if (match?.priceid || match?.price) {
      return {
        price: formatPriceValue(match?.price) ?? fallbackPrice,
        priceId:
          typeof match?.priceid === "string" && match.priceid
            ? match.priceid
            : fallbackPriceId,
        chosenOptionPriceId:
          typeof match?.priceid === "string" && match.priceid ? match.priceid : null,
      };
    }
  }

  return {
    price: fallbackPrice,
    priceId: fallbackPriceId,
    chosenOptionPriceId: null,
  };
}

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const cartDetails = await req.json();
  const detailEntries = Object.entries(
    ((cartDetails?.details as Record<string, CartLineDetail | undefined>) ?? {})
  );
  const validateOnly = cartDetails?.validateOnly === true;
  
  const ELIGIBLE_PRODUCT_IDS = new Set([
    "prod_SCLs3mv4vbqs76",
    "prod_Qw2iLBkbaYpORc",
    "prod_Qw0epnbTOvB2h4",
    "prod_Qw0XLjxb3ESzla",
    "prod_Qw0g6pDBQoDUl3",
    "prod_QsZlszGPRpDInS",
    "prod_RztCIunfFd9dnv",
    "prod_RztC8a7cL6Pv2L",
    "prod_SCLs3mv4vbqs76",
    "prod_SMneIxE8hGSN2n",
    "prod_SMnctTkG1EN6er",
    "prod_SKASjfjCK6sXDX",
    "prod_SJpFyNEorWO0Bk",
    "prod_SJnDwKP63LzZ96",
    "prod_SHsalw5YhR1lQ1",
    "prod_SHsZi6N6vXm8Sg",
    "prod_SGQyc87Kq0t3VK",
    "prod_SGQrAVwUa6mIj7",
    "prod_SD7ugRIQ13WbIr",
    "prod_RKn2lMpnfXyxw3",
    "prod_Qw0g6pDBQoDUl3",
    "prod_QsZlszGPRpDInS",
    "prod_QsZll9iTxdqVcO",
    "prod_TAv3tAZtyVmLCJ",
    'prod_T4u86Wm0HUvlI1',
    'prod_SiuVvCrB1nvs9B',
    'prod_SiXJCgSIroPN5r',
    'prod_SVQFBcHD6dZduz',
    'prod_SVPdbGEi5sx5GY',
    'prod_SVParklzr437Tw',
    'prod_SVPa3Cf1CcigSH',
    'prod_SOh6AYuwbMtJqH',
    'prod_SOh4VWt2BrBkz9',
    'prod_SMneIxE8hGSN2n',
    'prod_SMnctTkG1EN6er',
    'prod_SKASjfjCK6sXDX',
    'prod_SJnDwKP63LzZ96',
    'prod_SHsalw5YhR1lQ1',
    'prod_SHsZi6N6vXm8Sg',
    'prod_TDyBwaS4It4r47',
    'prod_TI4hux3NOhfH7i',
    'prod_TC1jOBxgXRjiPu',
    'prod_TAv3tAZtyVmLCJ',
    'prod_T4u86Wm0HUvlI1',
    'prod_Tw9lDli6sUbcQQ',
    'prod_Tw9uls9Hmqcfym',
  ]);

  const client = await connect;
  const validationIssues: string[] = [];
  const cartUpdates: CartValidationUpdate[] = [];

  const validatedEntries = await Promise.all(
    detailEntries.map(async ([cartKey, detail]): Promise<ValidatedCartEntry | null> => {
      const { product, chosenOption, chosenOptions, chosenColors, stocktrack } = detail || {};

      if (!product?.price) {
        validationIssues.push(`"${product?.name || "An item"}" is missing a valid price.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      const collectionName = resolveCollectionName(stocktrack?.currpage);
      if (!collectionName || !stocktrack?.id) {
        validationIssues.push(`"${product?.name || "An item"}" could not be validated.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      let listingId: ObjectId;
      try {
        listingId = new ObjectId(stocktrack.id);
      } catch {
        validationIssues.push(`"${product?.name || "An item"}" could not be validated.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      const currentRecord = await client
        .db(mongoDbName)
        .collection(collectionName)
        .findOne({ _id: listingId });

      if (!currentRecord) {
        validationIssues.push(`"${product?.name || "An item"}" is no longer available.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      const { price, priceId, chosenOptionPriceId } = resolveCurrentPrice(
        currentRecord,
        chosenOptions
      );
      const currentStock = Number.parseInt(String(currentRecord.stock || "0"), 10) || 0;
      const requestedQty = Number(product.quantity || 1);
      let normalizedChosenColors = chosenColors;
      let normalizedQty = requestedQty;
      let needsCartUpdate = false;

      if (currentStock <= 0) {
        validationIssues.push(`"${currentRecord.name || product.name}" is out of stock.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      if (currentStock < requestedQty) {
        needsCartUpdate = true;
        if (chosenColors) {
          normalizedChosenColors = normalizeChosenColorsToStock(chosenColors, currentStock);
          normalizedQty = currentStock;
        } else {
          normalizedQty = currentStock;
        }
      }

      const validPriceIds = new Set<string>();
      if (typeof currentRecord.priceid === "string" && currentRecord.priceid) {
        validPriceIds.add(currentRecord.priceid);
      }

      if (Array.isArray(currentRecord.customOptions)) {
        currentRecord.customOptions.forEach((opt: any) => {
          if (typeof opt?.priceid === "string" && opt.priceid) {
            validPriceIds.add(opt.priceid);
          }
        });
      }

      if (!priceId || !validPriceIds.has(priceId)) {
        validationIssues.push(`"${currentRecord.name || product.name}" could not be validated.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      if (product.price !== priceId) {
        needsCartUpdate = true;
      }

      if (!price) {
        validationIssues.push(`"${currentRecord.name || product.name}" is missing a valid price.`);
        cartUpdates.push({ cartKey, action: "remove" });
        return null;
      }

      if (validateOnly) {
        cartUpdates.push(
          needsCartUpdate
            ? {
                cartKey,
                action: "update",
                quantity: normalizedQty,
                price,
                priceID: priceId,
                chosenOptionPriceID: chosenOptionPriceId,
                chosenColors: normalizedChosenColors,
              }
            : {
                cartKey,
                action: "keep",
                quantity: requestedQty,
                price,
                priceID: priceId,
                chosenOptionPriceID: chosenOptionPriceId,
                chosenColors,
              }
        );
      }

      return {
        cartKey,
        product,
        chosenOption,
        chosenColors,
        category: formatCategoryLabel(stocktrack?.currpage),
      };
    })
  );

  if (validationIssues.length > 0) {
    const issues = Array.from(new Set(validationIssues));
    return NextResponse.json(
      {
        error: "Cart validation failed",
        issues,
        updates: validateOnly ? cartUpdates : undefined,
      },
      { status: 409 }
    );
  }

  if (validateOnly) {
    return NextResponse.json({
      ok: true,
      updates: cartUpdates,
    });
  }

  const nonNullValidatedEntries = validatedEntries.filter(
    (entry): entry is ValidatedCartEntry => entry !== null
  );
  const hasReptileInCart = nonNullValidatedEntries.some(
    (entry) => entry.category === "Reptile"
  );

  console.log(
    "Checkout session product details:",
    nonNullValidatedEntries.map(({ cartKey, product, chosenOption, chosenColors, category }) => ({
      cartKey,
      category,
      name: product.name,
      priceId: product.price,
      quantity: product.quantity,
      chosenOption,
      chosenColors,
    }))
  );

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = await Promise.all(
    nonNullValidatedEntries.map(async ({ product, chosenOption, chosenColors }) => {
      const productPriceId = product.price!;

      const qty      = product.quantity || 1;
      const priceObj = await stripe.prices.retrieve(productPriceId);
      const prodId   = typeof priceObj.product === "string"
        ? priceObj.product
        : priceObj.product.id;
  
      // base unit price
      let unitAmount = priceObj.unit_amount!;
  
      // start with any existing description (e.g. color)
      const colorDescription = formatChosenColors(chosenColors, product.colors);

      let description = colorDescription
        ? `Color(s): ${colorDescription}`
        : "";

        if (chosenOption) {
          const optionNote = `Option: ${chosenOption}`;
          description = description
            ? `${description}; ${optionNote}`
            : optionNote;
        }
  
      // only apply bulk‐tier to eligible Products
      if (ELIGIBLE_PRODUCT_IDS.has(prodId)) {
        let discountRate = 0;
        if      (qty >= 30) discountRate = 0.20;
        else if (qty >= 20) discountRate = 0.15;
        else if (qty >= 10) discountRate = 0.10;
  
        if (discountRate > 0) {
          // compute the discounted unit price
          unitAmount = Math.round(unitAmount * (1 - discountRate));
          // append the bulk‐discount text
          const note = `Bulk discount applied: ${Math.round(discountRate * 100)}% off`;
          description = description
            ? `${description}; ${note}`
            : note;
        }
      }
  
      return {
        price_data: {
          currency:    "cad",
          unit_amount: unitAmount,
          product_data: {
            name:        product.name || "Product",
            description: description || undefined,  // omit if empty
          },
        },
        quantity: qty,
      };
    })
  );  

  // Now create the Checkout session with embedded checkout enabled
  try {
    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: { allowed_countries: ["CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'cad' },
            display_name: 'Calculating…',
          },
        },
      ],
      payment_method_types: ["card", "afterpay_clearpay"],
      line_items: lineItems,
      phone_number_collection: {
        enabled: true,
      },
      mode: "payment",
      ui_mode: "elements",
      metadata: {
        has_reptile_in_cart: hasReptileInCart ? "true" : "false",
      },
      return_url: `${headersList.get("origin")}/thank-you`,
      permissions: {
        update_shipping_details: 'server_only',
      },
    });

    if (typeof session.client_secret !== "string") {
      console.error("Stripe session missing client_secret", {
        id: session.id,
        ui_mode: session.ui_mode,
      });
      return NextResponse.json(
        { error: "Stripe checkout session did not return a client secret." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      clientSecret: session.client_secret,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Error creating checkout session" });
  }
}
