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

  const [cart, setCart] = useState<{ listing: IboListing; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOrdersSection, setShowOrdersSection] = useState(false);

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

  const addToCart = (listing: IboListing) => {
    setCreatedOrder(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.listing.id === listing.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.id === listing.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { listing, quantity: 1 }];
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
    const shareUrl = `${window.location.origin}/shop/${iboProfile.slug}`;
    const text = `Check out ${item.product.title} for ₦${item.finalCustomerPrice.toLocaleString()} at ${storeName}: ${shareUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setSharedProductId(item.id);
    setTimeout(() => setSharedProductId(null), 2000);
  };

  const filteredListings = listings.filter((l) => {
    const matchesCategory =
      selectedCategory === 'all' || l.product.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      l.product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          <div className="flex items-center gap-3">
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
          </div>

          {/* In-Store Search Bar */}
          <div className="flex-1 max-w-md relative order-3 md:order-2 w-full md:w-auto">
            <Search
              className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setShowOrdersSection(!showOrdersSection)}
              className="h-10 px-3 rounded border border-line bg-surface hover:bg-page text-ink font-bold text-[12px] flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode
                className="w-4 h-4"
                style={{ color: accentColor }}
                strokeWidth={1.75}
              />
              <span className="hidden sm:inline">My Orders</span>
              <span
                className="px-1.5 py-0.5 rounded text-[11px] text-white font-bold"
                style={{ backgroundColor: accentColor }}
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

        {/* Storefront Category Filter Row */}
        {storeCategories.length > 0 && (
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

        {/* Active Storefront Orders & QR Delivery Verification Section */}
        {(showOrdersSection || customerOrders.length > 0) && (
          <section className="bg-surface border border-line rounded p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title text-ink">
                  Your Orders at {storeName} ({customerOrders.length})
                </h2>
                <p className="text-[12px] text-muted">
                  When your delivery rider arrives, click “Confirm Delivery” after checking your package.
                </p>
              </div>
              {showOrdersSection && (
                <button
                  type="button"
                  onClick={() => setShowOrdersSection(false)}
                  className="text-[12px] text-muted hover:text-ink"
                >
                  Hide
                </button>
              )}
            </div>

            {customerOrders.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-muted">
                You have no orders in this store yet. Add items below to place an escrow-protected order.
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
                    <div key={ord.id} className="py-3.5 space-y-3 text-[13px]">
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
                              ? ` • Courier: ${ord.agentName} (${ord.agentVehicle || 'Assigned'})`
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
        )}

        {/* 4. Curated Storefront Products Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-ink">
              Curated Store Catalog ({filteredListings.length})
            </h2>
            <span className="text-[12px] text-muted">
              All prices in Nigerian Naira (₦)
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
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-line rounded p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square bg-page rounded overflow-hidden mb-3 border border-line relative">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
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

                    <h3 className="text-[14px] font-bold text-ink line-clamp-2 min-h-[40px]">
                      {item.product.title}
                    </h3>

                    <p className="text-[12px] text-muted line-clamp-2 mt-1">
                      {item.product.description}
                    </p>

                    <div className="price-text text-ink mt-2.5">
                      ₦{item.finalCustomerPrice.toLocaleString()}
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
              ))}
            </div>
          )}
        </section>
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
              Escrow-protected checkout • Powered by IBO Hub
            </div>
          </div>
        </div>
      </footer>

      {/* 6. In-Store Cart & Escrow Checkout Slide-Over Drawer */}
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
                        setShowOrdersSection(true);
                        setCreatedOrder(null);
                        setIsCartOpen(false);
                      }}
                      style={{ backgroundColor: accentColor }}
                      className="flex-1 h-10 text-white font-bold rounded text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" strokeWidth={1.75} />
                      <span>Track Live Delivery</span>
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
                            {item.listing.product.title}
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
