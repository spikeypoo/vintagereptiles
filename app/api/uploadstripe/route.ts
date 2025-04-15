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


export async function POST(request: Request){
  const files = await request.formData()

  stripe.products.create({
    name: files.name,
    images: [files.image],
    shippable: true,
  })
}