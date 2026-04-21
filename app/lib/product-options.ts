export type ProductOptionLike = {
  label?: string;
  groupName?: string;
  isColourOption?: boolean;
  stock?: string | number | null;
};

export type StandardOptionGroup<T extends ProductOptionLike> = {
  title: string;
  options: T[];
};

export function parseStockCount(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(parsed, 0);
}

export function getStandardOptionGroups<T extends ProductOptionLike>(
  customOptions?: T[] | null
) {
  if (!Array.isArray(customOptions)) {
    return [] as StandardOptionGroup<T>[];
  }

  const order: string[] = [];
  const map = new Map<string, StandardOptionGroup<T>>();

  customOptions.forEach((option) => {
    if (option?.isColourOption) {
      return;
    }

    const title = option?.groupName || option?.label || "Option";
    const key = `standard:${title}`;

    if (!map.has(key)) {
      order.push(key);
      map.set(key, { title, options: [] });
    }

    map.get(key)!.options.push(option);
  });

  return order.map((key) => map.get(key)!);
}

export function getOptionStock(
  option: ProductOptionLike | null | undefined,
  fallbackStock: unknown
) {
  if (option && option.stock !== undefined && option.stock !== null && option.stock !== "") {
    return parseStockCount(option.stock, 0);
  }

  return parseStockCount(fallbackStock, 0);
}

export function getListingAvailability(
  customOptions: ProductOptionLike[] | null | undefined,
  fallbackStock: unknown
) {
  const groups = getStandardOptionGroups(customOptions);

  if (groups.length === 0) {
    const stock = parseStockCount(fallbackStock, 0);
    return {
      usesOptionStock: false,
      inStock: stock > 0,
      stock,
    };
  }

  return {
    usesOptionStock: true,
    inStock: groups.every((group) =>
      group.options.some((option) => getOptionStock(option, fallbackStock) > 0)
    ),
    stock: null as number | null,
  };
}

export function getSelectedOptionAvailability<T extends ProductOptionLike>(
  customOptions: T[] | null | undefined,
  chosenOptions: Record<string, string> | undefined,
  fallbackStock: unknown
) {
  const groups = getStandardOptionGroups(customOptions);

  if (groups.length === 0) {
    const stock = parseStockCount(fallbackStock, 0);
    return {
      usesOptionStock: false,
      stock,
      groups,
      matchedOptions: [] as T[],
      missingSelections: [] as string[],
    };
  }

  const matchedOptions: T[] = [];
  const missingSelections: string[] = [];

  groups.forEach((group) => {
    const selectedLabel = chosenOptions?.[group.title];
    if (!selectedLabel) {
      missingSelections.push(group.title);
      return;
    }

    const match = group.options.find((option) => option?.label === selectedLabel);
    if (!match) {
      missingSelections.push(group.title);
      return;
    }

    matchedOptions.push(match);
  });

  const stock =
    matchedOptions.length > 0
      ? Math.min(...matchedOptions.map((option) => getOptionStock(option, fallbackStock)))
      : 0;

  return {
    usesOptionStock: true,
    stock,
    groups,
    matchedOptions,
    missingSelections,
  };
}
