/**
 * Domain types for Referral-Driven Marketplace & Logistics Platform
 * Isolated surfaces: Founder/Admin, Merchant, IBO, Delivery Agent, Customer
 */

export type UserRole = 'founder' | 'merchant' | 'ibo' | 'agent' | 'customer';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username: string; // e.g. "amina_crafts", "kalu_logistics"
  phone: string; // e.g. "+2348012345678"
  passwordHash: string;
  role: UserRole;
  entityId?: string; // iboId, merchantId, agentId, or customerId
  tokenVerified: boolean;
  createdAt: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  token: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  // Specific entity references
  merchantId?: string;
  iboId?: string;
  agentId?: string;
  customerId?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  userName?: string;
  role: 'merchant' | 'ibo' | 'agent';
  entityName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType?: string;
  documentNumber?: string;
  documentUrl?: string;
  documents: {
    name: string;
    type: string;
    fileUrl: string;
    verified: boolean;
  }[];
  nationalIdNumber?: string;
  taxId?: string;
  bvnOrBankVerification?: string;
  businessRegistrationNumber?: string;
  reviewNotes?: string;
}

export type FulfillmentType = 'warehouse_deposit' | 'merchant_held';

// §6 Merchant Tiers (Capacity and business tools, never commission access)
export type MerchantTier = 'free' | 'pro' | 'business' | 'enterprise';

export type MerchantKycType = 'sole_proprietor' | 'registered_company';

export interface MerchantProfile {
  id: string;
  userId: string;
  businessName: string;
  merchantCode: string; // e.g., 'MERCH-0012'
  tier: MerchantTier;
  tierActiveUntil?: string;
  kycType: MerchantKycType;
  cacRegistrationNumber?: string;
  tin?: string;
  isKycVerified: boolean;
  contactEmail: string;
  contactPhone: string;
  warehouseAddress: string;
  state: string;
  regulatoryCertifications: {
    type: 'NAFDAC' | 'SON' | 'FOOD_PERMIT' | 'AGRIC_QUARANTINE' | 'IMPORT_LICENSE' | 'OTHER';
    documentNumber: string;
    isVerified: boolean;
    validUntil?: string;
  }[];
  activeProductsCount: number;
  totalWholesaleOrdersCompleted: number;
  code?: string;
  referralCode?: string; // e.g. 'MRC-AGRO-01'
  referredByMerchantId?: string;
  referredMerchantsCount?: number;
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  title: string;
  description: string;
  category: string;
  subCategory: string;
  merchantBasePrice: number; // in NGN (₦)
  vatIncluded: boolean;
  vatRate: number; // e.g., 0.075 for 7.5%
  fulfillmentType: FulfillmentType;
  stockQty: number;
  imageUrl: string;
  isAvailable: boolean;
  boostedUntil?: string;
  createdAt: string;
}

export interface IboListing {
  id: string;
  iboId: string;
  productId: string;
  product: Product;
  iboMarkup: number; // 0 to (merchantBasePrice * 0.5)
  finalCustomerPrice: number; // merchantBasePrice + (vat if any) + iboMarkup
  isFeaturedInShop: boolean;
  displayOrder: number;
}

export type IboCapacityTier = 'free' | 'tier_2' | 'tier_3';

export interface IboProfile {
  id: string;
  iboNumber: string; // Official format: 'IBO-00001245' (§8)
  userId: string;
  name: string;
  slug: string; // Used in /shop/:slug
  referralCode: string; // Used in /join/:referralCode
  tier: IboCapacityTier;
  referredById: string | null; // Permanent referrer of record (Founder if null/root)
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  shopBranding: {
    storeName: string;
    tagline: string;
    accentColor: string;
    logoUrl?: string;
    bannerImageUrl?: string;
    supportEmail: string;
    supportPhone: string;
  };
  selectedMerchantIds: string[]; // Capped by tier
  completedTraining: boolean;
  cosmeticBadges: string[]; // Purely cosmetic, zero cash value!
  isBoostedOnFounderHome: boolean;
  activeBoostPackage?: 'boost_24h' | 'boost_7d' | 'boost_30d';
  boostExpiry?: string;
  acceptedAgreementAt?: string;
}

export type VehicleType = 'bicycle' | 'motorcycle' | 'tricycle' | 'car' | 'van';

