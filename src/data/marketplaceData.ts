import { platformStore } from '../services/store';

export interface MarketplaceSubCategory {
  slug: string;
  name: string;
}

export interface MarketplaceCategory {
  slug: string;
  name: string;
  shortName: string;
  iconName: string;
  imageUrl: string;
  itemCount: number;
  description: string;
  subCategories: MarketplaceSubCategory[];
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  verified: boolean;
  title: string;
  comment: string;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  brand: string;
  categorySlug: string;
  categoryName: string;
  subCategorySlug: string;
  subCategoryName: string;
  price: number;
  oldPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  images: string[];
  merchantId: string;
  merchantName: string;
  merchantCode: string;
  sellerType: 'Official Store' | 'Verified Merchant' | 'Warehouse Deposit';
  location: 'Lagos' | 'Abuja' | 'Kano' | 'Port Harcourt' | 'Ibadan';
  deliveryOptions: string[];
  stockQty: number;
  isFlashSale?: boolean;
  isRecommended?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  description: string;
  keyFeatures?: string[];
  whatsInTheBox?: string;
  warranty?: string;
  condition?: string;
  sku?: string;
  weightKg?: string;
  specs: { label: string; value: string }[];
  variants: {
    label: string;
    options: string[];
  }[];
  reviews: ProductReview[];
}

