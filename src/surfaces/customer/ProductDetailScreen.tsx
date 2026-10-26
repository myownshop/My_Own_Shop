import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Star,
  ShoppingCart,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Store,
  MessageSquare,
  Check,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import {
  getAllMarketplaceProducts,
  cartStore,
} from '../../data/marketplaceData';
import { ProductCard } from '../../components/ProductCard';

interface ProductDetailScreenProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onNavigate,
}) => {
  const allProducts = getAllMarketplaceProducts();
  const product =
    allProducts.find((p) => p.id === productId) || allProducts[0];

  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>(
    'description'
  );
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatSent, setChatSent] = useState<boolean>(false);

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    const defaults: Record<string, string> = {};
    product.variants.forEach((v) => {
      if (v.options.length > 0) {
        defaults[v.label] = v.options[0];
      }
    });
    setSelectedVariants(defaults);
    cartStore.recordViewedProduct(product.id);
  }, [product.id]);

  const handleAddToCart = () => {
    cartStore.addItem(product.id, quantity, selectedVariants);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = () => {
    cartStore.addItem(product.id, quantity, selectedVariants);
    onNavigate('/checkout');
  };

  const similarItems = allProducts
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .concat(allProducts.filter((p) => p.id !== product.id && p.categorySlug !== product.categorySlug))
    .slice(0, 5);

  const recentlyViewed = cartStore.getRecentlyViewedProducts(product.id).slice(0, 5);

  const ratingBreakdown = [
    { stars: 5, percent: 78, count: Math.round(product.reviewCount * 0.78) },
    { stars: 4, percent: 16, count: Math.round(product.reviewCount * 0.16) },
    { stars: 3, percent: 4, count: Math.round(product.reviewCount * 0.04) },
    { stars: 2, percent: 1, count: Math.round(product.reviewCount * 0.01) },
    { stars: 1, percent: 1, count: Math.round(product.reviewCount * 0.01) },
  ];

  return (
    <div className="container-market py-4 pb-20 md:pb-8 space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted"
      >
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-primary-dark cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        <button
          type="button"
          onClick={() => onNavigate(`/category/${product.categorySlug}`)}
          className="hover:text-primary-dark cursor-pointer"
        >
          {product.categoryName}
        </button>
        {product.subCategorySlug && (
          <>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            <button
              type="button"
              onClick={() =>
                onNavigate(`/category/${product.categorySlug}/${product.subCategorySlug}`)
              }
              className="hover:text-primary-dark cursor-pointer"
            >
              {product.subCategoryName}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span className="text-ink font-medium truncate max-w-[260px] sm:max-w-md">
          {product.title}
        </span>
      </nav>

      {/* Main Product Section + Right Delivery/Seller Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left + Center: Gallery & Product Details (8 cols) */}
        <div className="lg:col-span-9 bg-surface border border-line rounded p-4 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Image Gallery with Thumbnails (5 cols) */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="aspect-square w-full bg-page border border-line rounded overflow-hidden">
              <img
                src={product.images[selectedImageIdx] || product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(product.images.length > 0 ? product.images : [product.imageUrl]).map(
                (imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 rounded border overflow-hidden shrink-0 cursor-pointer ${
                      idx === selectedImageIdx
                        ? 'border-primary-dark bg-primary-tint'
                        : 'border-line bg-page'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Product Details, Variants, Stepper & Actions (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <span>Brand:</span>
                <button
                  type="button"
                  onClick={() => onNavigate(`/search?q=${encodeURIComponent(product.brand)}`)}
                  className="font-bold text-primary-dark hover:underline cursor-pointer"
                >
                  {product.brand}
                </button>
                <span>·</span>
                <span>Item ID: {product.id.toUpperCase()}</span>
                <span>·</span>
                <span>{product.sellerType}</span>
              </div>

              <h1 className="page-title">{product.title}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-[12px] pb-3 border-b border-line">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent fill-accent" strokeWidth={1.75} />
                  <span className="font-bold text-ink">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-muted">({product.reviewCount} verified ratings)</span>
                <span>·</span>
                <span className="text-primary-dark font-bold">
                  In stock ({product.stockQty} units)
                </span>
              </div>

              {/* Price & Discount Badge */}
              <div className="py-1 flex items-baseline gap-3">
                <span className="price-text-lg">₦{product.price.toLocaleString()}</span>
                {product.oldPrice > product.price && (
                  <>
                    <span className="text-[14px] text-muted line-through">
                      ₦{product.oldPrice.toLocaleString()}
                    </span>
                    <span className="bg-sale text-surface text-[12px] font-bold px-2 py-0.5 rounded">
                      -{product.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Variant Chips */}
              <div className="space-y-3 pt-2">
                {product.variants.map((variant) => (
                  <div key={variant.label}>
                    <div className="text-[12px] font-bold text-ink uppercase mb-1.5">
                      {variant.label}:{' '}
                      <span className="font-normal text-muted">
                        {selectedVariants[variant.label]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((opt) => {
                        const isSelected = selectedVariants[variant.label] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [variant.label]: opt,
                              }))
                            }
                            className={`h-9 px-3 rounded border text-[12px] cursor-pointer ${
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
                ))}
              </div>

              {/* Quantity Stepper */}
              <div className="pt-2 flex items-center gap-3">
                <span className="text-[12px] font-bold text-ink uppercase">Quantity:</span>
                <div className="flex items-center border border-line rounded overflow-hidden">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 bg-page hover:bg-primary-tint text-ink flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-bold text-[14px] text-ink bg-surface border-x border-line">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                    className="w-10 h-10 bg-page hover:bg-primary-tint text-ink flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            {/* Spring Green "Add to cart" and Amber "Buy now" (both with near-black bold text) */}
            <div className="pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="h-10 px-6 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-5 h-5" strokeWidth={1.75} />
                    <span>Added to cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                    <span>Add to cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="h-10 px-6 bg-accent text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5" strokeWidth={1.75} />
                <span>Buy now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Delivery Info, Return Policy, Seller Box (3 cols) */}
        <aside className="lg:col-span-3 space-y-3">
          {/* Delivery & Returns Card */}
          <div className="bg-surface border border-line rounded p-4 space-y-4">
            <h2 className="text-[14px] font-bold text-ink uppercase pb-2 border-b border-line">
              Delivery &amp; Returns
            </h2>

            <div className="flex items-start gap-2.5 text-[12px]">
              <Truck className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="font-bold text-ink">Home Delivery &amp; Local Pickup</div>
                <p className="text-muted mt-0.5">
                  Sent from {product.location}. Same-day delivery in {product.location} and 1–3 days nationwide. Free delivery on orders over ₦20,000.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-[12px]">
              <ShieldCheck className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="font-bold text-ink">Safe Payment Protection</div>
                <p className="text-muted mt-0.5">
                  We hold your money safely until you receive your package, check it, and confirm delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-[12px]">
              <RotateCcw className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="font-bold text-ink">7-Day Return Policy</div>
                <p className="text-muted mt-0.5">
                  Free return within 7 days for defective or wrong items.{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/returns-policy')}
                    className="text-primary-dark font-bold hover:underline cursor-pointer"
                  >
                    Read policy
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Seller Box */}
          <div className="bg-surface border border-line rounded p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="text-[12px] font-bold text-ink uppercase">
                Seller Information
              </span>
              <span className="text-[12px] font-bold text-primary-dark">
                {product.merchantCode}
              </span>
            </div>

            <div>
              <div className="text-[14px] font-bold text-ink flex items-center gap-1.5">
                <Store className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>{product.merchantName}</span>
              </div>
              <div className="text-[12px] text-muted mt-1">
                98% Order Fulfillment · {product.rating}★ Seller Rating · {product.location}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate(`/store/${product.merchantId}`)}
                className="h-10 px-3 bg-surface border border-line hover:border-primary-dark text-ink font-bold text-[12px] rounded flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Store className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>Visit store</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatOpen(true);
                  setChatSent(false);
                }}
                className="h-10 px-3 bg-primary-tint border border-primary-dark text-on-primary font-bold text-[12px] rounded flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>Chat with seller</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Tabs: Description, Specifications, Reviews */}
      <section className="bg-surface border border-line rounded">
        <div className="flex border-b border-line overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`h-11 px-5 text-[14px] font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'description'
                ? 'border-primary-dark text-primary-dark bg-primary-tint/50'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`h-11 px-5 text-[14px] font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'specs'
                ? 'border-primary-dark text-primary-dark bg-primary-tint/50'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`h-11 px-5 text-[14px] font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'reviews'
                ? 'border-primary-dark text-primary-dark bg-primary-tint/50'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Customer Reviews ({product.reviewCount})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'description' && (
            <div className="space-y-3 max-w-3xl text-[14px] text-ink">
              <h2 className="section-title">Product Overview</h2>
              <p>{product.description}</p>
              <ul className="list-disc pl-5 space-y-1 text-muted">
                <li>Sold by {product.merchantName} ({product.merchantCode}).</li>
                <li>Checked for quality at our {product.location} center before shipping.</li>
                <li>Safe payment protection: seller is paid only when your order arrives.</li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              <h2 className="section-title mb-3">Product Details</h2>
              <table className="w-full border border-line text-[14px]">
                <tbody className="divide-y divide-line">
                  {product.specs.map((spec) => (
                    <tr key={spec.label}>
                      <th className="w-1/3 bg-page px-3 py-2.5 text-left font-bold text-ink border-r border-line">
                        {spec.label}
                      </th>
                      <td className="px-3 py-2.5 text-ink">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Rating Bars (4 cols) */}
              <div className="md:col-span-4 bg-page border border-line rounded p-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[24px] font-bold text-ink">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-[14px] text-muted">out of 5</span>
                </div>
                <div className="text-[12px] text-muted">
                  Based on {product.reviewCount} verified purchases
                </div>

                <div className="space-y-2 pt-2">
                  {ratingBreakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2 text-[12px]">
                      <span className="w-10 font-bold text-ink">{row.stars} star</span>
                      <div className="flex-1 h-2.5 bg-surface border border-line rounded overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-muted">{row.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List (8 cols) */}
              <div className="md:col-span-8 divide-y divide-line">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'text-accent fill-accent'
                                  : 'text-line'
                              }`}
                              strokeWidth={1.75}
                            />
                          ))}
                        </div>
                        <span className="text-[14px] font-bold text-ink">
                          {rev.title}
                        </span>
                      </div>
                      <span className="text-[12px] text-muted">{rev.date}</span>
                    </div>
                    <p className="text-[14px] text-ink">{rev.comment}</p>
                    <div className="text-[12px] text-muted">
                      By {rev.author} ·{' '}
                      <span className="text-primary-dark font-medium">
                        Verified Purchase
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Similar Items */}
      <section className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Similar items</h2>
          <button
            type="button"
            onClick={() => onNavigate(`/category/${product.categorySlug}`)}
            className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            More in {product.categoryName}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {similarItems.map((item) => (
            <ProductCard key={item.id} product={item} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Recently viewed</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {recentlyViewed.map((item) => (
            <ProductCard key={item.id} product={item} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Sticky Bottom "Add to cart" Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line p-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] text-muted">Unit Price</div>
          <div className="price-text">₦{product.price.toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 h-11 bg-primary text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
            <span>{addedFeedback ? 'Added' : 'Add to cart'}</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="h-11 px-4 bg-accent text-on-primary font-bold text-[14px] rounded cursor-pointer"
          >
            Buy now
          </button>
        </div>
      </div>

      {/* Chat with Seller Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-dark/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-line rounded p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div>
                <h3 className="section-title">Message {product.merchantName}</h3>
                <p className="text-[12px] text-muted">
                  Merchant Code: {product.merchantCode} · Response time: ~15 mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="w-9 h-9 rounded border border-line flex items-center justify-center text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {chatSent ? (
              <div className="p-4 bg-primary-tint border border-primary-dark rounded text-[14px] text-on-primary space-y-2">
                <div className="font-bold">Inquiry sent to {product.merchantName}</div>
                <p className="text-[12px]">
                  Your message regarding "{product.title}" has been logged. The seller will respond via your account inbox.
                </p>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="mt-2 h-10 px-4 bg-primary text-on-primary font-bold text-[12px] rounded cursor-pointer"
                >
                  Close window
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatMessage.trim()) setChatSent(true);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    Your question about {product.title}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about bulk pricing, stock availability, or specification details..."
                    className="w-full p-2.5 bg-surface border border-line rounded text-[14px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="h-10 px-4 bg-surface border border-line text-ink font-bold text-[14px] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
                  >
                    Send message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
