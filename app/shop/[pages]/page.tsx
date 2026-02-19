import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import ShopPageClient, { ShopPageProduct } from './ShopPageClient';

export const revalidate = 300;

const VALID_PAGES = ['availability', 'isopods', 'plants', 'prints'] as const;

type PageKey = (typeof VALID_PAGES)[number];

export async function generateStaticParams() {
  return VALID_PAGES.map((page) => ({ pages: page }));
}

async function getProducts(page: string): Promise<ShopPageProduct[]> {
  const normalizedPage = page.toLowerCase() as PageKey;

  switch (normalizedPage) {
    case 'availability': {
      const products = await prisma.availability.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'isopods': {
      const products = await prisma.isopods.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'plants': {
      const products = await prisma.plants.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    case 'prints': {
      const products = await prisma.prints.findMany({
        select: selectFields,
        orderBy: { id: 'desc' },
      });
      return normalizeProducts(products);
    }
    default:
      notFound();
  }
}

const selectFields = {
  id: true,
  name: true,
  price: true,
  issale: true,
  oldprice: true,
  description: true,
  stock: true,
  images: true,
  customOptions: true,
} as const;

function normalizeProducts(products: Array<Record<string, unknown>>): ShopPageProduct[] {
  return products.map((product) => {
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    const customOptions = Array.isArray(product.customOptions)
      ? (product.customOptions as ShopPageProduct['customOptions'])
      : [];

    return {
      id: String(product.id ?? ''),
      name: String(product.name ?? ''),
      price: String(product.price ?? ''),
      oldprice: product.oldprice ? String(product.oldprice) : undefined,
      description: String(product.description ?? ''),
      stock: String(product.stock ?? ''),
      images,
      issale: String(product.issale ?? ''),
      customOptions,
    };
  });
}

export default async function Page({ params }: { params: { pages: string } }) {
  const { pages } = await params;

  const cards = await getProducts(pages);

  if (!cards) {
    notFound();
  }

  return <ShopPageClient pages={pages} initialCards={cards} />;
}
