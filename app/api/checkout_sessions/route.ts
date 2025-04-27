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
  ]);

  // Validate stock
  const client = await connect;

  // For each item in cartDetails
  const detailValues = Object.values(cartDetails.details);

  const lineItems = await Promise.all(
    detailValues.map(async ({ product }) => {
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

  // Now create the Checkout session with ephemeral line items
  try {
    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: { allowed_countries: ["CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 2500,
              currency: "cad",
            },
            display_name:
              "Canada MERCHANDISE Shipping. You will be contacted for a quote if your purchase includes a reptile",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "cad",
            },
            display_name:
              "Canada REPTILE Shipping. You will be contacted for a shipping quote",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 2 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "cad",
            },
            display_name: "LOCAL PICKUP - Vaughan, Ontario",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "cad",
            },
            display_name: "Request a custom quote",
          },
        },
      ],
      payment_method_types: ["card", "afterpay_clearpay"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${headersList.get("origin")}/thank-you`,
      cancel_url: `${headersList.get("origin")}/cart`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Error creating checkout session" });
  }
}