export interface DeliveryAgentProfile {
  id: string;
  agentNumber: string; // e.g. 'DEL-0000452'
  userId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  referralCode: string;
  referredByAgentId: string | null; // Agent who introduced this courier (§2)
  tier1AgentCount: number;
  tier2AgentCount: number;
  tier3AgentCount: number;
  operatingAreas: string[];
  isInspectionPassed: boolean;
  inspectionDate?: string;
  currentLocation: {
    lat: number;
    lng: number;
    areaName: string;
  };
  isOnline: boolean;
  isAvailable?: boolean;
  hubCity?: string;
  operatingHubCity?: string;
  status?: 'active' | 'pending' | 'suspended';
  activeDeliveriesCount: number;
}

// §18 Customer Attribution Tracking (90-Day attribution window)
export interface CustomerAttribution {
  id: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  attributedIboId: string;
  attributedIboName?: string;
  attributionSource?: string;
  attributedAt?: string;
  firstOrderAt?: string;
  expiresAt: string; // default: firstOrderAt + 90 days
  ordersCount?: number;
  lifetimeOrdersCount?: number;
  lifetimeGrossValue?: number;
  lastOrderAt?: string;
}

// §15 Merchant Advertising to IBOs
export interface MerchantAdvertisingCampaign {
  id: string;
  merchantId: string;
  merchantName: string;
  campaignTitle?: string;
  headline?: string;
  targetCategory?: string;
  category?: string;
  targetLocations?: string[];
  targetAudience?: string;
  targetIboTier?: 'all' | 'free' | 'growth' | 'scale';
  budgetNgn?: number;
  dailySpendNgn?: number;
  dailyBudget?: number;
  totalBudget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  status: 'active' | 'paused' | 'completed';
  impressionsCount?: number;
  impressions?: number;
  clicksCount?: number;
  clicks?: number;
  curatedByIbosCount?: number;
  iboPickups?: number;
}

// §5 Two-Stage Failed Delivery Dispute Record
export interface FailedDeliveryDispute {
  id: string;
  orderId: string;
  orderNumber: string;
  deliveryFee?: number;
  failureReason: string;
  stage?: 'stage1_applied' | 'stage2_review' | 'resolved';
  standard151520AppliedAt?: string;
  disputeClaimant?: string;
  disputeReason?: string;
  claimedAt?: string;
  adjudicationStatus?: 'pending' | 'adjusted' | 'upheld' | 'dismissed';
  adjudicationNotes?: string;
  resolvedAt?: string;
  // Stage 1 default split applied
  stage1Allocation?: {
    agentAmount: number; // 15%
    platformAmount: number; // 15%
    reserveAmount: number; // 20%
    customerRefundAmount: number; // 50%
  };
  // Stage 2 admin adjudication
  stage2Status?: 'pending_review' | 'upheld_standard' | 'merchant_at_fault' | 'agent_at_fault' | 'resolved';
  adjudicatedFaultParty?: 'customer' | 'merchant' | 'agent' | 'force_majeure';
  adminAdjustmentNotes?: string;
  adjudicatedAt?: string;
}

export type OrderStatus =
  | 'placed'
  | 'dispatched'
  | 'in_transit'
  | 'arrived_at_customer'
  | 'delivered'
  | 'failed_delivery'
  | 'cancelled';

export type PaymentMethod = 'pay_on_delivery' | 'online_paystack' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'held_in_escrow' | 'paid_to_agent' | 'completed' | 'refunded';

export interface OrderItem {
  productId: string;
  productTitle: string;
  merchantId: string;
  merchantName: string;
  merchantBasePrice: number;
  iboMarkup: number;
  unitPrice: number; // base + markup
  quantity: number;
  imageUrl: string;
  fulfillmentType: FulfillmentType;
}

export interface Order {
  id: string;
  orderNumber: string;
  iboId: string;
  iboSlug: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  totalMarkup: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  agentVehicle?: string;
  // Pickup QR Verification (Warehouse / Depot Handover)
  pickupQrToken?: string;
  isPickupConfirmed?: boolean;
  pickedUpAt?: string;
  // Live Map Tracking & Telemetry
  pickupLocation?: {
    lat: number;
    lng: number;
    address: string;
    hubName: string;
  };
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  agentLiveLocation?: {
    lat: number;
    lng: number;
    progressPct: number;
    leg: 'to_pickup' | 'to_delivery' | 'arrived';
    updatedAt: string;
  };
  // Final Delivery QR Confirmation code: single-use, unique to this order
  confirmationQrToken: string;
  qrExpiresAt: string;
  isQrScanned: boolean;
  failureReason?: 'customer_refused' | 'wrong_or_damaged_item' | 'agent_no_show' | 'other';
  agentPayout?: number;
  failureRecoupDetails?: {
    totalRecoup: number;
    iboCharge: number;
    merchantCharge: number;
    founderCharge: number;
    faultParty: string;
  };
  createdAt: string;
  deliveredAt?: string;
}

