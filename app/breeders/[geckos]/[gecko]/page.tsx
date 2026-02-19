import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import GeckoListingClient, { GeckoListingData } from './GeckoListingClient';

export const revalidate = 300;

const VALID_GECKO_GROUPS = [
  'malecrestedgeckos',
  'femalecrestedgeckos',
  'malegargoylegeckos',
  'femalegargoylegeckos',
  'malechahouageckos',
  'femalechahouageckos',
] as const;

type GeckoGroup = (typeof VALID_GECKO_GROUPS)[number];

const selectFields = {
  id: true,
  name: true,
  price: true,
  oldprice: true,
  description: true,
  stock: true,
  images: true,
  issale: true,
} as const;

function normalizeListing(listing: Record<string, unknown> | null): GeckoListingData | null {
  if (!listing) {
    return null;
  }

  const record = listing as Record<string, unknown>;
  const images = Array.isArray(record.images) ? (record.images as string[]) : [];

  const priceidValue = 'priceid' in record ? (record as { priceid?: unknown }).priceid : undefined;
  const stripeidValue = 'stripeid' in record ? (record as { stripeid?: unknown }).stripeid : undefined;

  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    price: String(record.price ?? ''),
    oldprice: record.oldprice ? String(record.oldprice) : undefined,
    description: String(record.description ?? ''),
    stock: String(record.stock ?? ''),
    images,
    issale: String(record.issale ?? ''),
    priceid:
      typeof priceidValue === 'string'
        ? priceidValue
        : priceidValue != null
        ? String(priceidValue)
        : undefined,
    stripeid:
      typeof stripeidValue === 'string'
        ? stripeidValue
        : stripeidValue != null
        ? String(stripeidValue)
        : undefined,
  };
}

async function getListing(group: GeckoGroup, id: string): Promise<GeckoListingData | null> {
  switch (group) {
    case 'malecrestedgeckos': {
      const listing = await prisma.malecrestedgeckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    case 'femalecrestedgeckos': {
      const listing = await prisma.femalecrestedgeckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    case 'malegargoylegeckos': {
      const listing = await prisma.malegargoylegeckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    case 'femalegargoylegeckos': {
      const listing = await prisma.femalegargoylegeckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    case 'malechahouageckos': {
      const listing = await prisma.malechahouageckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    case 'femalechahouageckos': {
      const listing = await prisma.femalechahouageckos.findUnique({
        where: { id },
        select: selectFields,
      });
      return normalizeListing(listing);
    }
    default:
      return null;
  }
}

export default async function GeckoListingPage({
  params,
}: {
  params: { geckos: string; gecko: string };
}) {
  const { geckos, gecko } = await params;

  const group = geckos.toLowerCase();
  if (!VALID_GECKO_GROUPS.includes(group as GeckoGroup)) {
    notFound();
  }

  const [, idPart] = gecko.split('-');
  if (!idPart) {
    notFound();
  }

  const listing = await getListing(group as GeckoGroup, idPart);
  if (!listing) {
    notFound();
  }

  return <GeckoListingClient page={group} initialData={listing} />;
}
