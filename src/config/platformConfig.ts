/**
 * Platform Configuration: Surfaces all TODO(config) requirements as named, editable values.
 * In accordance with prompt instructions, these are NOT silently buried or hardcoded.
 */

/**
 * Platform Configuration for MyOwnShop (powered by IBOHub Architecture)
 * 
 * Core architectural principle:
 * 1. IBO Network (sales & customer acquisition)
 * 2. Delivery Agent Network (logistics & courier referrals)
 * 3. Merchant Network (product supply & CAC verification)
 * These three networks are strictly isolated in the database, ledger, and commission engines.
 */

export interface PlatformConfig {
  platformName: string;
  architectureName: string;

  // Category Taxonomy: 17 comprehensive multi-vendor categories (§13)
  productCategories: { id: string; name: string; subCategories: string[]; iconName: string }[];
  serviceCategories: { id: string; name: string; subCategories: string[]; iconName: string }[];

  // IBO Product Boost & Merchant Advertising to IBOs (§14, §15)
  iboBoostPricing: {
    boost24hNgn: number;   // ₦500
    boost7dNgn: number;    // ₦2,500
    boost30dNgn: number;   // ₦7,500
  };
  merchantHubBoostPriceWeeklyNgn: number;
  maxFeaturedBoostSlots: number;

  // Customer Discovery & Attribution (§17, §18)
  customerAttributionDays: number; // 90 days default

  // Merchant Subscription Tiers (§6)
  // Subscription pays for tools/analytics/listing capacity, NEVER for commission access
  merchantTiers: {
    free: { name: string; maxActiveProducts: number; maxProducts?: number; priceMonthlyNgn: number; monthlyFeeNgn?: number; features: string[] };
    pro: { name: string; maxActiveProducts: number; maxProducts?: number; priceMonthlyNgn: number; monthlyFeeNgn?: number; features: string[] };
    business: { name: string; maxActiveProducts: number; maxProducts?: number; priceMonthlyNgn: number; monthlyFeeNgn?: number; features: string[] };
    enterprise: { name: string; maxActiveProducts: number; maxProducts?: number; priceMonthlyNgn: number; monthlyFeeNgn?: number; features: string[] };
  };

  // KYC Verification Requirements (§7, §8, §9, §10)
  kycRequirements: {
    merchant: {
      requiredDocs: string[];
      vendorProcess: string;
      targetTurnaroundHours: number;
      requiresCacVerification: boolean;
      regulatedDocTypes: string[]; // NAFDAC, SON, Food/Agric permits
    };
    ibo: {
      requiredDocs: string[];
      vendorProcess: string;
      targetTurnaroundHours: number;
      requiresBvnOrTIN: boolean;
      idPrefix: string; // e.g., 'IBO-0000'
    };
    agent: {
      requiredDocs: string[];
      vendorProcess: string;
      targetTurnaroundHours: number;
      vehicleInspectionRequired: boolean;
      vehicleDocTypes: string[];
    };
  };

  // IBO Capacity Tier System (§4, §7)
  tierCaps: {
    free: { name: string; maxSelectableMerchants: number; costMonthlyNgn: number };
    tier_2: { name: string; maxSelectableMerchants: number; costMonthlyNgn: number };
    tier_3: { name: string; maxSelectableMerchants: number; costMonthlyNgn: number };
  };

  // IBO Markup Cap (50% max)
  maxIboMarkupPercentage: number;

  // IBO Team View Privacy (§16): Protects downline privacy
  teamViewAllowsGrossSalesVolume: boolean; // false = see counts and own commissions only

  // Payment Gateways (§11): Paystack primary, Flutterwave fallback
  supportedPaymentGateways: {
    id: string;
    name: string;
    enabled: boolean;
    isPrimary: boolean;
    description: string;
  }[];

  // Platform Product Cut (§3): 3% of product selling price
  platformProductCutPct: number; // 3%
  platformCutPercentage?: number;

  // Platform Logistics Commission (§4): 10% of the delivery agent's platform-earned commission
  platformLogisticsCommissionPct: number; // 10% (formerly named Founder's Commission)
  deliveryAgentFounderCommissionPct: number; // legacy alias for backward compatibility
  founderDeliveryCommissionPercentage?: number;

  // Failed Delivery 15/15/20 Rule (§5)
  failedDeliverySplit: {
    agentPct: number;    // 15%
    platformPct: number; // 15%
    reservePct: number;  // 20% (return/recoupment/logistics reserve)
    customerRefundPct: number; // 50%
  };

