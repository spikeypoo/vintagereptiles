import connect from "@/app/utils/startMongo"
import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type NextRequest } from 'next/server'
import { stringify } from "querystring";
import { ObjectId } from 'bson';

export async function POST(request: Request){
  const files = await request.formData()

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  let filename = files.get("imagename") as string

  const command = new PutObjectCommand({
    Bucket: process.env.AMPLIFY_BUCKET,
    Key: filename,
    ContentType: "image/png"
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return Response.json({ presignedUrl: url });
}