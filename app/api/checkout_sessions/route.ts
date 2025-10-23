import connect from "@/app/utils/startMongo";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { ObjectId } from "bson";

export async function POST(req: NextRequest, res: NextResponse) {
  const headersList = headers();
  const cartDetails = await req.json(); 
  
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
  ]);

  // Validate stock
  const client = await connect;

  // For each item in cartDetails
  const detailValues = Object.values(cartDetails.details);

  console.log(detailValues)

  const lineItems = await Promise.all(
    detailValues.map(async ({ product, chosenOption}) => {

      if (!product.price) {
        console.error('Missing price for product:', product);
        return;
      }

      const qty      = product.quantity || 1;
      const priceObj = await stripe.prices.retrieve(product.price);
      const prodId   = typeof priceObj.product === "string"
        ? priceObj.product
        : priceObj.product.id;
  
      // base unit price
      let unitAmount = priceObj.unit_amount!;
  
      // start with any existing description (e.g. color)
      let description = product.colors
        ? `Color(s): ${product.colors}`
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
            name:        product.name,
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
      ui_mode: "custom", // This enables embedded checkout
      return_url: `${headersList.get("origin")}/thank-you`,
      permissions: {
        update_shipping_details: 'server_only',
      },
    });

    console.log(session.client_secret);

    return NextResponse.json({ 
      clientSecret: session.client_secret,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Error creating checkout session" });
  }
}