import {
  AppUser,
  UserSession,
  Product,
  IboListing,
  IboProfile,
  DeliveryAgentProfile,
  VehicleType,
  Order,
  LedgerEntry,
  KYCSubmission,
  WithdrawalRequest,
  ReferralNode,
  WalletBalance,
  MerchantTier,
  CustomerAttribution,
  MerchantAdvertisingCampaign,
  FailedDeliveryDispute,
} from '../types';
import { INITIAL_PLATFORM_CONFIG, PlatformConfig } from '../config/platformConfig';
import { LedgerEngine, RecoupResult, LedgerAuditReport } from './ledger';
import { generate30DayHistoricalLedger } from './historicalLedger';

// Local storage key for persistent simulation
const STORAGE_KEY = 'affiliate_marketplace_platform_v1';

export interface PlatformState {
  config: PlatformConfig;
  currentSession: UserSession;
  merchants: {
    id: string;
    userId: string;
    code: string;
    referralCode?: string;
    referredByMerchantId?: string;
    referredMerchantsCount?: number;
    businessName: string;
    tier?: MerchantTier;
    isVerified: boolean;
    isKycVerified?: boolean;
    cacRegistrationNumber?: string;
    tin?: string;
    contactEmail: string;
    contactPhone: string;
    warehouseAddress?: string;
    state?: string;
    warehouseStockDeposited: boolean;
    hubBoostedUntil?: string;
    regulatoryCertifications?: {
      type: 'NAFDAC' | 'SON' | 'FOOD_PERMIT' | 'OTHER';
      documentNumber: string;
      isVerified: boolean;
    }[];
    activeProductsCount?: number;
    totalWholesaleOrdersCompleted?: number;
  }[];
  products: Product[];
  iboProfiles: Record<string, IboProfile>; // keyed by iboId
  iboListings: Record<string, IboListing[]>; // keyed by iboId
  agents: DeliveryAgentProfile[];
  orders: Order[];
  ledger: LedgerEntry[];
  kycSubmissions: KYCSubmission[];
  withdrawals: WithdrawalRequest[];
  iboReferralTrees: Record<string, ReferralNode[]>; // keyed by iboId
  customerAttributions: CustomerAttribution[];
  merchantCampaigns: MerchantAdvertisingCampaign[];
  failedDeliveryDisputes: FailedDeliveryDispute[];
  userAccounts: AppUser[];
}

// Initial Pre-populated Seed Data
export const SEED_MERCHANTS = [
  {
    id: 'mrc-1',
    userId: 'usr-mrc-1',
    code: 'MRC-AGRO-01',
    referralCode: 'MRC-AGRO-01',
    referredByMerchantId: 'founder',
    referredMerchantsCount: 2,
    businessName: 'AgroFresh Mega Farms Ltd',
    tier: 'pro' as const, // Up to 25 products, ₦10k/mo
    isVerified: true,
    isKycVerified: true,
    cacRegistrationNumber: 'RC-1849201',
    tin: '22839102-0001',
    contactEmail: 'orders@agrofresh.ng',
    contactPhone: '+234 802 111 2233',
    warehouseAddress: 'Agro Industrial Estate, Plot 12, Ikorodu Road, Lagos',
    warehouseStockDeposited: true,
    hubBoostedUntil: '2026-10-01T00:00:00Z',
    regulatoryCertifications: [
      { type: 'NAFDAC' as const, documentNumber: 'NAFDAC-A4-9182', isVerified: true },
      { type: 'SON' as const, documentNumber: 'SON-CAP-2024-88', isVerified: true },
    ],
    activeProductsCount: 2,
    totalWholesaleOrdersCompleted: 142,
  },
  {
    id: 'mrc-2',
    userId: 'usr-mrc-2',
    code: 'MRC-AUTO-02',
    referralCode: 'MRC-AUTO-02',
    referredByMerchantId: 'mrc-1',
    referredMerchantsCount: 0,
    businessName: 'Lagos Prime Automobile Spares',
    tier: 'business' as const, // Up to 100 products, ₦25k/mo
    isVerified: true,
    isKycVerified: true,
    cacRegistrationNumber: 'RC-994821',
    tin: '19402914-0001',
    contactEmail: 'supply@lagosprimespares.com',
    contactPhone: '+234 803 222 4455',
    warehouseAddress: 'Ladipo Auto Market, Line 4, Mushin, Lagos',
    warehouseStockDeposited: false,
    regulatoryCertifications: [
      { type: 'SON' as const, documentNumber: 'SON-AUTO-9122', isVerified: true },
    ],
    activeProductsCount: 1,
    totalWholesaleOrdersCompleted: 87,
  },
  {
    id: 'mrc-3',
    userId: 'usr-mrc-3',
    code: 'MRC-SOLAR-03',
    referralCode: 'MRC-SOLAR-03',
    referredByMerchantId: 'founder',
    referredMerchantsCount: 1,
    businessName: 'GreenVolt Solar Tech Ltd',
    tier: 'pro' as const,
    isVerified: true,
    isKycVerified: true,
    cacRegistrationNumber: 'RC-1294812',
    tin: '20491824-0001',
    contactEmail: 'distributors@greenvoltsolar.ng',
    contactPhone: '+234 805 333 7788',
    warehouseAddress: 'Alaba International Tech Wing, Ojo, Lagos',
    warehouseStockDeposited: true,
    hubBoostedUntil: '2026-09-25T00:00:00Z',
    regulatoryCertifications: [
      { type: 'SON' as const, documentNumber: 'SON-SOLAR-4491', isVerified: true },
    ],
    activeProductsCount: 2,
    totalWholesaleOrdersCompleted: 219,
  },
  {
    id: 'mrc-4',
    userId: 'usr-mrc-4',
    code: 'MRC-LEKKI-04',
    referralCode: 'MRC-LEKKI-04',
    referredByMerchantId: 'mrc-1',
    referredMerchantsCount: 0,
    businessName: 'Lekki Loom Textiles & Footwear',
    tier: 'free' as const, // Up to 5 products, ₦0/mo
    isVerified: true,
    isKycVerified: true,
    cacRegistrationNumber: 'BN-4481029',
    tin: '11092834-0001',
    contactEmail: 'hello@lekkiloom.ng',
    contactPhone: '+234 809 444 8899',
    warehouseAddress: 'Ikota Shopping Complex, VGC, Lekki, Lagos',
    warehouseStockDeposited: false,
    regulatoryCertifications: [],
    activeProductsCount: 1,
    totalWholesaleOrdersCompleted: 34,
  },
  {
    id: 'mrc-5',
    userId: 'usr-mrc-5',
    code: 'MRC-FOOD-05',
    referralCode: 'MRC-FOOD-05',
    referredByMerchantId: 'mrc-3',
    referredMerchantsCount: 0,
    businessName: 'AfroGourmet Natural Spices & Grains',
    tier: 'enterprise' as const, // Up to 500 products, ₦50k/mo
    isVerified: true,
    isKycVerified: true,
    cacRegistrationNumber: 'RC-339182',
    tin: '39102948-0001',
    contactEmail: 'wholesale@afrogourmet.ng',
    contactPhone: '+234 812 555 9900',
    warehouseAddress: 'Mile 12 Commercial Cold-Hub, Ketu, Lagos',
    warehouseStockDeposited: true,
    regulatoryCertifications: [
      { type: 'NAFDAC' as const, documentNumber: 'NAFDAC-FD-3810', isVerified: true },
      { type: 'FOOD_PERMIT' as const, documentNumber: 'LASG-FOOD-9912', isVerified: true },
    ],
    activeProductsCount: 1,
    totalWholesaleOrdersCompleted: 412,
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    merchantId: 'mrc-1',
    merchantName: 'AgroFresh Mega Farms',
    merchantCode: 'MRC-AGRO-01',
    title: 'Certified Organic Fertilizer (50kg Bag)',
    description: 'High-nitrogen organic soil conditioning fertilizer enriched with beneficial micro-nutrients for cassava, maize, and vegetable yield.',
    category: 'agriculture',
    subCategory: 'Organic Fertilizers',
    merchantBasePrice: 18500,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'warehouse_deposit',
    stockQty: 340,
    imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    merchantId: 'mrc-1',
    merchantName: 'AgroFresh Mega Farms',
    merchantCode: 'MRC-AGRO-01',
    title: 'Precision Drip Irrigation Starter Kit (1 Acre)',
    description: 'Complete gravity-fed irrigation system with UV-stabilized driplines, filters, and connectors for dry season all-year farming.',
    category: 'agriculture',
    subCategory: 'Irrigation Kits',
    merchantBasePrice: 65000,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'warehouse_deposit',
    stockQty: 85,
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb2252c?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-05T12:00:00Z',
  },
  {
    id: 'prod-3',
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    title: '350W Monocrystalline High-Efficiency Solar Panel',
    description: 'Tier-1 German solar cell technology with anti-reflective glass, ideal for residential inverters and mini-grid installations.',
    category: 'electronics',
    subCategory: 'Solar Panels & Inverters',
    merchantBasePrice: 42000,
    vatIncluded: false,
    vatRate: 0.075,
    fulfillmentType: 'warehouse_deposit',
    stockQty: 120,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-10T14:30:00Z',
  },
  {
    id: 'prod-4',
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    title: '1.5kVA Pure Sine Wave Hybrid Solar Inverter',
    description: 'Integrated MPPT charge controller, LED monitoring display, smart battery charging, and surge overload protection.',
    category: 'electronics',
    subCategory: 'Solar Panels & Inverters',
    merchantBasePrice: 135000,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'warehouse_deposit',
    stockQty: 45,
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-12T09:00:00Z',
  },
  {
    id: 'prod-5',
    merchantId: 'mrc-2',
    merchantName: 'Lagos Prime Automobile Spares',
    merchantCode: 'MRC-AUTO-02',
    title: 'Fully Synthetic Engine Oil 5W-30 (5 Litres)',
    description: 'API SP rated advanced molecular wear defense for modern Japanese and European passenger vehicles in tropical climates.',
    category: 'automobile',
    subCategory: 'Engine Oils & Lubricants',
    merchantBasePrice: 28000,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'merchant_held', // Customer pays extra pickup fee
    stockQty: 210,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-15T11:00:00Z',
  },
  {
    id: 'prod-6',
    merchantId: 'mrc-4',
    merchantName: 'Lekki Loom Textiles & Footwear',
    merchantCode: 'MRC-LEKKI-04',
    title: 'Handcrafted Genuine Calfskin Loafers (Onyx Black)',
    description: 'Artisanal Goodyear-welted leather loafers with padded memory insole, breathable goat leather lining, and durable rubber outsoles.',
    category: 'fashion',
    subCategory: 'Footwear',
    merchantBasePrice: 38000,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'merchant_held',
    stockQty: 60,
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-18T16:00:00Z',
  },
  {
    id: 'prod-7',
    merchantId: 'mrc-5',
    merchantName: 'AfroGourmet Natural Spices & Grains',
    merchantCode: 'MRC-FOOD-05',
    title: 'Premium Stone-Free Ofada Rice (10kg Jute Bag)',
    description: 'Organically cultivated unpolished nutrient-dense aromatic grain, machine-destoned and packaged in sealed moisture-lock liners.',
    category: 'food_beverage',
    subCategory: 'Packaged Staples',
    merchantBasePrice: 22000,
    vatIncluded: true,
    vatRate: 0.075,
    fulfillmentType: 'warehouse_deposit',
    stockQty: 180,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    isAvailable: true,
    createdAt: '2026-08-20T10:00:00Z',
  },
];