export interface TopMerchantInfo {
  id: string;
  name: string;
  code: string;
  category: string;
  categorySlug: string;
  city: string;
  address: string;
  rating: number;
  ordersCompleted: number;
  fulfillmentRate: string;
  responseTime: string;
  verified: boolean;
  cacNumber: string;
  summary: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    slug: 'phones',
    name: 'Phones & Tablets',
    shortName: 'Phones',
    iconName: 'Smartphone',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    itemCount: 418,
    description: 'Official Nigerian warranty smartphones, tablets, 30,000mAh power banks, and fast chargers.',
    subCategories: [
      { slug: 'smartphones', name: 'Smartphones (5G & 4G)' },
      { slug: 'power-banks', name: 'Power Banks & Chargers' },
      { slug: 'tablets', name: 'Tablets & Educational Pads' },
      { slug: 'audio', name: 'Earbuds & Bluetooth Audio' },
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion & Footwear',
    shortName: 'Fashion',
    iconName: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80',
    itemCount: 690,
    description: 'Hand-crafted leather footwear, Nigerian textiles, Senator kaftans, Ankara prints, and everyday apparel.',
    subCategories: [
      { slug: 'mens-footwear', name: "Men's Leather Footwear" },
      { slug: 'textiles-ankara', name: 'Ankara, Aso-Oke & Textiles' },
      { slug: 'native-wear', name: 'Senator & Native Attire' },
      { slug: 'bags-accessories', name: 'Leather Bags & Watches' },
    ],
  },
  {
    slug: 'home',
    name: 'Home & Kitchen',
    shortName: 'Home',
    iconName: 'Home',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80',
    itemCount: 312,
    description: 'Low-wattage chest freezers, heavy-duty copper blenders, gas cookers, and cookware for Nigerian homes.',
    subCategories: [
      { slug: 'kitchen-appliances', name: 'Blenders, Kettles & Air Fryers' },
      { slug: 'cooling-freezers', name: 'Chest Freezers & Fridges' },
      { slug: 'cookware-gas', name: 'Gas Burners & Cookware Sets' },
      { slug: 'home-comfort', name: 'Standing Fans & Stabilizers' },
    ],
  },
  {
    slug: 'groceries',
    name: 'Groceries & Bulk Food',
    shortName: 'Groceries',
    iconName: 'ShoppingBasket',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    itemCount: 540,
    description: 'Direct-from-mill 50kg parboiled rice, cold-pressed cooking oils, honey beans, garri, and bulk spices.',
    subCategories: [
      { slug: 'rice-grains', name: '50kg Rice, Beans & Grains' },
      { slug: 'cooking-oils', name: 'Vegetable, Palm & Sesame Oils' },
      { slug: 'spices-herbs', name: 'Dried Hibiscus (Zobo) & Spices' },
      { slug: 'packaged-foods', name: 'Carton Noodles, Pasta & Milk' },
    ],
  },
  {
    slug: 'beauty',
    name: 'Beauty & Personal Care',
    shortName: 'Beauty',
    iconName: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
    itemCount: 284,
    description: 'NAFDAC-registered body lotions, raw unrefined shea butter, black soap, fragrances, and grooming kits.',
    subCategories: [
      { slug: 'skincare', name: 'Body Lotions & UV Skincare' },
      { slug: 'shea-natural', name: 'Raw Shea Butter & Black Soap' },
      { slug: 'fragrances', name: 'Eau de Parfum & Body Mists' },
      { slug: 'grooming', name: 'Clippers & Grooming Kits' },
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics & Solar',
    shortName: 'Electronics',
    iconName: 'Tv',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80',
    itemCount: 375,
    description: 'Monocrystalline solar panels, hybrid MPPT inverters, LiFePO4 lithium batteries, and smart LED TVs.',
    subCategories: [
      { slug: 'solar-panels', name: 'Monocrystalline Solar Panels' },
      { slug: 'inverters-batteries', name: 'Hybrid Inverters & Lithium Batteries' },
      { slug: 'televisions', name: 'Smart TVs & Soundbars' },
      { slug: 'security-cctv', name: 'Solar CCTV & Smart Locks' },
    ],
  },
  {
    slug: 'baby',
    name: 'Baby, Kids & Maternity',
    shortName: 'Baby',
    iconName: 'Baby',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80',
    itemCount: 162,
    description: 'Jumbo carton diapers, baby wipes, infant feeding sets, strollers, and nursery essentials.',
    subCategories: [
      { slug: 'diapers-wipes', name: 'Jumbo Diapers & Baby Wipes' },
      { slug: 'feeding-nursing', name: 'Bottle Sterilizers & Feeding' },
      { slug: 'baby-gear', name: 'Strollers, Cots & Car Seats' },
    ],
  },
  {
    slug: 'sports',
    name: 'Sports & Fitness',
    shortName: 'Sports',
    iconName: 'Dumbbell',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
    itemCount: 145,
    description: 'Cast-iron dumbbell kits, foldable home treadmills, resistance bands, and match football gear.',
    subCategories: [
      { slug: 'strength-weights', name: 'Dumbbells, Barbells & Benches' },
      { slug: 'cardio-fitness', name: 'Treadmills, Bikes & Yoga Mats' },
      { slug: 'team-sports', name: 'Footballs, Boots & Jerseys' },
    ],
  },
  {
    slug: 'services',
    name: 'Installation & Services',
    shortName: 'Services',
    iconName: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    itemCount: 89,
    description: 'COREN-certified solar inverter installation, split AC servicing, CCTV wiring, and generator maintenance.',
    subCategories: [
      { slug: 'solar-installation', name: 'Solar & Inverter Installation' },
      { slug: 'ac-appliance-repair', name: 'AC Servicing & Gas Refill' },
      { slug: 'cctv-electrical', name: 'CCTV & Electrical Wiring' },
    ],
  },
  {
    slug: 'more',
    name: 'Auto Spares & Industrial',
    shortName: 'More',
    iconName: 'Grid',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80',
    itemCount: 230,
    description: 'OEM ceramic brake pads, synthetic engine oils, maintenance-free car batteries, and warehouse packaging.',
    subCategories: [
      { slug: 'brake-suspension', name: 'Brake Pads, Shocks & Suspension' },
      { slug: 'engine-oil-batteries', name: 'Synthetic Oils & Car Batteries' },
      { slug: 'industrial-packaging', name: 'Scales, Sealing Machines & PPE' },
    ],
  },
];

export const TOP_MERCHANTS: TopMerchantInfo[] = [
  {
    id: 'mrc-1',
    name: 'AgroFresh Mega Farms Ltd',
    code: 'MRC-AGRO-01',
    category: 'Groceries & Bulk Food',
    categorySlug: 'groceries',
    city: 'Lagos',
    address: 'Block 4, Ikorodu Industrial Grain Depot, Lagos',
    rating: 4.9,
    ordersCompleted: 1420,
    fulfillmentRate: '99.2%',
    responseTime: '< 10 mins',
    verified: true,
    cacNumber: 'RC-1489201',
    summary: 'Direct processor and wholesale distributor of Kebbi parboiled rice, Benue sesame oil, and Plateau honey beans.',
  },
  {
    id: 'mrc-3',
    name: 'GreenVolt Solar Tech Ltd',
    code: 'MRC-SOLAR-03',
    category: 'Electronics & Solar',
    categorySlug: 'electronics',
    city: 'Lagos',
    address: '22 Opebi Link Road, Ikeja, Lagos',
    rating: 4.8,
    ordersCompleted: 2190,
    fulfillmentRate: '98.7%',
    responseTime: '< 15 mins',
    verified: true,
    cacNumber: 'RC-1730412',
    summary: 'Importer of Tier-1 monocrystalline solar panels, hybrid MPPT inverters, LiFePO4 batteries, and low-wattage home appliances.',
  },
  {
    id: 'mrc-2',
    name: 'Lagos Prime Auto Spares',
    code: 'MRC-AUTO-02',
    category: 'Auto Spares & Industrial',
    categorySlug: 'more',
    city: 'Lagos',
    address: 'Zone B, Aspamda Trade Fair Complex, Badagry Expy, Lagos',
    rating: 4.7,
    ordersCompleted: 870,
    fulfillmentRate: '97.9%',
    responseTime: '< 20 mins',
    verified: true,
    cacNumber: 'RC-1190344',
    summary: 'SONCAP-certified distributor of Toyota/Honda ceramic brake pads, full-synthetic engine oils, and heavy-duty fitness ironware.',
  },
  {
    id: 'mrc-4',
    name: 'Lekki Loom Textiles',
    code: 'MRC-LEKKI-04',
    category: 'Fashion & Footwear',
    categorySlug: 'fashion',
    city: 'Lagos',
    address: '19 Admiralty Road, Lekki Phase 1, Lagos',
    rating: 4.8,
    ordersCompleted: 640,
    fulfillmentRate: '98.4%',
    responseTime: '< 12 mins',
    verified: true,
    cacNumber: 'BN-2849102',
    summary: 'Nigerian footwear and apparel house specializing in full-grain leather loafers, Aso-Oke, Senator fabrics, and skincare.',
  },
  {
    id: 'mrc-5',
    name: 'AfroGourmet Natural Grains',
    code: 'MRC-FOOD-05',
    category: 'Groceries & Bulk Food',
    categorySlug: 'groceries',
    city: 'Kano',
    address: 'Plot 88, Dawanau International Grain Market, Kano',
    rating: 4.9,
    ordersCompleted: 3100,
    fulfillmentRate: '99.5%',
    responseTime: '< 15 mins',
    verified: true,
    cacNumber: 'RC-1502881',
    summary: 'Northern Nigeria commodity hub supplying Grade-A dried hibiscus (Zobo), split ginger, raw shea butter, and family essentials.',
  },
  {
    id: 'mrc-6',
    name: 'Computer Village Direct Hub',
    code: 'MRC-TECH-06',
    category: 'Phones & Tablets',
    categorySlug: 'phones',
    city: 'Lagos',
    address: '10 Otigba Street, Computer Village, Ikeja, Lagos',
    rating: 4.8,
    ordersCompleted: 1890,
    fulfillmentRate: '98.9%',
    responseTime: '< 8 mins',
    verified: true,
    cacNumber: 'RC-1688320',
    summary: 'Authorized Nigerian distributor for Samsung, Xiaomi, Infinix, and Oraimo with 12–24 months official Carlcare/Samsung warranty.',
  },
];

export const PROMO_BANNERS = [
  {
    id: 'banner-1',
    tag: 'FLASH ELECTRONICS WEEK',
    headline: 'Solar Panels, Lithium Batteries & Pure Sine Inverters',
    subtext: 'Up to 28% off warehouse stock. Free delivery on orders over ₦20,000 in Lagos, Abuja & Kano.',
    ctaText: 'Shop Solar Deals',
    ctaLink: '/category/electronics',
    badgeText: 'Pay on Delivery Protection',
    imageUrl:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1000&q=80',
    featuredItems: [
      {
        id: 'prod-4',
        label: '550W Solar Panel',
        price: '₦92,000',
        imageUrl:
          'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-15',
        label: '2.5kVA Inverter',
        price: '₦265,000',
        imageUrl:
          'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-19',
        label: '5kWh Lithium Battery',
        price: '₦980,000',
        imageUrl:
          'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'banner-2',
    tag: 'DIRECT FARM WHOLESALE',
    headline: '50kg Parboiled Rice, Honey Beans & Cold-Pressed Oils',
    subtext: 'Sourced directly from verified mills in Kano, Kebbi, and Benue with NAFDAC batch certification.',
    ctaText: 'Browse Groceries',
    ctaLink: '/category/groceries',
    badgeText: 'Same-Day Hub Dispatch',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1000&q=80',
    featuredItems: [
      {
        id: 'prod-1',
        label: '50kg Kebbi Rice',
        price: '₦68,500',
        imageUrl:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-16',
        label: '50kg Honey Beans',
        price: '₦74,000',
        imageUrl:
          'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-2',
        label: '25L Pure Cooking Oil',
        price: '₦42,000',
        imageUrl:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'banner-3',
    tag: 'OFFICIAL WARRANTY PHONES',
    headline: 'Samsung, Xiaomi, Infinix & Oraimo Power Accessories',
    subtext: '12-month manufacturer warranty. Your payment is kept safe until your order is delivered.',
    ctaText: 'Shop Phones',
    ctaLink: '/category/phones',
    badgeText: '100% Genuine Stock',
    imageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
    featuredItems: [
      {
        id: 'prod-6',
        label: 'Galaxy A55 5G',
        price: '₦465,000',
        imageUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-17',
        label: 'Redmi Note 13 Pro',
        price: '₦348,000',
        imageUrl:
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'prod-7',
        label: 'Oraimo 30,000mAh',
        price: '₦26,500',
        imageUrl:
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
];

const DEFAULT_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    author: 'Chinedu O.',
    rating: 5,
    date: '14 Oct 2026',
    verified: true,
    title: 'Delivered on time, exact specification',
    comment: 'Courier called 20 minutes before arrival in Ikeja. Checked the seal before scanning the QR code. Very straightforward.',
  },
  {
    id: 'rev-2',
    author: 'Halima S.',
    rating: 5,
    date: '09 Oct 2026',
    verified: true,
    title: 'Original warehouse stock',
    comment: 'Price is lower than open market and the packaging was intact. Will reorder next month.',
  },
  {
    id: 'rev-3',
    author: 'Babatunde A.',
    rating: 4,
    date: '02 Oct 2026',
    verified: true,
    title: 'Good value for money',
    comment: 'Picked up from the Yaba hub. Fast verification and clean documentation.',
  },
];

export const MOCK_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  // === GROCERIES ===
  {
    id: 'prod-1',
    title: 'Royal Stallion 50kg Long Grain Parboiled Rice (Kebbi Mill)',
    brand: 'AgroFresh',
    categorySlug: 'groceries',
    categoryName: 'Groceries & Bulk Food',
    subCategorySlug: 'rice-grains',
    subCategoryName: '50kg Rice, Beans & Grains',
    price: 68500,
    oldPrice: 78000,
    discountPercent: 12,
    rating: 4.9,
    reviewCount: 318,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-1',
    merchantName: 'AgroFresh Mega Farms Ltd',
    merchantCode: 'MRC-AGRO-01',
    sellerType: 'Warehouse Deposit',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 140,
    isFlashSale: true,
    isRecommended: true,
    isBestSeller: true,
    description: 'Stone-free, double-polished long grain parboiled rice milled in Kebbi and stored in our climate-monitored Ikorodu warehouse. Non-sticky texture ideal for jollof, fried rice, and daily family meals.',
    specs: [
      { label: 'Net Weight', value: '50 kg Woven Polypropylene Sack' },
      { label: 'Grain Type', value: '100% Sorted Long Grain Parboiled' },
      { label: 'Moisture Content', value: 'Below 13.5% (Export Standard)' },
      { label: 'NAFDAC Reg. No.', value: 'A4-9182-NG' },
      { label: 'Origin', value: 'Argungu Mill, Kebbi State' },
    ],
    variants: [
      { label: 'Bag Size', options: ['50kg Full Bag', '25kg Half Bag'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-2',
    title: 'Pure Cold-Pressed Virgin Sesame & Groundnut Cooking Oil (25L Keg)',
    brand: 'AgroFresh',
    categorySlug: 'groceries',
    categoryName: 'Groceries & Bulk Food',
    subCategorySlug: 'cooking-oils',
    subCategoryName: 'Vegetable, Palm & Sesame Oils',
    price: 42000,
    oldPrice: 51000,
    discountPercent: 18,
    rating: 4.8,
    reviewCount: 194,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-1',
    merchantName: 'AgroFresh Mega Farms Ltd',
    merchantCode: 'MRC-AGRO-01',
    sellerType: 'Warehouse Deposit',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 85,
    isFlashSale: true,
    isBestSeller: true,
    description: 'Cholesterol-free, cold-pressed golden vegetable oil with tamper-evident factory cap. High smoke point suitable for commercial catering and household frying.',
    specs: [
      { label: 'Volume', value: '25 Litres Tamper-Sealed Keg' },
      { label: 'Processing', value: 'Cold-Pressed Unbleached' },
      { label: 'Shelf Life', value: '18 Months from Production' },
      { label: 'Certification', value: 'NAFDAC & SON Certified' },
    ],
    variants: [
      { label: 'Volume', options: ['25L Commercial Keg', '5L Family Gallon'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-14',
    title: 'Kano Grade-A Dried Hibiscus (Zobo) Calyces & Ginger Bundle (25kg)',
    brand: 'AfroGourmet',
    categorySlug: 'groceries',
    categoryName: 'Groceries & Bulk Food',
    subCategorySlug: 'spices-herbs',
    subCategoryName: 'Dried Hibiscus (Zobo) & Spices',
    price: 36000,
    oldPrice: 44000,
    discountPercent: 18,
    rating: 4.8,
    reviewCount: 132,
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-5',
    merchantName: 'AfroGourmet Natural Grains',
    merchantCode: 'MRC-FOOD-05',
    sellerType: 'Warehouse Deposit',
    location: 'Kano',
    deliveryOptions: ['Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 95,
    isRecommended: true,
    isNewArrival: true,
    description: 'Sun-dried crimson hibiscus calyces paired with split dried Kaduna ginger. Cleaned and sieved for beverage bottlers, restaurants, and bulk retailers.',
    specs: [
      { label: 'Weight', value: '20kg Hibiscus + 5kg Dried Ginger' },
      { label: 'Purity', value: '99% Sand-Free Cleaned' },
      { label: 'Origin', value: 'Dawanau Market Hub, Kano' },
    ],
    variants: [
      { label: 'Bundle Size', options: ['25kg Combo Sack', '50kg Export Bale'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-16',
    title: 'Maiduguri Stone-Free Sweet Oloyin Honey Beans (50kg Jutebag)',
    brand: 'AfroGourmet',
    categorySlug: 'groceries',
    categoryName: 'Groceries & Bulk Food',
    subCategorySlug: 'rice-grains',
    subCategoryName: '50kg Rice, Beans & Grains',
    price: 74000,
    oldPrice: 86000,
    discountPercent: 14,
    rating: 4.9,
    reviewCount: 208,
    imageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-5',
    merchantName: 'AfroGourmet Natural Grains',
    merchantCode: 'MRC-FOOD-05',
    sellerType: 'Warehouse Deposit',
    location: 'Kano',
    deliveryOptions: ['Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 60,
    isBestSeller: true,
    description: 'Naturally sweet brown Oloyin beans, machine-destoned and hermetically bagged without chemical preservatives. Cooks soft in 35 minutes.',
    specs: [
      { label: 'Net Weight', value: '50 kg Hermetic Liner Sack' },
      { label: 'Preservation', value: '100% Chemical-Free PICS Bagged' },
      { label: 'Origin', value: 'Biu / Kano Grain Corridor' },
    ],
    variants: [
      { label: 'Weight', options: ['50kg Full Sack', '25kg Half Sack', '10kg Family Pack'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === PHONES & TABLETS ===
  {
    id: 'prod-6',
    title: 'Samsung Galaxy A55 5G (256GB ROM / 8GB RAM, Dual SIM)',
    brand: 'Samsung',
    categorySlug: 'phones',
    categoryName: 'Phones & Tablets',
    subCategorySlug: 'smartphones',
    subCategoryName: 'Smartphones (5G & 4G)',
    price: 465000,
    oldPrice: 520000,
    discountPercent: 11,
    rating: 4.9,
    reviewCount: 412,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-6',
    merchantName: 'Computer Village Direct Hub',
    merchantCode: 'MRC-TECH-06',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 35,
    isFlashSale: true,
    isBestSeller: true,
    isRecommended: true,
    description: 'Official Nigerian warranty unit with 6.6-inch 120Hz Super AMOLED display, 50MP OIS triple camera, IP67 water resistance, and 5000mAh 2-day battery.',
    specs: [
      { label: 'Display', value: '6.6" FHD+ Super AMOLED 120Hz' },
      { label: 'Memory', value: '256GB Storage / 8GB RAM' },
      { label: 'Main Camera', value: '50MP (OIS) + 12MP Ultra-Wide + 5MP Macro' },
      { label: 'Battery', value: '5000mAh (25W Fast Charging)' },
      { label: 'Warranty', value: '24 Months Samsung Nigeria Official' },
    ],
    variants: [
      { label: 'Storage', options: ['256GB / 8GB RAM', '128GB / 8GB RAM'] },
      { label: 'Color', options: ['Awesome Navy', 'Iceblue', 'Lilac'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-7',
    title: 'Oraimo PowerBox 300 30,000mAh 22.5W Fast Charging Power Bank',
    brand: 'Oraimo',
    categorySlug: 'phones',
    categoryName: 'Phones & Tablets',
    subCategorySlug: 'power-banks',
    subCategoryName: 'Power Banks & Chargers',
    price: 26500,
    oldPrice: 34000,
    discountPercent: 22,
    rating: 4.8,
    reviewCount: 625,
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-6',
    merchantName: 'Computer Village Direct Hub',
    merchantCode: 'MRC-TECH-06',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 210,
    isFlashSale: true,
    isBestSeller: true,
    description: 'High-density lithium polymer 30,000mAh cell with AniFast 22.5W two-way Type-C PD charging, digital LED percentage display, and built-in emergency SOS torch.',
    specs: [
      { label: 'Capacity', value: '30,000mAh / 111Wh' },
      { label: 'Output Ports', value: '2x USB-A + 1x Bidirectional Type-C' },
      { label: 'Fast Charge', value: '22.5W PD3.0 & QC3.0' },
      { label: 'Warranty', value: '365 Days Carlcare Replacement' },
    ],
    variants: [
      { label: 'Capacity', options: ['30,000mAh (22.5W)', '20,000mAh (18W)'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-17',
    title: 'Xiaomi Redmi Note 13 Pro (256GB / 8GB RAM, 200MP OIS Camera)',
    brand: 'Xiaomi',
    categorySlug: 'phones',
    categoryName: 'Phones & Tablets',
    subCategorySlug: 'smartphones',
    subCategoryName: 'Smartphones (5G & 4G)',
    price: 348000,
    oldPrice: 395000,
    discountPercent: 12,
    rating: 4.8,
    reviewCount: 289,
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-6',
    merchantName: 'Computer Village Direct Hub',
    merchantCode: 'MRC-TECH-06',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 48,
    isNewArrival: true,
    isRecommended: true,
    description: 'Includes 67W turbo wall charger in the box. Features 120Hz AMOLED Corning Gorilla Glass 5 display and 200MP ultra-clear main camera.',
    specs: [
      { label: 'Display', value: '6.67" FHD+ 120Hz AMOLED' },
      { label: 'Charger Included', value: '67W Turbo Charger (45 min to 100%)' },
      { label: 'Camera', value: '200MP OIS + 8MP + 2MP' },
      { label: 'Warranty', value: '15 Months Xiaomi Nigeria Official' },
    ],
    variants: [
      { label: 'Color', options: ['Midnight Black', 'Forest Green', 'Lavender Purple'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-18',
    title: 'Oraimo FreePods 4 Active Noise Cancelling Wireless Earbuds',
    brand: 'Oraimo',
    categorySlug: 'phones',
    categoryName: 'Phones & Tablets',
    subCategorySlug: 'audio',
    subCategoryName: 'Earbuds & Bluetooth Audio',
    price: 29500,
    oldPrice: 38000,
    discountPercent: 22,
    rating: 4.8,
    reviewCount: 512,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-6',
    merchantName: 'Computer Village Direct Hub',
    merchantCode: 'MRC-TECH-06',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 135,
    isBestSeller: true,
    description: '30dB Hybrid Active Noise Cancellation with 35.5-hour total playtime, 4-mic ENC clear voice calls, and HavyBass tuned drivers.',
    specs: [
      { label: 'Bluetooth', value: 'v5.2 Low-Latency Game Mode' },
      { label: 'Battery Life', value: '8.5h Buds + 27h Charging Case' },
      { label: 'Waterproof', value: 'IPX5 Sweat & Splash Resistant' },
    ],
    variants: [
      { label: 'Edition', options: ['Matte Black', 'Burna Boy Special Edition'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === ELECTRONICS & SOLAR ===
  {
    id: 'prod-4',
    title: 'GreenVolt 550W Monocrystalline Half-Cell Tier-1 Solar Panel',
    brand: 'GreenVolt',
    categorySlug: 'electronics',
    categoryName: 'Electronics & Solar',
    subCategorySlug: 'solar-panels',
    subCategoryName: 'Monocrystalline Solar Panels',
    price: 92000,
    oldPrice: 125000,
    discountPercent: 26,
    rating: 4.9,
    reviewCount: 276,
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 64,
    isFlashSale: true,
    isRecommended: true,
    isBestSeller: true,
    description: 'High-efficiency 21.4% PERC half-cut monocrystalline cells with anodized aluminum frame and IP68 MC4 junction box. Performs reliably in low-light harmattan and rainy conditions.',
    specs: [
      { label: 'Rated Power (Pmax)', value: '550W (+5W Positive Tolerance)' },
      { label: 'Open Circuit Voltage', value: '49.8V DC' },
      { label: 'Short Circuit Current', value: '13.98A' },
      { label: 'Dimensions', value: '2278 × 1134 × 35 mm' },
      { label: 'Warranty', value: '25-Year Linear Power Output' },
    ],
    variants: [
      { label: 'Wattage', options: ['550W Single Panel', '450W Single Panel', '4x 550W Bundle'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-15',
    title: '2.5kVA 24V Hybrid Pure Sine Wave Solar Inverter with 80A MPPT',
    brand: 'GreenVolt',
    categorySlug: 'electronics',
    categoryName: 'Electronics & Solar',
    subCategorySlug: 'inverters-batteries',
    subCategoryName: 'Hybrid Inverters & Lithium Batteries',
    price: 265000,
    oldPrice: 320000,
    discountPercent: 17,
    rating: 4.9,
    reviewCount: 158,
    imageUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 27,
    isFlashSale: true,
    isBestSeller: true,
    isNewArrival: true,
    description: 'All-in-one pure sine wave inverter with built-in 80A MPPT solar charge controller and 60A AC grid charger. Supports tubular, AGM, and LiFePO4 lithium batteries.',
    specs: [
      { label: 'Rated Output', value: '2500VA / 2200W Continuous' },
      { label: 'Battery Voltage', value: '24V DC (Lithium & Lead-Acid)' },
      { label: 'MPPT Solar Input', value: '80A (Max PV 3000W / 400V VOC)' },
      { label: 'Transfer Time', value: '< 10ms UPS Grade' },
    ],
    variants: [
      { label: 'Capacity', options: ['2.5kVA / 24V', '3.5kVA / 24V', '5kVA / 48V'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-19',
    title: 'GreenVolt 5kWh 48V Wall-Mounted LiFePO4 Lithium Solar Battery (6000 Cycles)',
    brand: 'GreenVolt',
    categorySlug: 'electronics',
    categoryName: 'Electronics & Solar',
    subCategorySlug: 'inverters-batteries',
    subCategoryName: 'Hybrid Inverters & Lithium Batteries',
    price: 980000,
    oldPrice: 1150000,
    discountPercent: 15,
    rating: 5.0,
    reviewCount: 84,
    imageUrl: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 14,
    isNewArrival: true,
    description: 'Grade-A prismatic LiFePO4 cells with built-in 100A smart BMS, LCD SOC screen, and CAN/RS485 inverter communication. 10-year service lifespan.',
    specs: [
      { label: 'Usable Energy', value: '5.12 kWh (51.2V 100Ah)' },
      { label: 'Cycle Life', value: '6,000+ Cycles @ 80% DOD' },
      { label: 'Warranty', value: '5-Year Replacement Warranty' },
    ],
    variants: [
      { label: 'Model', options: ['5.12kWh 48V Wall Mount', '2.56kWh 24V Wall Mount'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === FASHION & FOOTWEAR ===
  {
    id: 'prod-5',
    title: 'Hand-Stitched Full-Grain Leather Men Penny Loafers',
    brand: 'LekkiLoom',
    categorySlug: 'fashion',
    categoryName: 'Fashion & Footwear',
    subCategorySlug: 'mens-footwear',
    subCategoryName: "Men's Leather Footwear",
    price: 34500,
    oldPrice: 45000,
    discountPercent: 23,
    rating: 4.8,
    reviewCount: 148,
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-4',
    merchantName: 'Lekki Loom Textiles',
    merchantCode: 'MRC-LEKKI-04',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 29,
    isRecommended: true,
    isNewArrival: true,
    description: 'Crafted from drum-dyed cowhide leather with breathable calfskin lining and Blake-stitched non-slip rubber sole. Built for formal business wear and native attire.',
    specs: [
      { label: 'Upper Material', value: '100% Full-Grain Cowhide Leather' },
      { label: 'Outsole', value: 'Reinforced Crepe & Rubber Grip' },
      { label: 'Insole', value: 'Cushioned Orthopedic Arch Support' },
      { label: 'Sizes Available', value: 'EU 40 – EU 46' },
    ],
    variants: [
      { label: 'Size (EU)', options: ['EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'] },
      { label: 'Color', options: ['Espresso Brown', 'Jet Black', 'Oxblood'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-20',
    title: 'Hand-Woven Abeokuta Indigo Adire & Aso-Oke 6-Yard Bundle',
    brand: 'LekkiLoom',
    categorySlug: 'fashion',
    categoryName: 'Fashion & Footwear',
    subCategorySlug: 'textiles-ankara',
    subCategoryName: 'Ankara, Aso-Oke & Textiles',
    price: 28000,
    oldPrice: 35000,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 116,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-4',
    merchantName: 'Lekki Loom Textiles',
    merchantCode: 'MRC-LEKKI-04',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 54,
    isBestSeller: true,
    description: 'Colorfast 100% combed cotton Adire Eleko resist-dyed in Abeokuta. Breathable, non-fade fabric suitable for kaftans, boubous, and two-piece sets.',
    specs: [
      { label: 'Length', value: '6 Full Yards (5.4 Meters)' },
      { label: 'Base Fabric', value: '100% Mercerized Cotton Brocade' },
      { label: 'Wash Care', value: 'Colorfast Cold Wash' },
    ],
    variants: [
      { label: 'Pattern', options: ['Indigo Olokun', 'Emerald Gold', 'Terracotta Sun'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-21',
    title: 'Tailored Men Cashmere Wool 2-Piece Senator Kaftan Set',
    brand: 'LekkiLoom',
    categorySlug: 'fashion',
    categoryName: 'Fashion & Footwear',
    subCategorySlug: 'native-wear',
    subCategoryName: 'Senator & Native Attire',
    price: 42500,
    oldPrice: 54000,
    discountPercent: 21,
    rating: 4.8,
    reviewCount: 93,
    imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-4',
    merchantName: 'Lekki Loom Textiles',
    merchantCode: 'MRC-LEKKI-04',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 38,
    isNewArrival: true,
    description: 'Ready-to-wear Nigerian Senator tunic and tailored trousers crafted from wrinkle-resistant Italian cashmere blend with minimalist chest embroidery.',
    specs: [
      { label: 'Set Includes', value: 'Short/Long Sleeve Top + Tailored Trousers' },
      { label: 'Fabric Weight', value: '280 GSM Breathable Cashmere Blend' },
    ],
    variants: [
      { label: 'Size', options: ['M', 'L', 'XL', 'XXL'] },
      { label: 'Color', options: ['Navy Blue', 'Charcoal Grey', 'wine Red'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === HOME & KITCHEN ===
  {
    id: 'prod-8',
    title: 'Binatone 1.5L Heavy-Duty Unbreakable Jar Blender & Dry Mill (BLG-452)',
    brand: 'Binatone',
    categorySlug: 'home',
    categoryName: 'Home & Kitchen',
    subCategorySlug: 'kitchen-appliances',
    subCategoryName: 'Blenders, Kettles & Air Fryers',
    price: 38000,
    oldPrice: 46500,
    discountPercent: 18,
    rating: 4.7,
    reviewCount: 183,
    imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Warehouse Deposit',
    location: 'Abuja',
    deliveryOptions: ['Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 52,
    isRecommended: true,
    description: '450W pure copper motor blender with shatterproof polycarbonate jug and stainless steel 6-fin blades for grinding beans, tiger nuts, peppers, and Egusi.',
    specs: [
      { label: 'Motor Power', value: '450W Peak Copper Coil' },
      { label: 'Jar Material', value: '1.5L Unbreakable Polycarbonate' },
      { label: 'Speed Settings', value: '2 Speeds + Pulse Mode' },
      { label: 'Warranty', value: '2-Year Binatone Official Warranty' },
    ],
    variants: [
      { label: 'Color', options: ['Matte Black', 'Ivory White'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-9',
    title: 'Nexus 150L Chest Freezer with Fast-Freeze & Lock (NX-195C)',
    brand: 'Nexus',
    categorySlug: 'home',
    categoryName: 'Home & Kitchen',
    subCategorySlug: 'cooling-freezers',
    subCategoryName: 'Chest Freezers & Fridges',
    price: 245000,
    oldPrice: 289000,
    discountPercent: 15,
    rating: 4.8,
    reviewCount: 109,
    imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Warehouse Deposit',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 19,
    isNewArrival: true,
    description: 'Low-voltage compressor chest freezer designed to run on small generators or 1.5kVA solar inverters. Retains frozen ice for up to 100 hours after power outage.',
    specs: [
      { label: 'Capacity', value: '150 Litres Net Storage' },
      { label: 'Refrigerant', value: 'R600a Eco-Friendly Low Wattage' },
      { label: 'Interior', value: 'Easy-Clean Embossed Aluminum' },
      { label: 'Power Input', value: '95W Inverter Compatible' },
    ],
    variants: [
      { label: 'Size', options: ['150 Litres', '210 Litres'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-22',
    title: 'Binatone 18-Inch Rechargeable Standing Fan with Solar Charging Port',
    brand: 'Binatone',
    categorySlug: 'home',
    categoryName: 'Home & Kitchen',
    subCategorySlug: 'home-comfort',
    subCategoryName: 'Standing Fans & Stabilizers',
    price: 64500,
    oldPrice: 78000,
    discountPercent: 17,
    rating: 4.8,
    reviewCount: 241,
    imageUrl: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 73,
    isBestSeller: true,
    description: '5-blade silent AC/DC rechargeable pedestal fan with up to 14 hours cordless battery runtime, USB phone charging port, and remote control.',
    specs: [
      { label: 'Blade Diameter', value: '18 Inches (5 Aero Blades)' },
      { label: 'Battery Runtime', value: 'Up to 14 Hours on Low Speed' },
      { label: 'DC Solar Input', value: '12V Solar Panel Port Included' },
    ],
    variants: [
      { label: 'Color', options: ['Black', 'White'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === BEAUTY & PERSONAL CARE ===
  {
    id: 'prod-10',
    title: 'Nivea Radiant & Beauty Even Glow Body Lotion Pack (2 × 400ml)',
    brand: 'Nivea',
    categorySlug: 'beauty',
    categoryName: 'Beauty & Personal Care',
    subCategorySlug: 'skincare',
    subCategoryName: 'Body Lotions & UV Skincare',
    price: 11200,
    oldPrice: 14500,
    discountPercent: 23,
    rating: 4.9,
    reviewCount: 410,
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-4',
    merchantName: 'Lekki Loom Textiles',
    merchantCode: 'MRC-LEKKI-04',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup'],
    stockQty: 320,
    isFlashSale: true,
    isBestSeller: true,
    description: 'Formulated with 95% pure Vitamin C, pearl extract, and SPF 15 to nourish melanin-rich skin and protect against harsh UV exposure.',
    specs: [
      { label: 'Pack Size', value: '2 Bottles × 400ml (800ml Total)' },
      { label: 'SPF Protection', value: 'SPF 15 UV Shield' },
      { label: 'Skin Type', value: 'Dry to Combination Skin' },
    ],
    variants: [
      { label: 'Formula', options: ['Even Glow (Vitamin C)', 'Advanced Care (Almond Oil)'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-23',
    title: 'Unrefined Grade-A Kwara Ivory Shea Butter & Dudu-Osun Soap Carton (5kg)',
    brand: 'AfroGourmet',
    categorySlug: 'beauty',
    categoryName: 'Beauty & Personal Care',
    subCategorySlug: 'shea-natural',
    subCategoryName: 'Raw Shea Butter & Black Soap',
    price: 18500,
    oldPrice: 23000,
    discountPercent: 20,
    rating: 4.9,
    reviewCount: 167,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-0e6d526a6828?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1608248597359-0e6d526a6828?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-5',
    merchantName: 'AfroGourmet Natural Grains',
    merchantCode: 'MRC-FOOD-05',
    sellerType: 'Warehouse Deposit',
    location: 'Kano',
    deliveryOptions: ['Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 110,
    isRecommended: true,
    description: '100% pure cold-kneaded ivory shea butter paired with 6 bars of camwood & honey herbal black soap. Zero paraffin or synthetic fragrance.',
    specs: [
      { label: 'Contents', value: '4kg Raw Shea Tub + 6×150g Black Soap' },
      { label: 'Grade', value: 'Unrefined Export Grade A' },
    ],
    variants: [
      { label: 'Bundle', options: ['4kg Tub + 6 Soaps', '10kg Salon Wholesale Bucket'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === BABY, KIDS & MATERNITY ===
  {
    id: 'prod-11',
    title: 'Pampers Baby-Dry Jumbo Pack Diapers – Size 4 Maxi (90 Count)',
    brand: 'Pampers',
    categorySlug: 'baby',
    categoryName: 'Baby, Kids & Maternity',
    subCategorySlug: 'diapers-wipes',
    subCategoryName: 'Jumbo Diapers & Baby Wipes',
    price: 19800,
    oldPrice: 24000,
    discountPercent: 18,
    rating: 4.9,
    reviewCount: 254,
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-5',
    merchantName: 'AfroGourmet Natural Grains',
    merchantCode: 'MRC-FOOD-05',
    sellerType: 'Warehouse Deposit',
    location: 'Abuja',
    deliveryOptions: ['Express Hub Pickup'],
    stockQty: 115,
    isNewArrival: true,
    description: 'Up to 12 hours of overnight dryness with 3 absorbent micro-pearl channels, stretchy sides, and breathable cotton-soft outer cover.',
    specs: [
      { label: 'Size', value: 'Size 4 Maxi (9–14 kg)' },
      { label: 'Pack Count', value: '90 Diapers Jumbo Carton' },
      { label: 'Lotion', value: 'Hypoallergenic Aloe Vera Strip' },
    ],
    variants: [
      { label: 'Size', options: ['Size 3 (Midi)', 'Size 4 (Maxi)', 'Size 5 (Junior)'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-24',
    title: '6-in-1 Electric Baby Bottle Steam Sterilizer, Dryer & Food Warmer',
    brand: 'Nexus',
    categorySlug: 'baby',
    categoryName: 'Baby, Kids & Maternity',
    subCategorySlug: 'feeding-nursing',
    subCategoryName: 'Bottle Sterilizers & Feeding',
    price: 32000,
    oldPrice: 41000,
    discountPercent: 22,
    rating: 4.8,
    reviewCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-6',
    merchantName: 'Computer Village Direct Hub',
    merchantCode: 'MRC-TECH-06',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 44,
    isRecommended: true,
    description: 'BPA-free high-temperature steam sterilizer holds up to 6 wide-neck feeding bottles, breast pump parts, and pacifiers with auto shut-off.',
    specs: [
      { label: 'Capacity', value: '6 Wide-Neck Bottles + Nipple Tray' },
      { label: 'Material', value: '100% Food-Grade BPA-Free PP' },
    ],
    variants: [
      { label: 'Model', options: ['Sterilizer + Warmer', 'Sterilizer + HEPA Dryer'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === SPORTS & FITNESS ===
  {
    id: 'prod-12',
    title: '20kg Adjustable Cast-Iron Dumbbell Set with Carry Case',
    brand: 'FitForce',
    categorySlug: 'sports',
    categoryName: 'Sports & Fitness',
    subCategorySlug: 'strength-weights',
    subCategoryName: 'Dumbbells, Barbells & Benches',
    price: 44000,
    oldPrice: 55000,
    discountPercent: 20,
    rating: 4.7,
    reviewCount: 77,
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-2',
    merchantName: 'Lagos Prime Auto Spares',
    merchantCode: 'MRC-AUTO-02',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 31,
    isNewArrival: true,
    description: 'Solid cast-iron weight plates with knurled chrome handles and spin-lock collars. Includes steel connector rod to convert into a full barbell.',
    specs: [
      { label: 'Total Weight', value: '20 kg (2 × 10 kg Dumbbells)' },
      { label: 'Plates Included', value: '4×2.5kg, 4×1.25kg, 4×0.5kg + Bars' },
      { label: 'Case', value: 'Molded Heavy-Duty Storage Case' },
    ],
    variants: [
      { label: 'Weight Kit', options: ['20kg Kit', '30kg Kit with Barbell Rod'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-25',
    title: 'Foldable Home Motorized Treadmill (2.5HP Peak, 120kg Max Load)',
    brand: 'FitForce',
    categorySlug: 'sports',
    categoryName: 'Sports & Fitness',
    subCategorySlug: 'cardio-fitness',
    subCategoryName: 'Treadmills, Bikes & Yoga Mats',
    price: 215000,
    oldPrice: 265000,
    discountPercent: 19,
    rating: 4.8,
    reviewCount: 53,
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-2',
    merchantName: 'Lagos Prime Auto Spares',
    merchantCode: 'MRC-AUTO-02',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 12,
    isRecommended: true,
    description: 'Low-noise 2.5HP motor with shock-absorbing 5-layer running belt, LCD calorie/heart-rate monitor, and hydraulic soft-drop folding frame.',
    specs: [
      { label: 'Speed Range', value: '1.0 – 12.8 km/h' },
      { label: 'Max User Weight', value: '120 kg' },
      { label: 'Inverter Friendly', value: 'Runs on 2.5kVA+ Pure Sine Inverter' },
    ],
    variants: [
      { label: 'Configuration', options: ['Standard Treadmill', 'With Massager & Sit-Up Bar'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === INSTALLATION & SERVICES ===
  {
    id: 'prod-13',
    title: 'Certified Home Solar & Inverter Installation Service (1kVA–5kVA)',
    brand: 'GreenVolt',
    categorySlug: 'services',
    categoryName: 'Installation & Services',
    subCategorySlug: 'solar-installation',
    subCategoryName: 'Solar & Inverter Installation',
    price: 45000,
    oldPrice: 60000,
    discountPercent: 25,
    rating: 4.9,
    reviewCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 50,
    isNewArrival: true,
    description: 'COREN-certified solar electrical engineers handle roof mounting, DC breaker box wiring, surge arrestor earthing, and load separation. Escrow released only after system test.',
    specs: [
      { label: 'System Capacity', value: '1kVA to 5kVA Single Phase' },
      { label: 'Included', value: 'Roof Rail Mounting, Trunking & Changeover' },
      { label: 'Service Areas', value: 'Lagos, Abuja, Ibadan, Port Harcourt' },
      { label: 'Workmanship Warranty', value: '12 Months Free Maintenance' },
    ],
    variants: [
      { label: 'System Size', options: ['1kVA – 2.5kVA Setup', '3.5kVA – 5kVA Setup'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-26',
    title: 'Split Air Conditioner Chemical Wash, Servicing & R410a Gas Top-Up (2 Units)',
    brand: 'GreenVolt',
    categorySlug: 'services',
    categoryName: 'Installation & Services',
    subCategorySlug: 'ac-appliance-repair',
    subCategoryName: 'AC Servicing & Gas Refill',
    price: 22000,
    oldPrice: 30000,
    discountPercent: 27,
    rating: 4.8,
    reviewCount: 112,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-3',
    merchantName: 'GreenVolt Solar Tech Ltd',
    merchantCode: 'MRC-SOLAR-03',
    sellerType: 'Official Store',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Free Delivery Eligible'],
    stockQty: 80,
    isBestSeller: true,
    description: 'Complete pressure-bag indoor coil wash, outdoor condenser jet cleaning, drainage flushing, and R410a/R22 refrigerant pressure check for 2 split AC units.',
    specs: [
      { label: 'Coverage', value: '2 Split or Standing AC Units (1HP – 2HP)' },
      { label: 'Guarantee', value: '30-Day Cooling & Zero-Leak Guarantee' },
    ],
    variants: [
      { label: 'Package', options: ['2 AC Units Servicing', '4 AC Units Office Bundle'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },

  // === AUTO SPARES & INDUSTRIAL (MORE) ===
  {
    id: 'prod-3',
    title: 'Toyota Camry / Corolla Ceramic Front Brake Pads Set (2014–2023)',
    brand: 'PrimeAuto',
    categorySlug: 'more',
    categoryName: 'Auto Spares & Industrial',
    subCategorySlug: 'brake-suspension',
    subCategoryName: 'Brake Pads, Shocks & Suspension',
    price: 21500,
    oldPrice: 28000,
    discountPercent: 23,
    rating: 4.7,
    reviewCount: 92,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-2',
    merchantName: 'Lagos Prime Auto Spares',
    merchantCode: 'MRC-AUTO-02',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 42,
    isRecommended: true,
    description: 'OEM-grade low-dust ceramic brake pads with stainless steel anti-squeal shims. Engineered for high-temperature stop-and-go city driving.',
    specs: [
      { label: 'Compound', value: 'Carbon-Ceramic Low Dust (FF Rated)' },
      { label: 'Axle Position', value: 'Front Axle (4 Pads + Shims)' },
      { label: 'Compatibility', value: 'Toyota Camry / Corolla 2014-2023' },
      { label: 'SONCAP', value: 'SON-AUTO-9122' },
    ],
    variants: [
      { label: 'Axle Set', options: ['Front Axle Set', 'Rear Axle Set', 'Complete 4-Wheel Kit'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: 'prod-27',
    title: 'Mobil 1 Full Synthetic 5W-30 Engine Oil (5L Keg) + Genuine Oil Filter',
    brand: 'PrimeAuto',
    categorySlug: 'more',
    categoryName: 'Auto Spares & Industrial',
    subCategorySlug: 'engine-oil-batteries',
    subCategoryName: 'Synthetic Oils & Car Batteries',
    price: 48500,
    oldPrice: 58000,
    discountPercent: 16,
    rating: 4.9,
    reviewCount: 145,
    imageUrl: 'https://images.unsplash.com/photo-1635784063388-1ff609e12d72?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1635784063388-1ff609e12d72?auto=format&fit=crop&w=600&q=80',
    ],
    merchantId: 'mrc-2',
    merchantName: 'Lagos Prime Auto Spares',
    merchantCode: 'MRC-AUTO-02',
    sellerType: 'Verified Merchant',
    location: 'Lagos',
    deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
    stockQty: 68,
    isBestSeller: true,
    description: '100% original holographic-sealed Mobil 1 5W-30 advanced full synthetic motor oil bundled with a spin-on OEM oil filter for up to 10,000km drain intervals.',
    specs: [
      { label: 'Viscosity', value: 'SAE 5W-30 API SP / ILSAC GF-6A' },
      { label: 'Volume', value: '5 Litres Sealed Gallon + Filter' },
    ],
    variants: [
      { label: 'Filter Fitment', options: ['Toyota / Lexus Filter', 'Honda / Acura Filter', 'Hyundai / Kia Filter'] },
    ],
    reviews: DEFAULT_REVIEWS,
  },
];

export function getAllMarketplaceProducts(): MarketplaceProduct[] {
  const storeProducts = platformStore.getState().products || [];
  const mergedMap = new Map<string, MarketplaceProduct>();

  for (const item of MOCK_MARKETPLACE_PRODUCTS) {
    mergedMap.set(item.id, item);
  }

  for (const sp of storeProducts) {
    const basePrice = sp.merchantBasePrice || 25000;
    const oldPrice = sp.recommendedRetailPrice && sp.recommendedRetailPrice > basePrice
      ? sp.recommendedRetailPrice
      : Math.round(basePrice * 1.2);
    const discountPercent = oldPrice > basePrice
      ? Math.round(((oldPrice - basePrice) / oldPrice) * 100)
      : 15;
    const matchedCat = MARKETPLACE_CATEGORIES.find(
      (c) =>
        c.slug === sp.category?.toLowerCase() ||
        c.name.toLowerCase().includes((sp.category || '').toLowerCase())
    ) || MARKETPLACE_CATEGORIES[3];

    const gallery =
      sp.galleryImages && sp.galleryImages.length > 0
        ? sp.galleryImages
        : [sp.imageUrl || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'];

    const existingMock = mergedMap.get(sp.id);
    if (!existingMock || sp.keyFeatures || sp.specs) {
      mergedMap.set(sp.id, {
        id: sp.id,
        title: sp.title,
        brand: sp.brand || existingMock?.brand || sp.merchantName.split(' ')[0] || 'IBOHub',
        categorySlug: matchedCat.slug,
        categoryName: matchedCat.name,
        subCategorySlug: sp.subCategory?.toLowerCase().replace(/\s+/g, '-') || matchedCat.subCategories[0]?.slug || 'general',
        subCategoryName: sp.subCategory || matchedCat.subCategories[0]?.name || 'General',
        price: basePrice,
        oldPrice,
        discountPercent,
        rating: existingMock?.rating || 4.8,
        reviewCount: existingMock?.reviewCount || 42,
        imageUrl: sp.imageUrl || gallery[0],
        images: gallery,
        merchantId: sp.merchantId,
        merchantName: sp.merchantName,
        merchantCode: sp.merchantCode,
        sellerType: sp.fulfillmentType === 'warehouse_deposit' ? 'Warehouse Deposit' : 'Verified Merchant',
        location: sp.dispatchLocation || existingMock?.location || 'Lagos',
        deliveryOptions: ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'],
        stockQty: sp.stockQty ?? 25,
        isRecommended: true,
        description: sp.description || 'Verified merchant inventory stored and fulfilled with safe payment buyer protection.',
        keyFeatures: sp.keyFeatures || existingMock?.keyFeatures,
        whatsInTheBox: sp.whatsInTheBox || existingMock?.whatsInTheBox,
        warranty: sp.warranty || existingMock?.warranty,
        condition: sp.condition || existingMock?.condition || 'Brand New',
        sku: sp.sku || existingMock?.sku || sp.id.toUpperCase(),
        weightKg: sp.weightKg || existingMock?.weightKg,
        specs:
          sp.specs && sp.specs.length > 0
            ? sp.specs
            : existingMock?.specs || [
                { label: 'Brand', value: sp.brand || sp.merchantName },
                { label: 'Condition', value: sp.condition || 'Brand New' },
                { label: 'Warranty', value: sp.warranty || '7-Day Return Guarantee' },
                { label: 'Merchant Code', value: sp.merchantCode },
                { label: 'Fulfillment', value: sp.fulfillmentType === 'warehouse_deposit' ? 'IBO Hub Warehouse' : 'Merchant Direct' },
              ],
        variants:
          sp.variants && sp.variants.length > 0
            ? sp.variants
            : existingMock?.variants || [{ label: 'Option', options: ['Standard Unit'] }],
        reviews: existingMock?.reviews || DEFAULT_REVIEWS,
      });
    }
  }

  return Array.from(mergedMap.values());
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

const CART_STORAGE_KEY = 'ibohub_marketplace_cart_v1';
const RECENT_VIEWED_KEY = 'ibohub_recently_viewed_v1';

class CartManager {
  private items: CartItem[] = [];
  private recentlyViewedIds: string[] = ['prod-6', 'prod-4', 'prod-1', 'prod-5', 'prod-7'];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        this.items = JSON.parse(raw);
      } else {
        this.items = [
          { productId: 'prod-1', quantity: 1, selectedVariants: { 'Bag Size': '50kg Full Bag' } },
          { productId: 'prod-7', quantity: 2, selectedVariants: { Capacity: '30,000mAh (22.5W)' } },
        ];
      }
      const recentRaw = localStorage.getItem(RECENT_VIEWED_KEY);
      if (recentRaw) {
        this.recentlyViewedIds = JSON.parse(recentRaw);
      }
    } catch {
      this.items = [];
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
        localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(this.recentlyViewedIds));
      } catch {
        // ignore storage quota errors
      }
    }
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getItems(): CartItem[] {
    return this.items;
  }

  public getTotalCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public getDetailedItems(): { item: CartItem; product: MarketplaceProduct }[] {
    const all = getAllMarketplaceProducts();
    return this.items
      .map((item) => {
        const product = all.find((p) => p.id === item.productId);
        return product ? { item, product } : null;
      })
      .filter((x): x is { item: CartItem; product: MarketplaceProduct } => x !== null);
  }

  public addItem(productId: string, quantity: number = 1, selectedVariants?: Record<string, string>) {
    const existing = this.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
      if (selectedVariants) {
        existing.selectedVariants = { ...existing.selectedVariants, ...selectedVariants };
      }
    } else {
      this.items.push({ productId, quantity, selectedVariants });
    }
    this.save();
  }

  public updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const existing = this.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = quantity;
      this.save();
    }
  }

  public removeItem(productId: string) {
    this.items = this.items.filter((i) => i.productId !== productId);
    this.save();
  }

  public clearCart() {
    this.items = [];
    this.save();
  }

  public recordViewedProduct(productId: string) {
    this.recentlyViewedIds = [productId, ...this.recentlyViewedIds.filter((id) => id !== productId)].slice(0, 5);
    this.save();
  }

  public getRecentlyViewedProducts(excludeId?: string): MarketplaceProduct[] {
    const all = getAllMarketplaceProducts();
    return this.recentlyViewedIds
      .filter((id) => id !== excludeId)
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is MarketplaceProduct => Boolean(p))
      .slice(0, 5);
  }
}

export const cartStore = new CartManager();

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

const WISHLIST_STORAGE_KEY = 'ibohub_customer_wishlists_v1';

class WishlistManager {
  private byUser: Record<string, WishlistItem[]> = {};
  private hydratedUsers: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) {
        this.byUser = JSON.parse(raw);
      } else {
        this.byUser = {
          'usr-cust-1': [
            { productId: 'prod-6', addedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
            { productId: 'prod-4', addedAt: new Date(Date.now() - 86400000).toISOString() },
          ],
        };
      }
    } catch {
      this.byUser = {};
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.byUser));
      } catch {
        // ignore storage quota errors
      }
    }
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public hydrateFromServer(userId: string | undefined | null) {
    if (!userId || typeof window === 'undefined' || this.hydratedUsers.has(userId)) {
      return;
    }
    this.hydratedUsers.add(userId);
    fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          const current = this.byUser[userId] || [];
          const existingIds = new Set(current.map((i) => i.productId));
          let changed = false;
          for (const row of data.items) {
            if (row.productId && !existingIds.has(row.productId)) {
              current.push({
                productId: String(row.productId),
                addedAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
              });
              existingIds.add(String(row.productId));
              changed = true;
            }
          }
          if (changed) {
            this.byUser[userId] = current;
            this.save();
          }
        }
      })
      .catch(() => {});
  }

  public getItems(userId: string | undefined | null): WishlistItem[] {
    if (!userId) return [];
    return this.byUser[userId] || [];
  }

  public getCount(userId: string | undefined | null): number {
    return this.getItems(userId).length;
  }

  public isWishlisted(userId: string | undefined | null, productId: string): boolean {
    if (!userId) return false;
    return this.getItems(userId).some((item) => item.productId === productId);
  }

  public getDetailedItems(
    userId: string | undefined | null
  ): { item: WishlistItem; product: MarketplaceProduct }[] {
    if (!userId) return [];
    const all = getAllMarketplaceProducts();
    return this.getItems(userId)
      .map((item) => {
        const product = all.find((p) => p.id === item.productId);
        return product ? { item, product } : null;
      })
      .filter((x): x is { item: WishlistItem; product: MarketplaceProduct } => x !== null);
  }

  public addItem(userId: string, productId: string) {
    if (!userId || !productId) return;
    const list = this.byUser[userId] ? [...this.byUser[userId]] : [];
    if (!list.some((i) => i.productId === productId)) {
      list.unshift({ productId, addedAt: new Date().toISOString() });
      this.byUser[userId] = list;
      this.save();

      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      }).catch(() => {});
    }
  }

  public removeItem(userId: string, productId: string) {
    if (!userId || !productId) return;
    const list = this.byUser[userId] || [];
    const next = list.filter((i) => i.productId !== productId);
    if (next.length !== list.length) {
      this.byUser[userId] = next;
      this.save();

      fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId }),
      }).catch(() => {});
    }
  }

  public toggleItem(userId: string, productId: string): boolean {
    if (this.isWishlisted(userId, productId)) {
      this.removeItem(userId, productId);
      return false;
    } else {
      this.addItem(userId, productId);
      return true;
    }
  }

  public clearWishlist(userId: string) {
    if (!userId) return;
    const list = this.byUser[userId] || [];
    for (const item of list) {
      fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: item.productId }),
      }).catch(() => {});
    }
    this.byUser[userId] = [];
    this.save();
  }
}

export const wishlistStore = new WishlistManager();

