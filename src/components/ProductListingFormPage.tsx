import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  Package,
  Image as ImageIcon,
  FileText,
  ListChecks,
  ShieldCheck,
  Truck,
  Star,
  AlertCircle,
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '../data/marketplaceData';
import { Product, FulfillmentType, IboListing } from '../types';

export interface MerchantProductPageSubmission {
  title: string;
  brand: string;
  sku: string;
  condition: 'Brand New' | 'Refurbished' | 'Fresh / Organic';
  category: string;
  subCategory: string;
  merchantBasePrice: number;
  recommendedRetailPrice: number;
  stockQty: number;
  fulfillmentType: FulfillmentType;
  dispatchLocation: 'Lagos' | 'Abuja' | 'Kano' | 'Port Harcourt' | 'Ibadan';
  imageUrl: string;
  galleryImages: string[];
  keyFeatures: string[];
  description: string;
  whatsInTheBox: string;
  weightKg: string;
  dimensions: string;
  warranty: string;
  returnPolicy: string;
  specs: { label: string; value: string }[];
  variants: { label: string; options: string[] }[];
}

export interface IboProductPageSubmission {
  productId: string;
  iboMarkup: number;
  customTitle: string;
  customDescription: string;
  customKeyFeatures: string[];
  customWhatsInTheBox: string;
  customWarranty: string;
  customSpecs: { label: string; value: string }[];
  galleryImages: string[];
}

interface ProductListingFormPageProps {
  mode: 'merchant' | 'ibo';
  merchantName?: string;
  merchantCode?: string;
  iboStoreName?: string;
  maxMarkupPct?: number;
  availableSupplierProducts?: Product[];
  initialProduct?: Product | null;
  initialListing?: IboListing | null;
  onCancel: () => void;
  onSubmitMerchant?: (data: MerchantProductPageSubmission) => void;
  onSubmitIbo?: (data: IboProductPageSubmission) => void;
}

const SAMPLE_CATEGORY_IMAGES: Record<string, string[]> = {
  phones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
  ],
  groceries: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  ],
  home: [
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  ],
};