  // Unsuccessful delivery recoup legacy mappings
  unsuccessfulDeliveryRecoupRate: number;
  standardRecoupSplit: {
    iboPct: number;
    merchantPct: number;
    founderPct: number;
  };
  faultBasedRecoupEnabled: boolean;
  faultPolicies: {
    customer_refused: { iboPct: number; merchantPct: number; founderPct: number; customerPenaltyPct: number };
    wrong_or_damaged_item: { iboPct: number; merchantPct: number; founderPct: number; customerPenaltyPct: number };
    agent_no_show: { iboPct: number; merchantPct: number; founderPct: number; customerPenaltyPct: number };
    other: { iboPct: number; merchantPct: number; founderPct: number; customerPenaltyPct: number };
  };

  // IBO Tier 1 / 2 / 3 Referral Commission Engine (§1, §24)
  // Max network commission = 5% (Tier 1: 3%, Tier 2: 1.5%, Tier 3: 0.5%)
  referralCommissions: {
    tier1Pct: number; // 3.0%
    tier2Pct: number; // 1.5%
    tier3Pct: number; // 0.5%
    maxDepth: 3;
  };
  // Configurable active depth pending legal review (Tier 1 only, Tiers 1-2, Tiers 1-3)
  activeIboCommissionDepth: 1 | 2 | 3;

