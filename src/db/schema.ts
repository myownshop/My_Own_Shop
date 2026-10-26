import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID or Unique User ID
  email: text('email').notNull(),
  name: text('name').notNull(),
  username: text('username'),
  phone: text('phone'),
  role: text('role').notNull().default('customer'),
  entityId: text('entity_id'),
  tokenVerified: boolean('token_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Merchants Table
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  businessName: text('business_name').notNull(),
  code: text('code').notNull(),
  referralCode: text('referral_code'),
  tier: text('tier').default('free'),
  isVerified: boolean('is_verified').default(false),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  warehouseAddress: text('warehouse_address'),
  state: text('state'),
  activeProductsCount: integer('active_products_count').default(0),
  totalWholesaleOrdersCompleted: integer('total_wholesale_orders_completed').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Products Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantCode: text('merchant_code').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  merchantBasePrice: integer('merchant_base_price').notNull(),
  vatIncluded: boolean('vat_included').default(false),
  vatRate: integer('vat_rate').default(0),
  fulfillmentType: text('fulfillment_type').default('merchant_held'),
  stockQty: integer('stock_qty').default(0),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. IBO Profiles Table
export const ibos = pgTable('ibos', {
  id: text('id').primaryKey(),
  iboNumber: text('ibo_number').notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  referralCode: text('referral_code').notNull().unique(),
  tier: text('tier').default('free'),
  referredById: text('referred_by_id'),
  storeName: text('store_name'),
  tagline: text('tagline'),
  accentColor: text('accent_color').default('#10b981'),
  supportEmail: text('support_email'),
  supportPhone: text('support_phone'),
  tier1Count: integer('tier1_count').default(0),
  tier2Count: integer('tier2_count').default(0),
  tier3Count: integer('tier3_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. IBO Listings Table
export const iboListings = pgTable('ibo_listings', {
  id: text('id').primaryKey(),
  iboId: text('ibo_id').notNull(),
  productId: text('product_id').notNull(),
  iboMarkup: integer('ibo_markup').default(0),
  finalCustomerPrice: integer('final_customer_price').notNull(),
  isFeaturedInShop: boolean('is_featured_in_shop').default(false),
  displayOrder: integer('display_order').default(0),
});

// 6. Delivery Agents Table
export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  agentNumber: text('agent_number').notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  vehicleType: text('vehicle_type').default('motorcycle'),
  vehiclePlate: text('vehicle_plate'),
  referralCode: text('referral_code').notNull(),
  referredByAgentId: text('referred_by_agent_id'),
  operatingAreas: text('operating_areas'),
  isOnline: boolean('is_online').default(true),
  activeDeliveriesCount: integer('active_deliveries_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryCity: text('delivery_city').notNull(),
  iboId: text('ibo_id').notNull(),
  iboName: text('ibo_name').notNull(),
  merchantId: text('merchant_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  agentId: text('agent_id'),
  agentName: text('agent_name'),
  items: text('items').notNull(), // JSON stringified line items
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull(),
  qrCodeToken: text('qr_code_token'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Double-Entry Append-Only Ledger Table
export const ledger = pgTable('ledger', {
  id: text('id').primaryKey(),
  orderId: text('order_id'),
  transactionType: text('transaction_type').notNull(),
  fromAccount: text('from_account').notNull(),
  toAccount: text('to_account').notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  metadata: text('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 9. KYC Submissions Table
export const kycSubmissions = pgTable('kyc_submissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name'),
  role: text('role').notNull(),
  entityName: text('entity_name').notNull(),
  status: text('status').default('pending'),
  documentType: text('document_type'),
  documentNumber: text('document_number'),
  reviewNotes: text('review_notes'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// 10. Platform Config Table
export const platformConfig = pgTable('platform_config', {
  id: text('id').primaryKey(),
  configJson: text('config_json').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
