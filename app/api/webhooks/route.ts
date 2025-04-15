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
import { headers } from "next/headers";


export async function POST(request: Request){
    const signature = headers().get("stripe-signature");
    const body = await request.text();
    const jsonBody = await JSON.parse(body);
    const client = await connect;
    
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === "checkout.session.completed") {
      const lineItems = await (await stripe.checkout.sessions.listLineItems(jsonBody.data.object.id))
      const lines = lineItems.data
      let selected = ""
      console.log("beginning stock fix");

      for (let i = 0; i < lines.length; i++)
      {
        console.log("entered loop");
        let quantity = lines[i].quantity
        let currentQuantity = 0;
        let availabilitycheck = await client.db("Products").collection("Availability").find({"priceid": lines[i].price?.id}).toArray()
        let plantscheck = await client.db("Products").collection("Plants").find({"priceid": lines[i].price?.id}).toArray()
        let printscheck = await client.db("Products").collection("Prints").find({"priceid": lines[i].price?.id}).toArray()

        // console.log(printscheck + " for prints")
        // console.log(plantscheck + " for plants")
        // console.log(availabilitycheck + " for geckos")
        // console.log(printscheck.length)
        // console.log(printscheck.length != 0)

        if (availabilitycheck.length != 0)
        {
            client.db("Products").collection("Availability").findOneAndUpdate({"priceid": lines[i].price?.id}, {$set: { "stock": String((parseInt(availabilitycheck[0].stock)) - quantity)}})
        }
        else if (plantscheck.length != 0)
        {
            client.db("Products").collection("Plants").findOneAndUpdate({"priceid": lines[i].price?.id}, {$set: { "stock": String((parseInt(plantscheck[0].stock)) - quantity)}})
        }
        else if (printscheck.length != 0)
        {
          console.log("updating prints stock for item");
            client.db("Products").collection("Prints").findOneAndUpdate({"priceid": lines[i].price?.id}, {$set: { "stock": String((parseInt(printscheck[0].stock)) - quantity)}})
        }
      }
    }

    return new Response("Success", {status: 200})
}