  // Delivery Agent Network Referral Commission (§2, §24)
  // Calculated from delivery agent earnings pool, not product value. Max 3.5%
  agentReferralCommissions: {
    tier1Pct: number; // 2.0%
    tier2Pct: number; // 1.0%
    tier3Pct: number; // 0.5%
    maxDepth: 3;
  };
}

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'MyOwnShop',
  architectureName: 'IBOHub Platform',

  // §13 Full 17 Multi-Vendor Category Taxonomy
  productCategories: [
    {
      id: 'food_beverage',
      name: 'Food & Beverages',
      subCategories: ['Honey', 'Grains', 'Flour', 'Garri', 'Spices', 'Snacks', 'Drinks', 'Processed Foods'],
      iconName: 'Package',
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      subCategories: ['Seeds', 'Fertilizer', 'Farm Equipment', 'Animal Feed', 'Agricultural Products'],
      iconName: 'Sprout',
    },
    {
      id: 'health_wellness',
      name: 'Health & Wellness',
      subCategories: ['Personal Care', 'Wellness Products', 'Natural Products', 'Fitness Products'],
      iconName: 'Activity',
    },
    {
      id: 'beauty_personal_care',
      name: 'Beauty & Personal Care',
      subCategories: ['Skincare', 'Haircare', 'Cosmetics', 'Fragrance', 'Grooming'],
      iconName: 'Sparkles',
    },
    {
      id: 'fashion',
      name: 'Fashion',
      subCategories: ["Men's Fashion", "Women's Fashion", "Children's Fashion", 'Shoes', 'Bags', 'Accessories'],
      iconName: 'Shirt',
    },
    {
      id: 'electronics',
      name: 'Electronics',
      subCategories: ['Phones', 'Computers', 'Accessories', 'Home Electronics', 'Solar Products'],
      iconName: 'Zap',
    },
    {
      id: 'home_living',
      name: 'Home & Living',
      subCategories: ['Furniture', 'Kitchen', 'Bedding', 'Home Décor', 'Cleaning Products'],
      iconName: 'Home',
    },
    {
      id: 'automotive',
      name: 'Automotive',
      subCategories: ['Vehicles', 'Spare Parts', 'Accessories', 'Tyres', 'Car Care'],
      iconName: 'Truck',
    },
    {
      id: 'construction',
      name: 'Construction',
      subCategories: ['Building Materials', 'Plumbing', 'Electrical', 'Tools', 'Hardware'],
      iconName: 'Wrench',
    },
    {
      id: 'education',
      name: 'Education',
      subCategories: ['Courses', 'Books', 'Training', 'Educational Materials'],
      iconName: 'BookOpen',
    },
    {
      id: 'digital_products',
      name: 'Digital Products',
      subCategories: ['Software', 'Templates', 'E-books', 'Digital Services', 'Design Services'],
      iconName: 'Laptop',
    },
    {
      id: 'business_services',
      name: 'Business Services',
      subCategories: ['Printing', 'Branding', 'IT Services', 'Marketing', 'Consulting'],
      iconName: 'Briefcase',
    },
    {
      id: 'industrial',
      name: 'Industrial',
      subCategories: ['Machinery', 'Equipment', 'Industrial Supplies'],
      iconName: 'Factory',
    },
    {
      id: 'baby_kids',
      name: 'Baby & Kids',
      subCategories: ['Baby Products', 'Toys', "Children's Accessories"],
      iconName: 'Smile',
    },
    {
      id: 'sports_fitness',
      name: 'Sports & Fitness',
      subCategories: ['Equipment', 'Clothing', 'Accessories'],
      iconName: 'Dumbbell',
    },
    {
      id: 'household_essentials',
      name: 'Household Essentials',
      subCategories: ['Cleaning', 'Consumables', 'Utilities'],
      iconName: 'CheckSquare',
    },
    {
      id: 'gifts_lifestyle',
      name: 'Gifts & Lifestyle',
      subCategories: ['Gifts', 'Events', 'Lifestyle Products'],
      iconName: 'Gift',
    },
    {
      id: 'wholesale_bulk',
      name: 'Wholesale & Bulk',
      subCategories: ['Bulk Food', 'Wholesale Merchandise', 'Raw Materials'],
      iconName: 'Boxes',
    },
  ],

  serviceCategories: [
    {
      id: 'digital_services',
      name: 'Digital & Creative Services',
      subCategories: ['Brand Identity & Graphics', 'Web Development', 'Digital Marketing', 'Translation'],
      iconName: 'Laptop',
    },
    {
      id: 'agricultural_services',
      name: 'Agricultural Services',
      subCategories: ['Soil Testing', 'Tractor Leasing', 'Farm Setup Consultancy', 'Veterinary Tele-advice'],
      iconName: 'Tractor',
    },
    {
      id: 'logistics_services',
      name: 'Logistics & Haulage',
      subCategories: ['Inter-State Haulage', 'Cold-Chain Storage', 'Express Courier'],
      iconName: 'Navigation',
    },
  ],

  // §14 IBO Boost Pricing & Advertising
  iboBoostPricing: {
    boost24hNgn: 500,
    boost7dNgn: 2500,
    boost30dNgn: 7500,
  },
  merchantHubBoostPriceWeeklyNgn: 10000,
  maxFeaturedBoostSlots: 12,

  // §18 Customer Attribution Rule (90 days lock)
  customerAttributionDays: 90,

  // §6 Merchant Tiers (Capacity & tools, never for commission access)
  merchantTiers: {
    free: {
      name: 'Free Merchant',
      maxActiveProducts: 5,
      maxProducts: 5,
      priceMonthlyNgn: 0,
      monthlyFeeNgn: 0,
      features: ['Up to 5 active products', 'Standard merchant dashboard', 'Basic order management', 'Standard support'],
    },
    pro: {
      name: 'Merchant Pro',
      maxActiveProducts: 25,
      maxProducts: 25,
      priceMonthlyNgn: 10000,
      monthlyFeeNgn: 10000,
      features: ['Up to 25 active products', 'Advanced inventory tools', 'Sales analytics', 'Priority order processing', 'IBO marketing tools'],
    },
    business: {
      name: 'Merchant Business',
      maxActiveProducts: 100,
      maxProducts: 100,
      priceMonthlyNgn: 25000,
      monthlyFeeNgn: 25000,
      features: ['Up to 100 active products', 'Full analytics & reports', 'Bulk inventory upload', 'Direct IBO advertising suite', 'Dedicated account manager'],
    },
    enterprise: {
      name: 'Merchant Enterprise',
      maxActiveProducts: 500,
      maxProducts: 500,
      priceMonthlyNgn: 50000,
      monthlyFeeNgn: 50000,
      features: ['Up to 500 active products', 'Custom API access', 'Priority warehouse slots', 'White-glove compliance support', 'Featured catalog placement'],
    },
  },

  // §7, §8, §9, §10 KYC Requirements (with NDPC Data Minimisation)
  kycRequirements: {
    merchant: {
      requiredDocs: [
        'CAC Business Incorporation Certificate',
        'Tax Identification Number (TIN)',
        'Managing Director Government ID',
        'Proof of Business Address',
      ],
      vendorProcess: 'Corporate Affairs Commission (CAC) automated registry check & manual compliance sign-off',
      targetTurnaroundHours: 24,
      requiresCacVerification: true,
      regulatedDocTypes: ['NAFDAC Registration', 'SON Certification', 'Food Handling Permits', 'Agric Quarantine Certificate', 'Import License'],
    },
    ibo: {
      requiredDocs: ['Government ID (NIN / Voter Card / Driver License)', 'Bank Account Verification (Name match)', 'Signed IBO Agreement'],
      vendorProcess: 'Automated AML & Identity verification with NDPC-compliant status recording (no raw BVN storage)',
      targetTurnaroundHours: 4,
      requiresBvnOrTIN: true,
      idPrefix: 'IBO-',
    },
    agent: {
      requiredDocs: ['Commercial Driver / Rider License', 'Vehicle Registration Document', 'Proof of Vehicle Insurance', 'Vehicle Photo with Plate Number'],
      vendorProcess: 'Physical route readiness verification & vehicle roadworthiness confirmation',
      targetTurnaroundHours: 24,
      vehicleInspectionRequired: true,
      vehicleDocTypes: ['Roadworthiness Certificate', 'Insurance Policy', 'Vehicle Inspection Report'],
    },
  },

  // §4 IBO Capacity Tiers
  tierCaps: {
    free: {
      name: 'Standard Free Tier',
      maxSelectableMerchants: 5,
      costMonthlyNgn: 0,
    },
    tier_2: {
      name: 'Growth Hub',
      maxSelectableMerchants: 25,
      costMonthlyNgn: 7500,
    },
    tier_3: {
      name: 'Scale Unlimited Hub',
      maxSelectableMerchants: 100,
      costMonthlyNgn: 18000,
    },
  },

  // §4 IBO Markup rule
  maxIboMarkupPercentage: 50,

  // §16 Downline Earnings Privacy
  teamViewAllowsGrossSalesVolume: false,

  // §11 Payment Gateways: Paystack Primary, Flutterwave Secondary
  supportedPaymentGateways: [
    {
      id: 'online_paystack',
      name: 'Paystack Gateway (Primary)',
      enabled: true,
      isPrimary: true,
      description: 'Primary Nigerian gateway: Cards, Bank Transfer, USSD, Apple Pay, automated webhook settlement',
    },
    {
      id: 'online_flutterwave',
      name: 'Flutterwave Gateway (Secondary/Fallback)',
      enabled: true,
      isPrimary: false,
      description: 'Secondary fallback gateway: Cards, USSD, NQR, Virtual Accounts, dynamic failover',
    },
    {
      id: 'pay_on_delivery',
      name: 'Pay on Delivery (Cash/POS to Agent)',
      enabled: true,
      isPrimary: false,
      description: 'Customer pays agent upon physical arrival and QR inspection',
    },
    {
      id: 'bank_transfer',
      name: 'Direct Bank Transfer / Dedicated Virtual Account',
      enabled: true,
      isPrimary: false,
      description: 'Automated dynamic Nigerian NUBAN account reconciliation',
    },
  ],

  // §3 Platform's Cut: 3% of product selling price
  platformProductCutPct: 3.0,
  platformCutPercentage: 3.0,

  // §4 Founder's Commission From Delivery: 10% of agent platform-earned delivery commission
  platformLogisticsCommissionPct: 10.0,
  deliveryAgentFounderCommissionPct: 10.0, // legacy backward-compatibility
  founderDeliveryCommissionPercentage: 10.0,

  // §5 Failed Delivery: 15/15/20 Rule
  failedDeliverySplit: {
    agentPct: 15,
    platformPct: 15,
    reservePct: 20,
    customerRefundPct: 50,
  },

  // Recoup split compatibility
  unsuccessfulDeliveryRecoupRate: 50,
  standardRecoupSplit: {
    iboPct: 15,
    merchantPct: 15,
    founderPct: 20,
  },
  faultBasedRecoupEnabled: true,
  faultPolicies: {
    customer_refused: { iboPct: 10, merchantPct: 10, founderPct: 10, customerPenaltyPct: 20 },
    wrong_or_damaged_item: { iboPct: 0, merchantPct: 40, founderPct: 10, customerPenaltyPct: 0 },
    agent_no_show: { iboPct: 0, merchantPct: 0, founderPct: 0, customerPenaltyPct: 0 },
    other: { iboPct: 15, merchantPct: 15, founderPct: 20, customerPenaltyPct: 0 },
  },

  // §1, §24 IBO Tier 1 / 2 / 3 Referral Commission Engine
  // Tier 1: 3%, Tier 2: 1.5%, Tier 3: 0.5% (Max = 5%)
  referralCommissions: {
    tier1Pct: 3.0,
    tier2Pct: 1.5,
    tier3Pct: 0.5,
    maxDepth: 3,
  },
  // Configurable active depth: 1 (Tier 1 only), 2 (Tier 1-2), 3 (Tier 1-3)
  activeIboCommissionDepth: 3,

  // §2, §24 Delivery Agent Network Referral Commission
  // Tier 1: 2%, Tier 2: 1%, Tier 3: 0.5% (Max = 3.5% of delivery agent earnings pool)
  agentReferralCommissions: {
    tier1Pct: 2.0,
    tier2Pct: 1.0,
    tier3Pct: 0.5,
    maxDepth: 3,
  },
};

