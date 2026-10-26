import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Globe,
  ShieldCheck,
  Truck,
  CreditCard,
  Heart,
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES, cartStore, wishlistStore } from '../data/marketplaceData';
import { useAuth } from '../context/AuthContext';
import { PlatformLogo } from './PlatformLogo';

interface MarketplaceLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { currentAppUser, userProfile, signOutUser } = useAuth();
  const activeUserId = currentAppUser?.id || userProfile?.userId || null;

  const [cartCount, setCartCount] = useState<number>(() => cartStore.getTotalCount());
  const [wishlistCount, setWishlistCount] = useState<number>(() =>
    wishlistStore.getCount(activeUserId)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [country, setCountry] = useState<string>('NG');

  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setCartCount(cartStore.getTotalCount());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeUserId) {
      wishlistStore.hydrateFromServer(activeUserId);
    }
    setWishlistCount(wishlistStore.getCount(activeUserId));
    const unsubscribe = wishlistStore.subscribe(() => {
      setWishlistCount(wishlistStore.getCount(activeUserId));
    });
    return () => unsubscribe();
  }, [activeUserId]);

  useEffect(() => {
    const params = new URLSearchParams(
      currentPath.includes('?') ? currentPath.split('?')[1] : window.location.search
    );
    const q = params.get('q') || '';
    const cat = params.get('category') || 'all';
    setSearchQuery(q);
    setSelectedCategory(cat);
  }, [currentPath]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    const queryStr = params.toString();
    onNavigate(`/search${queryStr ? `?${queryStr}` : ''}`);
    setMobileMenuOpen(false);
  };

  const categoryNavItems = [
    { label: 'Phones', slug: 'phones' },
    { label: 'Fashion', slug: 'fashion' },
    { label: 'Home', slug: 'home' },
    { label: 'Groceries', slug: 'groceries' },
    { label: 'Beauty', slug: 'beauty' },
    { label: 'Electronics', slug: 'electronics' },
    { label: 'Baby', slug: 'baby' },
    { label: 'Sports', slug: 'sports' },
    { label: 'Services', slug: 'services' },
    { label: 'More', slug: 'more' },
  ];

  const activeCategorySlug = currentPath.startsWith('/category/')
    ? currentPath.replace('/category/', '').split('?')[0]
    : '';
  const isWishlistPage =
    currentPath.split('?')[0] === '/wishlist' ||
    currentPath.split('?')[0] === '/my-wishlist';

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line">
        {/* 1. Thin top bar (spring green, near-black text #0B1F17, 12px) */}
        <div className="bg-primary text-on-primary text-[12px] border-b border-primary-dark">
          <div className="container-market h-8 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-4 shrink-0 font-medium">
              <button
                type="button"
                onClick={() => onNavigate('/sell')}
                className="hover:underline cursor-pointer"
              >
                Sell on IBO Hub
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('/become-a-delivery-agent')}
                className="hover:underline cursor-pointer"
              >
                Become a delivery agent
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('/become-an-ibo')}
                className="hover:underline cursor-pointer"
              >
                Become an IBO
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('/help')}
                className="hover:underline cursor-pointer"
              >
                Help
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3 shrink-0 font-medium">
              <span>Free delivery on orders over ₦20,000</span>
              <span aria-hidden="true">|</span>
              <button
                type="button"
                onClick={() => onNavigate('/wishlist')}
                className="hover:underline cursor-pointer"
              >
                My Wishlist
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('/track-order')}
                className="hover:underline cursor-pointer"
              >
                Track Order
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigate('/escrow-protection')}
                className="hover:underline cursor-pointer"
              >
                Safe Payment Protection
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main bar (white) */}
        <div className="bg-surface">
          <div className="container-market py-2.5">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile Hamburger + Wordmark */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="md:hidden w-11 h-11 flex items-center justify-center rounded border border-line text-ink hover:bg-page cursor-pointer"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Menu className="w-5 h-5" strokeWidth={1.75} />
                  )}
                </button>
                <PlatformLogo onNavigate={onNavigate} size="lg" />
              </div>

              {/* Desktop Wide Centered Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex flex-1 max-w-2xl items-center"
              >
                <div className="flex w-full h-10 border border-line rounded overflow-hidden bg-surface focus-within:border-primary-dark">
                  <select
                    aria-label="Search category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-full px-3 bg-page text-ink text-[12px] font-medium border-r border-line focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {MARKETPLACE_CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.shortName}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1 flex items-center">
                    <Search
                      className="w-5 h-5 text-muted ml-3 shrink-0"
                      strokeWidth={1.75}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search phones, 50kg rice, solar panels, brands..."
                      className="w-full h-full px-2.5 text-[14px] text-ink bg-surface focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-full px-5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] shrink-0 transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Right Actions: Account, My Wishlist, Help, Cart */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {currentAppUser || userProfile ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const role = currentAppUser?.role || userProfile?.role;
                        if (role === 'merchant') onNavigate('/merchant/dashboard');
                        else if (role === 'ibo') onNavigate('/ibo/dashboard');
                        else if (role === 'agent') onNavigate('/agent/dashboard');
                        else if (role === 'founder') onNavigate('/admin');
                        else onNavigate('/wishlist');
                      }}
                      className="h-11 md:h-10 px-2.5 rounded flex items-center gap-1.5 text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                    >
                      <User className="w-5 h-5 text-ink" strokeWidth={1.75} />
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {currentAppUser?.name || userProfile?.displayName || 'Account'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => signOutUser()}
                      className="hidden lg:inline-flex h-10 px-2 text-[12px] text-muted hover:text-ink cursor-pointer items-center"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="h-11 md:h-10 px-2.5 rounded flex items-center gap-1.5 text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                  >
                    <User className="w-5 h-5 text-ink" strokeWidth={1.75} />
                    <span className="hidden sm:inline">Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('/wishlist')}
                  className={`h-11 md:h-10 px-2.5 rounded flex items-center gap-1.5 text-[14px] font-medium transition-colors cursor-pointer ${
                    isWishlistPage
                      ? 'bg-primary-tint text-on-primary border border-primary-dark font-bold'
                      : 'text-ink hover:bg-primary-tint'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      wishlistCount > 0 ? 'text-sale fill-sale' : 'text-ink'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="hidden sm:inline">My Wishlist</span>
                  {activeUserId && wishlistCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-sale text-surface text-[11px] font-bold rounded leading-none">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/help')}
                  className="hidden sm:flex h-10 px-2.5 rounded items-center gap-1.5 text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  <span className="hidden lg:inline">Help</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/cart')}
                  className="h-11 md:h-10 px-2.5 rounded flex items-center gap-1.5 text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer relative"
                >
                  <ShoppingCart className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="px-1.5 py-0.5 bg-primary text-on-primary text-[12px] font-bold rounded leading-none">
                    {cartCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Full-Width Search Bar Beneath */}
            <form onSubmit={handleSearchSubmit} className="mt-2 md:hidden">
              <div className="flex w-full h-11 border border-line rounded overflow-hidden bg-surface">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands and categories..."
                  className="flex-1 h-full px-3 text-[14px] text-ink bg-surface focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-full px-4 bg-primary text-on-primary font-bold text-[14px] shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-5 h-5" strokeWidth={1.75} />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 3. Category row below */}
        <nav
          aria-label="Marketplace categories"
          className="bg-surface border-t border-line hidden md:block"
        >
          <div className="container-market flex items-center gap-1 overflow-x-auto py-1">
            {categoryNavItems.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onNavigate(`/category/${cat.slug}`)}
                  className={`h-9 px-3 rounded text-[14px] font-medium shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary-tint text-on-primary border border-primary-dark font-bold'
                      : 'text-ink hover:bg-primary-tint'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface border-t border-line px-4 py-3 space-y-4">
            <div>
              <div className="text-[12px] font-bold text-muted uppercase mb-2">
                My Account &amp; Saved Items
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate('/wishlist');
                  setMobileMenuOpen(false);
                }}
                className="w-full h-11 px-3 rounded border border-line text-left text-[14px] font-bold text-ink hover:bg-primary-tint flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart
                    className={`w-4 h-4 ${
                      wishlistCount > 0 ? 'text-sale fill-sale' : 'text-primary-dark'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span>My Wishlist</span>
                </span>
                <span className="text-[12px] text-muted">
                  {activeUserId ? `${wishlistCount} saved` : 'Sign in'}
                </span>
              </button>
            </div>

            <div>
              <div className="text-[12px] font-bold text-muted uppercase mb-2">
                Categories
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {categoryNavItems.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      onNavigate(`/category/${cat.slug}`);
                      setMobileMenuOpen(false);
                    }}
                    className="h-11 px-3 rounded border border-line text-left text-[14px] font-medium text-ink hover:bg-primary-tint flex items-center justify-between cursor-pointer"
                  >
                    <span>{cat.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.75} />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-line">
              <div className="text-[12px] font-bold text-muted uppercase mb-2">
                Sell &amp; Earn With Us
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('/sell');
                    setMobileMenuOpen(false);
                  }}
                  className="h-11 px-3 rounded border border-line text-left text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                >
                  Sell on IBO Hub
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('/become-an-ibo');
                    setMobileMenuOpen(false);
                  }}
                  className="h-11 px-3 rounded border border-line text-left text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                >
                  Become an IBO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('/become-a-delivery-agent');
                    setMobileMenuOpen(false);
                  }}
                  className="h-11 px-3 rounded border border-line text-left text-[14px] font-medium text-ink hover:bg-primary-tint cursor-pointer"
                >
                  Become a delivery agent
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN PAGE CONTENT */}
      <main className="flex-1">{children}</main>

      {/* SHARED COMPACT DARK FOOTER (#14181F) */}
      <footer className="bg-dark text-surface border-t border-line mt-8">
        <div className="container-market py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Column 1: Customer care */}
            <div>
              <h3 className="text-[14px] font-bold text-surface mb-3">Customer Care</h3>
              <ul className="space-y-2 text-[12px] text-muted">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/wishlist')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    My Wishlist
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/help')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Help &amp; Common Questions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/track-order')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Track My Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/returns-policy')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Returns &amp; Refunds
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/contact')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/cart')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Shopping Cart
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: About IBO Hub */}
            <div>
              <h3 className="text-[14px] font-bold text-surface mb-3">About IBO Hub</h3>
              <ul className="space-y-2 text-[12px] text-muted">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/about')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/merchants')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    All Trusted Sellers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/verified-sellers')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    How We Check Sellers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/terms')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/privacy')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/shop/amina-crafts')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Visit Sample Online Shop
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Sell and earn */}
            <div>
              <h3 className="text-[14px] font-bold text-surface mb-3">Sell &amp; Earn</h3>
              <ul className="space-y-2 text-[12px] text-muted">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/sell')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Sell Your Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/become-an-ibo')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Open Your Own Online Shop (IBO)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/become-a-delivery-agent')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    Deliver Packages &amp; Earn
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/fee-schedule')}
                    className="hover:text-primary cursor-pointer text-left"
                  >
                    How Partner Earnings Work
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Payment and delivery info */}
            <div>
              <h3 className="text-[14px] font-bold text-surface mb-3">
                Payment &amp; Delivery
              </h3>
              <ul className="space-y-2 text-[12px] text-muted">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/escrow-protection')}
                    className="flex items-center gap-2 hover:text-primary cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
                    <span>Pay Only When You Get Your Order</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/payment-methods')}
                    className="flex items-center gap-2 hover:text-primary cursor-pointer text-left"
                  >
                    <CreditCard className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
                    <span>Card, Bank Transfer &amp; Pay on Delivery</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('/delivery-rates')}
                    className="flex items-center gap-2 hover:text-primary cursor-pointer text-left"
                  >
                    <Truck className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
                    <span>Fast Same-Day &amp; Next-Day Delivery</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Logo, Social links, copyright, country selector */}
          <div className="mt-6 pt-4 border-t border-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-muted">
            <div className="flex flex-wrap items-center gap-4">
              <PlatformLogo onNavigate={onNavigate} variant="dark" size="sm" />
              <span>© 2026 IBO Hub Marketplace Ltd. All rights reserved.</span>
              <div className="flex items-center gap-3">
                <a
                  href="#facebook"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/about');
                  }}
                  className="hover:text-primary"
                >
                  Facebook
                </a>
                <a
                  href="#x"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/about');
                  }}
                  className="hover:text-primary"
                >
                  X (Twitter)
                </a>
                <a
                  href="#instagram"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/about');
                  }}
                  className="hover:text-primary"
                >
                  Instagram
                </a>
                <a
                  href="#whatsapp"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/contact');
                  }}
                  className="hover:text-primary"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted" strokeWidth={1.75} />
              <label htmlFor="country-select" className="sr-only">
                Select Country
              </label>
              <select
                id="country-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-dark text-surface border border-muted/40 rounded px-2 py-1 text-[12px] focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="NG">Nigeria (₦ NGN)</option>
                <option value="GH">Ghana (GH₵ GHS)</option>
                <option value="KE">Kenya (KSh KES)</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