export const ProductListingFormPage: React.FC<ProductListingFormPageProps> = ({
  mode,
  merchantName = 'Verified Seller',
  merchantCode = 'MRC-001',
  iboStoreName = 'My Online Shop',
  maxMarkupPct = 50,
  availableSupplierProducts = [],
  initialProduct,
  initialListing,
  onCancel,
  onSubmitMerchant,
  onSubmitIbo,
}) => {
  const [activeView, setActiveView] = useState<'form' | 'preview'>('form');
  const [formError, setFormError] = useState<string | null>(null);

  // For IBO mode: selected supplier product
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialListing?.productId ||
      initialProduct?.id ||
      availableSupplierProducts[0]?.id ||
      ''
  );

  const selectedSupplierProduct =
    availableSupplierProducts.find((p) => p.id === selectedProductId) ||
    initialListing?.product ||
    initialProduct ||
    null;

  // 1. Basic Product Info
  const [title, setTitle] = useState<string>(
    initialListing?.customTitle ||
      initialProduct?.title ||
      selectedSupplierProduct?.title ||
      ''
  );
  const [brand, setBrand] = useState<string>(
    initialProduct?.brand ||
      selectedSupplierProduct?.brand ||
      merchantName.split(' ')[0] ||
      ''
  );
  const [categorySlug, setCategorySlug] = useState<string>(
    initialProduct?.category?.toLowerCase() ||
      selectedSupplierProduct?.category?.toLowerCase() ||
      'phones'
  );
  const matchedCat =
    MARKETPLACE_CATEGORIES.find((c) => c.slug === categorySlug) ||
    MARKETPLACE_CATEGORIES[0];

  const [subCategory, setSubCategory] = useState<string>(
    initialProduct?.subCategory ||
      selectedSupplierProduct?.subCategory ||
      matchedCat.subCategories[0]?.name ||
      'Smartphones (5G & 4G)'
  );
  const [condition, setCondition] = useState<'Brand New' | 'Refurbished' | 'Fresh / Organic'>(
    initialProduct?.condition || selectedSupplierProduct?.condition || 'Brand New'
  );
  const [sku, setSku] = useState<string>(
    initialProduct?.sku ||
      selectedSupplierProduct?.sku ||
      `SKU-${Math.floor(10000 + Math.random() * 90000)}`
  );

  // 2. Product Images
  const [mainImageUrl, setMainImageUrl] = useState<string>(
    initialProduct?.imageUrl ||
      selectedSupplierProduct?.imageUrl ||
      SAMPLE_CATEGORY_IMAGES.phones[0]
  );
  const [extraImages, setExtraImages] = useState<string[]>(
    initialProduct?.galleryImages?.slice(1) ||
      selectedSupplierProduct?.galleryImages?.slice(1) ||
      ['']
  );

  // 3. Key Features, Description & What's in the Box
  const [keyFeatures, setKeyFeatures] = useState<string[]>(
    initialListing?.customKeyFeatures && initialListing.customKeyFeatures.length > 0
      ? initialListing.customKeyFeatures
      : initialProduct?.keyFeatures && initialProduct.keyFeatures.length > 0
      ? initialProduct.keyFeatures
      : [
          '100% genuine quality checked before dispatch',
          'Protected by Safe Payment — pay only when your order arrives',
          'Fast doorstep delivery or local pickup center option',
        ]
  );
  const [description, setDescription] = useState<string>(
    initialListing?.customDescription ||
      initialProduct?.description ||
      selectedSupplierProduct?.description ||
      ''
  );
  const [whatsInTheBox, setWhatsInTheBox] = useState<string>(
    initialListing?.customWhatsInTheBox ||
      initialProduct?.whatsInTheBox ||
      selectedSupplierProduct?.whatsInTheBox ||
      '1x Main Product Unit, 1x User Guide & Warranty Slip'
  );

  // 4. Technical Specifications & Variants
  const [weightKg, setWeightKg] = useState<string>(
    initialProduct?.weightKg || selectedSupplierProduct?.weightKg || '1.2 kg'
  );
  const [dimensions, setDimensions] = useState<string>(
    initialProduct?.dimensions || selectedSupplierProduct?.dimensions || '25 x 18 x 10 cm'
  );
  const [variantLabel, setVariantLabel] = useState<string>(
    initialProduct?.variants?.[0]?.label || 'Option / Size'
  );
  const [variantOptionsText, setVariantOptionsText] = useState<string>(
    initialProduct?.variants?.[0]?.options?.join(', ') || 'Standard Pack'
  );
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(
    initialListing?.customSpecs && initialListing.customSpecs.length > 0
      ? initialListing.customSpecs
      : initialProduct?.specs && initialProduct.specs.length > 0
      ? initialProduct.specs
      : [
          { label: 'Model / SKU', value: sku },
          { label: 'Condition', value: 'Brand New in Original Packaging' },
          { label: 'Quality Check', value: 'Verified before shipping' },
        ]
  );

  // 5. Pricing, Stock, Delivery & Warranty
  const [basePrice, setBasePrice] = useState<number>(
    initialProduct?.merchantBasePrice ||
      selectedSupplierProduct?.merchantBasePrice ||
      28000
  );
  const [recommendedRetailPrice, setRecommendedRetailPrice] = useState<number>(
    initialProduct?.recommendedRetailPrice ||
      Math.round((initialProduct?.merchantBasePrice || 28000) * 1.2)
  );
  const [stockQty, setStockQty] = useState<number>(
    initialProduct?.stockQty || selectedSupplierProduct?.stockQty || 25
  );
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(
    initialProduct?.fulfillmentType || 'warehouse_deposit'
  );
  const [dispatchLocation, setDispatchLocation] = useState<
    'Lagos' | 'Abuja' | 'Kano' | 'Port Harcourt' | 'Ibadan'
  >(initialProduct?.dispatchLocation || 'Lagos');
  const [warranty, setWarranty] = useState<string>(
    initialListing?.customWarranty ||
      initialProduct?.warranty ||
      selectedSupplierProduct?.warranty ||
      '12 Months Official Warranty & 7-Day Free Return'
  );
  const [returnPolicy, setReturnPolicy] = useState<string>(
    initialProduct?.returnPolicy || '7-Day Free Return if faulty or not as described'
  );

  // IBO Markup state
  const [iboMarkup, setIboMarkup] = useState<number>(
    initialListing?.iboMarkup ??
      Math.round((selectedSupplierProduct?.merchantBasePrice || 25000) * 0.2)
  );

  // Sync fields when IBO changes the selected supplier product
  useEffect(() => {
    if (mode === 'ibo' && selectedSupplierProduct && !initialListing) {
      setTitle(selectedSupplierProduct.title);
      setBrand(
        selectedSupplierProduct.brand ||
          selectedSupplierProduct.merchantName.split(' ')[0] ||
          'Verified Brand'
      );
      setDescription(selectedSupplierProduct.description);
      setMainImageUrl(selectedSupplierProduct.imageUrl);
      setBasePrice(selectedSupplierProduct.merchantBasePrice);
      setIboMarkup(Math.round(selectedSupplierProduct.merchantBasePrice * 0.2));
      if (selectedSupplierProduct.keyFeatures?.length) {
        setKeyFeatures(selectedSupplierProduct.keyFeatures);
      }
      if (selectedSupplierProduct.whatsInTheBox) {
        setWhatsInTheBox(selectedSupplierProduct.whatsInTheBox);
      }
      if (selectedSupplierProduct.specs?.length) {
        setSpecs(selectedSupplierProduct.specs);
      } else {
        setSpecs([
          { label: 'Brand', value: selectedSupplierProduct.merchantName },
          { label: 'Category', value: selectedSupplierProduct.category },
          { label: 'Condition', value: 'Brand New' },
        ]);
      }
    }
  }, [selectedProductId, mode]);

  const maxAllowedMarkup = Math.round(
    (selectedSupplierProduct?.merchantBasePrice || basePrice) * (maxMarkupPct / 100)
  );
  const finalPreviewPrice =
    mode === 'ibo'
      ? (selectedSupplierProduct?.merchantBasePrice || basePrice) + iboMarkup
      : basePrice;

  const validKeyFeatures = keyFeatures.map((f) => f.trim()).filter(Boolean);
  const validSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
  const allGalleryImages = [
    mainImageUrl.trim(),
    ...extraImages.map((u) => u.trim()).filter(Boolean),
  ].filter(Boolean);

  // Checklist status for online shopping product page readiness
  const checklist = [
    {
      label: 'Product Name, Brand & Category',
      done: Boolean(title.trim().length >= 5 && brand.trim().length >= 2),
    },
    {
      label: 'Product Photo Gallery',
      done: Boolean(mainImageUrl.trim().startsWith('http') || mainImageUrl.trim().startsWith('/')),
    },
    {
      label: 'Key Highlights (at least 2 bullet points) & Description',
      done: Boolean(validKeyFeatures.length >= 2 && description.trim().length >= 15),
    },
    {
      label: "What's in the Box & Specifications Table",
      done: Boolean(whatsInTheBox.trim().length >= 5 && validSpecs.length >= 2),
    },
    {
      label: mode === 'merchant' ? 'Price, Stock & Warranty Details' : 'Shop Markup & Warranty Details',
      done:
        mode === 'merchant'
          ? Boolean(basePrice > 0 && stockQty > 0 && warranty.trim().length >= 3)
          : Boolean(
              iboMarkup >= 0 &&
                iboMarkup <= maxAllowedMarkup &&
                warranty.trim().length >= 3
            ),
    },
  ];

  const allChecksComplete = checklist.every((c) => c.done);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || title.trim().length < 5) {
      setFormError('Please enter a clear product name (at least 5 characters).');
      return;
    }
    if (!brand.trim()) {
      setFormError('Please enter the product brand name.');
      return;
    }
    if (!mainImageUrl.trim()) {
      setFormError('Please provide a main product photo URL.');
      return;
    }
    if (validKeyFeatures.length < 2) {
      setFormError('Please enter at least 2 Key Features / Highlights so shoppers know what they are buying.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setFormError('Please write a detailed product description (at least 15 characters).');
      return;
    }
    if (!whatsInTheBox.trim()) {
      setFormError("Please fill in the 'What's in the Box' field.");
      return;
    }
    if (validSpecs.length < 2) {
      setFormError('Please fill in at least 2 product specifications in the Specifications section.');
      return;
    }

    if (mode === 'merchant' && onSubmitMerchant) {
      if (basePrice <= 0) {
        setFormError('Wholesale price must be greater than ₦0.');
        return;
      }
      onSubmitMerchant({
        title: title.trim(),
        brand: brand.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        condition,
        category: matchedCat.slug,
        subCategory: subCategory.trim() || matchedCat.subCategories[0]?.name || 'General',
        merchantBasePrice: Number(basePrice),
        recommendedRetailPrice: Number(recommendedRetailPrice) || Math.round(Number(basePrice) * 1.2),
        stockQty: Number(stockQty),
        fulfillmentType,
        dispatchLocation,
        imageUrl: mainImageUrl.trim(),
        galleryImages: allGalleryImages,
        keyFeatures: validKeyFeatures,
        description: description.trim(),
        whatsInTheBox: whatsInTheBox.trim(),
        weightKg: weightKg.trim() || '1.0 kg',
        dimensions: dimensions.trim() || '20 x 15 x 10 cm',
        warranty: warranty.trim(),
        returnPolicy: returnPolicy.trim(),
        specs: [
          ...validSpecs,
          { label: 'Weight', value: weightKg.trim() || '1.0 kg' },
          { label: 'Dimensions', value: dimensions.trim() || '20 x 15 x 10 cm' },
          { label: 'Warranty', value: warranty.trim() },
        ],
        variants: [
          {
            label: variantLabel.trim() || 'Option',
            options: variantOptionsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
        ],
      });
    } else if (mode === 'ibo' && onSubmitIbo) {
      if (!selectedProductId) {
        setFormError('Please select a supplier product to list.');
        return;
      }
      if (iboMarkup < 0 || iboMarkup > maxAllowedMarkup) {
        setFormError(
          `Your profit markup must be between ₦0 and ₦${maxAllowedMarkup.toLocaleString()} (max ${maxMarkupPct}%).`
        );
        return;
      }
      onSubmitIbo({
        productId: selectedProductId,
        iboMarkup: Number(iboMarkup),
        customTitle: title.trim(),
        customDescription: description.trim(),
        customKeyFeatures: validKeyFeatures,
        customWhatsInTheBox: whatsInTheBox.trim(),
        customWarranty: warranty.trim(),
        customSpecs: validSpecs,
        galleryImages: allGalleryImages,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-surface border border-line rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3 rounded border border-line hover:bg-page text-ink font-bold text-[12px] flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Back to Catalog</span>
          </button>
          <div>
            <div className="text-[11px] font-bold text-primary-dark uppercase">
              {mode === 'merchant'
                ? 'Seller Product Page Builder'
                : `IBO Shop Product Page Builder (${iboStoreName})`}
            </div>
            <h1 className="section-title text-ink">
              {initialProduct || initialListing
                ? 'Edit Product Page & Specifications'
                : 'Complete Product Page Before Listing'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-page p-1 rounded border border-line">
            <button
              type="button"
              onClick={() => setActiveView('form')}
              className={`h-8 px-3 rounded text-[12px] font-bold cursor-pointer ${
                activeView === 'form'
                  ? 'bg-surface text-primary-dark border border-line'
                  : 'text-muted hover:text-ink'
              }`}
            >
              1. Fill Product Details
            </button>
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className={`h-8 px-3 rounded text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
                activeView === 'preview'
                  ? 'bg-surface text-primary-dark border border-line'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>2. Preview Product Page</span>
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-surface border border-sale rounded flex items-center gap-2.5 text-sale text-[13px] font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={1.75} />
          <span>{formError}</span>
        </div>
      )}

      {activeView === 'preview' ? (
        /* ============================================================== */
        /* LIVE CUSTOMER-FACING PRODUCT PAGE PREVIEW (JUMIA/AMAZON STYLE) */
        /* ============================================================== */
        <div className="space-y-5">
          <div className="p-3.5 bg-primary-tint border border-primary-dark rounded flex flex-wrap items-center justify-between gap-2 text-[13px] text-on-primary">
            <span>
              <strong>Customer Product Page Preview:</strong> This is the exact product page shoppers will see when they click your item.
            </span>
            <button
              type="button"
              onClick={() => setActiveView('form')}
              className="font-bold underline cursor-pointer"
            >
              ← Return to Edit Form
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left + Center: Gallery & Main Info (9 cols) */}
            <div className="lg:col-span-9 bg-surface border border-line rounded p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-3">
                <div className="aspect-square w-full bg-page border border-line rounded overflow-hidden">
                  <img
                    src={mainImageUrl}
                    alt={title || 'Product preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {allGalleryImages.map((img, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded border border-line overflow-hidden bg-page shrink-0"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="space-y-2 border-b border-line pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                    <span>
                      Brand: <strong className="text-primary-dark">{brand || 'Brand'}</strong>
                    </span>
                    <span>·</span>
                    <span>Condition: {condition}</span>
                    <span>·</span>
                    <span>SKU: {sku}</span>
                  </div>
                  <h2 className="text-[20px] font-bold text-ink leading-snug">
                    {title || 'Your Product Title Will Appear Here'}
                  </h2>
                  <div className="flex items-center gap-2 text-[12px]">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" strokeWidth={1.75} />
                      <span className="font-bold text-ink">New Listing</span>
                    </div>
                    <span>·</span>
                    <span className="text-primary-dark font-bold">
                      In stock ({stockQty} units)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="price-text-lg text-ink">
                    ₦{finalPreviewPrice.toLocaleString()}
                  </div>
                  {mode === 'ibo' && (
                    <div className="text-[12px] text-primary-dark font-bold">
                      Includes your ₦{iboMarkup.toLocaleString()} profit markup on ₦
                      {(selectedSupplierProduct?.merchantBasePrice || basePrice).toLocaleString()} wholesale base
                    </div>
                  )}
                </div>

                {/* Key Features Box on Product Page */}
                <div className="p-3.5 bg-page border border-line rounded space-y-2">
                  <div className="text-[12px] font-bold text-ink uppercase">
                    Key Features &amp; Highlights
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[13px] text-ink">
                    {validKeyFeatures.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="h-10 px-6 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded cursor-pointer"
                  >
                    {mode === 'merchant'
                      ? 'Publish Product Page to Marketplace'
                      : 'Publish Product Page to My Shop'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('form')}
                    className="h-10 px-4 bg-surface border border-line text-ink font-bold text-[13px] rounded cursor-pointer"
                  >
                    Back to Form
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Delivery, Warranty & Seller Info (3 cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-surface border border-line rounded p-4 space-y-3 text-[12px]">
                <div className="font-bold text-ink uppercase border-b border-line pb-2">
                  Delivery &amp; Warranty
                </div>
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-bold text-ink">Dispatched from {dispatchLocation}</div>
                    <p className="text-muted">Free delivery on orders over ₦20,000.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <div className="font-bold text-ink">Warranty &amp; Returns</div>
                    <p className="text-muted">{warranty}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description, What's in the Box & Specifications Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 bg-surface border border-line rounded p-5 space-y-4 text-[13px]">
              <div>
                <h3 className="section-title text-ink mb-2">Product Description</h3>
                <p className="text-ink leading-relaxed whitespace-pre-line">{description}</p>
              </div>
              <div className="pt-3 border-t border-line">
                <h4 className="font-bold text-ink uppercase text-[12px] mb-1.5">
                  What's in the Box
                </h4>
                <p className="text-ink">{whatsInTheBox}</p>
              </div>
            </div>

            <div className="md:col-span-5 bg-surface border border-line rounded p-5 space-y-3 text-[13px]">
              <h3 className="section-title text-ink">Specifications</h3>
              <table className="w-full border border-line text-[13px]">
                <tbody className="divide-y divide-line">
                  {validSpecs.map((s, idx) => (
                    <tr key={idx}>
                      <th className="w-2/5 bg-page px-3 py-2 text-left font-bold text-ink border-r border-line">
                        {s.label}
                      </th>
                      <td className="px-3 py-2 text-ink">{s.value}</td>
                    </tr>
                  ))}
                  <tr>
                    <th className="bg-page px-3 py-2 text-left font-bold text-ink border-r border-line">
                      Weight
                    </th>
                    <td className="px-3 py-2 text-ink">{weightKg}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* STRUCTURED ONLINE SHOPPING PRODUCT PAGE CREATION FORM          */
        /* ============================================================== */
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Structured Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* IBO Supplier Product Picker (when mode === 'ibo') */}
            {mode === 'ibo' && availableSupplierProducts.length > 0 && (
              <section className="bg-surface border border-line rounded p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <Package className="w-4 h-4" strokeWidth={1.75} />
                  <span>Step 0: Select Supplier Product to List in Your Shop</span>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-ink mb-1.5">
                    Choose Verified Supplier Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                  >
                    {availableSupplierProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — Wholesale: ₦{p.merchantBasePrice.toLocaleString()} ({p.merchantName})
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {/* SECTION 1: BASIC PRODUCT INFORMATION */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <Package className="w-4 h-4" strokeWidth={1.75} />
                  <span>Section 1 of 5</span>
                </div>
                <h2 className="section-title text-ink mt-0.5">Basic Product Information</h2>
                <p className="text-[12px] text-muted">
                  Include the brand, model, key spec, and size/color in your title just like top online shopping sites.
                </p>
              </div>

              <div className="space-y-3.5 text-[13px]">
                <div>
                  <label className="block font-bold text-ink mb-1">
                    Product Title (Displayed on Product Page) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Samsung Galaxy A15 6.5-Inch Super AMOLED (6GB RAM, 128GB ROM) – Blue"
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Samsung, Oraimo, RoyalStallion"
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Condition *</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Fresh / Organic">Fresh / Organic Produce</option>
                      <option value="Refurbished">Certified Refurbished</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Model / SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. SAM-A15-128B"
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">Category *</label>
                    <select
                      value={categorySlug}
                      onChange={(e) => {
                        const newSlug = e.target.value;
                        setCategorySlug(newSlug);
                        const catObj = MARKETPLACE_CATEGORIES.find((c) => c.slug === newSlug);
                        if (catObj && catObj.subCategories[0]) {
                          setSubCategory(catObj.subCategories[0].name);
                        }
                      }}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    >
                      {MARKETPLACE_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">Sub-Category *</label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    >
                      {matchedCat.subCategories.map((sub) => (
                        <option key={sub.slug} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: PRODUCT IMAGES & GALLERY */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                  <span>Section 2 of 5</span>
                </div>
                <h2 className="section-title text-ink mt-0.5">Product Images &amp; Gallery</h2>
                <p className="text-[12px] text-muted">
                  Clear product photos help customers see the item from multiple angles before ordering.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start text-[13px]">
                <div className="sm:col-span-4">
                  <div className="aspect-square w-full bg-page border border-line rounded overflow-hidden">
                    <img
                      src={mainImageUrl}
                      alt="Main product preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-muted mt-1 text-center">
                    Main Product Photo Preview
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Main Product Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={mainImageUrl}
                      onChange={(e) => setMainImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>

                  {/* Quick sample images for convenience */}
                  <div>
                    <span className="block text-[11px] font-bold text-muted uppercase mb-1">
                      Or pick a sample category photo:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        SAMPLE_CATEGORY_IMAGES[categorySlug] ||
                        SAMPLE_CATEGORY_IMAGES.phones
                      ).map((sampleUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMainImageUrl(sampleUrl)}
                          className="h-8 px-2.5 bg-page border border-line hover:border-primary-dark rounded text-[11px] font-medium text-ink cursor-pointer"
                        >
                          Use Sample Photo {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-ink text-[12px]">
                        Additional Gallery Photos (Optional)
                      </label>
                      {extraImages.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setExtraImages([...extraImages, ''])}
                          className="text-[12px] font-bold text-primary-dark hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Add Photo Angle</span>
                        </button>
                      )}
                    </div>
                    {extraImages.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const next = [...extraImages];
                            next[idx] = e.target.value;
                            setExtraImages(next);
                          }}
                          placeholder={`Gallery image URL #${idx + 2}`}
                          className="flex-1 h-9 px-3 bg-surface border border-line rounded text-[12px] text-ink"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExtraImages(extraImages.filter((_, i) => i !== idx))
                          }
                          className="w-9 h-9 border border-line rounded flex items-center justify-center text-muted hover:text-sale cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: KEY FEATURES, DESCRIPTION & WHAT'S IN THE BOX */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <FileText className="w-4 h-4" strokeWidth={1.75} />
                  <span>Section 3 of 5</span>
                </div>
                <h2 className="section-title text-ink mt-0.5">
                  Key Highlights, Description &amp; What's in the Box
                </h2>
                <p className="text-[12px] text-muted">
                  Shoppers read bullet highlights and package contents first before adding an item to their cart.
                </p>
              </div>

              <div className="space-y-4 text-[13px]">
                {/* Key Features Bullet List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-ink">
                      Key Features / Bullet Highlights (Min 2 required) *
                    </label>
                    {keyFeatures.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setKeyFeatures([...keyFeatures, ''])}
                        className="text-[12px] font-bold text-primary-dark hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Add Bullet Point</span>
                      </button>
                    )}
                  </div>
                  {keyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-muted font-bold text-[12px] w-5">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const next = [...keyFeatures];
                          next[idx] = e.target.value;
                          setKeyFeatures(next);
                        }}
                        placeholder="e.g. 5000mAh battery with 25W fast charging support"
                        className="flex-1 h-9 px-3 bg-surface border border-line rounded text-ink"
                      />
                      {keyFeatures.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setKeyFeatures(keyFeatures.filter((_, i) => i !== idx))
                          }
                          className="w-9 h-9 border border-line rounded flex items-center justify-center text-muted hover:text-sale cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    Full Product Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the product clearly in everyday words: what it does, who it is for, how to use it, and why buyers love it..."
                    className="w-full p-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">
                    What's in the Box (Package Contents) *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsInTheBox}
                    onChange={(e) => setWhatsInTheBox(e.target.value)}
                    placeholder="e.g. 1x Phone, 1x USB-C Cable, 1x Ejector Pin, 1x User Manual & Warranty Card"
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 4: TECHNICAL SPECIFICATIONS & VARIANTS */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <ListChecks className="w-4 h-4" strokeWidth={1.75} />
                  <span>Section 4 of 5</span>
                </div>
                <h2 className="section-title text-ink mt-0.5">
                  Technical Specifications &amp; Options
                </h2>
                <p className="text-[12px] text-muted">
                  These populate the "Specifications" table on the product page (weight, size, color, capacity, material).
                </p>
              </div>

              <div className="space-y-4 text-[13px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Item Weight (for Delivery) *
                    </label>
                    <input
                      type="text"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="e.g. 0.45 kg or 50 kg"
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Dimensions (L × W × H)
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="e.g. 16 x 8 x 1 cm"
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>
                </div>

                {mode === 'merchant' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Option / Variant Type
                      </label>
                      <input
                        type="text"
                        value={variantLabel}
                        onChange={(e) => setVariantLabel(e.target.value)}
                        placeholder="e.g. Color, Storage Size, Bag Weight"
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Available Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={variantOptionsText}
                        onChange={(e) => setVariantOptionsText(e.target.value)}
                        placeholder="e.g. 128GB Blue, 128GB Black, 256GB Blue"
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-ink">
                      Specification Table Rows (Min 2 required) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                      className="text-[12px] font-bold text-primary-dark hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Add Specification Row</span>
                    </button>
                  </div>

                  {specs.map((spec, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => {
                          const next = [...specs];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Spec Name (e.g. Battery, Material)"
                        className="col-span-5 h-9 px-3 bg-page border border-line rounded text-ink"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const next = [...specs];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Value (e.g. 5000mAh Li-Po, 100% Cotton)"
                        className="col-span-6 h-9 px-3 bg-surface border border-line rounded text-ink"
                      />
                      {specs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                          className="col-span-1 h-9 border border-line rounded flex items-center justify-center text-muted hover:text-sale cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 5: PRICING, STOCK, DELIVERY & WARRANTY */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                  <span>Section 5 of 5</span>
                </div>
                <h2 className="section-title text-ink mt-0.5">
                  {mode === 'merchant'
                    ? 'Pricing, Stock Quantity, Dispatch & Warranty'
                    : 'Your Shop Price Markup & Customer Warranty'}
                </h2>
              </div>

              {mode === 'merchant' ? (
                <div className="space-y-4 text-[13px]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Wholesale Selling Price (₦) *
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Old / Regular Price (₦)
                      </label>
                      <input
                        type="number"
                        value={recommendedRetailPrice}
                        onChange={(e) => setRecommendedRetailPrice(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Available Stock (Units) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={stockQty}
                        onChange={(e) => setStockQty(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Dispatch City / State *
                      </label>
                      <select
                        value={dispatchLocation}
                        onChange={(e) => setDispatchLocation(e.target.value as any)}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      >
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Kano">Kano</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                        <option value="Ibadan">Ibadan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Storage &amp; Handover Method *
                      </label>
                      <select
                        value={fulfillmentType}
                        onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      >
                        <option value="warehouse_deposit">
                          Stored at IBO Hub Pickup Center (Fastest Dispatch)
                        </option>
                        <option value="merchant_held">
                          Kept at My Shop / Warehouse (Rider Picks Up)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Warranty Information *
                      </label>
                      <input
                        type="text"
                        required
                        value={warranty}
                        onChange={(e) => setWarranty(e.target.value)}
                        placeholder="e.g. 1 Year Manufacturer Warranty"
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Return Policy *
                      </label>
                      <input
                        type="text"
                        required
                        value={returnPolicy}
                        onChange={(e) => setReturnPolicy(e.target.value)}
                        placeholder="e.g. 7-Day Free Return for faulty items"
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-[13px]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-page border border-line rounded">
                    <div>
                      <div className="text-[11px] font-bold text-muted uppercase">
                        Supplier Wholesale Price
                      </div>
                      <div className="price-text text-ink mt-1">
                        ₦{(selectedSupplierProduct?.merchantBasePrice || basePrice).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-primary-dark uppercase">
                        Your Profit Markup (Max {maxMarkupPct}%)
                      </div>
                      <div className="price-text text-primary-dark mt-1">
                        +₦{iboMarkup.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-ink uppercase">
                        Final Shop Customer Price
                      </div>
                      <div className="price-text text-ink mt-1">
                        ₦{finalPreviewPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Set Your Profit Markup (₦0 up to ₦{maxAllowedMarkup.toLocaleString()}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={maxAllowedMarkup}
                      value={iboMarkup}
                      onChange={(e) => setIboMarkup(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Warranty &amp; Buyer Assurance Shown on Product Page *
                    </label>
                    <input
                      type="text"
                      required
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      placeholder="e.g. 12 Months Warranty + 7-Day Free Return Guarantee"
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right 4 Columns: Sticky Readiness Checklist & Publish CTA */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <div className="text-[11px] font-bold text-primary-dark uppercase">
                  Required Before Listing
                </div>
                <h3 className="section-title text-ink mt-0.5">
                  Product Page Readiness
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Every product must have a complete online shopping page before it can be listed for customers.
                </p>
              </div>

              <ul className="space-y-2.5 text-[13px]">
                {checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        item.done ? 'text-primary-dark' : 'text-muted/40'
                      }`}
                      strokeWidth={2}
                    />
                    <span className={item.done ? 'text-ink font-medium' : 'text-muted'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Mini Product Card Preview */}
              <div className="p-3 bg-page border border-line rounded space-y-2">
                <div className="text-[11px] font-bold text-muted uppercase">
                  Live Card Preview
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={mainImageUrl}
                    alt=""
                    className="w-14 h-14 rounded object-cover border border-line bg-surface shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-primary-dark font-bold truncate">
                      {brand || 'Brand'}
                    </div>
                    <div className="text-[13px] font-bold text-ink truncate">
                      {title || 'Untitled Product'}
                    </div>
                    <div className="text-[14px] font-bold text-ink">
                      ₦{finalPreviewPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  <span>
                    {mode === 'merchant'
                      ? 'Save Product Page & List Item'
                      : 'Save Product Page & Publish to Shop'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('preview')}
                  className="w-full h-10 bg-surface border border-line hover:border-primary-dark text-ink font-bold text-[13px] rounded flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                  <span>Preview Full Product Page</span>
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full h-9 text-muted hover:text-ink text-[12px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </aside>
        </form>
      )}
    </div>
  );
};
