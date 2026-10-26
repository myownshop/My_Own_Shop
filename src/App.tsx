import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { MarketplaceLayout } from './components/MarketplaceLayout';
import { SurfaceHarnessBar } from './components/SurfaceHarnessBar';
import { FounderHomeScreen } from './surfaces/founder/FounderHomeScreen';
import { CategorySearchScreen } from './surfaces/customer/CategorySearchScreen';
import { ProductDetailScreen } from './surfaces/customer/ProductDetailScreen';
import { CartScreen } from './surfaces/customer/CartScreen';
import { CheckoutScreen } from './surfaces/customer/CheckoutScreen';
import { WishlistScreen } from './surfaces/customer/WishlistScreen';
import { MyOrdersScreen } from './surfaces/customer/MyOrdersScreen';
import { CustomerShopScreen } from './surfaces/customer/CustomerShopScreen';
import { IboDashboardScreen } from './surfaces/ibo/IboDashboardScreen';
import { MerchantPortalScreen } from './surfaces/merchant/MerchantPortalScreen';
import { DeliveryAgentAppScreen } from './surfaces/agent/DeliveryAgentAppScreen';
import { FounderAdminScreen } from './surfaces/admin/FounderAdminScreen';
import { IboJoinScreen } from './surfaces/ibo/IboJoinScreen';
import { DeliveryAgentSignupScreen } from './surfaces/agent/DeliveryAgentSignupScreen';
import { MerchantSignupScreen } from './surfaces/merchant/MerchantSignupScreen';
import { LoginScreen } from './surfaces/auth/LoginScreen';
import { InfoPagesScreen, InfoPageType } from './surfaces/static/InfoPagesScreen';
import { platformStore, SEED_USER_ACCOUNTS } from './services/store';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initSupabaseBackendSync } from './services/supabaseSync';
import { UserRole } from './types';

