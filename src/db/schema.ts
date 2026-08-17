import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---- Enums -------------------------------------------------------------------

export const productCategoryEnum = pgEnum("product_category", [
  "sneakers",
  "vetements",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const customerSegmentEnum = pgEnum("customer_segment", [
  "nouveau",
  "recurrent",
  "vip",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

// ---- Products ----------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    variant: text("variant").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    category: productCategoryEnum("category").notNull().default("sneakers"),
    color: text("color").notNull().default(""),
    image: text("image").notNull(),
    images: jsonb("images").$type<string[]>().default([]),
    isNew: boolean("is_new").default(false),
    isBestSeller: boolean("is_best_seller").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
    categoryIdx: index("products_category_idx").on(t.category),
  })
);

// ---- Variants (size + stock) -------------------------------------------------

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
    sku: text("sku"),
  },
  (t) => ({
    productSizeIdx: uniqueIndex("variant_product_size_idx").on(
      t.productId,
      t.size
    ),
  })
);

// ---- Customers (CRM) ---------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    city: text("city"),
    segment: customerSegmentEnum("segment").notNull().default("nouveau"),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: numeric("total_spent", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("customers_email_idx").on(t.email),
  })
);

// ---- Orders ------------------------------------------------------------------

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    email: text("email").notNull(),
    customerName: text("customer_name").notNull(),
    address: text("address"),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    shipping: numeric("shipping", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntent: text("stripe_payment_intent"),
    paid: boolean("paid").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    referenceIdx: uniqueIndex("orders_reference_idx").on(t.reference),
    customerIdx: index("orders_customer_idx").on(t.customerId),
    statusIdx: index("orders_status_idx").on(t.status),
  })
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name").notNull(),
  variant: text("variant"),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// ---- Promotions --------------------------------------------------------------

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    type: discountTypeEnum("type").notNull().default("percentage"),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    minSubtotal: numeric("min_subtotal", { precision: 10, scale: 2 }).default(
      "0"
    ),
    active: boolean("active").notNull().default(true),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex("promotions_code_idx").on(t.code),
  })
);

// ---- Reviews -----------------------------------------------------------------

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---- Relations ---------------------------------------------------------------

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

// ---- Inferred types ----------------------------------------------------------

export type ProductRow = typeof products.$inferSelect;
export type ProductVariantRow = typeof productVariants.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type PromotionRow = typeof promotions.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
