import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Check, Heart } from 'lucide-react';
import { MarketplaceProduct, cartStore, wishlistStore } from '../data/marketplaceData';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: MarketplaceProduct;
  onNavigate: (path: string) => void;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  layout = 'grid',
}) => {
  const { currentAppUser, userProfile } = useAuth();
  const activeUserId = currentAppUser?.id || userProfile?.userId || null;

  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState<boolean>(() =>
    wishlistStore.isWishlisted(activeUserId, product.id)
  );

  useEffect(() => {
    setWishlisted(wishlistStore.isWishlisted(activeUserId, product.id));
    const unsubscribe = wishlistStore.subscribe(() => {
      setWishlisted(wishlistStore.isWishlisted(activeUserId, product.id));
    });
    return () => unsubscribe();
  }, [activeUserId, product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    cartStore.addItem(product.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeUserId) {
      onNavigate('/wishlist');
      return;
    }
    const next = wishlistStore.toggleItem(activeUserId, product.id);
    setWishlisted(next);
  };

  if (layout === 'list') {
    return (
      <div
        onClick={() => onNavigate(`/product/${product.id}`)}
        className="group bg-surface border border-line rounded p-3 flex flex-col sm:flex-row gap-4 cursor-pointer hover:border-primary-dark transition-colors"
      >
        <div className="relative w-full sm:w-40 aspect-square shrink-0 bg-page rounded overflow-hidden border border-line">
          {product.discountPercent > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-sale text-surface text-[12px] font-bold px-1.5 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={wishlisted ? 'Remove from My Wishlist' : 'Save to My Wishlist'}
            title={wishlisted ? 'Remove from My Wishlist' : 'Save to My Wishlist'}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-surface/95 border border-line hover:border-primary-dark flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${wishlisted ? 'fill-sale text-sale' : 'text-ink'}`}
              strokeWidth={1.75}
            />
          </button>
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[12px] text-muted mb-1">
              <span>{product.brand}</span>
              <span className="mx-1.5">·</span>
              <span>{product.merchantName}</span>
              <span className="mx-1.5">·</span>
              <span>{product.location}</span>
            </div>
            <h3 className="text-[14px] font-normal text-ink line-clamp-2 group-hover:text-primary-dark">
              {product.title}
            </h3>
            <p className="text-[12px] text-muted line-clamp-2 mt-1">
              {product.description}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[12px] text-ink">
              <Star className="w-4 h-4 text-accent fill-accent" strokeWidth={1.75} />
              <span className="font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-muted">({product.reviewCount})</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="price-text">₦{product.price.toLocaleString()}</span>
              {product.oldPrice > product.price && (
                <span className="text-[12px] text-muted line-through">
                  ₦{product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="h-10 px-4 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" strokeWidth={1.75} />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
                  <span>Add to cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onNavigate(`/product/${product.id}`)}
      className="group bg-surface border border-line rounded p-2.5 flex flex-col justify-between cursor-pointer hover:border-primary-dark transition-colors"
    >
      <div>
        <div className="relative aspect-square w-full bg-page rounded overflow-hidden border border-line mb-2">
          {product.discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 z-10 bg-sale text-surface text-[12px] font-bold px-1.5 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={wishlisted ? 'Remove from My Wishlist' : 'Save to My Wishlist'}
            title={wishlisted ? 'Remove from My Wishlist' : 'Save to My Wishlist'}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-surface/95 border border-line hover:border-primary-dark flex items-center justify-center shadow-sm cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 ${wishlisted ? 'fill-sale text-sale' : 'text-ink'}`}
              strokeWidth={1.75}
            />
          </button>
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <h3
          className="text-[14px] font-normal text-ink line-clamp-2 min-h-[42px] group-hover:text-primary-dark"
          title={product.title}
        >
          {product.title}
        </h3>

        <div className="mt-1.5">
          <div className="price-text">₦{product.price.toLocaleString()}</div>
          {product.oldPrice > product.price ? (
            <div className="text-[12px] text-muted line-through">
              ₦{product.oldPrice.toLocaleString()}
            </div>
          ) : (
            <div className="text-[12px] text-transparent select-none">₦0</div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-[12px] text-ink">
          <Star className="w-4 h-4 text-accent fill-accent shrink-0" strokeWidth={1.75} />
          <span className="font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-muted">({product.reviewCount})</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        className="mt-2.5 h-10 w-full bg-primary text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
      >
        {added ? (
          <>
            <Check className="w-5 h-5" strokeWidth={1.75} />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" strokeWidth={1.75} />
            <span>Add to cart</span>
          </>
        )}
      </button>
    </div>
  );
};

