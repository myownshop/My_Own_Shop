import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Minus,
  Plus,
  Store,
  ShieldCheck,
  ChevronRight,
  ShoppingCart,
  User,
} from 'lucide-react';
import {
  cartStore,
  MarketplaceProduct,
  CartItem,
} from '../../data/marketplaceData';
import { useAuth } from '../../context/AuthContext';

interface CartScreenProps {
  onNavigate: (path: string) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onNavigate }) => {
  const { currentAppUser, userProfile } = useAuth();
  const isAuthenticated = Boolean(currentAppUser || userProfile);
  const [detailedItems, setDetailedItems] = useState<
    { item: CartItem; product: MarketplaceProduct }[]
  >(() => cartStore.getDetailedItems());

  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setDetailedItems([...cartStore.getDetailedItems()]);
    });
    return () => unsubscribe();
  }, []);

  interface MerchantGroup {
    merchantId: string;
    merchantName: string;
    merchantCode: string;
    entries: { item: CartItem; product: MarketplaceProduct }[];
  }

  const groupedByMerchant: Record<string, MerchantGroup> = {};
  for (const entry of detailedItems) {
    const mId = entry.product.merchantId;
    if (!groupedByMerchant[mId]) {
      groupedByMerchant[mId] = {
        merchantId: mId,
        merchantName: entry.product.merchantName,
        merchantCode: entry.product.merchantCode,
        entries: [],
      };
    }
    groupedByMerchant[mId].entries.push(entry);
  }
  const merchantGroups: MerchantGroup[] = Object.values(groupedByMerchant);

  const subtotal = detailedItems.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0
  );
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 20000 ? 0 : 2500;
  const totalAmount = subtotal + deliveryFee;

  return (
    <div className="container-market py-4 space-y-4">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-muted">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-primary-dark cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span className="text-ink font-medium">Shopping Cart</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="page-title">
          Shopping Cart ({cartStore.getTotalCount()}{' '}
          {cartStore.getTotalCount() === 1 ? 'item' : 'items'})
        </h1>
        {detailedItems.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
          >
            Continue shopping
          </button>
        )}
      </div>

      {detailedItems.length === 0 ? (
        <div className="bg-surface border border-line rounded p-8 text-center space-y-3">
          <div className="flex justify-center">
            <ShoppingCart className="w-5 h-5 text-muted" strokeWidth={1.75} />
          </div>
          <h2 className="section-title">Your cart is empty</h2>
          <p className="text-[14px] text-muted max-w-md mx-auto">
            Browse categories or check today's flash sales to add items to your cart. Free delivery applies on orders over ₦20,000.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/category/phones')}
              className="h-10 px-5 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
            >
              Browse categories
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Items grouped by seller (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {Object.values(groupedByMerchant).map((group) => (
              <div
                key={group.merchantId}
                className="bg-surface border border-line rounded overflow-hidden"
              >
                {/* Seller Header */}
                <div className="bg-page px-4 py-2.5 border-b border-line flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <Store className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                    <span>Seller: {group.merchantName}</span>
                    <span className="text-muted font-normal">({group.merchantCode})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/store/${group.merchantId}`)}
                    className="font-bold text-primary-dark hover:underline cursor-pointer"
                  >
                    View seller items
                  </button>
                </div>

                {/* Seller Items */}
                <div className="divide-y divide-line">
                  {group.entries.map(({ item, product }) => (
                    <div
                      key={product.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => onNavigate(`/product/${product.id}`)}
                          className="w-20 h-20 rounded border border-line bg-page overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </button>

                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/product/${product.id}`)}
                            className="text-left text-[14px] font-bold text-ink hover:text-primary-dark line-clamp-2 cursor-pointer"
                          >
                            {product.title}
                          </button>

                          {item.selectedVariants &&
                            Object.keys(item.selectedVariants).length > 0 && (
                              <div className="text-[12px] text-muted">
                                {Object.entries(item.selectedVariants)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </div>
                            )}

                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="price-text">
                              ₦{product.price.toLocaleString()}
                            </span>
                            {product.oldPrice > product.price && (
                              <span className="text-[12px] text-muted line-through">
                                ₦{product.oldPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-line rounded overflow-hidden">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              cartStore.updateQuantity(product.id, item.quantity - 1)
                            }
                            className="w-9 h-9 bg-page hover:bg-primary-tint text-ink flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <span className="w-10 h-9 flex items-center justify-center font-bold text-[14px] text-ink bg-surface border-x border-line">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              cartStore.updateQuantity(product.id, item.quantity + 1)
                            }
                            className="w-9 h-9 bg-page hover:bg-primary-tint text-ink flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => cartStore.removeItem(product.id)}
                          className="h-9 px-2.5 border border-line rounded text-[12px] font-medium text-muted hover:text-sale hover:border-sale flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Sticky Order Summary Card (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-surface border border-line rounded p-4 space-y-4">
            <h2 className="section-title pb-2 border-b border-line">Order Summary</h2>

            <div className="space-y-2.5 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">
                  Subtotal ({cartStore.getTotalCount()} items)
                </span>
                <span className="font-bold text-ink">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-bold text-primary-dark">FREE</span>
                ) : (
                  <span className="font-bold text-ink">
                    ₦{deliveryFee.toLocaleString()}
                  </span>
                )}
              </div>

              {subtotal < 20000 && (
                <div className="p-2.5 bg-primary-tint border border-primary-dark rounded text-[12px] text-on-primary">
                  Add ₦{(20000 - subtotal).toLocaleString()} more to qualify for free delivery.
                </div>
              )}

              <div className="pt-3 border-t border-line flex items-baseline justify-between">
                <span className="font-bold text-ink">Total</span>
                <span className="price-text-lg">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="p-2.5 bg-page border border-line rounded flex items-start gap-2 text-[12px] text-ink">
                <User className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <span className="font-bold">Account required to checkout:</span> You will be asked to sign in or create a free account on the next step.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate('/checkout')}
              className="h-10 w-full bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {isAuthenticated
                  ? `Checkout (₦${totalAmount.toLocaleString()})`
                  : `Sign In / Create Account to Checkout (₦${totalAmount.toLocaleString()})`}
              </span>
            </button>

            <div className="pt-2 border-t border-line flex items-start gap-2 text-[12px] text-muted">
              <ShieldCheck
                className="w-5 h-5 text-primary-dark shrink-0 mt-0.5"
                strokeWidth={1.75}
              />
              <span>
                Safe Payment Protection: your payment is held safely and only paid to the seller after you scan the courier's QR code upon delivery.
              </span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