// Double-entry style transactional ledger entries
export type LedgerAccountType =
  | 'customer_escrow'
  | 'merchant_payable'
  | 'ibo_payable'
  | 'agent_payable'
  | 'founder_platform_revenue'
  | 'founder_delivery_commission'
  | 'ibo_referral_payable'
  | 'recoup_loss_account'
  | 'customer_funds'
  | 'customer_refund_payable';

/**
 * Section 6 Strict Delivery Transaction State
 * - pending: Funds held in customer escrow; delivery is in transit; neither merchant, IBO, agent nor platform can withdraw.
 * - confirmed: Delivery confirmed via physical QR token scan at customer handover; escrow released to merchant wholesale, IBO markup, courier net fee, founder commission, and referral uplines.
 * - reversed: Delivery failed or was refused; product escrow reversed to customer refund; fault-based recoup ledger charges applied to at-fault parties to compensate courier transport.
 */
export type DeliveryTransactionState = 'pending' | 'confirmed' | 'reversed';

export type TransactionType =
  | 'order_escrow'
  | 'delivery_settlement'
  | 'unsuccessful_recoup'
  | 'order_refund'
  | 'withdrawal'
  | 'balance_adjustment';

export type MoneyPipe =
  | 'pipe_a_delivery'
  | 'pipe_b_product'
  | 'recoup_unsuccessful'
  | 'withdrawal'
  | 'escrow_hold'
  | 'combined';

/**
 * Atomic Entry in Double-Entry Accounting
 * Enforces: sum(debits) === sum(credits)
 */
export interface Entry {
  id: string;
  transactionId: string;
  orderId?: string;
  orderNumber?: string;
  account: string;
  entryType: 'debit' | 'credit';
  amount: number;
  currency: string;
  state: DeliveryTransactionState;
  pipe: MoneyPipe;
  memo: string;
  timestamp: string;
  // Dual-entry pairing references for seamless interoperability with LedgerEntry
  debitAccount?: string;
  creditAccount?: string;
  isSettled?: boolean;
}

/**
 * Double-Entry Transaction container
 * Contains multiple debit and credit entries where sum(debits) must equal sum(credits).
 */
export interface Transaction {
  id: string;
  orderId?: string;
  orderNumber?: string;
  type: TransactionType;
  pipe: MoneyPipe;
  state: DeliveryTransactionState;
  entries: Entry[];
  totalDebits: number;
  totalCredits: number;
  currency: string;
  memo: string;
  timestamp: string;
  settledAt?: string;
  reversedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  orderId?: string;
  orderNumber?: string;
  pipe: 'pipe_a_delivery' | 'pipe_b_product' | 'recoup_unsuccessful' | 'withdrawal' | 'escrow_hold' | 'combined';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  memo: string;
  timestamp: string;
  isSettled: boolean;
  state?: DeliveryTransactionState;
  account?: string;
  entryType?: 'debit' | 'credit';
}

/**
 * Wallet Balance across Section 6 strict delivery states
 */
export interface WalletBalance {
  // Strict delivery states per Section 6
  pending: number;           // Funds currently locked in pending escrow
  confirmed: number;         // Funds confirmed/settled via QR delivery verification
  reversed: number;          // Funds reversed/refunded due to delivery failure or cancellation

  // Spendable balances
  availableBalance: number;  // Net confirmed spendable balance (confirmed credits minus debits and withdrawals)
  pendingEscrow: number;     // Escrow held pending QR delivery scan
  totalEarnings: number;     // Cumulative gross confirmed earnings
  totalEarned?: number;
  totalDebits: number;       // Total debits charged
  totalCredits: number;      // Total gross credits applied
  totalWithdrawn: number;    // Total funds processed via bank withdrawal

  // Role-specific earnings breakdown
  directSalesEarnings: number;
  tier1ReferralEarnings: number;
  tier2ReferralEarnings: number;
  tier3ReferralEarnings: number;
  deliveryEarnings?: number;
  platformRevenue?: number;
  recoupPenalties?: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  role: UserRole;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'processed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

export interface ReferralNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  tierLevel: 1 | 2 | 3;
  joinDate: string;
  activeShopListings: number;
  totalSalesVolume: number; // shown only if config allows
  earnedFromMember: number; // your cut from their sales
}
