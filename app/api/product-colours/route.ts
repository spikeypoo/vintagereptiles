import connect from "@/app/utils/startMongo";
import { ObjectId } from "mongodb";

type ProductColourDocument = {
  _id: ObjectId;
  name: string;
  imageUrl: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "ProductColours";

function normalizeColour(doc: ProductColourDocument) {
  return {
    id: doc._id.toString(),
    name: doc.name ?? "",
    imageUrl: doc.imageUrl ?? "",
    sortOrder: doc.sortOrder ?? doc.createdAt?.getTime() ?? 0,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export async function GET() {
  try {
    const client = await connect;
    const cursor = client
      .db("Products")
      .collection<ProductColourDocument>(COLLECTION_NAME)
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 });

    const colours = await cursor.toArray();

    return Response.json(colours.map(normalizeColour));
  } catch (error) {
    console.error("[ProductColours][GET]", error);
    return Response.json(
      { message: "Failed to load product colours" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await connect;
    const body = await request.json();
    const { name, imageUrl, sortOrder } = body ?? {};

    if (!name || !imageUrl) {
      return Response.json(
        { message: "Missing required fields: name, imageUrl" },
        { status: 400 }
      );
    }

    const now = new Date();

    const insertDoc = {
      name,
      imageUrl,
      sortOrder:
        typeof sortOrder === "number" ? sortOrder : now.getTime(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await client
      .db("Products")
      .collection(COLLECTION_NAME)
      .insertOne(insertDoc);

    return Response.json({
      id: result.insertedId.toString(),
      ...insertDoc,
    });
  } catch (error) {
    console.error("[ProductColours][POST]", error);
    return Response.json(
      { message: "Failed to create product colour" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const client = await connect;
    const body = await request.json();
    const { id, name, imageUrl, sortOrder } = body ?? {};

    if (!id) {
      return Response.json(
        { message: "Missing required field: id" },
        { status: 400 }
      );
    }

    const updateDoc: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof name === "string") {
      updateDoc.name = name;
    }
    if (typeof imageUrl === "string" && imageUrl.length > 0) {
      updateDoc.imageUrl = imageUrl;
    }
    if (typeof sortOrder === "number") {
      updateDoc.sortOrder = sortOrder;
    }

    const result = await client
      .db("Products")
      .collection<ProductColourDocument>(COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: "after" }
      );

    if (!result.value) {
      return Response.json({ message: "Colour not found" }, { status: 404 });
    }

    return Response.json(normalizeColour(result.value));
  } catch (error) {
    console.error("[ProductColours][PUT]", error);
    return Response.json(
      { message: "Failed to update product colour" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await connect;
    const body = await request.json();
    const { id } = body ?? {};

    if (!id) {
      return Response.json(
        { message: "Missing required field: id" },
        { status: 400 }
      );
    }

    const result = await client
      .db("Products")
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ message: "Colour not found" }, { status: 404 });
    }

    return Response.json({ id });
  } catch (error) {
    console.error("[ProductColours][DELETE]", error);
    return Response.json(
      { message: "Failed to delete product colour" },
      { status: 500 }
    );
  }
}
