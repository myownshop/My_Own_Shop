import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ChevronRight,
  Star,
  Store,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  MARKETPLACE_CATEGORIES,
  TOP_MERCHANTS,
  getAllMarketplaceProducts,
} from '../../data/marketplaceData';
import { ProductCard } from '../../components/ProductCard';

interface CategorySearchScreenProps {
  mode?: 'category' | 'search' | 'merchant' | 'merchants-directory';
  categorySlug?: string;
  subCategorySlug?: string;
  merchantId?: string;
  initialQuery?: string;
  currentPath?: string;
  onNavigate: (path: string) => void;
}

const PRICE_RANGES = [
  { id: 'all', label: 'Any Price', min: 0, max: Infinity },
  { id: 'under-20k', label: 'Under ₦20,000', min: 0, max: 20000 },
  { id: '20k-50k', label: '₦20,000 – ₦50,000', min: 20000, max: 50000 },
  { id: '50k-150k', label: '₦50,000 – ₦150,000', min: 50000, max: 150000 },
  { id: 'over-150k', label: 'Above ₦150,000', min: 150000, max: Infinity },
];

const SELLER_TYPES = ['Official Store', 'Verified Merchant', 'Warehouse Deposit'];
const DELIVERY_OPTIONS = ['Same-Day Lagos', 'Express Hub Pickup', 'Free Delivery Eligible'];
const LOCATIONS = ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan'];

