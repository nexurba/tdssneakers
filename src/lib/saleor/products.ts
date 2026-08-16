import { Product } from "@/data/products";
import { saleorConfig } from "./config";
import { saleorFetch } from "./client";
import { PRODUCTS_QUERY, SHOP_QUERY } from "./queries";

// ---- Saleor GraphQL response shapes (only the fields we query) ----

interface SaleorMoney {
  amount: number;
  currency: string;
}

interface SaleorProductNode {
  id: string;
  name: string;
  slug: string;
  category: { name: string; slug: string } | null;
  thumbnail: { url: string; alt: string | null } | null;
  media: { url: string; alt: string | null }[];
  variants: { id: string; name: string }[] | null;
  attributes: {
    attribute: { name: string; slug: string };
    values: { name: string }[];
  }[];
  pricing: {
    priceRange: {
      start: { gross: SaleorMoney } | null;
    } | null;
  } | null;
}

interface ProductsQueryResult {
  products: {
    edges: { node: SaleorProductNode }[];
  } | null;
}

interface ShopQueryResult {
  shop: { name: string } | null;
}

// ---- Mapping helpers ----

const APPAREL_KEYWORDS = [
  "hoodie",
  "shirt",
  "tee",
  "t-shirt",
  "sweat",
  "jacket",
  "pant",
  "jogger",
  "clothing",
  "apparel",
  "vetement",
  "vêtement",
  "juice",
  "grocer",
];

/**
 * Turn a Saleor base64 global ID / slug into a stable numeric id
 * so it fits the app's existing Product interface.
 */
function toNumericId(saleorId: string): number {
  let hash = 0;
  for (let i = 0; i < saleorId.length; i++) {
    hash = (hash << 5) - hash + saleorId.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash);
}

function inferCategory(node: SaleorProductNode): Product["category"] {
  const haystack = `${node.category?.name ?? ""} ${node.category?.slug ?? ""}`.toLowerCase();
  return APPAREL_KEYWORDS.some((kw) => haystack.includes(kw))
    ? "vetements"
    : "sneakers";
}

function extractColor(node: SaleorProductNode): string {
  const colorAttr = node.attributes.find((a) =>
    ["color", "couleur", "colour"].includes(a.attribute.slug.toLowerCase())
  );
  return colorAttr?.values[0]?.name ?? "";
}

function extractSizes(node: SaleorProductNode): string[] {
  // Prefer a "size" attribute, then variant names, then a sensible default.
  const sizeAttr = node.attributes.find((a) =>
    ["size", "taille"].includes(a.attribute.slug.toLowerCase())
  );
  if (sizeAttr && sizeAttr.values.length > 0) {
    return sizeAttr.values.map((v) => v.name);
  }
  const variantNames = (node.variants ?? [])
    .map((v) => v.name)
    .filter((n) => n && n.length <= 4);
  if (variantNames.length > 0) {
    return variantNames;
  }
  return ["S", "M", "L", "XL"];
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=600&fit=crop";

export function mapSaleorProduct(node: SaleorProductNode, index: number): Product {
  const price = node.pricing?.priceRange?.start?.gross?.amount ?? 0;
  return {
    id: toNumericId(node.id),
    name: node.name,
    variant: node.category?.name ?? "Saleor",
    price: Math.round(price),
    image: node.thumbnail?.url ?? node.media[0]?.url ?? PLACEHOLDER_IMAGE,
    sizes: extractSizes(node),
    category: inferCategory(node),
    color: extractColor(node),
    isNew: index < 4,
    isBestSeller: index >= 4 && index < 10,
  };
}

// ---- Public API ----

export async function fetchSaleorProducts(first = 24): Promise<Product[]> {
  const data = await saleorFetch<ProductsQueryResult>({
    query: PRODUCTS_QUERY,
    variables: { channel: saleorConfig.channel, first },
  });

  const edges = data.products?.edges ?? [];
  return edges.map((edge, i) => mapSaleorProduct(edge.node, i));
}

export async function fetchSaleorShopName(): Promise<string | null> {
  const data = await saleorFetch<ShopQueryResult>({ query: SHOP_QUERY });
  return data.shop?.name ?? null;
}
