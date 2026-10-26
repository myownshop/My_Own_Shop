import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ChevronRight,
  Star,
  Check,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  wishlistStore,
  cartStore,
  getAllMarketplaceProducts,
  MarketplaceProduct,
  WishlistItem,
} from '../../data/marketplaceData';
import { useAuth } from '../../context/AuthContext';
import { ShopperAuthGateCard } from '../../components/ShopperAuthGateCard';
import { ProductCard } from '../../components/ProductCard';

interface WishlistScreenProps {
  onNavigate: (path: string) => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({ onNavigate }) => {
  const { currentAppUser, userProfile } = useAuth();
  const activeUserId = currentAppUser?.id || userProfile?.userId || null;
  const activeUserName = currentAppUser?.name || userProfile?.displayName || 'Customer';

  const [wishlistEntries, setWishlistEntries] = useState<
    { item: WishlistItem; product: MarketplaceProduct }[]
  >(() => wishlistStore.getDetailedItems(activeUserId));
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [addedAllFeedback, setAddedAllFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (activeUserId) {
      wishlistStore.hydrateFromServer(activeUserId);
    }
    setWishlistEntries([...wishlistStore.getDetailedItems(activeUserId)]);

    const unsubscribe = wishlistStore.subscribe(() => {
      setWishlistEntries([...wishlistStore.getDetailedItems(activeUserId)]);
    });
    return () => unsubscribe();
  }, [activeUserId]);

  const handleAddToCart = (product: MarketplaceProduct) => {
    const defaultVariants: Record<string, string> = {};
    product.variants.forEach((v) => {
      if (v.options.length > 0) {
        defaultVariants[v.label] = v.options[0];
      }
    });
    cartStore.addItem(product.id, 1, defaultVariants);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((prev) => (prev === product.id ? null : prev));
    }, 1400);
  };

  const handleAddAllToCart = () => {
    wishlistEntries.forEach(({ product }) => {
      const defaultVariants: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (v.options.length > 0) {
          defaultVariants[v.label] = v.options[0];
        }
      });
      cartStore.addItem(product.id, 1, defaultVariants);
    });
    setAddedAllFeedback(true);
    setTimeout(() => setAddedAllFeedback(false), 1600);
  };

  const handleRemoveItem = (productId: string) => {
    if (!activeUserId) return;
    wishlistStore.removeItem(activeUserId, productId);
  };

  const handleClearAll = () => {
    if (!activeUserId) return;
    wishlistStore.clearWishlist(activeUserId);
  };

  const recommendedProducts = getAllMarketplaceProducts()
    .filter((p) => !wishlistEntries.some((w) => w.product.id === p.id))
    .slice(0, 5);

  return (
    <div className="container-market py-4 pb-16 space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[12px] text-muted"
      >
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-primary-dark cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span className="text-ink font-medium">My Wishlist</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-surface border border-line rounded p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-primary-tint border border-primary-dark flex items-center justify-center text-primary-dark shrink-0">
              <Heart className="w-5 h-5 fill-primary-dark" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <span>My Wishlist</span>
                {activeUserId && (
                  <span className="px-2 py-0.5 rounded bg-page border border-line text-[12px] font-bold text-ink">
                    {wishlistEntries.length}{' '}
                    {wishlistEntries.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-1.5 text-[12px] text-muted mt-0.5">
                <Lock className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                <span>
                  {activeUserId
                    ? `Private list for ${activeUserName} — only you can view and manage these saved items.`
                    : 'Private list — sign in to save and view your favorite products.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {activeUserId && wishlistEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="h-10 px-4 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[13px] rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {addedAllFeedback ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.75} />
                  <span>All items added to cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
                  <span>Add all to cart</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="h-10 px-3.5 bg-surface border border-line hover:border-sale text-muted hover:text-sale font-bold text-[13px] rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              <span>Clear wishlist</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Auth Gate for Guests OR Private Saved List for Logged-In Customers */}
      {!activeUserId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <ShopperAuthGateCard />
          </div>
          <div className="lg:col-span-5 bg-surface border border-line rounded p-5 space-y-3">
            <div className="flex items-center gap-2 text-ink font-bold text-[14px]">
              <Heart className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
              <span>Why use My Wishlist?</span>
            </div>
            <ul className="space-y-2.5 text-[13px] text-muted">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  <strong className="text-ink">100% Private to You:</strong> Your saved products are tied strictly to your personal customer account.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  <strong className="text-ink">Tap the Heart Icon Anywhere:</strong> Save phones, bulk groceries, solar gear, or fashion from any product page.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  <strong className="text-ink">One-Click Cart Transfer:</strong> Move saved items to your shopping cart whenever you are ready to buy.
                </span>
              </li>
            </ul>
          </div>
        </div>
      ) : wishlistEntries.length === 0 ? (
        <div className="bg-surface border border-line rounded p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-page border border-line flex items-center justify-center mx-auto text-muted">
            <Heart className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h2 className="section-title">Your wishlist is currently empty</h2>
            <p className="text-[13px] text-muted">
              Tap the heart icon on any product detail page to save items here for later.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-10 px-5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[13px] rounded inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Browse Marketplace Deals</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wishlistEntries.map(({ item, product }) => {
            const isAdded = addedProductId === product.id;
            return (
              <div
                key={product.id}
                className="bg-surface border border-line rounded p-3 flex flex-col justify-between hover:border-primary-dark transition-colors"
              >
                <div>
                  <div
                    onClick={() => onNavigate(`/product/${product.id}`)}
                    className="relative aspect-square w-full bg-page rounded overflow-hidden border border-line mb-2.5 cursor-pointer"
                  >
                    {product.discountPercent > 0 && (
                      <span className="absolute top-2 left-2 z-10 bg-sale text-surface text-[11px] font-bold px-1.5 py-0.5 rounded">
                        -{product.discountPercent}%
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      title="Remove from My Wishlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(product.id);
                      }}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-surface/95 border border-line hover:border-sale flex items-center justify-center text-sale shadow-sm cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-sale text-sale" strokeWidth={1.75} />
                    </button>
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="text-[11px] text-muted mb-1 flex items-center justify-between">
                    <span>{product.brand}</span>
                    <span>{product.location}</span>
                  </div>

                  <h3
                    onClick={() => onNavigate(`/product/${product.id}`)}
                    className="text-[14px] font-medium text-ink line-clamp-2 min-h-[40px] hover:text-primary-dark cursor-pointer"
                  >
                    {product.title}
                  </h3>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="price-text">₦{product.price.toLocaleString()}</span>
                    {product.oldPrice > product.price && (
                      <span className="text-[12px] text-muted line-through">
                        ₦{product.oldPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[12px]">
                    <div className="flex items-center gap-1 text-ink">
                      <Star className="w-3.5 h-3.5 text-accent fill-accent" strokeWidth={1.75} />
                      <span className="font-bold">{product.rating.toFixed(1)}</span>
                      <span className="text-muted">({product.reviewCount})</span>
                    </div>
                    <span className="text-[11px] text-primary-dark font-medium">
                      In stock ({product.stockQty})
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-line flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 h-9 px-3 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[12px] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" strokeWidth={1.75} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
                        <span>Add to cart</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(product.id)}
                    aria-label="Remove item from wishlist"
                    title="Remove item"
                    className="h-9 px-2.5 bg-surface border border-line hover:border-sale text-muted hover:text-sale rounded flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommended Products Section */}
      <section className="bg-surface border border-line rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
            <h2 className="section-title">Popular Deals You Might Like</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            View all deals
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {recommendedProducts.map((item) => (
            <ProductCard key={item.id} product={item} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
};