export const CategorySearchScreen: React.FC<CategorySearchScreenProps> = ({
  mode,
  categorySlug,
  subCategorySlug,
  merchantId,
  initialQuery,
  currentPath,
  onNavigate,
}) => {
  const safePath =
    currentPath ||
    (typeof window !== 'undefined'
      ? (window.location.pathname || '/') + (window.location.search || '')
      : '/');

  const queryPart = safePath.includes('?')
    ? safePath.split('?')[1]
    : typeof window !== 'undefined'
    ? window.location.search.replace(/^\?/, '')
    : '';
  const urlParams = new URLSearchParams(queryPart);

  const queryText = (urlParams.get('q') ?? initialQuery ?? '').trim();
  const queryCategory = urlParams.get('category') || urlParams.get('cat') || '';
  const querySubCategory = urlParams.get('sub') || subCategorySlug || 'all';
  const queryMerchant = urlParams.get('merchant') || merchantId || '';
  const initialSort = urlParams.get('sort') || 'featured';

  const effectiveMode =
    mode ||
    (safePath.startsWith('/merchants')
      ? 'merchants-directory'
      : safePath.startsWith('/store/') || queryMerchant
      ? 'merchant'
      : safePath.startsWith('/category/')
      ? 'category'
      : 'search');

  const activeCategorySlug =
    effectiveMode === 'category'
      ? categorySlug || 'all'
      : queryCategory && queryCategory !== 'all'
      ? queryCategory
      : 'all';

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(querySubCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedSellerTypes, setSelectedSellerTypes] = useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedSubCategory(querySubCategory);
    setSortBy(initialSort);
    setCurrentPage(1);
  }, [safePath, categorySlug, subCategorySlug, querySubCategory, initialSort]);

  const allProducts = getAllMarketplaceProducts();

  const activeCategoryObj = MARKETPLACE_CATEGORIES.find(
    (c) => c.slug === activeCategorySlug
  );

  const activeMerchantObj = queryMerchant
    ? TOP_MERCHANTS.find(
        (m) =>
          m.id.toLowerCase() === queryMerchant.toLowerCase() ||
          m.code.toLowerCase() === queryMerchant.toLowerCase()
      )
    : undefined;

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (activeCategorySlug === 'all' || p.categorySlug === activeCategorySlug) {
        set.add(p.brand);
      }
    });
    return Array.from(set);
  }, [allProducts, activeCategorySlug]);

  const filteredProducts = useMemo(() => {
    const priceObj =
      PRICE_RANGES.find((r) => r.id === selectedPriceRange) || PRICE_RANGES[0];

    const list = allProducts.filter((p) => {
      if (activeMerchantObj) {
        if (p.merchantId !== activeMerchantObj.id) return false;
      }

      if (activeCategorySlug && activeCategorySlug !== 'all') {
        if (p.categorySlug !== activeCategorySlug) return false;
      }

      if (selectedSubCategory && selectedSubCategory !== 'all') {
        if (p.subCategorySlug !== selectedSubCategory) return false;
      }

      if (queryText) {
        const q = queryText.toLowerCase();
        if (q === 'flash') {
          if (!p.isFlashSale) return false;
        } else {
          const matchesText =
            p.title.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.subCategoryName.toLowerCase().includes(q) ||
            p.merchantName.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q);
          if (!matchesText) return false;
        }
      }

      if (p.price < priceObj.min || p.price > priceObj.max) return false;

      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
        return false;
      }

      if (minRating > 0 && p.rating < minRating) {
        return false;
      }

      if (
        selectedSellerTypes.length > 0 &&
        !selectedSellerTypes.includes(p.sellerType)
      ) {
        return false;
      }

      if (selectedDelivery.length > 0) {
        const hasDelivery = selectedDelivery.some((opt) =>
          p.deliveryOptions.includes(opt)
        );
        if (!hasDelivery) return false;
      }

      if (selectedLocation !== 'all' && p.location !== selectedLocation) {
        return false;
      }

      return true;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }

    return list;
  }, [
    allProducts,
    activeMerchantObj,
    activeCategorySlug,
    selectedSubCategory,
    queryText,
    selectedPriceRange,
    selectedBrands,
    minRating,
    selectedSellerTypes,
    selectedDelivery,
    selectedLocation,
    sortBy,
  ]);

  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setCurrentPage(1);
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const resetAllFilters = () => {
    setSelectedSubCategory('all');
    setSelectedPriceRange('all');
    setSelectedBrands([]);
    setMinRating(0);
    setSelectedSellerTypes([]);
    setSelectedDelivery([]);
    setSelectedLocation('all');
    setCurrentPage(1);
  };

  const activeSubCategoryObj = activeCategoryObj?.subCategories.find(
    (s) => s.slug === selectedSubCategory
  );

  const renderFilterControls = () => (
    <div className="space-y-5 text-[14px]">
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <span className="font-bold text-ink">Filters</span>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
        >
          Reset all
        </button>
      </div>

      {/* Category & Sub-Category Switcher */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">Categories</div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              setSelectedSubCategory('all');
              onNavigate('/search');
            }}
            className={`w-full h-9 px-2.5 rounded border text-left text-[12px] flex items-center justify-between cursor-pointer ${
              activeCategorySlug === 'all' && !activeMerchantObj
                ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                : 'bg-surface border-line text-ink hover:bg-page'
            }`}
          >
            <span>All Marketplace Categories</span>
          </button>
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const isSelected = activeCategorySlug === cat.slug;
            return (
              <div key={cat.slug} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setSelectedSubCategory('all');
                    onNavigate(`/category/${cat.slug}`);
                  }}
                  className={`w-full h-9 px-2.5 rounded border text-left text-[12px] flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-muted">{cat.itemCount}</span>
                </button>

                {/* Nested Sub-Category Links when Category is Active */}
                {isSelected && cat.subCategories.length > 0 && (
                  <div className="pl-3 space-y-1 border-l-2 border-primary-dark ml-2 py-0.5">
                    {cat.subCategories.map((sub) => {
                      const isSubActive = selectedSubCategory === sub.slug;
                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => {
                            setSelectedSubCategory(sub.slug);
                            setCurrentPage(1);
                            onNavigate(`/category/${cat.slug}/${sub.slug}`);
                          }}
                          className={`w-full h-8 px-2 rounded text-left text-[12px] flex items-center justify-between cursor-pointer ${
                            isSubActive
                              ? 'bg-primary-tint font-bold text-primary-dark'
                              : 'text-muted hover:text-ink hover:bg-page'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">Price Range (₦)</div>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isSelected = selectedPriceRange === range.id;
            return (
              <button
                key={range.id}
                type="button"
                onClick={() => {
                  setSelectedPriceRange(range.id);
                  setCurrentPage(1);
                }}
                className={`w-full h-9 px-2.5 rounded border text-left text-[12px] flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                    : 'bg-surface border-line text-ink hover:bg-page'
                }`}
              >
                <span>{range.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">Brand</div>
        <div className="flex flex-wrap gap-1.5">
          {availableBrands.map((brand) => {
            const isSelected = selectedBrands.includes(brand);
            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggleItem(selectedBrands, setSelectedBrands, brand)}
                className={`h-8 px-2.5 rounded border text-[12px] cursor-pointer ${
                  isSelected
                    ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                    : 'bg-surface border-line text-ink hover:bg-page'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">Customer Rating</div>
        <div className="space-y-1">
          {[4.8, 4.5, 4.0].map((r) => {
            const isSelected = minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setMinRating(isSelected ? 0 : r);
                  setCurrentPage(1);
                }}
                className={`w-full h-9 px-2.5 rounded border text-left text-[12px] flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                    : 'bg-surface border-line text-ink hover:bg-page'
                }`}
              >
                <Star className="w-4 h-4 text-accent fill-accent" strokeWidth={1.75} />
                <span>{r} &amp; above</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seller Type */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">Seller Type</div>
        <div className="space-y-1">
          {SELLER_TYPES.map((st) => {
            const isSelected = selectedSellerTypes.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() =>
                  toggleItem(selectedSellerTypes, setSelectedSellerTypes, st)
                }
                className={`w-full h-9 px-2.5 rounded border text-left text-[12px] cursor-pointer ${
                  isSelected
                    ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                    : 'bg-surface border-line text-ink hover:bg-page'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery Options */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">
          Delivery Options
        </div>
        <div className="space-y-1">
          {DELIVERY_OPTIONS.map((opt) => {
            const isSelected = selectedDelivery.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  toggleItem(selectedDelivery, setSelectedDelivery, opt)
                }
                className={`w-full h-9 px-2.5 rounded border text-left text-[12px] cursor-pointer ${
                  isSelected
                    ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                    : 'bg-surface border-line text-ink hover:bg-page'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <div className="text-[12px] font-bold text-ink uppercase mb-2">
          Warehouse Location
        </div>
        <select
          aria-label="Filter by location"
          value={selectedLocation}
          onChange={(e) => {
            setSelectedLocation(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full h-10 px-2.5 bg-surface border border-line rounded text-[12px] text-ink focus:outline-none focus:border-primary-dark"
        >
          <option value="all">All Cities (Nigeria)</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // If mode is 'merchants-directory', render the full Verified Merchants Directory + Catalog
  if (effectiveMode === 'merchants-directory') {
    return (
      <div className="container-market py-4 space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-muted">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="hover:text-primary-dark cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span className="text-ink font-bold">Verified Merchants Directory</span>
        </nav>

        <div className="bg-surface border border-line rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Verified Wholesale &amp; Official Merchants</h1>
            <p className="text-[13px] text-muted mt-0.5">
              All merchants are CAC-verified and operate under IBO Hub QR escrow buyer protection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/sell')}
            className="h-10 px-4 bg-primary text-on-primary font-bold text-[14px] rounded shrink-0 cursor-pointer"
          >
            Apply to Sell on IBO Hub
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOP_MERCHANTS.map((m) => {
            const merchantProducts = allProducts.filter((p) => p.merchantId === m.id);
            return (
              <div
                key={m.id}
                className="bg-surface border border-line rounded p-4 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-primary-tint border border-primary-dark rounded text-[11px] font-bold text-primary-dark">
                      {m.code}
                    </span>
                    <span className="text-[12px] text-muted">CAC: {m.cacNumber}</span>
                  </div>
                  <h2 className="section-title flex items-center gap-1.5">
                    <Store className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
                    <span>{m.name}</span>
                  </h2>
                  <p className="text-[12px] text-muted">{m.summary}</p>
                  <div className="pt-2 border-t border-line grid grid-cols-3 gap-2 text-[12px]">
                    <div>
                      <div className="text-muted">Rating</div>
                      <div className="font-bold text-ink">{m.rating}★</div>
                    </div>
                    <div>
                      <div className="text-muted">Fulfillment</div>
                      <div className="font-bold text-primary-dark">{m.fulfillmentRate}</div>
                    </div>
                    <div>
                      <div className="text-muted">Depot</div>
                      <div className="font-bold text-ink">{m.city}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted">
                    {merchantProducts.length} active products
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/store/${m.id}`)}
                    className="h-9 px-3 bg-primary text-on-primary font-bold text-[12px] rounded flex items-center gap-1 cursor-pointer"
                  >
                    <span>Visit Storefront</span>
                    <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="container-market py-4 space-y-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-primary-dark cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        {activeMerchantObj ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('/merchants')}
              className="hover:text-primary-dark cursor-pointer"
            >
              Verified Merchants
            </button>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="text-ink font-bold">{activeMerchantObj.name}</span>
          </>
        ) : activeCategoryObj ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedSubCategory('all');
                onNavigate(`/category/${activeCategoryObj.slug}`);
              }}
              className={`cursor-pointer ${
                activeSubCategoryObj ? 'hover:text-primary-dark' : 'text-ink font-bold'
              }`}
            >
              {activeCategoryObj.name}
            </button>
            {activeSubCategoryObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="text-ink font-bold">{activeSubCategoryObj.name}</span>
              </>
            )}
          </>
        ) : (
          <span className="text-ink font-bold">
            {queryText === 'flash'
              ? 'Flash Sales & Daily Deals'
              : queryText
              ? `Search: "${queryText}"`
              : 'All Marketplace Products'}
          </span>
        )}
      </nav>

      {/* Merchant Store Banner if viewing a specific merchant */}
      {activeMerchantObj && (
        <div className="bg-surface border border-line rounded p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line pb-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark">
                  Official Merchant Store · {activeMerchantObj.code}
                </span>
                <span className="text-[12px] text-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                  <span>CAC Verified ({activeMerchantObj.cacNumber})</span>
                </span>
              </div>
              <h1 className="page-title">{activeMerchantObj.name}</h1>
              <p className="text-[13px] text-muted max-w-2xl">{activeMerchantObj.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('/merchants')}
                className="h-10 px-3 bg-surface border border-line rounded text-[12px] font-bold text-ink hover:bg-page cursor-pointer"
              >
                All Merchants
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/become-an-ibo')}
                className="h-10 px-4 bg-primary text-on-primary rounded text-[12px] font-bold cursor-pointer"
              >
                Resell This Merchant&apos;s Stock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-dark shrink-0" strokeWidth={1.75} />
              <div>
                <span className="text-muted">Dispatch Depot: </span>
                <span className="font-bold text-ink">{activeMerchantObj.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent fill-accent shrink-0" strokeWidth={1.75} />
              <div>
                <span className="text-muted">Store Rating: </span>
                <span className="font-bold text-ink">
                  {activeMerchantObj.rating}★ ({activeMerchantObj.ordersCompleted} orders)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-dark shrink-0" strokeWidth={1.75} />
              <div>
                <span className="text-muted">Fulfillment Rate: </span>
                <span className="font-bold text-primary-dark">{activeMerchantObj.fulfillmentRate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-dark shrink-0" strokeWidth={1.75} />
              <div>
                <span className="text-muted">Avg. Response: </span>
                <span className="font-bold text-ink">{activeMerchantObj.responseTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Category Horizontal Pill/Tab Row when viewing a Category */}
      {activeCategoryObj && activeCategoryObj.subCategories.length > 0 && (
        <div className="bg-surface border border-line rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-muted uppercase">
              {activeCategoryObj.name} Sub-Categories
            </span>
            <span className="text-[12px] text-muted hidden sm:inline">
              {activeCategoryObj.description}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSubCategory('all');
                setCurrentPage(1);
                onNavigate(`/category/${activeCategoryObj.slug}`);
              }}
              className={`h-9 px-3 rounded border text-[12px] cursor-pointer ${
                selectedSubCategory === 'all'
                  ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                  : 'bg-surface border-line text-ink hover:bg-page'
              }`}
            >
              All {activeCategoryObj.shortName}
            </button>
            {activeCategoryObj.subCategories.map((sub) => {
              const isSubSelected = selectedSubCategory === sub.slug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => {
                    setSelectedSubCategory(sub.slug);
                    setCurrentPage(1);
                    onNavigate(`/category/${activeCategoryObj.slug}/${sub.slug}`);
                  }}
                  className={`h-9 px-3 rounded border text-[12px] cursor-pointer ${
                    isSubSelected
                      ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 bg-surface border border-line rounded p-4">
          {renderFilterControls()}
        </aside>

        {/* Main Content Column */}
        <div className="lg:col-span-9 space-y-3">
          {/* Top Bar: Result count, sort dropdown, grid/list toggle */}
          <div className="bg-surface border border-line rounded p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="page-title">
                {activeMerchantObj
                  ? `${activeMerchantObj.name} Catalog`
                  : activeSubCategoryObj
                  ? activeSubCategoryObj.name
                  : activeCategoryObj
                  ? activeCategoryObj.name
                  : queryText === 'flash'
                  ? 'Flash Sales — Up to 28% Off'
                  : queryText
                  ? `Results for "${queryText}"`
                  : 'All Marketplace Products'}
              </h1>
              <p className="text-[12px] text-muted mt-0.5">
                Showing {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden h-10 px-3 bg-surface border border-line rounded text-[12px] font-bold text-ink flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
                <span>Filter</span>
              </button>

              <div className="flex items-center gap-1.5">
                <label htmlFor="sort-select" className="text-[12px] text-muted hidden sm:inline">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 px-2.5 bg-surface border border-line rounded text-[12px] font-medium text-ink focus:outline-none focus:border-primary-dark cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>

              <div className="flex items-center border border-line rounded overflow-hidden">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => setViewMode('grid')}
                  className={`w-10 h-10 flex items-center justify-center cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-primary-tint text-on-primary'
                      : 'bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => setViewMode('list')}
                  className={`w-10 h-10 flex items-center justify-center border-l border-line cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-primary-tint text-on-primary'
                      : 'bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <List className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / List or Empty State */}
          {paginatedProducts.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onNavigate={onNavigate}
                      layout="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onNavigate={onNavigate}
                      layout="list"
                    />
                  ))}
                </div>
              )}

              {/* Numbered Pagination */}
              <div className="bg-surface border border-line rounded p-3 flex items-center justify-between">
                <span className="text-[12px] text-muted">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo(0, 0);
                        }}
                        className={`w-10 h-10 rounded border text-[14px] font-bold cursor-pointer ${
                          pageNum === safePage
                            ? 'bg-primary border-primary-dark text-on-primary'
                            : 'bg-surface border-line text-ink hover:bg-primary-tint'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty state with plain text and a "Browse categories" button, no illustration */
            <div className="bg-surface border border-line rounded p-8 text-center space-y-3">
              <h2 className="section-title">No matching products found</h2>
              <p className="text-[14px] text-muted max-w-md mx-auto">
                No items matched your selected filters or search query. Clear your active filters or browse another marketplace category.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-10 px-4 bg-surface border border-line text-ink font-bold text-[14px] rounded hover:bg-page cursor-pointer"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    onNavigate('/category/phones');
                  }}
                  className="h-10 px-4 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
                >
                  Browse categories
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-dark/60 flex justify-end lg:hidden">
          <div className="w-full max-w-xs bg-surface h-full overflow-y-auto p-4 border-l border-line flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                <span className="section-title">Filter Products</span>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded border border-line text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
              {renderFilterControls()}
            </div>
            <div className="pt-4 mt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full h-11 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
