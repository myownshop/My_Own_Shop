import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  QrCode,
  ShieldCheck,
  X,
  Plus,
  Minus,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  CheckCircle2,
  Package,
  Award,
  MapPin,
  User,
  LogOut,
  ArrowLeft,
  Star,
  RotateCcw,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { IboProfile, IboListing, Order, PaymentMethod } from '../../types';
import { CustomerQrScannerModal } from '../../components/CustomerQrScannerModal';
import { LiveDeliveryTrackingMap } from '../../components/LiveDeliveryTrackingMap';
import { useAuth } from '../../context/AuthContext';
import { ShopperAuthGateCard } from '../../components/ShopperAuthGateCard';

interface CustomerShopScreenProps {
  iboSlug?: string;
  onNavigate?: (path: string) => void;
}

export const CustomerShopScreen: React.FC<CustomerShopScreenProps> = ({
  iboSlug = 'amina-crafts',
}) => {
  const [, setStoreTick] = useState(0);
  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const state = platformStore.getState();
  const { iboProfiles, iboListings, orders } = state;

  const iboProfile: IboProfile =
    Object.values(iboProfiles).find((p) => p.slug === iboSlug) ||
    Object.values(iboProfiles)[0] ||
    iboProfiles['ibo-1'];
  const listings: IboListing[] = iboListings[iboProfile.id] || [];

  // Persist 90-day customer attribution to this IBO storefront
  useEffect(() => {
    try {
      localStorage.setItem('attributedIboSlug', iboProfile.slug);
      localStorage.setItem('attributedIboId', iboProfile.id);
    } catch {
      // Ignore storage error
    }
  }, [iboProfile.slug, iboProfile.id]);

  // Storefront View Mode: 'shop' (Shopping Catalog) | 'orders' (My Orders & Track My Order) | 'product' (Dedicated Product Page)
  const [viewMode, setViewMode] = useState<'shop' | 'orders' | 'product'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'orders') return 'orders';
    if (params.get('product')) return 'product';
    return 'shop';
  });
  const [selectedListing, setSelectedListing] = useState<IboListing | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      return listings.find((l) => l.productId === prodId || l.id === prodId) || listings[0] || null;
    }
    return null;
  });
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number>(0);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [detailTab, setDetailTab] = useState<'description' | 'specs'>('description');

  const [cart, setCart] = useState<{ listing: IboListing; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Track My Order search inside My Orders view
  const [orderLookupQuery, setOrderLookupQuery] = useState('');
  const [lookupResultOrder, setLookupResultOrder] = useState<Order | null>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // Checkout & Shopper Auth state
  const { currentAppUser, userProfile, signOutUser } = useAuth();
  const isAuthenticated = Boolean(currentAppUser || userProfile);

  const [customerName, setCustomerName] = useState(
    currentAppUser?.name || userProfile?.displayName || 'Ngozi Eze'
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentAppUser?.phone || userProfile?.phone || '+234 802 334 4556'
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Plot 14, Admiralty Way, Lekki Phase 1, Lagos'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online_paystack');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentAppUser) {
      setCustomerName(currentAppUser.name);
      if (currentAppUser.phone) {
        setCustomerPhone(currentAppUser.phone);
      }
    } else if (userProfile) {
      setCustomerName(userProfile.displayName);
      if (userProfile.phone) {
        setCustomerPhone(userProfile.phone);
      }
    }
  }, [currentAppUser, userProfile]);

  // QR Scanner & Live Map Tracking state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeOrderForQr, setActiveOrderForQr] = useState<Order | null>(null);
  const [sharedProductId, setSharedProductId] = useState<string | null>(null);

  const customerOrders = orders.filter((o) => o.iboId === iboProfile.id);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(
    () =>
      customerOrders.find((o) => o.isPickupConfirmed && o.orderStatus !== 'delivered')?.id ||
      customerOrders[0]?.id ||
      null
  );

  // Brand theme color from IBO's shopBranding (never hard-coded to platform green)
  const accentColor = iboProfile.shopBranding.accentColor || '#0F766E';
  const storeName = iboProfile.shopBranding.storeName || `${iboProfile.name}'s Store`;
  const tagline =
    iboProfile.shopBranding.tagline || 'Verified Quality Products & Doorstep Delivery';
  const supportPhone = iboProfile.shopBranding.supportPhone || '+234 803 998 1234';
  const supportEmail = iboProfile.shopBranding.supportEmail || 'care@storefront.ng';
  const cleanWhatsAppPhone = supportPhone.replace(/\D/g, '');

  const storeInitials = storeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  // Store-scoped categories derived from this IBO's curated products
  const storeCategories = Array.from(
    new Set(listings.map((l) => l.product.category).filter(Boolean))
  );

  const openProductPage = (listing: IboListing) => {
    setSelectedListing(listing);
    setSelectedGalleryIdx(0);
    setDetailQty(1);
    setDetailTab('description');
    setViewMode('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (listing: IboListing, qty: number = 1) => {
    setCreatedOrder(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.listing.id === listing.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.id === listing.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { listing, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (listingId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.listing.id === listingId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.listing.finalCustomerPrice * item.quantity,
    0
  );
  const deliveryFee = cart.length > 0 ? 3500 : 0;
  const cartTotal = cartSubtotal + deliveryFee;
  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !customerName || !customerPhone || !deliveryAddress || cart.length === 0) return;

    // Record 90-day customer attribution on purchase
    platformStore.recordCustomerAttribution({
      customerId: `cust-${customerPhone.replace(/\D/g, '').slice(-8) || 'buyer'}`,
      customerPhone,
      iboId: iboProfile.id,
      source: 'shared_link',
    });

    const newOrder = platformStore.createOrder({
      iboId: iboProfile.id,
      iboSlug: iboProfile.slug,
      customerName,
      customerPhone,
      deliveryAddress,
      items: cart.map((item) => ({
        product: item.listing.product,
        quantity: item.quantity,
        iboMarkup: item.listing.iboMarkup,
      })),
      paymentMethod,
    });
    setCreatedOrder(newOrder);
    setCart([]);
  };

  const handleShareProduct = (item: IboListing) => {
    const shareUrl = `${window.location.origin}/shop/${iboProfile.slug}?product=${item.productId}`;
    const text = `Check out ${item.customTitle || item.product.title} for ₦${item.finalCustomerPrice.toLocaleString()} at ${storeName}: ${shareUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setSharedProductId(item.id);
    setTimeout(() => setSharedProductId(null), 2000);
  };

  const handleLookupOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderLookupQuery.trim().toUpperCase();
    setLookupAttempted(true);
    if (!q) {
      setLookupResultOrder(null);
      return;
    }
    const found =
      customerOrders.find((o) => o.orderNumber.toUpperCase() === q) ||
      orders.find((o) => o.orderNumber.toUpperCase() === q) ||
      null;
    setLookupResultOrder(found);
    if (found) {
      setTrackedOrderId(found.id);
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesCategory =
      selectedCategory === 'all' || l.product.category === selectedCategory;
    const displayTitle = l.customTitle || l.product.title;
    const displayDesc = l.customDescription || l.product.description;
    const matchesSearch =
      !searchQuery.trim() ||
      displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="min-h-screen flex flex-col bg-page text-ink"
      style={
        {
          '--shop-accent': accentColor,
        } as React.CSSProperties
      }
    >
      {/* 1. Storefront Customer Care Top Strip (IBO's own contact info, zero platform recruiting) */}
      <div
        className="text-white text-[12px]"
        style={{ backgroundColor: accentColor }}
      >
        <div className="container-market h-8 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0 font-medium">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Verified Shop ({iboProfile.iboNumber})</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Safe Payment Protection</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <a
              href={`tel:${supportPhone}`}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{supportPhone}</span>
            </a>
            <a
              href={`https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(
                `Hello ${storeName}, I am browsing your online store (/shop/${iboProfile.slug}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. White-Label Store Header */}
      <header className="bg-surface border-b border-line sticky top-0 z-30">
        <div className="container-market py-3 flex flex-wrap items-center justify-between gap-4">
          {/* IBO Logo / Monogram + Store Name */}
          <button
            type="button"
            onClick={() => setViewMode('shop')}
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            {iboProfile.shopBranding.logoUrl ? (
              <img
                src={iboProfile.shopBranding.logoUrl}
                alt={storeName}
                className="w-11 h-11 rounded object-cover border border-line shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-11 h-11 rounded flex items-center justify-center text-white font-bold text-[16px] shrink-0"
                style={{ backgroundColor: accentColor }}
              >
                {storeInitials || 'ST'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] sm:text-[20px] font-bold text-ink leading-tight">
                  {storeName}
                </h1>
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-[12px] text-muted line-clamp-1">{tagline}</p>
            </div>
          </button>

          {/* In-Store Search Bar */}
          <div className="flex-1 max-w-md relative order-3 md:order-2 w-full md:w-auto">
            <Search
              className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (viewMode !== 'shop') setViewMode('shop');
              }}
              placeholder={`Search products in ${storeName}...`}
              className="w-full pl-9 pr-3 h-10 bg-page border border-line rounded text-[13px] text-ink focus:outline-none"
            />
          </div>

          {/* Storefront Actions: Account + My Orders + Cart */}
          <div className="flex items-center gap-2 order-2 md:order-3">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-1.5 h-10 px-2.5 rounded border border-line bg-page text-[12px]">
                <User
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: accentColor }}
                  strokeWidth={1.75}
                />
                <span className="font-bold text-ink max-w-[110px] truncate">
                  {currentAppUser?.name || userProfile?.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  title="Sign out"
                  className="text-muted hover:text-sale ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="h-10 px-3 rounded border border-line bg-surface hover:bg-page text-ink font-bold text-[12px] flex items-center gap-1.5 cursor-pointer"
              >
                <User
                  className="w-4 h-4"
                  style={{ color: accentColor }}
                  strokeWidth={1.75}
                />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === 'orders' ? 'shop' : 'orders')
              }
              style={
                viewMode === 'orders'
                  ? { backgroundColor: accentColor, color: '#FFFFFF', borderColor: accentColor }
                  : undefined
              }
              className={`h-10 px-3 rounded border font-bold text-[12px] flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'orders'
                  ? 'text-white'
                  : 'border-line bg-surface hover:bg-page text-ink'
              }`}
            >
              <Package
                className="w-4 h-4"
                style={{ color: viewMode === 'orders' ? '#FFFFFF' : accentColor }}
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">My Orders</span>
              <span
                className="px-1.5 py-0.5 rounded text-[11px] font-bold"
                style={
                  viewMode === 'orders'
                    ? { backgroundColor: '#FFFFFF', color: accentColor }
                    : { backgroundColor: accentColor, color: '#FFFFFF' }
                }
              >
                {customerOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: accentColor }}
              className="px-4 h-10 text-white font-bold rounded text-[13px] flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
              <span>Cart ({totalCartItems})</span>
            </button>
          </div>
        </div>

        {/* Storefront Category Filter Row (shown when browsing shop) */}
        {viewMode === 'shop' && storeCategories.length > 0 && (
          <div className="border-t border-line bg-surface">
            <div className="container-market py-1.5 flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                style={
                  selectedCategory === 'all'
                    ? { backgroundColor: accentColor, color: '#FFFFFF' }
                    : undefined
                }
                className={`h-8 px-3 rounded text-[12px] font-bold shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'text-white'
                    : 'bg-page text-ink hover:bg-line/50'
                }`}
              >
                All Products ({listings.length})
              </button>
              {storeCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={
                      isSelected
                        ? { backgroundColor: accentColor, color: '#FFFFFF' }
                        : undefined
                    }
                    className={`h-8 px-3 rounded text-[12px] font-medium capitalize shrink-0 cursor-pointer ${
                      isSelected
                        ? 'font-bold text-white'
                        : 'bg-page text-ink hover:bg-line/50'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* 3. Main Storefront Content */}
      <main className="flex-1 container-market py-6 space-y-6">
        {viewMode === 'orders' ? (
          /* ============================================================== */
          /* VIEW 1: DEDICATED "MY ORDERS & TRACK MY ORDER" PAGE            */
          /* ============================================================== */
          <div className="space-y-6">
            <div className="bg-surface border border-line rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setViewMode('shop')}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold mb-2 hover:underline cursor-pointer"
                  style={{ color: accentColor }}
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                  <span>Back to {storeName} Shopping Page</span>
                </button>
                <h2 className="page-title text-ink">My Orders &amp; Track My Order</h2>
                <p className="text-[13px] text-muted mt-0.5">
                  Track your package on the live delivery map or confirm delivery when your rider arrives.
                </p>
              </div>
            </div>

            {/* Track My Order Search Box inside My Orders Page */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div>
                <h3 className="section-title text-ink">Track My Order</h3>
                <p className="text-[12px] text-muted">
                  Enter your Order Number below to check your package status and live delivery map.
                </p>
              </div>

              <form onSubmit={handleLookupOrder} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={orderLookupQuery}
                  onChange={(e) => setOrderLookupQuery(e.target.value)}
                  placeholder="Enter Order Number (e.g. ORD-2026-9041)..."
                  className="flex-1 h-10 px-3 bg-page border border-line rounded text-[13px] text-ink focus:outline-none"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: accentColor }}
                  className="h-10 px-5 text-white font-bold text-[13px] rounded cursor-pointer hover:opacity-95"
                >
                  Track Order
                </button>
              </form>

              {lookupAttempted && !lookupResultOrder && (
                <div className="p-3.5 bg-page border border-line rounded text-[13px] text-muted">
                  No order found with number <strong>"{orderLookupQuery}"</strong>. Please check the number or select from your orders below.
                </div>
              )}
            </section>

            {/* Orders List inside My Orders Page */}
            <section className="bg-surface border border-line rounded p-5 space-y-4">
              <div className="border-b border-line pb-3">
                <h3 className="section-title text-ink">
                  Your Orders at {storeName} ({customerOrders.length})
                </h3>
                <p className="text-[12px] text-muted">
                  When your delivery rider arrives, click “Confirm Delivery” after checking your package.
                </p>
              </div>

              {customerOrders.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <Package className="w-8 h-8 text-muted mx-auto" strokeWidth={1.75} />
                  <div className="text-[14px] font-bold text-ink">
                    You have no orders in this store yet
                  </div>
                  <p className="text-[12px] text-muted">
                    Browse products in our catalog to place a safe, protected order.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode('shop')}
                    style={{ backgroundColor: accentColor }}
                    className="h-10 px-5 text-white font-bold text-[13px] rounded cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {customerOrders.map((ord) => {
                    const isMapExpanded = trackedOrderId === ord.id;
                    const isLiveTrackable = Boolean(
                      ord.isPickupConfirmed ||
                        ord.orderStatus === 'in_transit' ||
                        ord.orderStatus === 'arrived_at_customer'
                    );
                    return (
                      <div key={ord.id} className="py-4 first:pt-0 last:pb-0 space-y-3 text-[13px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="font-bold text-ink flex flex-wrap items-center gap-2">
                              <span>{ord.orderNumber}</span>
                              <span>—</span>
                              <span>₦{ord.totalAmount.toLocaleString()}</span>
                              {isLiveTrackable && ord.orderStatus !== 'delivered' && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  Live GPS Active
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-muted">
                              {ord.items.map((i) => `${i.quantity}x ${i.productTitle}`).join(', ')}
                            </div>
                            <div className="text-[11px] text-muted">
                              Deliver to: {ord.deliveryAddress}
                              {ord.agentName
                                ? ` • Rider: ${ord.agentName} (${ord.agentVehicle || 'Assigned'})`
                                : ''}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span
                              className="px-2.5 py-1 rounded text-[11px] font-bold uppercase border"
                              style={
                                ord.orderStatus === 'delivered'
                                  ? {
                                      backgroundColor: `${accentColor}15`,
                                      borderColor: accentColor,
                                      color: accentColor,
                                    }
                                  : undefined
                              }
                            >
                              {ord.orderStatus.replace(/_/g, ' ')}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setTrackedOrderId(isMapExpanded ? null : ord.id)
                              }
                              className="px-3 h-9 border border-line bg-page hover:bg-surface text-ink font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin
                                className="w-4 h-4"
                                style={{ color: accentColor }}
                                strokeWidth={1.75}
                              />
                              <span>{isMapExpanded ? 'Hide Live Map' : 'Track Live Map'}</span>
                            </button>

                            {ord.orderStatus !== 'delivered' &&
                              ord.orderStatus !== 'failed_delivery' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveOrderForQr(ord);
                                    setIsQrModalOpen(true);
                                  }}
                                  style={{ backgroundColor: accentColor }}
                                  className="px-3 h-9 text-white font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                                >
                                  <QrCode className="w-4 h-4" strokeWidth={1.75} />
                                  <span>Confirm Delivery</span>
                                </button>
                              )}
                          </div>
                        </div>

                        {isMapExpanded && (
                          <div className="pt-1">
                            <LiveDeliveryTrackingMap
                              mode="customer"
                              order={ord}
                              accentColor={accentColor}
                              onOpenQrModal={(selectedOrd) => {
                                setActiveOrderForQr(selectedOrd);
                                setIsQrModalOpen(true);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : viewMode === 'product' && selectedListing ? (
          /* ============================================================== */
          /* VIEW 2: DEDICATED PRODUCT PAGE FOR EACH LISTED PRODUCT         */
          /* ============================================================== */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setViewMode('shop')}
                className="h-9 px-3.5 bg-surface border border-line rounded text-[13px] font-bold text-ink hover:bg-page inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                <span>Back to {storeName} Products</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareProduct(selectedListing)}
                className="h-9 px-3.5 bg-surface border border-line rounded text-[12px] font-bold text-ink hover:bg-page inline-flex items-center gap-1.5 cursor-pointer"
              >
                {sharedProductId === selectedListing.id ? (
                  <>
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: accentColor }}
                      strokeWidth={1.75}
                    />
                    <span>Product Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" strokeWidth={1.75} />
                    <span>Share Product Page</span>
                  </>
                )}
              </button>
            </div>

            {(() => {
              const p = selectedListing.product;
              const displayTitle = selectedListing.customTitle || p.title;
              const displayDesc = selectedListing.customDescription || p.description;
              const displayFeatures =
                selectedListing.customKeyFeatures && selectedListing.customKeyFeatures.length > 0
                  ? selectedListing.customKeyFeatures
                  : p.keyFeatures && p.keyFeatures.length > 0
                  ? p.keyFeatures
                  : [
                      `Curated and quality-checked by ${storeName}`,
                      `Protected by Safe Payment — pay only when your order arrives`,
                      `Fast doorstep delivery across Nigeria`,
                    ];
              const displayBox =
                selectedListing.customWhatsInTheBox ||
                p.whatsInTheBox ||
                `1x ${displayTitle}, User Guide & Official Warranty Slip`;
              const displayWarranty =
                selectedListing.customWarranty ||
                p.warranty ||
                '7-Day Easy Return & Safe Payment Protection';
              const displaySpecs =
                selectedListing.customSpecs && selectedListing.customSpecs.length > 0
                  ? selectedListing.customSpecs
                  : p.specs && p.specs.length > 0
                  ? p.specs
                  : [
                      { label: 'Brand', value: p.brand || p.merchantName },
                      { label: 'Category', value: p.category.replace(/_/g, ' ') },
                      { label: 'Sub-Category', value: p.subCategory },
                      { label: 'Condition', value: p.condition || 'Brand New' },
                      { label: 'Warranty', value: displayWarranty },
                    ];
              const gallery =
                p.galleryImages && p.galleryImages.length > 0
                  ? p.galleryImages
                  : [p.imageUrl];

              return (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left + Center: Gallery & Main Info (9 cols) */}
                    <div className="lg:col-span-9 bg-surface border border-line rounded p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Image Gallery */}
                      <div className="md:col-span-5 space-y-3">
                        <div className="aspect-square w-full bg-page border border-line rounded overflow-hidden">
                          <img
                            src={gallery[selectedGalleryIdx] || p.imageUrl}
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {gallery.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto">
                            {gallery.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedGalleryIdx(idx)}
                                style={
                                  idx === selectedGalleryIdx
                                    ? { borderColor: accentColor }
                                    : undefined
                                }
                                className={`w-16 h-16 rounded border overflow-hidden shrink-0 cursor-pointer ${
                                  idx === selectedGalleryIdx ? 'border-2' : 'border-line'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Product Info & Add to Cart */}
                      <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                            <span>
                              Brand:{' '}
                              <strong className="text-ink">
                                {p.brand || p.merchantName.split(' ')[0]}
                              </strong>
                            </span>
                            <span>·</span>
                            <span>SKU: {p.sku || p.id.toUpperCase()}</span>
                            <span>·</span>
                            <span>{p.condition || 'Brand New'}</span>
                          </div>

                          <h1 className="page-title text-ink">{displayTitle}</h1>

                          <div className="flex items-center gap-2 text-[12px] pb-3 border-b border-line">
                            <div className="flex items-center gap-1">
                              <Star
                                className="w-4 h-4 text-accent fill-accent"
                                strokeWidth={1.75}
                              />
                              <span className="font-bold text-ink">4.9</span>
                            </div>
                            <span className="text-muted">(Verified Store Product)</span>
                            <span>·</span>
                            <span
                              className="font-bold"
                              style={{ color: accentColor }}
                            >
                              {p.stockQty > 0
                                ? `In stock (${p.stockQty} units)`
                                : 'Out of stock'}
                            </span>
                          </div>

                          <div className="py-1">
                            <div className="price-text-lg text-ink">
                              ₦{selectedListing.finalCustomerPrice.toLocaleString()}
                            </div>
                            <div className="text-[12px] text-muted mt-0.5">
                              Protected by Safe Payment — pay only when your order arrives
                            </div>
                          </div>

                          {/* Key Features / Highlights Box */}
                          <div className="p-3.5 bg-page border border-line rounded space-y-1.5 text-[13px]">
                            <div className="text-[11px] font-bold text-ink uppercase">
                              Key Features &amp; Highlights
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-ink">
                              {displayFeatures.map((feat, idx) => (
                                <li key={idx}>{feat}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Quantity Stepper */}
                          <div className="pt-2 flex items-center gap-3">
                            <span className="text-[12px] font-bold text-ink uppercase">
                              Quantity:
                            </span>
                            <div className="flex items-center border border-line rounded overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                                className="w-10 h-10 bg-page hover:bg-surface text-ink flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-4 h-4" strokeWidth={1.75} />
                              </button>
                              <span className="w-12 h-10 flex items-center justify-center font-bold text-[14px] text-ink bg-surface border-x border-line">
                                {detailQty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDetailQty((q) => Math.min(p.stockQty || 99, q + 1))
                                }
                                className="w-10 h-10 bg-page hover:bg-surface text-ink flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-4 h-4" strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={!p.isAvailable || p.stockQty <= 0}
                            onClick={() => addToCart(selectedListing, detailQty)}
                            style={{ backgroundColor: accentColor }}
                            className="h-11 px-5 text-white font-bold text-[14px] rounded flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50"
                          >
                            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
                            <span>Add to Cart</span>
                          </button>

                          <button
                            type="button"
                            disabled={!p.isAvailable || p.stockQty <= 0}
                            onClick={() => {
                              addToCart(selectedListing, detailQty);
                              setIsCartOpen(true);
                            }}
                            className="h-11 px-5 bg-surface border-2 font-bold text-[14px] rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-page disabled:opacity-50"
                            style={{ borderColor: accentColor, color: accentColor }}
                          >
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Sidebar: Delivery, Warranty & Store Support (3 cols) */}
                    <aside className="lg:col-span-3 space-y-3">
                      <div className="bg-surface border border-line rounded p-4 space-y-4 text-[12px]">
                        <h2 className="text-[13px] font-bold text-ink uppercase pb-2 border-b border-line">
                          Delivery &amp; Buyer Protection
                        </h2>

                        <div className="flex items-start gap-2.5">
                          <Truck
                            className="w-5 h-5 shrink-0 mt-0.5"
                            style={{ color: accentColor }}
                            strokeWidth={1.75}
                          />
                          <div>
                            <div className="font-bold text-ink">Doorstep Delivery</div>
                            <p className="text-muted mt-0.5">
                              Dispatched from {p.dispatchLocation || 'Lagos'}. Same-day &amp; next-day delivery available.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <ShieldCheck
                            className="w-5 h-5 shrink-0 mt-0.5"
                            style={{ color: accentColor }}
                            strokeWidth={1.75}
                          />
                          <div>
                            <div className="font-bold text-ink">Safe Payment Protection</div>
                            <p className="text-muted mt-0.5">
                              Your money is held safely until your package arrives and you confirm delivery.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <RotateCcw
                            className="w-5 h-5 shrink-0 mt-0.5"
                            style={{ color: accentColor }}
                            strokeWidth={1.75}
                          />
                          <div>
                            <div className="font-bold text-ink">Warranty &amp; Returns</div>
                            <p className="text-muted mt-0.5">{displayWarranty}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface border border-line rounded p-4 space-y-2.5 text-[12px]">
                        <div className="font-bold text-ink uppercase border-b border-line pb-2">
                          Sold by {storeName}
                        </div>
                        <p className="text-muted">{tagline}</p>
                        <a
                          href={`https://wa.me/${cleanWhatsAppPhone}?text=${encodeURIComponent(
                            `Hello ${storeName}, I have a question about "${displayTitle}" (₦${selectedListing.finalCustomerPrice.toLocaleString()}).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ backgroundColor: accentColor }}
                          className="w-full h-9 rounded text-white font-bold flex items-center justify-center gap-1.5 hover:opacity-95"
                        >
                          <MessageCircle className="w-4 h-4" strokeWidth={1.75} />
                          <span>Ask Seller on WhatsApp</span>
                        </a>
                      </div>
                    </aside>
                  </div>

                  {/* Product Page Tabs: Description, What's in the Box & Specifications */}
                  <section className="bg-surface border border-line rounded">
                    <div className="flex border-b border-line">
                      <button
                        type="button"
                        onClick={() => setDetailTab('description')}
                        style={
                          detailTab === 'description'
                            ? { borderColor: accentColor, color: accentColor }
                            : undefined
                        }
                        className={`h-11 px-5 text-[14px] font-bold border-b-2 cursor-pointer ${
                          detailTab === 'description'
                            ? ''
                            : 'border-transparent text-muted hover:text-ink'
                        }`}
                      >
                        Product Description &amp; Box Contents
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailTab('specs')}
                        style={
                          detailTab === 'specs'
                            ? { borderColor: accentColor, color: accentColor }
                            : undefined
                        }
                        className={`h-11 px-5 text-[14px] font-bold border-b-2 cursor-pointer ${
                          detailTab === 'specs'
                            ? ''
                            : 'border-transparent text-muted hover:text-ink'
                        }`}
                      >
                        Specifications ({displaySpecs.length})
                      </button>
                    </div>

                    <div className="p-5">
                      {detailTab === 'description' ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[14px] text-ink">
                          <div className="md:col-span-8 space-y-3">
                            <h3 className="section-title">Product Overview</h3>
                            <p className="leading-relaxed whitespace-pre-line">
                              {displayDesc}
                            </p>
                          </div>
                          <div className="md:col-span-4 space-y-3">
                            <div className="p-4 bg-page border border-line rounded space-y-1.5 text-[13px]">
                              <h4 className="font-bold text-ink uppercase text-[12px]">
                                What's in the Box
                              </h4>
                              <p className="text-ink">{displayBox}</p>
                            </div>
                            <div className="p-4 bg-page border border-line rounded space-y-1.5 text-[13px]">
                              <h4 className="font-bold text-ink uppercase text-[12px]">
                                Warranty &amp; Return Policy
                              </h4>
                              <p className="text-ink">{displayWarranty}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-2xl">
                          <h3 className="section-title mb-3">Technical Specifications</h3>
                          <table className="w-full border border-line text-[13px]">
                            <tbody className="divide-y divide-line">
                              {displaySpecs.map((spec, i) => (
                                <tr key={i}>
                                  <th className="w-2/5 bg-page px-3.5 py-2.5 text-left font-bold text-ink border-r border-line">
                                    {spec.label}
                                  </th>
                                  <td className="px-3.5 py-2.5 text-ink">{spec.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              );
            })()}
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW 3: SHOPPING PAGE (CLEAN CATALOG — NO ORDER TRACKER HERE)  */
          /* ============================================================== */
          <>
            {/* Custom IBO Banner / Storefront Welcome Card */}
            <section className="bg-surface border border-line rounded overflow-hidden">
              {iboProfile.shopBranding.bannerImageUrl && (
                <div className="h-36 sm:h-48 w-full overflow-hidden bg-dark relative">
                  <img
                    src={iboProfile.shopBranding.bannerImageUrl}
                    alt={storeName}
                    className="w-full h-full object-cover opacity-85"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4 sm:p-6">
                    <div className="text-white space-y-1 max-w-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                        Official Retail Storefront • Curated by {iboProfile.name}
                      </div>
                      <h2 className="text-[20px] sm:text-[24px] font-bold leading-tight">
                        {storeName}
                      </h2>
                      <p className="text-[13px] text-white/90">{tagline}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-ink font-medium">
                    <ShieldCheck
                      className="w-4 h-4 shrink-0"
                      style={{ color: accentColor }}
                      strokeWidth={1.75}
                    />
                    <span>
                      <strong>Safe Payment:</strong> The seller is paid only after you receive your package and confirm delivery.
                    </span>
                  </div>
                  {iboProfile.cosmeticBadges?.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-page border border-line text-[11px] font-bold text-ink"
                    >
                      <Award
                        className="w-3.5 h-3.5"
                        style={{ color: accentColor }}
                        strokeWidth={1.75}
                      />
                      <span>{badge}</span>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-muted">
                  <Truck
                    className="w-4 h-4 shrink-0"
                    style={{ color: accentColor }}
                    strokeWidth={1.75}
                  />
                  <span>Direct warehouse dispatch across Nigeria</span>
                </div>
              </div>
            </section>

            {/* Curated Storefront Products Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="section-title text-ink">
                  Curated Store Catalog ({filteredListings.length})
                </h2>
                <span className="text-[12px] text-muted">
                  Click any item to view its full product page
                </span>
              </div>

              {filteredListings.length === 0 ? (
                <div className="bg-surface border border-line rounded p-8 text-center space-y-2">
                  <Package className="w-8 h-8 text-muted mx-auto" strokeWidth={1.75} />
                  <div className="text-[14px] font-bold text-ink">No matching products found</div>
                  <p className="text-[12px] text-muted">
                    Try clearing your search filter or selecting “All Products”.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredListings.map((item) => {
                    const displayTitle = item.customTitle || item.product.title;
                    const displayDesc = item.customDescription || item.product.description;
                    return (
                      <div
                        key={item.id}
                        className="bg-surface border border-line rounded p-3.5 flex flex-col justify-between hover:border-ink/40 transition-colors"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => openProductPage(item)}
                            className="block w-full text-left cursor-pointer group"
                          >
                            <div className="aspect-square bg-page rounded overflow-hidden mb-3 border border-line relative">
                              <img
                                src={item.product.imageUrl}
                                alt={displayTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/95 border border-line text-[10px] font-bold uppercase text-ink">
                                {item.product.category.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="text-[11px] text-muted flex items-center justify-between mb-1">
                              <span className="truncate">{item.product.subCategory}</span>
                              <span className="font-medium text-ink">
                                {item.product.stockQty > 0
                                  ? `${item.product.stockQty} in stock`
                                  : 'Out of stock'}
                              </span>
                            </div>

                            <h3 className="text-[14px] font-bold text-ink line-clamp-2 min-h-[40px] group-hover:underline">
                              {displayTitle}
                            </h3>

                            <p className="text-[12px] text-muted line-clamp-2 mt-1">
                              {displayDesc}
                            </p>
                          </button>

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="price-text text-ink">
                              ₦{item.finalCustomerPrice.toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => openProductPage(item)}
                              style={{ color: accentColor }}
                              className="text-[12px] font-bold hover:underline cursor-pointer"
                            >
                              Product details →
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-line flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!item.product.isAvailable || item.product.stockQty <= 0}
                            onClick={() => addToCart(item)}
                            style={{ backgroundColor: accentColor }}
                            className="flex-1 h-10 text-white font-bold rounded text-[13px] cursor-pointer hover:opacity-95 disabled:opacity-50"
                          >
                            Add to Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareProduct(item)}
                            title="Copy product link to share"
                            className="w-10 h-10 border border-line rounded flex items-center justify-center text-ink hover:bg-page cursor-pointer shrink-0"
                          >
                            {sharedProductId === item.id ? (
                              <CheckCircle2
                                className="w-4 h-4"
                                style={{ color: accentColor }}
                                strokeWidth={1.75}
                              />
                            ) : (
                              <Share2 className="w-4 h-4" strokeWidth={1.75} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* 5. White-Label Storefront Footer (Isolated from Platform Recruiting Chrome) */}
      <footer className="bg-surface border-t border-line mt-10">
        <div className="container-market py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-muted">
          <div className="space-y-1">
            <div className="font-bold text-ink text-[14px]">{storeName}</div>
            <div>{tagline}</div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{supportPhone}</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{supportEmail}</span>
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-ink font-medium">
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </div>
            <div className="text-[11px] text-muted">
              Safe payment checkout • Powered by IBO Hub
            </div>
          </div>
        </div>
      </footer>

      {/* 6. In-Store Cart & Checkout Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="bg-surface w-full max-w-md h-full p-6 flex flex-col justify-between overflow-y-auto border-l border-line">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="section-title text-ink">{storeName} Cart</h3>
                  <p className="text-[11px] text-muted">
                    Safe checkout — your money is protected until delivery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setCreatedOrder(null);
                  }}
                  className="text-muted hover:text-ink cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>

              {createdOrder ? (
                <div className="p-4 bg-page border border-line rounded space-y-3 text-[13px]">
                  <div className="flex items-center gap-2 font-bold text-[15px] text-ink">
                    <CheckCircle2
                      className="w-5 h-5 shrink-0"
                      style={{ color: accentColor }}
                      strokeWidth={1.75}
                    />
                    <span>Order Confirmed: {createdOrder.orderNumber}</span>
                  </div>
                  <p className="text-muted text-[12px]">
                    Your payment of <strong>₦{createdOrder.totalAmount.toLocaleString()}</strong> is kept safe. Show or scan your delivery code when the rider brings your package.
                  </p>
                  <div className="p-2.5 bg-surface border border-line rounded text-[11px] font-mono">
                    Delivery Code: <strong>{createdOrder.confirmationQrToken}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackedOrderId(createdOrder.id);
                        setViewMode('orders');
                        setCreatedOrder(null);
                        setIsCartOpen(false);
                      }}
                      style={{ backgroundColor: accentColor }}
                      className="flex-1 h-10 text-white font-bold rounded text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" strokeWidth={1.75} />
                      <span>Go to My Orders &amp; Track</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        setActiveOrderForQr(createdOrder);
                        setIsQrModalOpen(true);
                      }}
                      className="px-3 h-10 border border-line rounded text-[12px] font-bold text-ink flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" strokeWidth={1.75} />
                      <span>QR Scanner</span>
                    </button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="space-y-4">
                  <div className="py-8 text-center space-y-2 border-b border-line">
                    <ShoppingBag className="w-8 h-8 text-muted mx-auto" strokeWidth={1.75} />
                    <p className="text-[13px] text-muted">Your shopping cart is empty.</p>
                  </div>
                  {!isAuthenticated && (
                    <ShopperAuthGateCard
                      accentColor={accentColor}
                      storeName={storeName}
                      compact
                    />
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-line">
                    {cart.map((item) => (
                      <div
                        key={item.listing.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-ink truncate">
                            {item.listing.customTitle || item.listing.product.title}
                          </div>
                          <div className="text-[12px] text-muted">
                            ₦{item.listing.finalCustomerPrice.toLocaleString()} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.listing.id, -1)}
                            className="w-8 h-8 border border-line rounded flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <span className="text-[13px] font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.listing.id, 1)}
                            className="w-8 h-8 border border-line rounded flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 space-y-1 text-[13px] border-t border-line">
                    <div className="flex justify-between text-muted">
                      <span>Subtotal</span>
                      <span>₦{cartSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Home Delivery Fee</span>
                      <span>₦{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[16px] text-ink pt-1 border-t border-line">
                      <span>Total to Pay</span>
                      <span>₦{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {!isAuthenticated ? (
                    <div className="pt-2">
                      <ShopperAuthGateCard
                        accentColor={accentColor}
                        storeName={storeName}
                        compact
                      />
                    </div>
                  ) : (
                    <form
                      onSubmit={handlePlaceOrder}
                      className="space-y-3 pt-3 border-t border-line text-[13px]"
                    >
                      <div className="px-3 py-2 bg-page border border-line rounded flex items-center justify-between gap-2 text-[12px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0"
                            style={{ color: accentColor }}
                            strokeWidth={1.75}
                          />
                          <span className="truncate text-ink">
                            Signed in as{' '}
                            <strong>{currentAppUser?.name || userProfile?.displayName}</strong>
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-ink mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-ink mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-ink mb-1">Delivery Address *</label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-ink mb-1">
                          How Would You Like to Pay?
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        >
                          <option value="online_paystack">
                            Bank Card or USSD (Verve, Visa, Mastercard)
                          </option>
                          <option value="bank_transfer">
                            Bank Transfer from Phone
                          </option>
                          <option value="pay_on_delivery">
                            Pay on Delivery (POS or Cash)
                          </option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        style={{ backgroundColor: accentColor }}
                        className="w-full h-10 text-white font-bold rounded text-[14px] cursor-pointer hover:opacity-95"
                      >
                        Complete Order • ₦{cartTotal.toLocaleString()}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isQrModalOpen && activeOrderForQr && (
        <CustomerQrScannerModal
          order={activeOrderForQr}
          onClose={() => {
            setIsQrModalOpen(false);
            setActiveOrderForQr(null);
          }}
          onSuccess={() => setStoreTick((t) => t + 1)}
        />
      )}
    </div>
  );
};
