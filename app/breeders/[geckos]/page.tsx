import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import BreedersPageClient, { BreederCard } from './BreedersPageClient';

export const revalidate = 300;

const VALID_GECKOS = [
  'malecrestedgeckos',
  'femalecrestedgeckos',
  'malegargoylegeckos',
  'femalegargoylegeckos',
  'malechahouageckos',
  'femalechahouageckos',
] as const;

type GeckoKey = (typeof VALID_GECKOS)[number];

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

export async function generateStaticParams() {
  return VALID_GECKOS.map((geckos) => ({ geckos }));
}

function normalizeProducts(products: Array<Record<string, unknown>>): BreederCard[] {
  return products.map((product) => {
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];

    return {
      id: String(product.id ?? ''),
      name: String(product.name ?? ''),
      price: String(product.price ?? ''),
      oldprice: product.oldprice ? String(product.oldprice) : undefined,
      description: String(product.description ?? ''),
      stock: String(product.stock ?? ''),
      images,
      issale: String(product.issale ?? ''),
    };
  });
}

async function getProducts(geckos: GeckoKey): Promise<BreederCard[]> {
  switch (geckos) {
    case 'malecrestedgeckos': {
      const products = await prisma.malecrestedgeckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'femalecrestedgeckos': {
      const products = await prisma.femalecrestedgeckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'malegargoylegeckos': {
      const products = await prisma.malegargoylegeckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'femalegargoylegeckos': {
      const products = await prisma.femalegargoylegeckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'malechahouageckos': {
      const products = await prisma.malechahouageckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'femalechahouageckos': {
      const products = await prisma.femalechahouageckos.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    default:
      notFound();
  }
}

export default async function BreedersPage({ params }: { params: { geckos: string } }) {

  const { geckos } = await params;
  
  const geckoss = geckos.toLowerCase();
  if (!VALID_GECKOS.includes(geckoss as GeckoKey)) {
    notFound();
  }

  const cards = await getProducts(geckoss as GeckoKey);

  return <BreedersPageClient geckos={geckoss} initialCards={cards} />;
}
