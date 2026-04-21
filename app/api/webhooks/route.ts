import connect from "@/app/utils/startMongo";
import stripe from "@/app/lib/stripe";
import { mongoDbName } from "@/app/lib/db-server";
import { getStripeWebhookSecret } from "@/app/lib/stripe-server";
import { headers } from "next/headers";
import { ObjectId } from "bson";
import { getSelectedOptionAvailability, getStandardOptionGroups, parseStockCount } from "@/app/lib/product-options";

type CheckoutStockReservation = {
  sessionId: string;
  items?: {
    collectionName: string;
    listingId: string;
    quantity: number;
    chosenOptions?: Record<string, string>;
  }[];
  createdAt?: Date;
};

function applyStockDeduction(currentRecord: any, quantity: number, chosenOptions?: Record<string, string>) {
  const safeQty = Math.max(Number(quantity) || 0, 0);
  if (safeQty <= 0) {
    return null;
  }

  const standardGroups = getStandardOptionGroups(currentRecord?.customOptions);
  if (standardGroups.length === 0) {
    return {
      stock: String(Math.max(parseStockCount(currentRecord?.stock, 0) - safeQty, 0)),
    };
  }

  const selectedAvailability = getSelectedOptionAvailability(
    currentRecord?.customOptions,
    chosenOptions,
    currentRecord?.stock
  );

  if (
    selectedAvailability.matchedOptions.length === 0 ||
    selectedAvailability.missingSelections.length > 0
  ) {
    return {
      stock: String(Math.max(parseStockCount(currentRecord?.stock, 0) - safeQty, 0)),
    };
  }

  const nextCustomOptions = Array.isArray(currentRecord?.customOptions)
    ? currentRecord.customOptions.map((option: any) => {
        if (option?.isColourOption) {
          return option;
        }

        const groupName = option?.groupName || option?.label || "Option";
        const selectedLabel = chosenOptions?.[groupName];
        if (!selectedLabel || option?.label !== selectedLabel) {
          return option;
        }

        const currentOptionStock =
          option?.stock !== undefined && option?.stock !== null && option?.stock !== ""
            ? parseStockCount(option.stock, 0)
            : parseStockCount(currentRecord?.stock, 0);

        return {
          ...option,
          stock: String(Math.max(currentOptionStock - safeQty, 0)),
        };
      })
    : currentRecord?.customOptions;

  return {
    customOptions: nextCustomOptions,
  };
}

export async function POST(request: Request) {
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const client = await connect;
    const reservation = await client
      .db(mongoDbName)
      .collection<CheckoutStockReservation>("CheckoutStockReservations")
      .findOne({ sessionId: session.id });

    if (reservation?.items?.length) {
      for (const item of reservation.items) {
        if (!item?.collectionName || !item?.listingId) {
          continue;
        }

        let listingObjectId: ObjectId;
        try {
          listingObjectId = new ObjectId(item.listingId);
        } catch {
          continue;
        }

        const currentRecord = await client
          .db(mongoDbName)
          .collection(item.collectionName)
          .findOne({ _id: listingObjectId });

        if (!currentRecord) {
          continue;
        }

        const nextValues = applyStockDeduction(
          currentRecord,
          item.quantity,
          item.chosenOptions
        );

        if (!nextValues) {
          continue;
        }

        await client
          .db(mongoDbName)
          .collection(item.collectionName)
          .updateOne({ _id: listingObjectId }, { $set: nextValues });
      }

      await client
        .db(mongoDbName)
        .collection<CheckoutStockReservation>("CheckoutStockReservations")
        .deleteOne({ sessionId: session.id });
    }
  }

  return new Response("Success", { status: 200 });
}