export const SEED_IBO_PROFILES: Record<string, IboProfile> = {
  'ibo-1': {
    id: 'ibo-1',
    userId: 'usr-ibo-1',
    iboNumber: 'IBO-00001245',
    name: 'Amina Bello',
    slug: 'amina-crafts',
    referralCode: 'AMINA77',
    tier: 'free', // Capacity: 5 merchants
    referredById: null, // Directly attributed to Founder
    tier1Count: 3,
    tier2Count: 2,
    tier3Count: 2,
    shopBranding: {
      storeName: "Amina's Curated Living & Energy",
      tagline: 'Reliable Agro-Supplies, Solar Inverters & Lifestyle Essentials',
      accentColor: '#0F766E', // Teal/Emerald
      bannerImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&auto=format&fit=crop&q=80',
      supportEmail: 'care@aminas-store.ng',
      supportPhone: '+234 803 998 1234',
    },
    selectedMerchantIds: ['mrc-1', 'mrc-3', 'mrc-4', 'mrc-5'],
    completedTraining: true,
    cosmeticBadges: ['Certified Product Specialist', '100% On-Time Delivery Ambassador'],
    isBoostedOnFounderHome: true,
    boostExpiry: '2026-09-30T00:00:00Z',
  },
  'ibo-2': {
    id: 'ibo-2',
    userId: 'usr-ibo-2',
    iboNumber: 'IBO-00001246',
    name: 'Chidi Okafor',
    slug: 'chidi-auto-solar',
    referralCode: 'CHIDI24',
    tier: 'tier_2',
    referredById: 'ibo-1', // Referred by Amina Bello
    tier1Count: 1,
    tier2Count: 1,
    tier3Count: 0,
    shopBranding: {
      storeName: 'Chidi Heavy Duty & Power Solutions',
      tagline: 'Genuine Spares and Solar Inverter Systems',
      accentColor: '#B45309', // Warm Amber
      supportEmail: 'contact@chidiauto.ng',
      supportPhone: '+234 802 555 7890',
    },
    selectedMerchantIds: ['mrc-2', 'mrc-3'],
    completedTraining: false,
    cosmeticBadges: ['Rising Star Affiliate'],
    isBoostedOnFounderHome: false,
  },
};

export const SEED_IBO_LISTINGS: Record<string, IboListing[]> = {
  'ibo-1': [
    {
      id: 'lst-1',
      iboId: 'ibo-1',
      productId: 'prod-1',
      product: SEED_PRODUCTS[0],
      iboMarkup: 3500, // ≤ 50% cap of 18500 (= 9250 cap) -> valid!
      finalCustomerPrice: 22000,
      isFeaturedInShop: true,
      displayOrder: 1,
    },
    {
      id: 'lst-2',
      iboId: 'ibo-1',
      productId: 'prod-2',
      product: SEED_PRODUCTS[1],
      iboMarkup: 12000, // ≤ 50% cap of 65000 (= 32500 cap) -> valid!
      finalCustomerPrice: 77000,
      isFeaturedInShop: true,
      displayOrder: 2,
    },
    {
      id: 'lst-3',
      iboId: 'ibo-1',
      productId: 'prod-3',
      product: SEED_PRODUCTS[2],
      iboMarkup: 6000, // ≤ 50% cap of 42000 (= 21000 cap) -> valid!
      finalCustomerPrice: 48000,
      isFeaturedInShop: true,
      displayOrder: 3,
    },
    {
      id: 'lst-4',
      iboId: 'ibo-1',
      productId: 'prod-4',
      product: SEED_PRODUCTS[3],
      iboMarkup: 20000, // ≤ 50% cap of 135000 (= 67500 cap) -> valid!
      finalCustomerPrice: 155000,
      isFeaturedInShop: false,
      displayOrder: 4,
    },
    {
      id: 'lst-5',
      iboId: 'ibo-1',
      productId: 'prod-7',
      product: SEED_PRODUCTS[6],
      iboMarkup: 3000, // ≤ 50% cap of 22000 (= 11000 cap) -> valid!
      finalCustomerPrice: 25000,
      isFeaturedInShop: false,
      displayOrder: 5,
    },
  ],
  'ibo-2': [
    {
      id: 'lst-6',
      iboId: 'ibo-2',
      productId: 'prod-5',
      product: SEED_PRODUCTS[4],
      iboMarkup: 4000,
      finalCustomerPrice: 32000,
      isFeaturedInShop: true,
      displayOrder: 1,
    },
    {
      id: 'lst-7',
      iboId: 'ibo-2',
      productId: 'prod-3',
      product: SEED_PRODUCTS[2],
      iboMarkup: 7000,
      finalCustomerPrice: 49000,
      isFeaturedInShop: true,
      displayOrder: 2,
    },
  ],
};

export const SEED_AGENTS: DeliveryAgentProfile[] = [
  {
    id: 'agt-1',
    userId: 'usr-agt-1',
    agentNumber: 'DEL-00000101',
    name: 'Tunde Balogun',
    phone: '+234 813 777 6655',
    vehicleType: 'motorcycle',
    vehiclePlate: 'KJA-512-AB',
    referralCode: 'TUNDE-RIDER',
    referredByAgentId: null,
    tier1AgentCount: 1,
    tier2AgentCount: 0,
    tier3AgentCount: 0,
    operatingAreas: ['Ikeja', 'Maryland', 'Oregun', 'Lekki'],
    isInspectionPassed: true,
    inspectionDate: '2026-08-15T00:00:00Z',
    currentLocation: {
      lat: 6.5244,
      lng: 3.3792,
      areaName: 'Ikeja / Maryland Logistics Hub, Lagos',
    },
    isOnline: true,
    activeDeliveriesCount: 1,
  },
  {
    id: 'agt-2',
    userId: 'usr-agt-2',
    agentNumber: 'DEL-00000102',
    name: 'Emeka Nwosu',
    phone: '+234 814 888 9911',
    vehicleType: 'van',
    vehiclePlate: 'APP-902-LG',
    referralCode: 'EMEKA-VAN',
    referredByAgentId: 'agt-1',
    tier1AgentCount: 0,
    tier2AgentCount: 0,
    tier3AgentCount: 0,
    operatingAreas: ['Victoria Island', 'Ikoyi', 'Lekki Expressway'],
    isInspectionPassed: true,
    inspectionDate: '2026-08-20T00:00:00Z',
    currentLocation: {
      lat: 6.4281,
      lng: 3.4219,
      areaName: 'Victoria Island / Lekki Expressway, Lagos',
    },
    isOnline: true,
    activeDeliveriesCount: 0,
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-9041',
    iboId: 'ibo-1',
    iboSlug: 'amina-crafts',
    customerId: 'cust-1',
    customerName: 'Ngozi Eze',
    customerPhone: '+234 802 334 4556',
    deliveryAddress: 'Plot 14, Admiralty Way, Lekki Phase 1, Lagos',
    items: [
      {
        productId: 'prod-1',
        productTitle: 'Certified Organic Fertilizer (50kg Bag)',
        merchantId: 'mrc-1',
        merchantName: 'AgroFresh Mega Farms',
        merchantBasePrice: 18500,
        iboMarkup: 3500,
        unitPrice: 22000,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&auto=format&fit=crop&q=80',
        fulfillmentType: 'warehouse_deposit',
      },
    ],
    subtotal: 44000,
    totalMarkup: 7000,
    deliveryFee: 3500,
    totalAmount: 47500,
    paymentMethod: 'pay_on_delivery',
    paymentStatus: 'held_in_escrow',
    orderStatus: 'in_transit',
    agentId: 'agt-1',
    agentName: 'Tunde Balogun',
    agentPhone: '+234 813 777 6655',
    agentVehicle: 'Motorcycle (KJA-512-AB)',
    // Single-use QR token unique to this order
    pickupQrToken: 'QR-PICKUP-9041-7X9P',
    isPickupConfirmed: true,
    pickedUpAt: '2026-09-10T10:45:00Z',
    confirmationQrToken: 'QR-CONFIRM-9041-SECURE-89A',
    qrExpiresAt: '2026-09-10T22:00:00Z',
    isQrScanned: false,
    createdAt: '2026-09-10T10:15:00Z',
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-2026-9284',
    iboId: 'ibo-1',
    iboSlug: 'amina-crafts',
    customerId: 'cust-3',
    customerName: 'Chidi Okafor',
    customerPhone: '+234 803 445 7788',
    deliveryAddress: '15 Adeola Odeku St, Victoria Island, Lagos',
    items: [
      {
        productId: 'prod-2',
        productTitle: 'Cold-Pressed Virgin Coconut Oil (5L Jerrycan)',
        merchantId: 'mrc-2',
        merchantName: 'Afrilife Organics Enterprise',
        merchantBasePrice: 22000,
        iboMarkup: 4000,
        unitPrice: 26000,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
        fulfillmentType: 'warehouse_deposit',
      },
    ],
    subtotal: 52000,
    totalMarkup: 8000,
    deliveryFee: 3500,
    totalAmount: 55500,
    paymentMethod: 'pay_on_delivery',
    paymentStatus: 'held_in_escrow',
    orderStatus: 'dispatched',
    agentId: 'agt-1',
    agentName: 'Tunde Balogun',
    agentPhone: '+234 813 777 6655',
    agentVehicle: 'Motorcycle (KJA-512-AB)',
    pickupQrToken: 'QR-PICKUP-9284-A5K8',
    isPickupConfirmed: false,
    confirmationQrToken: 'QR-CONFIRM-9284-B8M2-41PX',
    qrExpiresAt: '2026-09-11T20:00:00Z',
    isQrScanned: false,
    createdAt: '2026-09-11T08:30:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    iboId: 'ibo-1',
    iboSlug: 'amina-crafts',
    customerId: 'cust-2',
    customerName: 'Babatunde Adeleke',
    customerPhone: '+234 809 112 3344',
    deliveryAddress: '22 Isaac John Street, GRA Ikeja, Lagos',
    items: [
      {
        productId: 'prod-3',
        productTitle: '350W Monocrystalline High-Efficiency Solar Panel',
        merchantId: 'mrc-3',
        merchantName: 'GreenVolt Solar Tech Ltd',
        merchantBasePrice: 42000,
        iboMarkup: 6000,
        unitPrice: 48000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
        fulfillmentType: 'warehouse_deposit',
      },
    ],
    subtotal: 48000,
    totalMarkup: 6000,
    deliveryFee: 4000,
    totalAmount: 52000,
    paymentMethod: 'online_paystack',
    paymentStatus: 'completed',
    orderStatus: 'delivered',
    agentId: 'agt-1',
    agentName: 'Tunde Balogun',
    agentPhone: '+234 813 777 6655',
    agentVehicle: 'Motorcycle (KJA-512-AB)',
    confirmationQrToken: 'QR-CONFIRM-8812-COMPLETED-99Z',
    qrExpiresAt: '2026-09-09T18:00:00Z',
    isQrScanned: true,
    createdAt: '2026-09-09T14:20:00Z',
    deliveredAt: '2026-09-09T17:15:00Z',
  },
];