function getPageMetadata(path: string): { title: string; description: string } {
  const clean = path.split('?')[0] || '/';
  if (clean === '/') {
    return {
      title: 'IBO Hub – Nigeria Online Marketplace for Phones, Groceries & Solar',
      description:
        'Shop phones, solar gear, 50kg bulk groceries, and fashion from trusted Nigerian sellers on IBO Hub. Free delivery over ₦20,000 and safe payment on delivery.',
    };
  }
  if (clean.startsWith('/shop/')) {
    const slug = clean.replace('/shop/', '') || 'amina-crafts';
    const ibos = platformStore.getState().iboProfiles;
    const matched = Object.values(ibos).find((i) => i.slug === slug);
    const storeName = matched?.shopBranding?.storeName || 'Verified Retail Storefront';
    return {
      title: `${storeName} — Official Online Store`,
      description:
        matched?.shopBranding?.tagline ||
        'Safe online shopping with doorstep delivery and payment protection.',
    };
  }
  if (clean.startsWith('/category/')) {
    const parts = clean.replace('/category/', '').split('/');
    const slug = parts[0] || 'phones';
    const sub = parts[1] ? ` (${parts[1].replace(/-/g, ' ')})` : '';
    return {
      title: `${slug.charAt(0).toUpperCase() + slug.slice(1)}${sub} — Shop on IBO Hub`,
      description: `Browse verified ${slug} deals in Naira with safe payment protection and fast delivery across Nigeria.`,
    };
  }
  if (clean.startsWith('/store/') || clean === '/merchants') {
    return {
      title: 'Trusted Sellers — IBO Hub Marketplace',
      description: 'Shop directly from verified Nigerian sellers with fast nationwide delivery.',
    };
  }
  if (clean.startsWith('/search')) {
    return {
      title: 'Search Products — IBO Hub Marketplace',
      description: 'Find products by price, brand, customer rating, seller, and Nigerian state.',
    };
  }
  if (clean.startsWith('/product/')) {
    return {
      title: 'Product Details — IBO Hub Marketplace',
      description: 'View product details, verified buyer reviews, seller rating, and delivery options.',
    };
  }
  if (clean === '/cart') {
    return {
      title: 'Shopping Cart — IBO Hub',
      description: 'Review your items and proceed to safe checkout with doorstep delivery.',
    };
  }
  if (clean === '/wishlist' || clean === '/my-wishlist') {
    return {
      title: 'My Wishlist — IBO Hub',
      description: 'View and manage the products saved to your private customer wishlist.',
    };
  }
  if (clean === '/my-orders' || clean === '/orders' || clean === '/track-order') {
    return {
      title: 'My Orders & Track My Order — IBO Hub',
      description: 'View your orders, track live delivery status, and confirm doorstep delivery.',
    };
  }
  if (clean === '/checkout') {
    return {
      title: 'Safe Checkout — IBO Hub',
      description: 'Complete your delivery address, shipping method, and protected payment.',
    };
  }
  if (clean === '/login' || clean === '/signin') {
    return {
      title: 'Sign In — IBO Hub',
      description: 'Sign in to your Customer, Seller, Shop Owner, or Delivery Agent account.',
    };
  }
  if (clean === '/signup') {
    return {
      title: 'Create Customer Account — IBO Hub',
      description: 'Create a free customer account on IBO Hub to shop, save items, and track orders.',
    };
  }
  if (clean === '/sell' || clean.startsWith('/merchant/join') || clean.startsWith('/merchant/signup')) {
    return {
      title: 'Sell on IBO Hub — Start Selling Online',
      description: 'List your products on IBO Hub for free and get fast Nigerian bank payouts after delivery.',
    };
  }
  if (clean === '/become-an-ibo' || clean.startsWith('/join') || clean.startsWith('/ibo/')) {
    return {
      title: 'Become an IBO — Open Your Own Online Shop on IBO Hub',
      description: 'Open your own online shop with products from trusted suppliers without buying stock upfront.',
    };
  }
  if (clean === '/become-a-delivery-agent' || clean.startsWith('/agent/join') || clean.startsWith('/agent/signup')) {
    return {
      title: 'Become a Delivery Agent — Deliver Packages & Earn on IBO Hub',
      description: 'Earn 85%–90% of delivery fees with instant payouts after each confirmed delivery.',
    };
  }
  if (clean.startsWith('/merchant')) {
    return {
      title: 'Seller Dashboard — IBO Hub',
      description: 'Manage your products, customer orders, and bank payouts.',
    };
  }
  if (clean.startsWith('/ibo/dashboard') || clean.startsWith('/dashboard')) {
    return {
      title: 'IBO Dashboard — IBO Hub',
      description: 'Manage your online shop, product prices, earnings, and customers.',
    };
  }
  if (clean.startsWith('/agent')) {
    return {
      title: 'Delivery Agent Dashboard — IBO Hub',
      description: 'View available pickup jobs, live delivery map routes, and earnings.',
    };
  }
  return {
    title: 'IBO Hub – Nigeria Online Marketplace for Phones, Groceries & Solar',
    description:
      'Shop phones, solar gear, 50kg bulk groceries, and fashion from trusted Nigerian sellers on IBO Hub. Free delivery over ₦20,000 and safe payment on delivery.',
  };
}

