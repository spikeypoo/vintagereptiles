import connect from "@/app/utils/startMongo";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { ObjectId } from "bson";

export async function POST(req: NextRequest, res: NextResponse) {
  const headersList = headers();
  const cartDetails = await req.json(); 
  // cartDetails.details => { item1: { product: {...}, stocktrack: {...} }, item2: {...}, ... }

  // We'll build ephemeral line items in this array
  let lineItems = [];

  // Validate stock
  const client = await connect;

  // For each item in cartDetails
  const detailValues = Object.values(cartDetails.details);

  for (let i = 0; i < detailValues.length; i++) {
    const product = detailValues[i].product; 
    const stocktrack = detailValues[i].stocktrack;

    // e.g. product might have { price, quantity, color, ... }
    // stocktrack might have { id, currpage }

    const productId = stocktrack.id;
    const currpage = stocktrack.currpage;
    const quantity = product.quantity || 1;

    // Check DB for stock
    let isExist = await client
      .db("Products")
      .collection(currpage.charAt(0).toUpperCase() + currpage.slice(1))
      .find({ _id: new ObjectId(productId) })
      .toArray();

    if (!isExist[0] || isExist[0].stock < quantity) {
      // Not enough in stock or item not found
      return NextResponse.json({ error: "At least one item isn't in stock!" });
    }
  }

  // If stock is fine, build ephemeral line items
  for (let i = 0; i < detailValues.length; i++) {
    const product = detailValues[i].product; 
    const stocktrack = detailValues[i].stocktrack;

    const quantity = product.quantity || 1;
    const priceNumber = product.price; // numeric price (or string). Convert to cents below
    const color = product.colors || ""; 
    // Adjust the property name based on how you store color in product

    // Set up ephemeral line item
    // If your prices are in CAD, multiply your numeric price by 100
    // to get the amount in cents
    // const unitAmount = Math.round(Number(priceNumber) * 100);
    const unitAmount = (await stripe.prices.retrieve(product.price)).unit_amount;

    // We'll create a line item with ephemeral price_data
    lineItems.push({
      price_data: {
        currency: "cad", // or "usd" if you want
        unit_amount: unitAmount,
        product_data: {
          // The item name (e.g. from DB or from cart)
          name: product.name,
          // You can embed color here if you like
          description: color ? `Color('s): ${color}` : "No colour",
        },
      },
      quantity: quantity,
    });
  }

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
              "Canada MERCHANDISE Shipping. You will be contacted for a quote if your purchase includes a reptile.",
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
              "Canada REPTILE Shipping. You will be contacted for a shipping quote.",
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
