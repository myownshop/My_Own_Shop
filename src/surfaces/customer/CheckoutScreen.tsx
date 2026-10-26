import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  CreditCard,
  Building2,
  Lock,
  UserCheck,
} from 'lucide-react';
import {
  cartStore,
  MarketplaceProduct,
  CartItem,
} from '../../data/marketplaceData';
import { platformStore } from '../../services/store';
import { Order, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShopperAuthGateCard } from '../../components/ShopperAuthGateCard';

interface CheckoutScreenProps {
  onNavigate: (path: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onNavigate }) => {
  const { currentAppUser, userProfile } = useAuth();
  const isAuthenticated = Boolean(currentAppUser || userProfile);

  const [detailedItems, setDetailedItems] = useState<
    { item: CartItem; product: MarketplaceProduct }[]
  >(() => cartStore.getDetailedItems());

  // 1. Address fields
  const [fullName, setFullName] = useState<string>(
    currentAppUser?.name || userProfile?.displayName || ''
  );
  const [phone, setPhone] = useState<string>(
    currentAppUser?.phone || userProfile?.phone || '+234 803 456 7890'
  );
  const [streetAddress, setStreetAddress] = useState<string>(
    '14B Admiralty Way, Lekki Phase 1'
  );
  const [city, setCity] = useState<string>('Lagos');
  const [stateName, setStateName] = useState<string>('Lagos State');

  // Sync recipient name and phone when user signs in or creates an account
  useEffect(() => {
    if (currentAppUser) {
      setFullName(currentAppUser.name);
      if (currentAppUser.phone) {
        setPhone(currentAppUser.phone);
      }
    } else if (userProfile) {
      setFullName(userProfile.displayName);
      if (userProfile.phone) {
        setPhone(userProfile.phone);
      }
    }
  }, [currentAppUser, userProfile]);

  // 2. Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<'door' | 'hub'>('door');

  // 3. Payment Method
  const [paymentMethod, setPaymentMethod] = useState<
    'pay_on_delivery' | 'bank_transfer' | 'online_paystack'
  >('pay_on_delivery');

  // Placed Order state
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setDetailedItems([...cartStore.getDetailedItems()]);
    });
    return () => unsubscribe();
  }, []);

  const subtotal = detailedItems.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0
  );
  const baseDeliveryFee =
    subtotal === 0
      ? 0
      : deliveryMethod === 'hub'
      ? 1000
      : subtotal >= 20000
      ? 0
      : 2500;
  const totalAmount = subtotal + baseDeliveryFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || detailedItems.length === 0) return;

    const orderItems = detailedItems.map(({ item, product }) => {
      const storeProd: Product = {
        id: product.id,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        merchantCode: product.merchantCode,
        title: product.title,
        description: product.description,
        category: product.categoryName,
        subCategory: product.categorySlug,
        merchantBasePrice: product.price,
        vatIncluded: true,
        vatRate: 0.075,
        fulfillmentType:
          product.sellerType === 'Warehouse Deposit'
            ? 'warehouse_deposit'
            : 'merchant_held',
        stockQty: product.stockQty,
        imageUrl: product.imageUrl,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      };
      return {
        product: storeProd,
        iboMarkup: 0,
        quantity: item.quantity,
      };
    });

    const created = platformStore.createOrder({
      iboId: 'ibo-1',
      iboSlug: 'amina-crafts',
      customerName: fullName.trim() || currentAppUser?.name || 'Customer',
      customerPhone: phone.trim() || currentAppUser?.phone || '+2348000000000',
      deliveryAddress: `${streetAddress.trim()}, ${city.trim()}, ${stateName.trim()}`,
      items: orderItems,
      paymentMethod,
    });

    cartStore.clearCart();
    setPlacedOrder(created);
    window.scrollTo(0, 0);
  };

  if (placedOrder) {
    return (
      <div className="container-market py-6">
        <div className="max-w-xl mx-auto bg-surface border border-line rounded p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary-dark">
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-[12px] font-bold uppercase">
              Order Received &amp; Payment Protected
            </span>
          </div>

          <h1 className="page-title">
            Order {placedOrder.orderNumber} Placed
          </h1>

          <p className="text-[14px] text-muted">
            Your order is being packed for delivery. Show your delivery confirmation code below to the rider after you check your package.
          </p>

          <div className="bg-page border border-line rounded p-4 space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-muted">Order Number:</span>
              <span className="font-bold text-ink">{placedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Recipient:</span>
              <span className="font-bold text-ink">{placedOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery Address:</span>
              <span className="font-bold text-ink text-right max-w-xs">
                {placedOrder.deliveryAddress}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line">
              <span className="text-muted">Delivery Confirmation Code:</span>
              <span className="font-mono font-bold text-primary-dark">
                {placedOrder.confirmationQrToken}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line">
              <span className="font-bold text-ink">Total Paid:</span>
              <span className="price-text">
                ₦{placedOrder.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-10 px-5 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
            >
              Continue shopping
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/my-orders')}
              className="h-10 px-5 bg-surface border border-line text-ink font-bold text-[14px] rounded hover:bg-page cursor-pointer"
            >
              Go to My Orders &amp; Track Order
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <button
          type="button"
          onClick={() => onNavigate('/cart')}
          className="hover:text-primary-dark cursor-pointer"
        >
          Cart
        </button>
        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span className="text-ink font-medium">Checkout</span>
      </nav>

      <h1 className="page-title">Checkout</h1>

      {detailedItems.length === 0 ? (
        <div className="bg-surface border border-line rounded p-6 text-center space-y-3">
          <h2 className="section-title">No items to checkout</h2>
          <p className="text-[14px] text-muted">
            Add products to your cart before proceeding to checkout.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="h-10 px-5 bg-primary text-on-primary font-bold text-[14px] rounded cursor-pointer"
          >
            Return to marketplace
          </button>
        </div>
      ) : !isAuthenticated ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Sign In / Create Account Gate + Cart Items Preview */}
          <div className="lg:col-span-8 space-y-4">
            <ShopperAuthGateCard />

            <section className="bg-surface border border-line rounded p-4 space-y-3">
              <div className="pb-2 border-b border-line flex items-center justify-between">
                <h2 className="section-title">Items in Your Order ({detailedItems.length})</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/cart')}
                  className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
                >
                  Edit items
                </button>
              </div>
              <div className="divide-y divide-line">
                {detailedItems.map(({ item, product }) => (
                  <div
                    key={product.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-[14px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded border border-line object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">
                          {product.title}
                        </div>
                        <div className="text-[12px] text-muted">
                          Qty: {item.quantity} × ₦{product.price.toLocaleString()} ·{' '}
                          {product.merchantName}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-ink shrink-0">
                      ₦{(product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-surface border border-line rounded p-4 space-y-4">
            <h2 className="section-title pb-2 border-b border-line">Order Summary</h2>

            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal</span>
                <span className="font-bold text-ink">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery Fee</span>
                {baseDeliveryFee === 0 ? (
                  <span className="font-bold text-primary-dark">FREE</span>
                ) : (
                  <span className="font-bold text-ink">
                    ₦{baseDeliveryFee.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="pt-3 border-t border-line flex items-baseline justify-between">
                <span className="font-bold text-ink">Total to Pay</span>
                <span className="price-text-lg">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[12px] text-on-primary space-y-1">
              <div className="font-bold">Sign in or create an account to continue</div>
              <p>
                Once you sign in or create your account on the left, you can enter your delivery address and place your order.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
        >
          {/* Left Column: Numbered Sections 1 to 4 (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Signed-in Customer Account Banner */}
            <div className="bg-primary-tint border border-primary-dark rounded px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-on-primary">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary-dark shrink-0" strokeWidth={1.75} />
                <span>
                  Checking out as{' '}
                  <strong className="font-bold">
                    {currentAppUser?.name || userProfile?.displayName}
                  </strong>{' '}
                  ({currentAppUser?.email || userProfile?.email})
                </span>
              </div>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-surface border border-primary-dark text-primary-dark">
                Verified Account
              </span>
            </div>

            {/* Section 1: Address */}
            <section className="bg-surface border border-line rounded p-4 space-y-3">
              <div className="pb-2 border-b border-line flex items-center justify-between">
                <h2 className="section-title">1. Delivery Address</h2>
                <span className="text-[12px] text-muted">Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    Street Address &amp; Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1">
                    State
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                  >
                    <option value="Lagos State">Lagos State</option>
                    <option value="FCT Abuja">FCT Abuja</option>
                    <option value="Kano State">Kano State</option>
                    <option value="Rivers State">Rivers State</option>
                    <option value="Oyo State">Oyo State</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 2: Delivery Method */}
            <section className="bg-surface border border-line rounded p-4 space-y-3">
              <div className="pb-2 border-b border-line">
                <h2 className="section-title">2. Delivery Method</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('door')}
                  className={`p-3 rounded border text-left space-y-1 cursor-pointer ${
                    deliveryMethod === 'door'
                      ? 'bg-primary-tint border-primary-dark text-on-primary'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                      <span>Home Delivery</span>
                    </span>
                    <span className="font-bold text-[12px]">
                      {subtotal >= 20000 ? 'FREE' : '₦2,500'}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted">
                    Delivered to your door within 24 hours. Free on orders over ₦20,000.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('hub')}
                  className={`p-3 rounded border text-left space-y-1 cursor-pointer ${
                    deliveryMethod === 'hub'
                      ? 'bg-primary-tint border-primary-dark text-on-primary'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] flex items-center gap-1.5">
                      <Building2
                        className="w-4 h-4 text-primary-dark"
                        strokeWidth={1.75}
                      />
                      <span>Pick Up at Local Center</span>
                    </span>
                    <span className="font-bold text-[12px]">₦1,000</span>
                  </div>
                  <p className="text-[12px] text-muted">
                    Pick up from our Ikeja, Yaba, Lekki, Abuja, or Kano pickup center.
                  </p>
                </button>
              </div>
            </section>

            {/* Section 3: Payment */}
            <section className="bg-surface border border-line rounded p-4 space-y-3">
              <div className="pb-2 border-b border-line">
                <h2 className="section-title">3. How Would You Like to Pay?</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_on_delivery')}
                  className={`p-3 rounded border text-left space-y-1 cursor-pointer ${
                    paymentMethod === 'pay_on_delivery'
                      ? 'bg-primary-tint border-primary-dark text-on-primary'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <div className="font-bold text-[14px] flex items-center gap-1.5">
                    <ShieldCheck
                      className="w-4 h-4 text-primary-dark"
                      strokeWidth={1.75}
                    />
                    <span>Pay on Delivery</span>
                  </div>
                  <p className="text-[12px] text-muted">
                    Check your items when the rider arrives and confirm delivery.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded border text-left space-y-1 cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-primary-tint border-primary-dark text-on-primary'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <div className="font-bold text-[14px] flex items-center gap-1.5">
                    <Building2
                      className="w-4 h-4 text-primary-dark"
                      strokeWidth={1.75}
                    />
                    <span>Bank Transfer</span>
                  </div>
                  <p className="text-[12px] text-muted">
                    Transfer easily from any bank app on your phone.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online_paystack')}
                  className={`p-3 rounded border text-left space-y-1 cursor-pointer ${
                    paymentMethod === 'online_paystack'
                      ? 'bg-primary-tint border-primary-dark text-on-primary'
                      : 'bg-surface border-line text-ink hover:bg-page'
                  }`}
                >
                  <div className="font-bold text-[14px] flex items-center gap-1.5">
                    <CreditCard
                      className="w-4 h-4 text-primary-dark"
                      strokeWidth={1.75}
                    />
                    <span>Bank Card (Verve/Visa)</span>
                  </div>
                  <p className="text-[12px] text-muted">
                    Pay with your card. We keep your money safe until your order arrives.
                  </p>
                </button>
              </div>
            </section>

            {/* Section 4: Review */}
            <section className="bg-surface border border-line rounded p-4 space-y-3">
              <div className="pb-2 border-b border-line flex items-center justify-between">
                <h2 className="section-title">4. Order Review</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/cart')}
                  className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
                >
                  Edit items
                </button>
              </div>

              <div className="divide-y divide-line">
                {detailedItems.map(({ item, product }) => (
                  <div
                    key={product.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-[14px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded border border-line object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">
                          {product.title}
                        </div>
                        <div className="text-[12px] text-muted">
                          Qty: {item.quantity} × ₦{product.price.toLocaleString()} ·{' '}
                          {product.merchantName}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-ink shrink-0">
                      ₦{(product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary on the Right (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-surface border border-line rounded p-4 space-y-4">
            <h2 className="section-title pb-2 border-b border-line">Order Summary</h2>

            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted">Items Subtotal</span>
                <span className="font-bold text-ink">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery Fee</span>
                {baseDeliveryFee === 0 ? (
                  <span className="font-bold text-primary-dark">FREE</span>
                ) : (
                  <span className="font-bold text-ink">
                    ₦{baseDeliveryFee.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="pt-3 border-t border-line flex items-baseline justify-between">
                <span className="font-bold text-ink">Total to Pay</span>
                <span className="price-text-lg">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Trust text near the pay button */}
            <div className="p-3 bg-page border border-line rounded text-[12px] text-muted flex items-start gap-2">
              <Lock className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                Safe Payment Guarantee: The seller is paid only after you check your package and confirm delivery.
              </span>
            </div>

            <button
              type="submit"
              className="h-10 w-full bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Pay ₦{totalAmount.toLocaleString()}</span>
            </button>
          </aside>
        </form>
      )}
    </div>
  );
};