interface RoleGuardProps {
  requiredRole: UserRole;
  roleLabel: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole,
  roleLabel,
  onNavigate,
  children,
}) => {
  const { currentAppUser, userProfile, setSessionUser } = useAuth();
  const activeRole = currentAppUser?.role || userProfile?.role;

  // Allow access if user has the required role or is Founder Admin
  if (activeRole === requiredRole || activeRole === 'founder') {
    return <>{children}</>;
  }

  const handleQuickDemoSwitch = () => {
    const accounts = platformStore.getUserAccounts();
    const demoUser =
      accounts.find((u) => u.role === requiredRole) ||
      SEED_USER_ACCOUNTS.find((u) => u.role === requiredRole);
    if (demoUser) {
      setSessionUser(demoUser);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-line rounded p-6 space-y-4 text-ink">
        <div className="flex items-center gap-2.5 text-ink">
          <Lock className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
          <h1 className="section-title">Role Access Restricted ({roleLabel})</h1>
        </div>
        <p className="text-[13px] text-muted">
          {activeRole
            ? `You are currently signed in as a ${activeRole.toUpperCase()} (${
                currentAppUser?.name || userProfile?.displayName
              }). Role isolation prevents ${activeRole} sessions from accessing the ${roleLabel}.`
            : `Please sign in with your ${roleLabel} credentials to access this workspace.`}
        </p>
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleQuickDemoSwitch}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Switch to Demo {roleLabel} Session</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="h-10 border border-line rounded text-[13px] font-bold text-ink hover:bg-page cursor-pointer"
            >
              Sign In Page
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-10 border border-line rounded text-[13px] font-bold text-muted hover:text-ink cursor-pointer"
            >
              Marketplace Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function MainApp() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const full = (window.location.pathname || '/') + (window.location.search || '');
    return full || '/';
  });

  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    initSupabaseBackendSync();

    const unsubscribe = platformStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });

    const handlePopState = () => {
      setCurrentPath((window.location.pathname || '/') + (window.location.search || ''));
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const meta = getPageMetadata(currentPath);
    document.title = meta.title;
    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };
    setMetaContent('meta[name="description"]', meta.description);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);
  }, [currentPath]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const cleanPath = (currentPath.split('?')[0] || '/').replace(/\/+$/, '') || '/';
  const queryString = currentPath.includes('?')
    ? currentPath.split('?')[1]
    : window.location.search.replace(/^\?/, '');
  const urlParams = new URLSearchParams(queryString);

  // =========================================================================
  // SURFACE 1: WHITE-LABEL IBO STOREFRONT (/shop/:slug)
  // Completely isolated from platform MarketplaceLayout chrome
  // =========================================================================
  if (cleanPath.startsWith('/shop/')) {
    const slug = cleanPath.replace('/shop/', '') || 'amina-crafts';
    return (
      <>
        <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
        <CustomerShopScreen iboSlug={slug} onNavigate={handleNavigate} />
      </>
    );
  }

  // =========================================================================
  // SURFACE 2: ROLE DASHBOARDS (Isolated per-role layouts with RoleGuard)
  // =========================================================================
  if (cleanPath === '/merchant/dashboard' || cleanPath === '/merchant') {
    return (
      <>
        <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
        <RoleGuard
          requiredRole="merchant"
          roleLabel="Merchant Portal"
          onNavigate={handleNavigate}
        >
          <MerchantPortalScreen onNavigate={handleNavigate} />
        </RoleGuard>
      </>
    );
  }

  if (cleanPath === '/ibo/dashboard' || cleanPath === '/dashboard') {
    return (
      <>
        <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
        <RoleGuard
          requiredRole="ibo"
          roleLabel="IBO Dashboard"
          onNavigate={handleNavigate}
        >
          <IboDashboardScreen onNavigate={handleNavigate} />
        </RoleGuard>
      </>
    );
  }

  if (cleanPath === '/agent/dashboard' || cleanPath === '/agent') {
    return (
      <>
        <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
        <RoleGuard
          requiredRole="agent"
          roleLabel="Delivery Agent App"
          onNavigate={handleNavigate}
        >
          <DeliveryAgentAppScreen onNavigate={handleNavigate} />
        </RoleGuard>
      </>
    );
  }

  if (cleanPath === '/admin' || cleanPath.startsWith('/admin')) {
    return (
      <>
        <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
        <RoleGuard
          requiredRole="founder"
          roleLabel="Founder Admin Console"
          onNavigate={handleNavigate}
        >
          <FounderAdminScreen onNavigate={handleNavigate} />
        </RoleGuard>
      </>
    );
  }

  // =========================================================================
  // SURFACE 3: FOUNDER PUBLIC MARKETPLACE & PARTNER ONBOARDING
  // Wrapped in MarketplaceLayout
  // =========================================================================
  const renderMarketplaceSurface = () => {
    // 1. Category, Sub-Category, Merchant Storefront & Search routes
    if (cleanPath.startsWith('/category/')) {
      const rest = cleanPath.replace('/category/', '');
      const segments = rest.split('/').filter(Boolean);
      const slug = segments[0] || 'phones';
      const subSlug = segments[1] || urlParams.get('sub') || 'all';
      return (
        <CategorySearchScreen
          mode="category"
          categorySlug={slug}
          subCategorySlug={subSlug}
          initialQuery={urlParams.get('q') || ''}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      );
    }

    if (cleanPath === '/merchants') {
      return (
        <CategorySearchScreen
          mode="merchants-directory"
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      );
    }

    if (cleanPath.startsWith('/store/')) {
      const mId = cleanPath.replace('/store/', '') || 'mrc-1';
      return (
        <CategorySearchScreen
          mode="merchant"
          merchantId={mId}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      );
    }

    if (cleanPath === '/search') {
      return (
        <CategorySearchScreen
          mode="search"
          categorySlug={urlParams.get('category') || urlParams.get('cat') || 'all'}
          subCategorySlug={urlParams.get('sub') || 'all'}
          initialQuery={urlParams.get('q') || ''}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      );
    }

    // 2. Product detail route
    if (cleanPath.startsWith('/product/')) {
      const productId = cleanPath.replace('/product/', '') || 'prod-1';
      return <ProductDetailScreen productId={productId} onNavigate={handleNavigate} />;
    }

    // 3. Cart, Wishlist & Checkout routes
    if (cleanPath === '/cart') {
      return <CartScreen onNavigate={handleNavigate} />;
    }

    if (cleanPath === '/wishlist' || cleanPath === '/my-wishlist') {
      return <WishlistScreen onNavigate={handleNavigate} />;
    }

    if (
      cleanPath === '/my-orders' ||
      cleanPath === '/orders' ||
      cleanPath === '/track-order'
    ) {
      return <MyOrdersScreen onNavigate={handleNavigate} />;
    }

    if (cleanPath === '/checkout') {
      return <CheckoutScreen onNavigate={handleNavigate} />;
    }

    // 4. Auth routes (/login, /signup)
    if (cleanPath === '/login' || cleanPath === '/signin') {
      return <LoginScreen mode="login" initialMode="login" onNavigate={handleNavigate} />;
    }

    if (cleanPath === '/signup') {
      return <LoginScreen mode="signup" initialMode="signup" onNavigate={handleNavigate} />;
    }

    // 5. Partner Onboarding Pages (/sell, /become-an-ibo, /become-a-delivery-agent + aliases)
    if (
      cleanPath === '/sell' ||
      cleanPath.startsWith('/merchant/join') ||
      cleanPath.startsWith('/merchant/signup')
    ) {
      const refCode = urlParams.get('ref') || '';
      return <MerchantSignupScreen initialReferralCode={refCode} onNavigate={handleNavigate} />;
    }

    if (
      cleanPath === '/become-an-ibo' ||
      cleanPath === '/join' ||
      cleanPath.startsWith('/join/') ||
      cleanPath === '/ibo/signup' ||
      cleanPath === '/ibo/join'
    ) {
      const refCode = urlParams.get('ref') || '';
      return <IboJoinScreen initialReferralCode={refCode} onNavigate={handleNavigate} />;
    }

    if (
      cleanPath === '/become-a-delivery-agent' ||
      cleanPath.startsWith('/agent/join') ||
      cleanPath.startsWith('/agent/signup')
    ) {
      const refCode = urlParams.get('ref') || '';
      return <DeliveryAgentSignupScreen initialReferralCode={refCode} onNavigate={handleNavigate} />;
    }

    // 6. Standard Info, Customer Care, Payment & Legal Sub-Pages
    const infoPagesMap: Record<string, InfoPageType> = {
      '/help': 'help',
      '/track-order': 'track-order',
      '/escrow-protection': 'escrow-protection',
      '/delivery-rates': 'delivery-rates',
      '/payment-methods': 'payment-methods',
      '/verified-sellers': 'verified-sellers',
      '/fee-schedule': 'fee-schedule',
      '/returns-policy': 'returns-policy',
      '/about': 'about',
      '/terms': 'terms',
      '/privacy': 'privacy',
      '/contact': 'contact',
    };

    if (infoPagesMap[cleanPath]) {
      return <InfoPagesScreen page={infoPagesMap[cleanPath]} onNavigate={handleNavigate} />;
    }

    // Default: Founder Marketplace Homepage
    return <FounderHomeScreen onNavigate={handleNavigate} />;
  };

  return (
    <>
      <SurfaceHarnessBar currentPath={currentPath} onNavigate={handleNavigate} />
      <MarketplaceLayout currentPath={currentPath} onNavigate={handleNavigate}>
        {renderMarketplaceSurface()}
      </MarketplaceLayout>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