export const SEED_LEDGER: LedgerEntry[] = [
  ...generate30DayHistoricalLedger(),
  // Pending Escrow for in-transit Order ORD-2026-9041 (§6 Delivery State: pending)
  {
    id: 'LEDGER-ESCROW-PA-ord-101',
    transactionId: 'TX-ESCROW-ord-101-1725960000',
    orderId: 'ord-101',
    orderNumber: 'ORD-2026-9041',
    pipe: 'pipe_a_delivery',
    debitAccount: 'customer_funds:cust-1',
    creditAccount: 'customer_escrow',
    amount: 3500,
    currency: 'NGN',
    memo: 'Delivery fee held in escrow pending customer QR confirmation for Order ORD-2026-9041 [Pipe A]',
    timestamp: '2026-09-10T10:15:00Z',
    isSettled: false,
    state: 'pending',
  },
  {
    id: 'LEDGER-ESCROW-PB-ord-101',
    transactionId: 'TX-ESCROW-ord-101-1725960000',
    orderId: 'ord-101',
    orderNumber: 'ORD-2026-9041',
    pipe: 'pipe_b_product',
    debitAccount: 'customer_funds:cust-1',
    creditAccount: 'customer_escrow',
    amount: 44000,
    currency: 'NGN',
    memo: 'Product money held in escrow pending customer QR confirmation for Order ORD-2026-9041 [Pipe B]',
    timestamp: '2026-09-10T10:15:00Z',
    isSettled: false,
    state: 'pending',
  },
  // Pipe A for Delivered Order ORD-2026-8812 (§6 Delivery State: confirmed)
  {
    id: 'LEDGER-PA-1-ord-102',
    transactionId: 'TX-ord-102-1725890000',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    pipe: 'pipe_a_delivery',
    debitAccount: 'customer_escrow',
    creditAccount: 'agent_payable:agt-1',
    amount: 3400, // 85% of 4000 NGN
    currency: 'NGN',
    memo: 'Delivery fee net payout to Agent (Tunde Balogun) [Pipe A]',
    timestamp: '2026-09-09T17:15:00Z',
    isSettled: true,
    state: 'confirmed',
  },
  {
    id: 'LEDGER-PA-2-ord-102',
    transactionId: 'TX-ord-102-1725890000',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    pipe: 'pipe_a_delivery',
    debitAccount: 'customer_escrow',
    creditAccount: 'founder_delivery_commission',
    amount: 600, // 15% of 4000 NGN
    currency: 'NGN',
    memo: 'Founder 15% commission on delivery fee [Pipe A]',
    timestamp: '2026-09-09T17:15:00Z',
    isSettled: true,
    state: 'confirmed',
  },
  // Pipe B for Delivered Order ORD-2026-8812 (§6 Delivery State: confirmed)
  {
    id: 'LEDGER-PB-MERCHANT-mrc-3-prod-3-ord-102',
    transactionId: 'TX-ord-102-1725890000',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    pipe: 'pipe_b_product',
    debitAccount: 'customer_escrow',
    creditAccount: 'merchant_payable:mrc-3',
    amount: 42000,
    currency: 'NGN',
    memo: 'Product base price payable to Merchant: GreenVolt Solar Tech Ltd (1x 350W Solar Panel) [Pipe B]',
    timestamp: '2026-09-09T17:15:00Z',
    isSettled: true,
    state: 'confirmed',
  },
  {
    id: 'LEDGER-PB-IBO-MARKUP-ord-102',
    transactionId: 'TX-ord-102-1725890000',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    pipe: 'pipe_b_product',
    debitAccount: 'customer_escrow',
    creditAccount: 'ibo_payable:ibo-1',
    amount: 6000,
    currency: 'NGN',
    memo: 'IBO Direct Sales Markup earnings for Order ORD-2026-8812 [Pipe B]',
    timestamp: '2026-09-09T17:15:00Z',
    isSettled: true,
    state: 'confirmed',
  },
  {
    id: 'LEDGER-PB-FOUNDER-CUT-ord-102',
    transactionId: 'TX-ord-102-1725890000',
    orderId: 'ord-102',
    orderNumber: 'ORD-2026-8812',
    pipe: 'pipe_b_product',
    debitAccount: 'customer_escrow',
    creditAccount: 'founder_platform_revenue',
    amount: 2400, // 5% of 48,000 NGN
    currency: 'NGN',
    memo: 'Founder 5% marketplace take-rate [Pipe B]',
    timestamp: '2026-09-09T17:15:00Z',
    isSettled: true,
    state: 'confirmed',
  },
];

export const SEED_KYC_SUBMISSIONS: KYCSubmission[] = [
  {
    id: 'kyc-1',
    userId: 'usr-mrc-2',
    role: 'merchant',
    entityName: 'Lagos Prime Automobile Spares',
    submittedAt: '2026-09-08T11:00:00Z',
    status: 'approved',
    businessRegistrationNumber: 'RC-1849201',
    taxId: 'TIN-9923841-001',
    documents: [
      { name: 'CAC Business Incorporation Certificate', type: 'application/pdf', fileUrl: 'https://example.com/docs/cac.pdf', verified: true },
      { name: 'Tax Clearance Certificate 2025', type: 'application/pdf', fileUrl: 'https://example.com/docs/tax.pdf', verified: true },
      { name: 'Managing Director International Passport', type: 'image/jpeg', fileUrl: 'https://example.com/docs/passport.jpg', verified: true },
    ],
  },
  {
    id: 'kyc-2',
    userId: 'usr-new-merchant',
    role: 'merchant',
    entityName: 'Kaduna Organic Seedlings & Tools',
    submittedAt: '2026-09-10T08:30:00Z',
    status: 'pending',
    businessRegistrationNumber: 'BN-8392110',
    taxId: 'TIN-4458921-002',
    documents: [
      { name: 'Business Name Registration Form', type: 'application/pdf', fileUrl: 'https://example.com/docs/seedlings-bn.pdf', verified: false },
      { name: 'Utility Bill (Kaduna Electric)', type: 'image/png', fileUrl: 'https://example.com/docs/utility.png', verified: false },
    ],
  },
  {
    id: 'kyc-3',
    userId: 'usr-agt-2',
    role: 'agent',
    entityName: 'Emeka Nwosu (Logistics Van Rider)',
    submittedAt: '2026-09-09T16:00:00Z',
    status: 'pending',
    nationalIdNumber: 'NIN-99120349120',
    documents: [
      { name: 'Commercial Driver License (Class E)', type: 'image/jpeg', fileUrl: 'https://example.com/docs/dl.jpg', verified: true },
      { name: 'Lagos State MOT Roadworthiness Test', type: 'application/pdf', fileUrl: 'https://example.com/docs/mot.pdf', verified: false },
    ],
  },
];

export const SEED_REFERRAL_TREES: Record<string, ReferralNode[]> = {
  'founder': [
    // Founder Tier 1 Direct Recruits (Signups without referral code fall back here)
    {
      id: 'ref-f-1',
      name: 'Amina Bello',
      email: 'care@aminas-store.ng',
      referralCode: 'AMINA77',
      tierLevel: 1,
      joinDate: '2026-08-01',
      activeShopListings: 5,
      totalSalesVolume: 420000,
      earnedFromMember: 21000,
    },
  ],
  'ibo-1': [
    // Tier 1 (Direct referrals)
    {
      id: 'ref-t1-1',
      name: 'Chidi Okafor',
      email: 'chidi@chidiauto.ng',
      referralCode: 'CHIDI24',
      tierLevel: 1,
      joinDate: '2026-08-14',
      activeShopListings: 4,
      totalSalesVolume: 240000,
      earnedFromMember: 12000, // 5% of direct sales
    },
    {
      id: 'ref-t1-2',
      name: 'Zainab Musa',
      email: 'zainab.musa@yahoo.com',
      referralCode: 'ZAINAB-STORE',
      tierLevel: 1,
      joinDate: '2026-08-19',
      activeShopListings: 5,
      totalSalesVolume: 180000,
      earnedFromMember: 9000,
    },
    {
      id: 'ref-t1-3',
      name: 'David Adeleke',
      email: 'david.adeleke@gmail.com',
      referralCode: 'DAVE-SOLAR',
      tierLevel: 1,
      joinDate: '2026-08-25',
      activeShopListings: 3,
      totalSalesVolume: 95000,
      earnedFromMember: 4750,
    },
    // Tier 2 (Referred by your Tier 1)
    {
      id: 'ref-t2-1',
      name: 'Kelechi Nnamdi',
      email: 'kelechi@nnamdi.ng',
      referralCode: 'KELECHI-9',
      tierLevel: 2,
      joinDate: '2026-08-28',
      activeShopListings: 2,
      totalSalesVolume: 120000,
      earnedFromMember: 3600, // 3%
    },
    {
      id: 'ref-t2-2',
      name: 'Fatima Aliyu',
      email: 'fatima@aliyu-textiles.com',
      referralCode: 'FATIMA-AFRO',
      tierLevel: 2,
      joinDate: '2026-09-01',
      activeShopListings: 4,
      totalSalesVolume: 80000,
      earnedFromMember: 2400,
    },
    // Tier 3 (Referred by your Tier 2)
    {
      id: 'ref-t3-1',
      name: 'Emeka Obi',
      email: 'emeka@obistores.ng',
      referralCode: 'EMEKA-AGRO',
      tierLevel: 3,
      joinDate: '2026-09-04',
      activeShopListings: 3,
      totalSalesVolume: 60000,
      earnedFromMember: 1200, // 2%
    },
    {
      id: 'ref-t3-2',
      name: 'Bisi Fayemi',
      email: 'bisi.fayemi@outlook.com',
      referralCode: 'BISI-STORE',
      tierLevel: 3,
      joinDate: '2026-09-06',
      activeShopListings: 2,
      totalSalesVolume: 45000,
      earnedFromMember: 900,
    },
    // Note: Any downstream recruits (e.g. Suleiman) flatten at Tier 3 per rule §8.
  ],
};

export const SEED_CUSTOMER_ATTRIBUTIONS: CustomerAttribution[] = [
  {
    id: 'attr-1',
    customerId: 'cust-1',
    customerPhone: '+234 802 334 4556',
    customerEmail: 'ngozi.eze@gmail.com',
    attributedIboId: 'ibo-1',
    attributedIboName: 'Amina Bello',
    attributionSource: 'shared_link',
    attributedAt: '2026-08-10T12:00:00Z',
    expiresAt: '2026-11-08T12:00:00Z', // 90-day attribution window
    lifetimeOrdersCount: 2,
    lifetimeGrossValue: 96000,
  },
  {
    id: 'attr-2',
    customerId: 'cust-2',
    customerPhone: '+234 809 111 4433',
    customerEmail: 'folake.ade@hotmail.com',
    attributedIboId: 'ibo-2',
    attributedIboName: 'Chidi Okafor',
    attributionSource: 'qr_flyer',
    attributedAt: '2026-08-25T14:30:00Z',
    expiresAt: '2026-11-23T14:30:00Z',
    lifetimeOrdersCount: 1,
    lifetimeGrossValue: 32000,
  },
];

