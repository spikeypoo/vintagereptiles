import connect from "@/app/utils/startMongo"
import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { type NextRequest } from 'next/server'
import { stringify } from "querystring";
import { ObjectId } from 'bson';

    
export async function POST(request: Request) {
  const client = await connect

  const files = await request.formData()
  const listingId = files.get("id") as string
  let sitePage = files.get("sitePage") as string
  sitePage = sitePage.charAt(0).toUpperCase() + sitePage.slice(1)
  const cursor = await client.db("Products").collection(sitePage).findOne({"_id": new ObjectId(listingId)});
  return Response.json(cursor)
}