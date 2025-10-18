import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import ListingPageClient, { ListingPageData } from './ListingPageClient';
import connect from '@/app/utils/startMongo';

export const revalidate = 300;

const VALID_PAGES = ['availability', 'isopods', 'plants', 'prints'] as const;

type PageKey = (typeof VALID_PAGES)[number];

type ProductColour = {
  id: string;
  name: string;
  imageUrl: string;
};

function normalizeListing(listing: Record<string, unknown> | null): ListingPageData | null {
  if (!listing) {
    return null;
  }

  const images = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const customOptions = Array.isArray(listing.customOptions)
    ? (listing.customOptions as ListingPageData['customOptions'])
    : [];

  return {
    id: String(listing.id ?? ''),
    name: String(listing.name ?? ''),
    price: String(listing.price ?? ''),
    oldprice: listing.oldprice ? String(listing.oldprice) : undefined,
    description: String(listing.description ?? ''),
    stock: String(listing.stock ?? ''),
    images,
    issale: String(listing.issale ?? ''),
    customOptions,
    priceid: listing.priceid ? String(listing.priceid) : undefined,
    stripeid: listing.stripeid ? String(listing.stripeid) : undefined,
  };
}

async function getProductColours(): Promise<ProductColour[]> {
  try {
    const client = await connect;
    const colours = await client
      .db('Products')
      .collection('ProductColours')
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    return colours.map((colour: any) => ({
      id: colour._id?.toString() ?? '',
      name: colour.name ?? '',
      imageUrl: colour.imageUrl ?? '',
    }));
  } catch (error) {
    console.error('Failed to load product colours', error);
    return [];
  }
}

async function getListing(page: PageKey, id: string) {
  switch (page) {
    case 'availability': {
      const listing = await prisma.availability.findUnique({
        where: { id },
        select: selectAvailabilityFields,
      });
      return normalizeListing(listing);
    }
    case 'isopods': {
      const listing = await prisma.isopods.findUnique({
        where: { id },
        select: selectSharedFields,
      });
      return normalizeListing(listing);
    }
    case 'plants': {
      const listing = await prisma.plants.findUnique({
        where: { id },
        select: selectSharedFields,
      });
      return normalizeListing(listing);
    }
    case 'prints': {
      const listing = await prisma.prints.findUnique({
        where: { id },
        select: selectPrintFields,
      });
      return normalizeListing(listing);
    }
    default:
      return null;
  }
}

const selectSharedFields = {
  id: true,
  name: true,
  price: true,
  oldprice: true,
  description: true,
  stock: true,
  images: true,
  issale: true,
  customOptions: true,
} as const;

const selectAvailabilityFields = {
  ...selectSharedFields,
  priceid: true,
  stripeid: true,
} as const;

const selectPrintFields = {
  ...selectSharedFields,
  priceid: true,
  stripeid: true,
} as const;

export default async function ListingPage({
  params,
}: {
  params: { pages: string; listing: string };
}) {
  const pageParam = params.pages.toLowerCase();
  if (!VALID_PAGES.includes(pageParam as PageKey)) {
    notFound();
  }

  const [, idPart] = params.listing.split('-');
  if (!idPart) {
    notFound();
  }

  const data = await getListing(pageParam as PageKey, idPart);
  if (!data) {
    notFound();
  }

  const productColours = pageParam === 'prints' ? await getProductColours() : [];

  return (
    <ListingPageClient
      page={pageParam}
      listingId={idPart}
      initialData={data}
      productColours={productColours}
    />
  );
}