export const SEED_MERCHANT_CAMPAIGNS: MerchantAdvertisingCampaign[] = [
  {
    id: 'cmp-1',
    merchantId: 'mrc-1',
    merchantName: 'AgroFresh Mega Farms Ltd',
    headline: 'High-Demand Organic Fertilizer & Drip Irrigation — ₦12k Markup Potential for IBOs!',
    targetAudience: 'category_specialists',
    category: 'agriculture',
    dailyBudget: 2500,
    totalBudget: 25000,
    spent: 12500,
    impressions: 480,
    clicks: 142,
    iboPickups: 38,
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cmp-2',
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    headline: 'Monocrystalline Solar Panels with 25-Year Warranty: Fast Depot Pickup in Lagos',
    targetAudience: 'ibos',
    category: 'electronics',
    dailyBudget: 3500,
    totalBudget: 35000,
    spent: 18000,
    impressions: 620,
    clicks: 195,
    iboPickups: 54,
    status: 'active',
    createdAt: '2026-09-03T11:30:00Z',
  },
];

export const SEED_FAILED_DISPUTES: FailedDeliveryDispute[] = [
  {
    id: 'dsp-101',
    orderId: 'ord-103',
    orderNumber: 'ORD-2026-5542',
    failureReason: 'wrong_or_damaged_item',
    stage: 'stage2_review',
    standard151520AppliedAt: '2026-09-10T14:00:00Z',
    disputeClaimant: 'customer',
    disputeReason: 'Customer reported bag of fertilizer was torn and contaminated with moisture upon courier arrival. Requested 100% refund.',
    claimedAt: '2026-09-10T14:45:00Z',
    adjudicationStatus: 'pending',
    adjudicationNotes: 'Reviewing depot dispatch logs. AgroFresh warehouse operator acknowledged packaging tear.',
  },
];

