import connect from "@/app/utils/startMongo"
import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { type NextRequest } from 'next/server'
import { stringify } from "querystring";
import { ObjectId } from 'bson';
import { prisma } from "@/app/lib/prisma";
import stripe from "@/app/lib/stripe"

    
export async function GET() {
  const time = Date.now();
  
  const cursor = await prisma.males.findMany({select: {id: true, name: true, price: true, image1: true , issale: true, oldprice: true, description: true, stock: true}, orderBy: {id: 'desc'}})
  const newvar = (Date.now() - time);
  
  return Response.json(cursor);
}

export async function POST(request: Request){
  const files = await request.formData()

  const client = await connect;
  client.db("Products").collection("Males").insertOne({
    name: files.get("name"),
    price: files.get("price"),
    description: files.get("description"),
    image1: files.get("image1"),
    image2: files.get("image2"),
    image3: files.get("image3"),
    image4: files.get("image4"),
    issale: files.get("issale"),
    oldprice: files.get("oldprice"),
    stock: files.get("stock")
  })
  return Response.json({message: "successfully uploaded the gecko"})
}

export async function PUT(request: Request){
  const files = await request.formData()
  const url1 = files.get("image1")
  const url2 = files.get("image2")
  const url3 = files.get("image3")
  const url4 = files.get("image4")

  const client = await connect;

  const id = files.get("id2") as string
  if (await url1 != "")
    {
      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "image1": await url1 }})
    }
  if (await url2 != "")
    {
      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "image2": await url2 }})
    }
  if (await url3 != "")
    {
      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "image3": await url3 }})
    }
  if (await url4 != "")
    {
      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "image4": await url4 }})
    }

    client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "name": files.get("name"), "price": files.get("price"), "description": files.get("description"), "issale" : files.get("issale"), "oldprice" : files.get("oldprice"), "stock" : files.get("stock")}})

    let isExist = await client.db("Products").collection("Males").find({"_id": new ObjectId(id)}).toArray()
    const image = isExist[0].image1 as string
    if (isExist[0].price != "" && "stripeid" in isExist[0] == false)
    {
      const res = await stripe.products.create({
        name: files.get("name"),
        images: [image],
        shippable: true,
      })

      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "stripeid": res.id }})

      const price = await stripe.prices.create({
        currency: "cad",
        unit_amount: files.get("price") * 100,
        product: res.id
      })

      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "priceid": price.id }})

      const newproduct = await stripe.products.update(res.id, {
        default_price: price.id
      })
    }
    else if (isExist[0].price != "")
    {
      const old = isExist[0].priceid
      const price = await stripe.prices.create({
        currency: "cad",
        unit_amount: files.get("price") * 100,
        product: isExist[0].stripeid
      })

      await stripe.products.update(isExist[0].stripeid, {
        name: isExist[0].name,
        images: [isExist[0].image1],
        default_price: price.id
      })

      stripe.prices.update(isExist[0].priceid, {
        active: false
      })


      client.db("Products").collection("Males").findOneAndUpdate({"_id": new ObjectId(id)}, {$set: { "priceid": price.id }})
    }
  return Response.json({message: "successfully edited the gecko"})
}

export async function DELETE(request: Request)
{
  const client = await connect;
  const files = await request.formData()
  const id = files.get("id") as string
  client.db("Products").collection("Males").findOneAndDelete({"_id": new ObjectId(id)})

  return Response.json({message: "successfully removed the gecko"})
}