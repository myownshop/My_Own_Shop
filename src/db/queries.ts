import { db } from './index.ts';
import { users, merchants, products, ibos, iboListings, agents, orders, ledger, kycSubmissions, platformConfig, wishlists } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME);
}

async function withDbFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallback;
  }
  try {
    return await operation();
  } catch (firstError: any) {
    const msg = String(firstError?.message || firstError?.cause?.message || '');
    const isTransient =
      msg.includes('Connection terminated') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('timeout') ||
      msg.includes('terminating connection');

    if (isTransient) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return await operation();
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// 1. User Queries
export async function getOrCreateUser(uid: string, email: string, name: string = 'User', role: string = 'customer') {
  const fallbackUser = {
    uid,
    email,
    name,
    role,
    entityId: null,
    tokenVerified: true,
    createdAt: new Date(),
  };

  return withDbFallback(async () => {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        name,
        role,
        tokenVerified: true,
      })
      .onConflictDoNothing()
      .returning();
    return inserted[0] || fallbackUser;
  }, fallbackUser);
}

// 2. Product Queries
export async function getDbProducts() {
  return withDbFallback(async () => {
    return await db.select().from(products);
  }, []);
}

export async function insertDbProduct(productData: typeof products.$inferInsert) {
  const fallbackProduct = {
    ...productData,
    vatIncluded: productData.vatIncluded ?? true,
    vatRate: productData.vatRate ?? 7,
    fulfillmentType: productData.fulfillmentType ?? 'merchant_held',
    stockQty: productData.stockQty ?? 0,
    imageUrl: productData.imageUrl ?? null,
    isAvailable: productData.isAvailable ?? true,
    createdAt: new Date(),
  };

  return withDbFallback(async () => {
    const inserted = await db.insert(products).values(productData).onConflictDoNothing().returning();
    return inserted[0] || fallbackProduct;
  }, fallbackProduct);
}

// 3. Merchant Queries
export async function getDbMerchants() {
  return withDbFallback(async () => {
    return await db.select().from(merchants);
  }, []);
}

// 4. IBO Queries
export async function getDbIbos() {
  return withDbFallback(async () => {
    return await db.select().from(ibos);
  }, []);
}

export async function getDbIboBySlug(slug: string) {
  return withDbFallback(async () => {
    const rows = await db.select().from(ibos).where(eq(ibos.slug, slug)).limit(1);
    return rows[0] || null;
  }, null);
}

// 5. Orders Queries
export async function getDbOrders() {
  return withDbFallback(async () => {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }, []);
}

export async function insertDbOrder(orderData: typeof orders.$inferInsert) {
  const fallbackOrder = {
    ...orderData,
    agentId: orderData.agentId ?? null,
    agentName: orderData.agentName ?? null,
    qrCodeToken: orderData.qrCodeToken ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return withDbFallback(async () => {
    const inserted = await db.insert(orders).values(orderData).onConflictDoNothing().returning();
    return inserted[0] || fallbackOrder;
  }, fallbackOrder);
}

// 6. Ledger Queries
export async function getDbLedgerEntries() {
  return withDbFallback(async () => {
    return await db.select().from(ledger).orderBy(desc(ledger.timestamp));
  }, []);
}

export async function insertDbLedgerEntry(entryData: typeof ledger.$inferInsert) {
  const fallbackEntry = {
    ...entryData,
    orderId: entryData.orderId ?? null,
    metadata: entryData.metadata ?? null,
    timestamp: new Date(),
  };

  return withDbFallback(async () => {
    const inserted = await db.insert(ledger).values(entryData).onConflictDoNothing().returning();
    return inserted[0] || fallbackEntry;
  }, fallbackEntry);
}

// 7. Customer Wishlist Queries
export async function getDbWishlistByUser(userId: string) {
  return withDbFallback(async () => {
    return await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
  }, []);
}

export async function addDbWishlistItem(userId: string, productId: string) {
  const id = `wish-${userId}-${productId}`;
  const fallbackItem = {
    id,
    userId,
    productId,
    createdAt: new Date(),
  };

  return withDbFallback(async () => {
    const inserted = await db
      .insert(wishlists)
      .values({ id, userId, productId })
      .onConflictDoNothing()
      .returning();
    return inserted[0] || fallbackItem;
  }, fallbackItem);
}

export async function removeDbWishlistItem(userId: string, productId: string) {
  return withDbFallback(async () => {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
    return true;
  }, true);
}