// Pre-populated user accounts supporting login via Email, Username, or Phone Number + Password
export const SEED_USER_ACCOUNTS: AppUser[] = [
  {
    id: 'usr-founder',
    name: 'Champion Afolayan',
    email: 'afolayanchampion@gmail.com',
    username: 'champion',
    phone: '+2348000000001',
    passwordHash: 'password123',
    role: 'founder',
    tokenVerified: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'usr-ibo-1',
    name: 'Amina Bello',
    email: 'amina@aminas-store.ng',
    username: 'amina_crafts',
    phone: '+2348039981234',
    passwordHash: 'password123',
    role: 'ibo',
    entityId: 'ibo-1',
    tokenVerified: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'usr-mrc-1',
    name: 'Kofi Mensah',
    email: 'kofi@agrofresh.ng',
    username: 'agrofresh',
    phone: '+2348021112233',
    passwordHash: 'password123',
    role: 'merchant',
    entityId: 'mrc-1',
    tokenVerified: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'usr-agt-1',
    name: 'Tunde Balogun',
    email: 'tunde@logistics-express.ng',
    username: 'tunde_rider',
    phone: '+2348137776655',
    passwordHash: 'password123',
    role: 'agent',
    entityId: 'agt-1',
    tokenVerified: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'usr-cust-1',
    name: 'Ngozi Eze',
    email: 'ngozi.eze@gmail.com',
    username: 'ngozi_eze',
    phone: '+2348023344556',
    passwordHash: 'password123',
    role: 'customer',
    entityId: 'cust-1',
    tokenVerified: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
];

// Default User Sessions for Each Role
export const SESSIONS: Record<string, UserSession> = {
  founder: {
    id: 'usr-founder',
    name: 'Platform Founder / Admin',
    email: 'founder@marketplace.ng',
    phone: '+234 800 000 0001',
    role: 'founder',
    token: 'founder-session-token-sec-999',
    isVerified: true,
    twoFactorEnabled: true,
  },
  merchant: {
    id: 'usr-mrc-1',
    name: 'Kofi Mensah (AgroFresh Farms)',
    email: 'kofi@agrofresh.ng',
    phone: '+234 802 111 2233',
    role: 'merchant',
    merchantId: 'mrc-1',
    token: 'merchant-session-token-agro-01',
    isVerified: true,
    twoFactorEnabled: true,
  },
  ibo: {
    id: 'usr-ibo-1',
    name: 'Amina Bello (IBO)',
    email: 'amina@aminas-store.ng',
    phone: '+234 803 998 1234',
    role: 'ibo',
    iboId: 'ibo-1',
    token: 'ibo-session-token-amina-77',
    isVerified: true,
    twoFactorEnabled: true,
  },
  agent: {
    id: 'usr-agt-1',
    name: 'Tunde Balogun (Rider)',
    email: 'tunde@logistics-express.ng',
    phone: '+234 813 777 6655',
    role: 'agent',
    agentId: 'agt-1',
    token: 'agent-session-token-tunde-512',
    isVerified: true,
    twoFactorEnabled: true,
  },
  customer: {
    id: 'usr-cust-1',
    name: 'Ngozi Eze (Shopper)',
    email: 'ngozi.eze@gmail.com',
    phone: '+234 802 334 4556',
    role: 'customer',
    customerId: 'cust-1',
    token: 'customer-session-token-ngozi',
    isVerified: true,
    twoFactorEnabled: false,
  },
};

/**
 * Global Platform Store Singleton
 */
class PlatformStore {
  private state: PlatformState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          this.state = this.loadState();
          this.notify();
        }
      });
    }
  }

  private loadState(): PlatformState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.ledger && parsed.ledger.length < 20) {
          parsed.ledger = [...generate30DayHistoricalLedger(), ...parsed.ledger];
        }
        if (parsed.orders) {
          if (!parsed.orders.some((o: Order) => o.id === 'ord-103')) {
            const ord103 = SEED_ORDERS.find((o) => o.id === 'ord-103');
            if (ord103) parsed.orders.unshift(ord103);
          }
          parsed.orders.forEach((o: Order) => {
            if (!o.pickupQrToken) {
              const suffix = o.orderNumber?.split('-')?.[2] || 'ORD';
              o.pickupQrToken = `QR-PICKUP-${suffix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
              if (o.orderStatus === 'in_transit' || o.orderStatus === 'delivered') {
                o.isPickupConfirmed = true;
              }
            }
          });
        }
        return {
          ...parsed,
          config: { ...INITIAL_PLATFORM_CONFIG, ...parsed.config },
          merchants: (parsed.merchants && parsed.merchants.length > 0 && parsed.merchants[0]?.tier)
            ? parsed.merchants
            : SEED_MERCHANTS,
          customerAttributions: parsed.customerAttributions || SEED_CUSTOMER_ATTRIBUTIONS,
          merchantCampaigns: parsed.merchantCampaigns || SEED_MERCHANT_CAMPAIGNS,
          failedDeliveryDisputes: parsed.failedDeliveryDisputes || SEED_FAILED_DISPUTES,
          userAccounts: (parsed.userAccounts && parsed.userAccounts.length > 0)
            ? parsed.userAccounts
            : SEED_USER_ACCOUNTS,
        };
      }
    } catch (e) {
      console.warn('Could not load stored platform state, using seed defaults', e);
    }

    return {
      config: INITIAL_PLATFORM_CONFIG,
      currentSession: SESSIONS.founder,
      merchants: SEED_MERCHANTS,
      products: SEED_PRODUCTS,
      iboProfiles: SEED_IBO_PROFILES,
      iboListings: SEED_IBO_LISTINGS,
      agents: SEED_AGENTS,
      orders: SEED_ORDERS,
      ledger: SEED_LEDGER,
      kycSubmissions: SEED_KYC_SUBMISSIONS,
      withdrawals: [],
      iboReferralTrees: SEED_REFERRAL_TREES,
      customerAttributions: SEED_CUSTOMER_ATTRIBUTIONS,
      merchantCampaigns: SEED_MERCHANT_CAMPAIGNS,
      failedDeliveryDisputes: SEED_FAILED_DISPUTES,
      userAccounts: SEED_USER_ACCOUNTS,
    };
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist platform state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public getState(): PlatformState {
    return this.state;
  }

  // ==========================================
  // CONFIG MANAGEMENT [TODO(config) Center]
  // ==========================================
  public updateConfig(newConfig: Partial<PlatformConfig>, skipNotify?: boolean): void {
    this.state.config = { ...this.state.config, ...newConfig };
    this.saveState();
    if (!skipNotify) {
      this.notify();
    }
  }

  // Remote Sync Methods for Supabase / PostgreSQL Backend Sync
  public syncOrdersFromRemote(remoteOrders: Order[]): void {
    this.state.orders = remoteOrders;
    this.saveState();
  }

  public syncProductsFromRemote(remoteProducts: Product[]): void {
    this.state.products = remoteProducts;
    this.saveState();
  }

  public syncLedgerFromRemote(remoteEntries: LedgerEntry[]): void {
    this.state.ledger = remoteEntries;
    this.saveState();
  }

  public syncIbosFromRemote(remoteIbos: Record<string, IboProfile>): void {
    this.state.iboProfiles = { ...this.state.iboProfiles, ...remoteIbos };
    this.saveState();
  }

  public syncMerchantsFromRemote(remoteMerchants: any[]): void {
    const map = new Map<string, any>();
    this.state.merchants.forEach((m) => map.set(m.id, m));
    remoteMerchants.forEach((m) => map.set(m.id, { ...map.get(m.id), ...m }));
    this.state.merchants = Array.from(map.values());
    this.saveState();
  }

  public syncAgentsFromRemote(remoteAgents: DeliveryAgentProfile[]): void {
    const map = new Map<string, DeliveryAgentProfile>();
    this.state.agents.forEach((a) => map.set(a.id, a));
    remoteAgents.forEach((a) => map.set(a.id, { ...map.get(a.id), ...a }));
    this.state.agents = Array.from(map.values());
    this.saveState();
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================
  public switchSession(role: keyof typeof SESSIONS): void {
    this.state.currentSession = SESSIONS[role];
    this.saveState();
  }

  public setCustomSession(session: UserSession): void {
    this.state.currentSession = session;
    this.saveState();
  }

  // ==========================================
  // USER ACCOUNTS & AUTH MANAGEMENT
  // ==========================================
  public getUserAccounts(): AppUser[] {
    return this.state.userAccounts || SEED_USER_ACCOUNTS;
  }

  public createUserAccount(user: AppUser): AppUser {
    if (!this.state.userAccounts) {
      this.state.userAccounts = [...SEED_USER_ACCOUNTS];
    }
    const existingIndex = this.state.userAccounts.findIndex(
      (u) =>
        u.id === user.id ||
        (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
        (u.username && user.username && u.username.toLowerCase() === user.username.toLowerCase())
    );
    if (existingIndex >= 0) {
      this.state.userAccounts[existingIndex] = { ...this.state.userAccounts[existingIndex], ...user };
    } else {
      this.state.userAccounts.unshift(user);
    }
    this.saveState();
    this.notify();
    return user;
  }

  public switchSessionToAccount(user: AppUser): void {
    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: `auth-token-${user.id}-${Date.now()}`,
      isVerified: user.tokenVerified,
      twoFactorEnabled: false,
      iboId: user.role === 'ibo' ? (user.entityId || 'ibo-1') : undefined,
      merchantId: user.role === 'merchant' ? (user.entityId || 'mrc-1') : undefined,
      agentId: user.role === 'agent' ? (user.entityId || 'agt-1') : undefined,
      customerId: user.role === 'customer' ? (user.entityId || 'cust-1') : undefined,
    };
    this.state.currentSession = session;
    this.saveState();
    this.notify();
  }

  // ==========================================
  // IBO SHOP & LISTINGS MANAGEMENT
  // ==========================================
  public updateIboMarkup(
    iboId: string,
    productId: string,
    newMarkup: number
  ): { success: boolean; error?: string } {
    const listing = (this.state.iboListings[iboId] || []).find((l) => l.productId === productId);
    if (!listing) return { success: false, error: 'Listing not found' };

    // Server-side / engine rule: markup ≤ 50% of merchant price (§4)
    const maxAllowedMarkup = listing.product.merchantBasePrice * (this.state.config.maxIboMarkupPercentage / 100);
    if (newMarkup > maxAllowedMarkup) {
      return {
        success: false,
        error: `Markup exceeds 50% cap. Max allowed for this product is ₦${maxAllowedMarkup.toLocaleString()}`,
      };
    }
    if (newMarkup < 0) {
      return { success: false, error: 'Markup cannot be negative' };
    }

    listing.iboMarkup = newMarkup;
    listing.finalCustomerPrice = listing.product.merchantBasePrice + newMarkup;
    this.saveState();
    return { success: true };
  }

  public upsertIboProductPageListing(params: {
    iboId: string;
    productId: string;
    iboMarkup: number;
    customTitle: string;
    customDescription: string;
    customKeyFeatures: string[];
    customWhatsInTheBox: string;
    customWarranty: string;
    customSpecs: { label: string; value: string }[];
    galleryImages?: string[];
  }): { success: boolean; error?: string; listing?: IboListing } {
    const prod = this.state.products.find((p) => p.id === params.productId);
    if (!prod) return { success: false, error: 'Selected supplier product not found' };

    const maxAllowedMarkup =
      prod.merchantBasePrice * (this.state.config.maxIboMarkupPercentage / 100);
    if (params.iboMarkup > maxAllowedMarkup) {
      return {
        success: false,
        error: `Markup exceeds 50% cap. Max allowed for this product is ₦${maxAllowedMarkup.toLocaleString()}`,
      };
    }
    if (params.iboMarkup < 0) {
      return { success: false, error: 'Markup cannot be negative' };
    }

    if (!this.state.iboListings[params.iboId]) {
      this.state.iboListings[params.iboId] = [];
    }

    // Ensure supplier is in IBO's selectedMerchantIds if capacity allows
    const iboProfile = this.state.iboProfiles[params.iboId];
    if (iboProfile && !iboProfile.selectedMerchantIds.includes(prod.merchantId)) {
      const tierConfig = this.state.config.tierCaps[iboProfile.tier];
      if (iboProfile.selectedMerchantIds.length < tierConfig.maxSelectableMerchants) {
        iboProfile.selectedMerchantIds.push(prod.merchantId);
      }
    }

    const updatedProd: Product = {
      ...prod,
      title: params.customTitle.trim() || prod.title,
      description: params.customDescription.trim() || prod.description,
      keyFeatures: params.customKeyFeatures.filter(Boolean),
      whatsInTheBox: params.customWhatsInTheBox.trim() || prod.whatsInTheBox,
      warranty: params.customWarranty.trim() || prod.warranty,
      specs: params.customSpecs.filter((s) => s.label.trim() && s.value.trim()),
      galleryImages:
        params.galleryImages && params.galleryImages.length > 0
          ? params.galleryImages
          : prod.galleryImages,
    };

    const existingIdx = this.state.iboListings[params.iboId].findIndex(
      (l) => l.productId === params.productId
    );

    const newListing: IboListing = {
      id:
        existingIdx >= 0
          ? this.state.iboListings[params.iboId][existingIdx].id
          : `list-${params.iboId}-${params.productId}-${Date.now()}`,
      iboId: params.iboId,
      productId: params.productId,
      product: updatedProd,
      iboMarkup: params.iboMarkup,
      finalCustomerPrice: prod.merchantBasePrice + params.iboMarkup,
      isFeaturedInShop: true,
      displayOrder: existingIdx >= 0 ? this.state.iboListings[params.iboId][existingIdx].displayOrder : 1,
      isProductPageCompleted: true,
      customTitle: params.customTitle.trim(),
      customDescription: params.customDescription.trim(),
      customKeyFeatures: params.customKeyFeatures.filter(Boolean),
      customWhatsInTheBox: params.customWhatsInTheBox.trim(),
      customWarranty: params.customWarranty.trim(),
      customSpecs: params.customSpecs.filter((s) => s.label.trim() && s.value.trim()),
    };

    if (existingIdx >= 0) {
      this.state.iboListings[params.iboId][existingIdx] = newListing;
    } else {
      this.state.iboListings[params.iboId].unshift(newListing);
    }

    this.saveState();
    return { success: true, listing: newListing };
  }

  public toggleSelectMerchantInIboHub(
    iboId: string,
    merchantId: string
  ): { success: boolean; error?: string } {
    const profile = this.state.iboProfiles[iboId];
    if (!profile) return { success: false, error: 'IBO Profile not found' };

    const currentSelection = profile.selectedMerchantIds || [];
    const isAlreadySelected = currentSelection.includes(merchantId);

    if (isAlreadySelected) {
      profile.selectedMerchantIds = currentSelection.filter((id) => id !== merchantId);
      // Remove listings for this merchant from IBO store
      if (this.state.iboListings[iboId]) {
        this.state.iboListings[iboId] = this.state.iboListings[iboId].filter(
          (l) => l.product.merchantId !== merchantId
        );
      }
      this.saveState();
      return { success: true };
    }

    // Check tier cap (§4, §7)
    const tierConfig = this.state.config.tierCaps[profile.tier];
    const maxCap = tierConfig.maxSelectableMerchants;

    if (currentSelection.length >= maxCap) {
      return {
        success: false,
        error: `Tier capacity limit reached (${maxCap} merchants). Upgrade to ${
          profile.tier === 'free' ? 'Tier 2' : 'Tier 3'
        } to select more merchants.`,
      };
    }

    profile.selectedMerchantIds.push(merchantId);

    // Auto-source active products from this merchant into IBO listings
    if (!this.state.iboListings[iboId]) {
      this.state.iboListings[iboId] = [];
    }
    const merchantProducts = this.state.products.filter(
      (p) => p.merchantId === merchantId && p.isAvailable
    );
    merchantProducts.forEach((prod) => {
      const alreadyListed = this.state.iboListings[iboId].some((l) => l.productId === prod.id);
      if (!alreadyListed) {
        const defaultMarkup = Math.min(
          Math.round(prod.merchantBasePrice * 0.15),
          Math.round(prod.merchantBasePrice * 0.5)
        );
        this.state.iboListings[iboId].push({
          id: `list-${iboId}-${prod.id}`,
          iboId,
          productId: prod.id,
          product: { ...prod },
          iboMarkup: defaultMarkup,
          finalCustomerPrice: prod.merchantBasePrice + defaultMarkup,
          isFeaturedInShop: true,
          displayOrder: 0,
        });
      }
    });

    this.saveState();
    return { success: true };
  }

  public updateIboBranding(
    iboId: string,
    branding: Partial<IboProfile['shopBranding']>
  ): void {
    const profile = this.state.iboProfiles[iboId];
    if (profile) {
      profile.shopBranding = { ...profile.shopBranding, ...branding };
      this.saveState();
    }
  }

  public upgradeIboTier(iboId: string, newTier: 'tier_2' | 'tier_3'): void {
    const profile = this.state.iboProfiles[iboId];
    if (profile) {
      profile.tier = newTier;
      this.saveState();
    }
  }

  public completeTraining(iboId: string): void {
    const profile = this.state.iboProfiles[iboId];
    if (profile) {
      profile.completedTraining = true;
      if (!profile.cosmeticBadges.includes('Affiliate Operations Certified')) {
        profile.cosmeticBadges.push('Affiliate Operations Certified');
      }
      this.saveState();
    }
  }

  // ==========================================
  // ORDER & CHECKOUT MANAGEMENT
  // ==========================================
  public createOrder(params: {
    iboId: string;
    iboSlug: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: { product: Product; iboMarkup: number; quantity: number }[];
    paymentMethod: 'pay_on_delivery' | 'online_paystack' | 'bank_transfer';
  }): Order {
    let subtotal = 0;
    let totalMarkup = 0;

    const orderItems = params.items.map((item) => {
      const itemSubtotal = (item.product.merchantBasePrice + item.iboMarkup) * item.quantity;
      subtotal += itemSubtotal;
      totalMarkup += item.iboMarkup * item.quantity;

      return {
        productId: item.product.id,
        productTitle: item.product.title,
        merchantId: item.product.merchantId,
        merchantName: item.product.merchantName,
        merchantBasePrice: item.product.merchantBasePrice,
        iboMarkup: item.iboMarkup,
        unitPrice: item.product.merchantBasePrice + item.iboMarkup,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        fulfillmentType: item.product.fulfillmentType,
      };
    });

    const deliveryFee = 3500; // standard delivery fee
    const totalAmount = subtotal + deliveryFee;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-2026-${randomSuffix}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      iboId: params.iboId,
      iboSlug: params.iboSlug,
      customerId: `cust-${Date.now()}`,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      deliveryAddress: params.deliveryAddress,
      items: orderItems,
      subtotal,
      totalMarkup,
      deliveryFee,
      totalAmount,
      paymentMethod: params.paymentMethod,
      paymentStatus: 'held_in_escrow',
      orderStatus: 'placed',
      // Pickup QR token for depot verification
      pickupQrToken: `QR-PICKUP-${randomSuffix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      isPickupConfirmed: false,
      // Unique single-use time-boxed token for customer verification
      confirmationQrToken: `QR-CONFIRM-${randomSuffix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      qrExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      isQrScanned: false,
      createdAt: new Date().toISOString(),
    };

    // Phase 1 (§6): Record pending escrow in double-entry ledger (state: 'pending')
    const escrowHold = LedgerEngine.createPendingEscrow(newOrder, this.state.config);
    this.state.ledger.push(...escrowHold.entries);

    // Deduct stock from purchased products and synchronize listings
    params.items.forEach((item) => {
      const prod = this.state.products.find((p) => p.id === item.product.id);
      if (prod) {
        prod.stockQty = Math.max(0, prod.stockQty - item.quantity);
        if (prod.stockQty === 0) {
          prod.isAvailable = false;
        }
        // Synchronize across IBO listings
        Object.values(this.state.iboListings).forEach((listings) => {
          const l = listings.find((listing) => listing.productId === prod.id);
          if (l) {
            l.product.stockQty = prod.stockQty;
            l.product.isAvailable = prod.isAvailable;
          }
        });
      }
    });

    this.state.orders.unshift(newOrder);
    this.saveState();
    return newOrder;
  }

  // Assign Delivery Agent
  public assignDeliveryAgent(orderId: string, agentId: string): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (order && agent) {
      order.agentId = agent.id;
      order.agentName = agent.name;
      order.agentPhone = agent.phone;
      order.agentVehicle = `${agent.vehicleType.toUpperCase()} (${agent.vehiclePlate})`;
      order.orderStatus = 'in_transit';
      this.saveState();
    }
  }

  // Claim Order by Delivery Agent
  public claimOrderAsAgent(orderId: string, agentId: string): { success: boolean; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (!order) return { success: false, error: 'Order not found' };
    if (!agent) return { success: false, error: 'Agent not found' };

    order.agentId = agent.id;
    order.agentName = agent.name;
    order.agentPhone = agent.phone;
    order.agentVehicle = `${agent.vehicleType.toUpperCase()} (${agent.vehiclePlate})`;
    order.orderStatus = 'dispatched';
    this.saveState();
    return { success: true };
  }

  // Regenerate random confirmation QR token for delivery handover (Rule §5 & §9)
  public regenerateDeliveryQrToken(orderId: string): string {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return '';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const entropy = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suffix = order.orderNumber?.split('-')?.[2] || 'ORD';
    const newToken = `QR-CONFIRM-${suffix}-${randomHex}-${entropy}`;
    order.confirmationQrToken = newToken;
    order.qrExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.saveState();
    return newToken;
  }

  // Regenerate random pickup QR token for depot / warehouse handover
  public regeneratePickupQrToken(orderId: string): string {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return '';
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const suffix = order.orderNumber?.split('-')?.[2] || 'ORD';
    const newToken = `QR-PICKUP-${suffix}-${randomHex}`;
    order.pickupQrToken = newToken;
    this.saveState();
    return newToken;
  }

  // Confirm order pickup from depot / warehouse
  public confirmOrderPickup(orderId: string, scannedToken?: string): { success: boolean; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    if (scannedToken && order.pickupQrToken) {
      let cleanToken = scannedToken.trim();
      try {
        const parsed = JSON.parse(scannedToken);
        if (parsed.token) cleanToken = parsed.token.trim();
      } catch {}
      if (cleanToken !== order.pickupQrToken) {
        return { success: false, error: 'Invalid pickup verification token' };
      }
    }

    order.isPickupConfirmed = true;
    order.orderStatus = 'in_transit';
    order.pickedUpAt = new Date().toISOString();
    if (!order.agentLiveLocation || order.agentLiveLocation.leg === 'to_pickup') {
      order.agentLiveLocation = {
        lat: order.pickupLocation?.lat ?? 6.5965,
        lng: order.pickupLocation?.lng ?? 3.3421,
        progressPct: 8,
        leg: 'to_delivery',
        updatedAt: new Date().toISOString(),
      };
    }
    this.saveState();
    return { success: true };
  }

  // Update real-time courier location & progress along pickup -> delivery route
  public updateOrderLiveTracking(
    orderId: string,
    update: {
      lat: number;
      lng: number;
      progressPct: number;
      leg: 'to_pickup' | 'to_delivery' | 'arrived';
      markArrived?: boolean;
    }
  ): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.agentLiveLocation = {
      lat: update.lat,
      lng: update.lng,
      progressPct: Math.max(0, Math.min(100, Math.round(update.progressPct))),
      leg: update.leg,
      updatedAt: new Date().toISOString(),
    };

    if (update.markArrived && order.orderStatus !== 'delivered' && order.orderStatus !== 'failed_delivery') {
      order.orderStatus = 'arrived_at_customer';
    } else if (
      update.leg === 'to_delivery' &&
      order.isPickupConfirmed &&
      order.orderStatus === 'dispatched'
    ) {
      order.orderStatus = 'in_transit';
    }

    if (order.agentId) {
      const agent = this.state.agents.find((a) => a.id === order.agentId);
      if (agent) {
        agent.currentLocation = {
          ...agent.currentLocation,
          lat: update.lat,
          lng: update.lng,
        };
      }
    }

    this.saveState();
  }

  // Complete Delivery via QR Scan (§5, §9: SOLE completion event!)
  public confirmDeliveryWithQr(
    orderId: string,
    scannedToken: string
  ): { success: boolean; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    let cleanToken = scannedToken.trim();
    try {
      const parsed = JSON.parse(scannedToken);
      if (parsed.token) cleanToken = parsed.token.trim();
    } catch {}

    if (order.confirmationQrToken.trim() !== cleanToken) {
      return { success: false, error: 'Invalid QR verification token for this order' };
    }

    if (order.isQrScanned || order.orderStatus === 'delivered') {
      return { success: false, error: 'This delivery has already been confirmed' };
    }

    // Mark confirmed
    order.isQrScanned = true;
    order.orderStatus = 'delivered';
    order.paymentStatus = 'completed';
    order.deliveredAt = new Date().toISOString();

    // Settle double-entry ledger!
    const iboProfile = this.state.iboProfiles[order.iboId];
    const referralChain = {
      tier1IboId: iboProfile?.referredById || undefined,
      tier2IboId: undefined, // simulated from graph
      tier3IboId: undefined,
    };

    const settlement = LedgerEngine.settleSuccessfulDelivery(order, this.state.config, referralChain);
    this.state.ledger.push(...settlement.pipeAEntries, ...settlement.pipeBEntries);

    this.saveState();

    // Asynchronously synchronize confirmed delivery and ledger entries to Firestore
    import('./supabaseSync')
      .then(({ syncOrderMutation }) => {
        syncOrderMutation(order, [...settlement.pipeAEntries, ...settlement.pipeBEntries]).catch((err) =>
          console.warn('Firestore delivery order mutation notice:', err)
        );
      })
      .catch(() => {});

    return { success: true };
  }

  // Process Unsuccessful Delivery Recoup (§6 & §5: 15/15/20 Rule)
  public markDeliveryFailed(
    orderId: string,
    reason: 'customer_refused' | 'wrong_or_damaged_item' | 'agent_no_show' | 'other'
  ): RecoupResult | null {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.orderStatus = 'failed_delivery';
    order.failureReason = reason;

    const recoup = LedgerEngine.settleUnsuccessfulDeliveryRecoup(order, reason, this.state.config);
    this.state.ledger.push(...recoup.refundEntries, ...recoup.recoupEntries);

    order.failureRecoupDetails = {
      totalRecoup: recoup.totalRecoupAmount,
      iboCharge: recoup.iboCharged,
      merchantCharge: recoup.merchantCharged,
      founderCharge: recoup.founderCharged,
      faultParty: reason.replace(/_/g, ' ').toUpperCase(),
    };

    // Create FailedDeliveryDispute tracking record for Stage 2 review (§5)
    const newDispute: FailedDeliveryDispute = {
      id: `dsp-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      failureReason: reason,
      stage: 'stage1_applied',
      standard151520AppliedAt: new Date().toISOString(),
      disputeClaimant: reason === 'customer_refused' ? 'customer' : 'agent',
      disputeReason: `Delivery marked as failed (${reason.replace(/_/g, ' ')}). Stage 1 standard 15/15/20 split applied.`,
      claimedAt: new Date().toISOString(),
      adjudicationStatus: 'pending',
    };
    this.state.failedDeliveryDisputes.unshift(newDispute);

    this.saveState();
    return recoup;
  }

  // Adjudicate Stage 2 Delivery Dispute (§5)
  public adjudicateFailedDeliveryDispute(
    disputeId: string,
    status: 'adjusted' | 'upheld' | 'dismissed',
    notes?: string
  ): void {
    const dispute = this.state.failedDeliveryDisputes.find((d) => d.id === disputeId);
    if (dispute) {
      dispute.adjudicationStatus = status;
      dispute.adjudicationNotes = notes;
      dispute.stage = 'resolved';
      dispute.resolvedAt = new Date().toISOString();
      this.saveState();
    }
  }

  // ==========================================
  // MERCHANT TIER & CAMPAIGN MANAGEMENT
  // ==========================================
  public updateMerchantTier(merchantId: string, newTier: MerchantTier): { success: boolean; error?: string } {
    const merchant = this.state.merchants.find((m) => m.id === merchantId);
    if (!merchant) return { success: false, error: 'Merchant not found' };

    const tierConfig = this.state.config.merchantTiers[newTier];
    if (!tierConfig) return { success: false, error: 'Invalid merchant tier' };

    const merchantProducts = this.state.products.filter((p) => p.merchantId === merchantId);
    if (merchantProducts.length > tierConfig.maxActiveProducts) {
      return {
        success: false,
        error: `Cannot downgrade: Active product count (${merchantProducts.length}) exceeds ${tierConfig.name} limit (${tierConfig.maxActiveProducts}). Please archive products first.`,
      };
    }

    merchant.tier = newTier;
    this.saveState();
    return { success: true };
  }

  public createMerchantCampaign(
    campaign: Omit<MerchantAdvertisingCampaign, 'id' | 'createdAt' | 'spent' | 'impressions' | 'clicks' | 'iboPickups'>
  ): MerchantAdvertisingCampaign {
    const newCampaign: MerchantAdvertisingCampaign = {
      ...campaign,
      id: `cmp-${Date.now()}`,
      spent: 0,
      impressions: 0,
      clicks: 0,
      iboPickups: 0,
      createdAt: new Date().toISOString(),
    };
    this.state.merchantCampaigns.unshift(newCampaign);
    this.saveState();
    return newCampaign;
  }

  // ==========================================
  // CUSTOMER ATTRIBUTION (90-Day Lock §3)
  // ==========================================
  public recordCustomerAttribution(params: {
    customerId: string;
    customerPhone?: string;
    customerEmail?: string;
    iboId: string;
    source: 'qr_flyer' | 'shared_link' | 'merchant_hub' | 'direct';
  }): CustomerAttribution {
    const ibo = this.state.iboProfiles[params.iboId];
    const existing = this.state.customerAttributions.find((a) => a.customerId === params.customerId);
    const now = new Date();
    const durationDays = this.state.config.customerAttributionDays || 90;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    if (existing) {
      if (new Date(existing.expiresAt) > now) {
        return existing;
      }
      existing.attributedIboId = params.iboId;
      existing.attributedIboName = ibo?.name || 'IBO';
      existing.attributionSource = params.source;
      existing.attributedAt = now.toISOString();
      existing.expiresAt = expiresAt;
      this.saveState();
      return existing;
    }

    const newAttr: CustomerAttribution = {
      id: `attr-${Date.now()}`,
      customerId: params.customerId,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      attributedIboId: params.iboId,
      attributedIboName: ibo?.name || 'IBO',
      attributionSource: params.source,
      attributedAt: now.toISOString(),
      firstOrderAt: now.toISOString(),
      lastOrderAt: now.toISOString(),
      ordersCount: 0,
      expiresAt,
      lifetimeOrdersCount: 0,
      lifetimeGrossValue: 0,
    };
    this.state.customerAttributions.unshift(newAttr);
    this.saveState();
    return newAttr;
  }

  // ==========================================
  // PARTICIPANT KYC SUBMISSION FLOW
  // ==========================================
  public submitKyc(submission: Omit<KYCSubmission, 'id' | 'submittedAt' | 'status'>): KYCSubmission {
    const newSubmission: KYCSubmission = {
      ...submission,
      id: `kyc-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.state.kycSubmissions.unshift(newSubmission);
    this.saveState();
    return newSubmission;
  }

  // ==========================================
  // MERCHANT MANAGEMENT
  // ==========================================
  public addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.products.unshift(newProduct);

    // If an IBO is currently sourcing this merchant, auto-list this product in their catalog
    Object.values(this.state.iboProfiles).forEach((ibo) => {
      if ((ibo.selectedMerchantIds || []).includes(newProduct.merchantId)) {
        if (!this.state.iboListings[ibo.id]) {
          this.state.iboListings[ibo.id] = [];
        }
        const defaultMarkup = Math.min(
          Math.round(newProduct.merchantBasePrice * 0.15),
          Math.round(newProduct.merchantBasePrice * 0.5)
        );
        this.state.iboListings[ibo.id].push({
          id: `list-${ibo.id}-${newProduct.id}`,
          iboId: ibo.id,
          productId: newProduct.id,
          product: { ...newProduct },
          iboMarkup: defaultMarkup,
          finalCustomerPrice: newProduct.merchantBasePrice + defaultMarkup,
          isFeaturedInShop: true,
          displayOrder: 0,
        });
      }
    });

    this.saveState();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Product>): void {
    const product = this.state.products.find((p) => p.id === productId);
    if (product) {
      Object.assign(product, updates);
      // Synchronize across IBO listings that feature this product
      Object.values(this.state.iboListings).forEach((listings) => {
        listings.forEach((listing) => {
          if (listing.productId === productId) {
            listing.product = { ...product };
            listing.finalCustomerPrice = product.merchantBasePrice + listing.iboMarkup;
          }
        });
      });
      this.saveState();
    }
  }

  // ==========================================
  // KYC APPROVALS [Admin Panel]
  // ==========================================
  public reviewKyc(
    kycId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): void {
    const kyc = this.state.kycSubmissions.find((k) => k.id === kycId);
    if (kyc) {
      kyc.status = status;
      kyc.reviewNotes = notes;

      // If approved, update entity verification
      if (status === 'approved') {
        if (kyc.role === 'merchant') {
          const m = this.state.merchants.find((merchant) => merchant.userId === kyc.userId);
          if (m) m.isVerified = true;
        }
      }
      this.saveState();
    }
  }

  // ==========================================
  // WALLET & WITHDRAWALS
  // ==========================================
  public requestWithdrawal(
    userId: string,
    role: UserSession['role'],
    amount: number,
    bankDetails: { bankName: string; accountNumber: string; accountName: string }
  ): { success: boolean; error?: string } {
    if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };

    let accountPrefix = '';
    if (role === 'merchant') accountPrefix = `merchant_payable:${userId}`;
    else if (role === 'agent') accountPrefix = `agent_payable:${userId}`;
    else if (role === 'ibo') accountPrefix = `ibo_payable:${userId}`;

    if (accountPrefix) {
      const balance = this.getWalletBalanceForAccount(accountPrefix);
      const pendingSum = this.state.withdrawals
        .filter((w) => w.userId === userId && w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

      const trueAvailable = balance.availableBalance - pendingSum;
      if (amount > trueAvailable) {
        return {
          success: false,
          error: `Insufficient available funds. Your current unallocated balance is ₦${Math.max(0, trueAvailable).toLocaleString()}.`,
        };
      }
    }

    const newWithdrawal: WithdrawalRequest = {
      id: `wth-${Date.now()}`,
      userId,
      role,
      amount,
      bankName: bankDetails.bankName,
      accountNumber: bankDetails.accountNumber,
      accountName: bankDetails.accountName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    this.state.withdrawals.unshift(newWithdrawal);
    this.saveState();
    return { success: true };
  }

  public processWithdrawal(withdrawalId: string, approve: boolean): void {
    const w = this.state.withdrawals.find((item) => item.id === withdrawalId);
    if (w) {
      w.status = approve ? 'processed' : 'rejected';
      w.processedAt = new Date().toISOString();

      if (approve) {
        let account = '';
        if (w.role === 'merchant') account = `merchant_payable:${w.userId}`;
        else if (w.role === 'agent') account = `agent_payable:${w.userId}`;
        else if (w.role === 'ibo') account = `ibo_payable:${w.userId}`;

        if (account) {
          this.state.ledger.push({
            id: `LEDGER-WTH-${w.id}`,
            transactionId: `TX-WTH-${w.id}`,
            orderId: w.id,
            orderNumber: `WTH-${w.id.slice(-6).toUpperCase()}`,
            pipe: 'withdrawal',
            debitAccount: account,
            creditAccount: 'platform_bank_clearing',
            amount: w.amount,
            currency: 'NGN',
            memo: `Bank payout disbursement to ${w.accountName} (${w.bankName} • ${w.accountNumber})`,
            timestamp: new Date().toISOString(),
            isSettled: true,
            state: 'confirmed',
          });
        }
      }

      this.saveState();
    }
  }

  // Calculate wallet balance from double-entry ledger with strict state handling
  public getWalletBalanceForAccount(accountPrefix: string): WalletBalance {
    return LedgerEngine.calculateWalletBalance(accountPrefix, this.state.ledger);
  }

  // Audit Ledger Balance Invariant (§6)
  public auditLedger(): LedgerAuditReport {
    return LedgerEngine.auditLedger(this.state.ledger);
  }

  // Manual Agent Assignment (§5, §10)
  public assignAgentToOrder(orderId: string, agentId: string): { success: boolean; error?: string } {
    const order = this.state.orders.find((o) => o.id === orderId);
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (!order) return { success: false, error: 'Order not found' };
    if (!agent) return { success: false, error: 'Agent not found' };

    order.agentId = agent.id;
    order.agentName = agent.name;
    order.agentPhone = agent.phone;
    order.agentVehicle = `${agent.vehicleType.toUpperCase()} (${agent.vehiclePlate})`;
    order.orderStatus = 'in_transit';
    this.saveState();
    return { success: true };
  }

  // KYC Review Helper
  public updateKycStatus(kycId: string, status: 'approved' | 'rejected'): void {
    this.reviewKyc(kycId, status);
  }

  // Onboard new IBO (§1a, §4, §8)
  public registerIbo(params: {
    name: string;
    email: string;
    phone: string;
    slug: string;
    storeName: string;
    referralCodeUsed?: string;
    password?: string;
    username?: string;
  }): IboProfile {
    const newId = `ibo-${Date.now()}`;
    const referralCode = `${params.name.substring(0, 4).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    const cleanRef = params.referralCodeUsed?.trim().toUpperCase();
    const referringIbo = cleanRef && cleanRef !== 'FOUNDER'
      ? Object.values(this.state.iboProfiles).find(
          (i) => i.referralCode.toUpperCase() === cleanRef
        )
      : undefined;

    // Any signup without referral code falls back to under the founder tier 1 referral
    const referredById = referringIbo ? referringIbo.id : 'founder';

    const newProfile: IboProfile = {
      id: newId,
      iboNumber: `IBO-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: `usr-${newId}`,
      name: params.name,
      slug: params.slug,
      referralCode,
      tier: 'free',
      referredById,
      tier1Count: 0,
      tier2Count: 0,
      tier3Count: 0,
      shopBranding: {
        storeName: params.storeName,
        tagline: 'Direct verified equipment & agro supplies',
        accentColor: '#0F766E',
        supportEmail: params.email,
        supportPhone: params.phone,
      },
      selectedMerchantIds: ['mrc-1', 'mrc-3'],
      completedTraining: false,
      cosmeticBadges: [],
      isBoostedOnFounderHome: false,
    };

    this.state.iboProfiles[newId] = newProfile;

    // Create corresponding AppUser for email/username/phone password login
    const cleanUsername = params.username
      ? params.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : params.slug.replace(/[^a-z0-9_]/g, '_');
    const userAccount: AppUser = {
      id: `usr-${newId}`,
      name: params.name,
      email: params.email.toLowerCase(),
      username: cleanUsername || `ibo_${newId.slice(-6)}`,
      phone: params.phone,
      passwordHash: params.password || 'password123',
      role: 'ibo',
      entityId: newId,
      tokenVerified: true,
      createdAt: new Date().toISOString(),
    };
    this.createUserAccount(userAccount);

    // Initialize initial curated listings for this new IBO
    const prod1 = this.state.products?.[0] || SEED_PRODUCTS[0];
    const prod2 = this.state.products?.[2] || this.state.products?.[0] || SEED_PRODUCTS[1] || SEED_PRODUCTS[0];
    this.state.iboListings[newId] = [
      {
        id: `lst-${Date.now()}-1`,
        iboId: newId,
        productId: prod1?.id || 'prod-1',
        product: prod1,
        iboMarkup: 2000,
        finalCustomerPrice: (prod1?.merchantBasePrice ?? 5000) + 2000,
        isFeaturedInShop: true,
        displayOrder: 1,
      },
      {
        id: `lst-${Date.now()}-2`,
        iboId: newId,
        productId: prod2?.id || 'prod-3',
        product: prod2,
        iboMarkup: 4000,
        finalCustomerPrice: (prod2?.merchantBasePrice ?? 8000) + 4000,
        isFeaturedInShop: true,
        displayOrder: 2,
      },
    ];

    // Attribution handling (§8)
    if (referringIbo) {
      referringIbo.tier1Count += 1;
      if (!this.state.iboReferralTrees[referringIbo.id]) {
        this.state.iboReferralTrees[referringIbo.id] = [];
      }
      this.state.iboReferralTrees[referringIbo.id].unshift({
        id: `ref-node-${Date.now()}`,
        name: params.name,
        email: params.email,
        referralCode,
        tierLevel: 1,
        joinDate: new Date().toISOString().split('T')[0],
        activeShopListings: 2,
        totalSalesVolume: 0,
        earnedFromMember: 0,
      });

      // Upline Tier 2 attribution
      if (referringIbo.referredById && referringIbo.referredById !== 'founder') {
        const tier2Ibo = this.state.iboProfiles[referringIbo.referredById];
        if (tier2Ibo) {
          tier2Ibo.tier2Count = (tier2Ibo.tier2Count || 0) + 1;
          if (!this.state.iboReferralTrees[tier2Ibo.id]) {
            this.state.iboReferralTrees[tier2Ibo.id] = [];
          }
          this.state.iboReferralTrees[tier2Ibo.id].unshift({
            id: `ref-node-t2-${Date.now()}`,
            name: params.name,
            email: params.email,
            referralCode,
            tierLevel: 2,
            joinDate: new Date().toISOString().split('T')[0],
            activeShopListings: 2,
            totalSalesVolume: 0,
            earnedFromMember: 0,
          });
        }
      }
    } else {
      // Any signup without referral code falls back to under the founder tier 1 referral!
      if (!this.state.iboReferralTrees['founder']) {
        this.state.iboReferralTrees['founder'] = [];
      }
      this.state.iboReferralTrees['founder'].unshift({
        id: `ref-node-f-${Date.now()}`,
        name: params.name,
        email: params.email,
        referralCode,
        tierLevel: 1,
        joinDate: new Date().toISOString().split('T')[0],
        activeShopListings: 2,
        totalSalesVolume: 0,
        earnedFromMember: 0,
      });
    }

    this.saveState();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeIboId', newProfile.id);
      } catch (e) {}
    }
    // Asynchronously push to Firebase Firestore
    import('./supabaseSync').then(({ pushIboToFirestore, syncUserAccountToFirestore }) => {
      pushIboToFirestore(newProfile).catch((err) => console.warn('Firestore IBO persistence notice:', err));
      syncUserAccountToFirestore(userAccount).catch((err) => console.warn('Firestore user persistence notice:', err));
    }).catch(() => {});

    return newProfile;
  }

  // Onboard new Delivery Agent (§2, §5)
  public registerDeliveryAgent(params: {
    name: string;
    phone: string;
    email?: string;
    vehicleType: VehicleType;
    vehiclePlate: string;
    operatingAreas: string[];
    referralCodeUsed?: string;
    documentType?: string;
    documentNumber?: string;
    documentFileName?: string;
    documentDataUrl?: string;
    password?: string;
    username?: string;
  }): DeliveryAgentProfile {
    const newId = `agt-${Date.now()}`;
    const agentNumber = `DEL-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const initials = (params.name || 'Agent')
      .split(' ')
      .filter(Boolean)
      .map((n) => n?.[0] || '')
      .join('')
      .toUpperCase() || 'AGT';
    const referralCode = `${initials}-${(params.vehicleType || 'BIKE').toUpperCase().substring(0, 4)}-${Math.floor(10 + Math.random() * 90)}`;

    let referringAgent: DeliveryAgentProfile | undefined;
    if (params.referralCodeUsed) {
      const cleanRef = params.referralCodeUsed.trim().toUpperCase();
      if (cleanRef && cleanRef !== 'FOUNDER') {
        referringAgent = this.state.agents.find(
          (a) => a.referralCode.toUpperCase() === cleanRef
        );
      }
      if (referringAgent) {
        referringAgent.tier1AgentCount = (referringAgent.tier1AgentCount || 0) + 1;
        if (referringAgent.referredByAgentId && referringAgent.referredByAgentId !== 'founder') {
          const parentAgent = this.state.agents.find(
            (a) => a.id === referringAgent!.referredByAgentId
          );
          if (parentAgent) {
            parentAgent.tier2AgentCount = (parentAgent.tier2AgentCount || 0) + 1;
          }
        }
      }
    }

    const newAgent: DeliveryAgentProfile = {
      id: newId,
      agentNumber,
      userId: `usr-${newId}`,
      name: params.name,
      phone: params.phone,
      vehicleType: params.vehicleType,
      vehiclePlate: params.vehiclePlate.toUpperCase(),
      referralCode,
      // Any signup without referral code falls back to under the founder tier 1 referral!
      referredByAgentId: referringAgent ? referringAgent.id : 'founder',
      tier1AgentCount: 0,
      tier2AgentCount: 0,
      tier3AgentCount: 0,
      operatingAreas: (params.operatingAreas && params.operatingAreas.length > 0) ? params.operatingAreas : ['Ikeja', 'Maryland', 'Lekki'],
      isInspectionPassed: true,
      inspectionDate: new Date().toISOString(),
      currentLocation: {
        lat: 6.5244,
        lng: 3.3792,
        areaName: `${params.operatingAreas?.[0] || 'Lagos Hub'} Dispatch Center`,
      },
      isOnline: true,
      isAvailable: true,
      activeDeliveriesCount: 0,
    };

    this.state.agents.push(newAgent);

    // Create corresponding AppUser for email/username/phone password login
    const cleanUsername = params.username
      ? params.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : `${initials.toLowerCase()}_${newId.slice(-6)}`;
    const userAccount: AppUser = {
      id: `usr-${newId}`,
      name: params.name,
      email: (params.email || `${initials.toLowerCase()}@logistics.ng`).toLowerCase(),
      username: cleanUsername,
      phone: params.phone,
      passwordHash: params.password || 'password123',
      role: 'agent',
      entityId: newId,
      tokenVerified: true,
      createdAt: new Date().toISOString(),
    };
    this.createUserAccount(userAccount);

    // If documents were provided, register a KYC submission
    if (params.documentType || params.documentDataUrl || params.documentFileName) {
      const kycSub: KYCSubmission = {
        id: `kyc-${Date.now()}`,
        userId: newAgent.userId,
        userName: newAgent.name,
        role: 'agent',
        entityName: `${newAgent.name} Logistics (${newAgent.vehiclePlate})`,
        submittedAt: new Date().toISOString(),
        status: 'approved',
        documentType: params.documentType || "Driver's License & Vehicle Registration",
        documentNumber: params.documentNumber || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        documentUrl: params.documentDataUrl || '',
        documents: params.documentFileName
          ? [
              {
                name: params.documentFileName,
                type: params.documentType || "Driver's License",
                fileUrl: params.documentDataUrl || '',
                verified: true,
              },
            ]
          : [],
      };
      this.state.kycSubmissions.unshift(kycSub);
    }

    this.saveState();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeAgentId', newAgent.id);
      } catch (e) {}
    }
    // Asynchronously push to Firebase Firestore
    import('./supabaseSync').then(({ pushAgentToFirestore, pushKycToFirestore, syncUserAccountToFirestore }) => {
      pushAgentToFirestore(newAgent).catch((err) => console.warn('Firestore agent persistence notice:', err));
      syncUserAccountToFirestore(userAccount).catch((err) => console.warn('Firestore user persistence notice:', err));
      if (params.documentType || params.documentDataUrl || params.documentFileName) {
        const kyc = this.state.kycSubmissions[0];
        if (kyc) pushKycToFirestore(kyc).catch(() => {});
      }
    }).catch(() => {});

    return newAgent;
  }

  // Attach an uploaded file to an existing KYC record
  public attachDocumentToKyc(
    kycId: string,
    doc: { name: string; type: string; fileUrl: string; verified?: boolean }
  ): boolean {
    const kyc = this.state.kycSubmissions.find((k) => k.id === kycId);
    if (!kyc) return false;
    if (!kyc.documents) kyc.documents = [];
    kyc.documents.push({
      name: doc.name,
      type: doc.type,
      fileUrl: doc.fileUrl,
      verified: doc.verified ?? false,
    });
    if (!kyc.documentUrl && doc.fileUrl) {
      kyc.documentUrl = doc.fileUrl;
    }
    this.saveState();
    return true;
  }

  // Delivery Failure Reporting Helper (§5)
  public reportDeliveryFailure(
    orderId: string,
    reason: 'customer_unavailable' | 'wrong_address' | 'package_rejected_by_customer' | 'force_majeure',
    notes?: string
  ): { success: boolean; error?: string } {
    const internalReason = reason === 'package_rejected_by_customer' ? 'customer_refused' : 'other';
    const result = this.markDeliveryFailed(orderId, internalReason);
    if (result) {
      return { success: true };
    }
    return { success: false, error: 'Order not found' };
  }

  // Register a new Merchant / Manufacturer (§6)
  public registerMerchant(params: {
    businessName: string;
    contactEmail: string;
    contactPhone: string;
    warehouseAddress: string;
    state?: string;
    cacRegistrationNumber?: string;
    tin?: string;
    category?: string;
    referralCodeUsed?: string;
    contactName?: string;
    password?: string;
    username?: string;
  }): any {
    const newId = `mrc-${Date.now()}`;
    const cleanPrefix = (params.businessName || 'MRC')
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase() || 'MRCH';
    const referralCode = `MRC-${cleanPrefix}-${Math.floor(10 + Math.random() * 90)}`;
    const merchantCode = `MRC-${cleanPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const cleanRef = params.referralCodeUsed?.trim().toUpperCase();
    let referringMerchant = cleanRef && cleanRef !== 'FOUNDER'
      ? this.state.merchants.find(
          (m) =>
            (m.referralCode && m.referralCode.toUpperCase() === cleanRef) ||
            (m.code && m.code.toUpperCase() === cleanRef)
        )
      : undefined;

    if (referringMerchant) {
      referringMerchant.referredMerchantsCount = (referringMerchant.referredMerchantsCount || 0) + 1;
    }

    const newMerchant: any = {
      id: newId,
      userId: `usr-${newId}`,
      code: merchantCode,
      referralCode,
      referredByMerchantId: referringMerchant ? referringMerchant.id : 'founder',
      referredMerchantsCount: 0,
      businessName: params.businessName,
      tier: 'free',
      isVerified: false,
      isKycVerified: !!params.cacRegistrationNumber,
      cacRegistrationNumber: params.cacRegistrationNumber || '',
      tin: params.tin || '',
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      warehouseAddress: params.warehouseAddress,
      warehouseStockDeposited: false,
      state: params.state || 'Lagos',
      regulatoryCertifications: [],
      activeProductsCount: 0,
      totalWholesaleOrdersCompleted: 0,
    };

    this.state.merchants.push(newMerchant);

    // Create corresponding AppUser for email/username/phone password login
    const cleanUsername = params.username
      ? params.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : `${cleanPrefix.toLowerCase()}_${newId.slice(-6)}`;
    const userAccount: AppUser = {
      id: `usr-${newId}`,
      name: params.contactName || params.businessName,
      email: params.contactEmail.toLowerCase(),
      username: cleanUsername,
      phone: params.contactPhone,
      passwordHash: params.password || 'password123',
      role: 'merchant',
      entityId: newId,
      tokenVerified: true,
      createdAt: new Date().toISOString(),
    };
    this.createUserAccount(userAccount);

    // If CAC registration number provided, also register a pending KYC submission
    if (params.cacRegistrationNumber) {
      const kycSub: KYCSubmission = {
        id: `kyc-${Date.now()}`,
        userId: newMerchant.userId,
        userName: newMerchant.businessName,
        role: 'merchant',
        entityName: newMerchant.businessName,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        documentType: 'CAC Certificate',
        businessRegistrationNumber: params.cacRegistrationNumber,
        documents: [
          {
            name: 'Corporate Affairs Commission Document',
            type: 'image/png',
            fileUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
            verified: false,
          },
        ],
      };
      this.state.kycSubmissions.push(kycSub);
    }

    this.saveState();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('activeMerchantId', newMerchant.id);
      } catch (e) {}
    }
    // Asynchronously push to Firebase Firestore
    import('./supabaseSync').then(({ pushMerchantToFirestore, pushKycToFirestore, syncUserAccountToFirestore }) => {
      pushMerchantToFirestore(newMerchant).catch((err) => console.warn('Firestore merchant persistence notice:', err));
      syncUserAccountToFirestore(userAccount).catch((err) => console.warn('Firestore user persistence notice:', err));
      if (params.cacRegistrationNumber) {
        const kyc = this.state.kycSubmissions.find((k) => k.userId === newMerchant.userId);
        if (kyc) pushKycToFirestore(kyc).catch(() => {});
      }
    }).catch(() => {});

    return newMerchant;
  }

  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.saveState();
  }
}

export const platformStore = new PlatformStore();
