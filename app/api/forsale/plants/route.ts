import connect from "@/app/utils/startMongo";
import { S3Client, ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest } from 'next/server';
import { ObjectId } from 'bson';
import { prisma } from "@/app/lib/prisma";
import stripe from "@/app/lib/stripe";

export async function GET() {
  const time = Date.now();
  
  // We'll assume your DB has a column "images" which is an array of strings (URLs).
  const cursor = await prisma.plants.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      issale: true,
      oldprice: true,
      description: true,
      stock: true,
      images: true, // array of image URLs
      customOptions: true,
    },
    orderBy: { id: 'desc' },
  });
  const newvar = (Date.now() - time);

  return Response.json(cursor);
}

export async function POST(request: Request) {
  // 1) Get form data
  const form = await request.formData();

  // 2) Parse the images array from JSON (sent as form field "images")
  let images = [];
  const imagesJson = form.get("images");
  if (imagesJson) {
    try {
      images = JSON.parse(imagesJson.toString()); // e.g. ["https://...","https://..."]
    } catch (e) {
      console.error("Failed to parse images JSON:", e);
    }
  }

  // Parse customOptions
  let customOptions = [];
  const optsJson = form.get("customOptions");
  if (optsJson) {
    try { customOptions = JSON.parse(optsJson.toString()); }
    catch (e) { console.error("Invalid customOptions JSON", e); }
  }

  // 3) Build initial doc
  const doc = {
    name: form.get("name"),
    price: form.get("price"),
    description: form.get("description"),
    issale: form.get("issale"),
    oldprice: form.get("oldprice"),
    stock: form.get("stock"),
    images: images,  // store all images in an array
  };

  // 4) Connect + insert into MongoDB first
  const client = await connect;
  const result = await client.db("Products").collection("Plants").insertOne(doc);

  // 5) Create Stripe product + price
  if (doc.price && doc.price !== "") {
    const mainImage = images.length > 0 ? images[0] : "";

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: doc.name?.toString() || "Unnamed",
      images: mainImage ? [mainImage] : [],
      shippable: true,
    });

    const pricedOptions = await Promise.all(
      customOptions.map(async opt => {
        // parse user‐entered price
        const cents = Math.round(Number(opt.price) * 100);
        const p = await stripe.prices.create({
          currency:    "cad",
          unit_amount: cents,
          product:     stripeProduct.id,
        });
        return {
          label:      opt.label,
          imageIndex: opt.imageIndex,
          price: opt.price,
          priceid:    p.id,     // <-- store the Stripe Price ID
        };
      })
    );

    // Create Stripe price
    const stripePrice = await stripe.prices.create({
      currency: "cad",
      unit_amount: Number(doc.price) * 100,
      product: stripeProduct.id,
    });

    // Update MongoDB document with stripeid and priceid
    await client.db("Products").collection("Plants").updateOne(
      { _id: result.insertedId },
      { $set: { stripeid: stripeProduct.id, priceid: stripePrice.id, customOptions: pricedOptions} }
    );

    // Set default price on product
    await stripe.products.update(stripeProduct.id, {
      default_price: stripePrice.id,
    });
  }

  return Response.json({ message: "successfully uploaded the gecko" });
}

export async function PUT(request: Request) {
  // 1) Parse form data
  const form = await request.formData();
  const id = form.get("id2") as string;

  // 2) Parse the images array
  let images = [];
  const imagesJson = form.get("images");
  if (imagesJson) {
    try {
      images = JSON.parse(imagesJson.toString());
    } catch (e) {
      console.error("Failed to parse images JSON in PUT:", e);
    }
  }

  // Parse customOptions
  let customOptions = [];
  const optsJson = form.get("customOptions");
  if (optsJson) {
    try { customOptions = JSON.parse(optsJson.toString()); }
    catch (e) { console.error("Invalid customOptions JSON in PUT", e); }
  }

  // 3) Build update fields
  const updateDoc: any = {
    name: form.get("name"),
    price: form.get("price"),
    description: form.get("description"),
    issale: form.get("issale"),
    oldprice: form.get("oldprice"),
    stock: form.get("stock"),
    images: images, // overwrite the images array
  };

  // 4) Update DB
  const client = await connect;
  await client.db("Products").collection("Plants").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc }
  );

  // 5) Possibly handle Stripe logic
  //    We'll find the updated doc so we can get the first image for Stripe
  const isExist = await client.db("Products").collection("Plants").findOne({ _id: new ObjectId(id) });
  if (!isExist) {
    return Response.json({ message: "document not found" });
  }

  const mainImage = Array.isArray(isExist.images) && isExist.images.length > 0
    ? isExist.images[0]
    : ""; // first image if any

  // If there's a price and no stripeid, create a new product
  if (isExist.price && isExist.price !== "" && !("stripeid" in isExist)) {
    const res = await stripe.products.create({
      name: isExist.name,
      images: mainImage ? [mainImage] : [],
      shippable: true,
    });

    await client.db("Products").collection("Plants").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { stripeid: res.id } }
    );

    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: Number(isExist.price) * 100,
      product: res.id,
    });

    await client.db("Products").collection("Plants").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { priceid: price.id } }
    );

    await stripe.products.update(res.id, {
      default_price: price.id,
    });
  }
  // otherwise update existing product
  else if (isExist.price && isExist.price !== "" && isExist.stripeid) {
    const oldPriceId = isExist.priceid;
    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: Number(isExist.price) * 100,
      product: isExist.stripeid,
    });

    await stripe.products.update(isExist.stripeid, {
      name: isExist.name,
      images: mainImage ? [mainImage] : [],
      default_price: price.id,
    });

    // Deactivate old price
    if (oldPriceId) {
      await stripe.prices.update(oldPriceId, {
        active: false,
      });
    }

    const newPricedOptions = await Promise.all(
      customOptions.map(async opt => {
        const cents = Math.round(Number(opt.price) * 100);
        const p = await stripe.prices.create({
          currency:    "cad",
          unit_amount: cents,
          product:     isExist.stripeid,
        });
        return {
          label:      opt.label,
          imageIndex: opt.imageIndex,
          price: opt.price,
          priceid:    p.id,
        };
      })
    );
  
    // 5) Overwrite mongo’s customOptions with the new price‐ID’d list
    await client.db("Products").collection("Plants").updateOne(
      { _id: new ObjectId(id) },
      { $set: { customOptions: newPricedOptions } }
    );

    await client.db("Products").collection("Plants").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { priceid: price.id } }
    );
  }

  return Response.json({ message: "successfully edited the gecko" });
}

export async function DELETE(request: Request) {
  const client = await connect;
  const form = await request.formData();
  const id = form.get("id") as string;
  
  await client.db("Products").collection("Plants").findOneAndDelete({
    _id: new ObjectId(id),
  });

  return Response.json({ message: "successfully removed the gecko" });
}
