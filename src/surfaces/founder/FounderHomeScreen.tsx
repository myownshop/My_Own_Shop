import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shirt,
  Home,
  ShoppingBasket,
  Sparkles,
  Tv,
  Baby,
  Dumbbell,
  Wrench,
  Grid,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  Store,
} from 'lucide-react';
import {
  MARKETPLACE_CATEGORIES,
  PROMO_BANNERS,
  TOP_MERCHANTS,
  getAllMarketplaceProducts,
} from '../../data/marketplaceData';
import { ProductCard } from '../../components/ProductCard';

interface FounderHomeScreenProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  Smartphone,
  Shirt,
  Home,
  ShoppingBasket,
  Sparkles,
  Tv,
  Baby,
  Dumbbell,
  Wrench,
  Grid,
};

export const FounderHomeScreen: React.FC<FounderHomeScreenProps> = ({ onNavigate }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(4 * 3600 + 27 * 60 + 19);

  const allProducts = getAllMarketplaceProducts();
  const flashSaleProducts = allProducts.filter((p) => p.isFlashSale).slice(0, 6);
  const recommendedProducts = allProducts.filter((p) => p.isRecommended).slice(0, 5);
  const bestSellerProducts = allProducts.filter((p) => p.isBestSeller).slice(0, 5);
  const newArrivalProducts = allProducts.filter((p) => p.isNewArrival).slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 14400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 6000);
    return () => clearInterval(bannerTimer);
  }, []);

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const currentBanner = PROMO_BANNERS[activeSlide] || PROMO_BANNERS[0];

  return (
    <div className="container-market py-4 space-y-6">
      {/* 1. THREE-COLUMN TOP BLOCK */}
      <section aria-label="Featured promotions" className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Category Sidebar (desktop only, icons and chevrons) */}
        <aside className="hidden lg:block lg:col-span-3 bg-surface border border-line rounded p-2">
          <ul className="divide-y divide-line">
            {MARKETPLACE_CATEGORIES.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.iconName] || Grid;
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/category/${cat.slug}`)}
                    className="w-full h-9 px-2.5 flex items-center justify-between text-[14px] text-ink hover:bg-primary-tint rounded transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <IconComponent className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Center Hero Banner Carousel with background image and featured product images */}
        <div className="lg:col-span-6 relative bg-dark text-white border border-line rounded overflow-hidden flex flex-col justify-between min-h-[340px] sm:min-h-[380px]">
          {/* Background Hero Image + Readability Scrim */}
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.headline}
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#0B1410]/95 via-[#0B1410]/85 to-[#0B1410]/55"
          />

          {/* Top Content + Featured Product Image Strip */}
          <div className="relative z-10 p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-[12px] text-primary font-bold tracking-wide uppercase">
                <span>{currentBanner.tag}</span>
                <span className="text-white/80 font-medium">{currentBanner.badgeText}</span>
              </div>

              <h1 className="text-[22px] sm:text-[26px] font-bold leading-tight text-white max-w-xl">
                {currentBanner.headline}
              </h1>

              <p className="text-[13px] sm:text-[14px] text-white/80 max-w-lg">
                {currentBanner.subtext}
              </p>
            </div>

            {/* Featured Product Images Row inside the Hero */}
            {currentBanner.featuredItems && currentBanner.featuredItems.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {currentBanner.featuredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(`/product/${item.id}`)}
                    className="group bg-white/10 hover:bg-white/15 border border-white/20 hover:border-primary rounded p-2 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded object-cover shrink-0 bg-surface border border-white/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-[12px] font-bold text-white truncate group-hover:text-primary">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-primary font-bold tabular-nums mt-0.5">
                        {item.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/15">
              <button
                type="button"
                onClick={() => onNavigate(currentBanner.ctaLink)}
                className="h-10 px-5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>{currentBanner.ctaText}</span>
                <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() =>
                    setActiveSlide((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length)
                  }
                  className="w-9 h-9 border border-white/25 rounded flex items-center justify-center text-white hover:border-primary cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
                </button>
                <div className="flex items-center gap-1.5 px-1">
                  {PROMO_BANNERS.map((b, idx) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded transition-all cursor-pointer ${
                        idx === activeSlide ? 'w-6 bg-primary' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % PROMO_BANNERS.length)}
                  className="w-9 h-9 border border-white/25 rounded flex items-center justify-center text-white hover:border-primary cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Two Small Stacked Promo Tiles */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="bg-surface border border-line rounded p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=240&q=80"
                  alt="Sell on IBO Hub"
                  className="w-12 h-12 rounded object-cover border border-line shrink-0"
                />
                <div>
                  <div className="text-[11px] font-bold text-primary-dark uppercase">
                    For Sellers
                  </div>
                  <h2 className="section-title">Sell on IBO Hub</h2>
                </div>
              </div>
              <p className="text-[12px] text-muted mt-2">
                List your products for free. Get paid as soon as your customer receives their order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/sell')}
              className="mt-3 h-10 px-4 bg-primary text-on-primary font-bold text-[14px] rounded flex items-center justify-between cursor-pointer"
            >
              <span>Start selling</span>
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="bg-surface border border-line rounded p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=240&q=80"
                  alt="Earn as a delivery agent"
                  className="w-12 h-12 rounded object-cover border border-line shrink-0"
                />
                <div>
                  <div className="text-[11px] font-bold text-primary-dark uppercase">
                    For Riders &amp; Drivers
                  </div>
                  <h2 className="section-title">Earn as a delivery agent</h2>
                </div>
              </div>
              <p className="text-[12px] text-muted mt-2">
                Pick up ready packages with your bike, car, or van. Get paid right after you deliver.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/become-a-delivery-agent')}
              className="mt-3 h-10 px-4 bg-surface border border-primary-dark text-primary-dark hover:bg-primary-tint font-bold text-[14px] rounded flex items-center justify-between cursor-pointer"
            >
              <span>Join as a rider</span>
              <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. THIN SINGLE-LINE TRUST ROW */}
      <section
        aria-label="Buyer protection guarantees"
        className="bg-surface border border-line rounded px-4 py-3"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px] sm:text-[14px]">
          <button
            type="button"
            onClick={() => onNavigate('/escrow-protection')}
            className="flex items-center gap-2 text-left hover:text-primary-dark cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
            <div>
              <span className="font-bold text-ink">Safe payment</span>
              <span className="hidden xl:inline text-muted"> · Money kept safe until delivery</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/delivery-rates')}
            className="flex items-center gap-2 text-left hover:text-primary-dark cursor-pointer"
          >
            <Truck className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
            <div>
              <span className="font-bold text-ink">Fast delivery</span>
              <span className="hidden xl:inline text-muted"> · Same-day &amp; next-day</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/returns-policy')}
            className="flex items-center gap-2 text-left hover:text-primary-dark cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
            <div>
              <span className="font-bold text-ink">Easy returns</span>
              <span className="hidden xl:inline text-muted"> · 7-day return guarantee</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/verified-sellers')}
            className="flex items-center gap-2 text-left hover:text-primary-dark cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
            <div>
              <span className="font-bold text-ink">Trusted sellers</span>
              <span className="hidden xl:inline text-muted"> · Checked for genuine items</span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. FLASH SALES (Amber header strip with countdown, horizontal scroll of product cards) */}
      <section aria-label="Flash sales" className="bg-surface border border-line rounded overflow-hidden">
        <div className="bg-accent text-on-primary px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-line">
          <div className="flex items-center gap-3">
            <h2 className="section-title text-on-primary">Flash Sales</h2>
            <div className="flex items-center gap-1.5 text-[12px] sm:text-[14px] font-bold">
              <Clock className="w-5 h-5 text-on-primary" strokeWidth={1.75} />
              <span>Ends in:</span>
              <span className="font-mono bg-surface text-on-primary px-2 py-0.5 rounded border border-on-primary/20">
                {hours}h : {mins}m : {secs}s
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/search?q=flash')}
            className="text-[12px] sm:text-[14px] font-bold text-on-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>See all deals</span>
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-3 overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[175px] sm:auto-cols-[210px] gap-3">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. TOP CATEGORIES (Square image tiles with names below) */}
      <section aria-label="Top categories" className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Top categories</h2>
          <button
            type="button"
            onClick={() => onNavigate('/category/phones')}
            className="text-[12px] sm:text-[14px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            Browse all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onNavigate(`/category/${cat.slug}`)}
              className="group text-left cursor-pointer"
            >
              <div className="aspect-square w-full bg-page border border-line rounded overflow-hidden group-hover:border-primary-dark transition-colors">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-1.5 text-[12px] font-bold text-ink text-center truncate group-hover:text-primary-dark">
                {cat.shortName}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5A. RECOMMENDED FOR YOU (5 columns desktop, 2 mobile) */}
      <section aria-label="Recommended for you" className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recommended for you</h2>
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-[12px] sm:text-[14px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 5B. BEST SELLERS (5 columns desktop, 2 mobile) */}
      <section aria-label="Best sellers" className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Best sellers</h2>
          <button
            type="button"
            onClick={() => onNavigate('/search?sort=rating')}
            className="text-[12px] sm:text-[14px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {bestSellerProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 5C. NEW ARRIVALS (5 columns desktop, 2 mobile) */}
      <section aria-label="New arrivals" className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">New arrivals</h2>
          <button
            type="button"
            onClick={() => onNavigate('/search?sort=newest')}
            className="text-[12px] sm:text-[14px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {newArrivalProducts.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* 6. TOP MERCHANTS STRIP WITH LOGO TILES */}
      <section aria-label="Top merchants" className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Top merchants</h2>
          <div className="flex items-center gap-3 text-[12px] sm:text-[14px] font-bold">
            <button
              type="button"
              onClick={() => onNavigate('/merchants')}
              className="text-primary-dark hover:underline cursor-pointer"
            >
              View all merchants
            </button>
            <span className="text-muted">·</span>
            <button
              type="button"
              onClick={() => onNavigate('/sell')}
              className="text-primary-dark hover:underline cursor-pointer"
            >
              Become a seller
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TOP_MERCHANTS.map((merchant) => (
            <button
              key={merchant.id}
              type="button"
              onClick={() => onNavigate(`/store/${merchant.id}`)}
              className="p-3 bg-page border border-line rounded text-left hover:border-primary-dark transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="h-8 px-2 bg-surface border border-line rounded flex items-center gap-1.5 text-[12px] font-bold text-ink">
                  <Store className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                  <span>{merchant.code}</span>
                </div>
              </div>
              <div className="text-[14px] font-bold text-ink truncate">{merchant.name}</div>
              <div className="text-[12px] text-muted mt-0.5">
                {merchant.city} · {merchant.rating}★ ({merchant.ordersCompleted})
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 7. ONE SLIM BANNER INVITING MERCHANTS, IBOS AND DELIVERY AGENTS TO JOIN */}
      <section
        aria-label="Partner with IBO Hub"
        className="bg-surface border border-line rounded px-4 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
      >
        <div className="text-[14px] text-ink">
          <span className="font-bold">Earn with IBO Hub:</span>{' '}
          <span className="text-muted">
            Sell your own products, open a free online shop, or deliver packages in your area.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold">
          <button
            type="button"
            onClick={() => onNavigate('/sell')}
            className="text-primary-dark hover:underline cursor-pointer"
          >
            Sell Products →
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/become-an-ibo')}
            className="text-primary-dark hover:underline cursor-pointer"
          >
            Open an Online Shop (IBO) →
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/become-a-delivery-agent')}
            className="text-primary-dark hover:underline cursor-pointer"
          >
            Become a Delivery Rider →
          </button>
        </div>
      </section>
    </div>
  );
};
