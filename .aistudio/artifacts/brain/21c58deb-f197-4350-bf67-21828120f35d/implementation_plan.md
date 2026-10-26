# IBO Hub — Role Isolation, White-Label Storefront & Engine Restoration Plan

## 1. Architecture & Layout Isolation (`src/App.tsx`)
Currently, `<MarketplaceLayout>` wraps every route in the application, causing the Founder marketplace chrome ("IBO HUB" header, category bar, partner signup links, and dark footer) to bleed into `/shop/:slug` and all partner dashboards.

- **Public Founder Marketplace Routes (Keep in `<MarketplaceLayout>`)**:
  - `/`, `/category/:id`, `/search`, `/product/:id`, `/cart`, `/checkout`, `/merchants`, `/store/:id`
  - `/login`, `/signup`, `/ibo/signup`, `/merchant/signup`, `/agent/signup`, and static info pages (`/about`, `/help`, `/track`, etc.)
  - Leave `src/data/marketplaceData.ts` and the Founder marketplace browse/cart/checkout screens untouched as the public Founder marketplace for visitors arriving without an IBO shop link.
- **Isolated Role & White-Label Routes (Render OUTSIDE `<MarketplaceLayout>`)**:
  - `/shop/:slug` → `CustomerShopScreen` (100% white-label IBO storefront with its own header, cart/checkout drawer, order tracker, and footer)
  - `/ibo/dashboard` → `IboDashboardScreen` (guarded by `ProtectedRoute` for `ibo` / `founder`)
  - `/merchant/dashboard` → `MerchantPortalScreen` (guarded by `ProtectedRoute` for `merchant` / `founder`)
  - `/agent/dashboard` → `DeliveryAgentAppScreen` (guarded by `ProtectedRoute` for `agent` / `founder`)
  - `/admin` → `FounderAdminScreen` (guarded by `ProtectedRoute` for `founder`)

---

## 2. White-Label IBO Storefront (`src/surfaces/customer/CustomerShopScreen.tsx`)
When a customer visits an IBO's referral link (`/shop/:slug`), they must experience **that IBO's private store**, not the platform's general marketplace:

- **Dynamic IBO Branding**:
  - Read `ibo.shopBranding` (`accentColor`, `logoUrl`, `bannerImageUrl`, `supportEmail`, `supportPhone`) and inject scoped CSS variables (`--shop-accent`, `--shop-accent-hover`, `--shop-accent-light`) on the storefront root container, falling back to `#14181F` if unconfigured.
  - Render the IBO's custom Store Header (logo/avatar, `ibo.storeName`, `ibo.tagline`, Verified Store badge, in-store search bar, WhatsApp/Phone contact button, and Cart/Orders drawer triggers).
  - Never display the "IBO HUB" logo, platform category bar, "Become an IBO / Sell on IBO Hub" links, or other IBOs' products.
- **Curated Inventory & IBO Retail Pricing**:
  - Display only active products curated by this IBO (`iboListings` filtered by `iboId === ibo.id && isListed`), showing the IBO's custom `retailPrice` (base price + IBO markup).
- **In-Store Cart, Escrow Checkout & Order QR Confirmation**:
  - Maintain a store-scoped cart (`ibo_hub_shop_cart_${ibo.id}`) and slide-over checkout drawer that calls `platformStore.createOrder` attributed directly to `ibo.id` and `ibo.slug`.
  - Include an in-store "My Orders & QR Delivery Scan" view where customers can track orders placed in this shop and open `CustomerQrScannerModal` to scan the delivery agent's handover QR code and release escrow.
  - Render a clean white-label footer (`© {ibo.storeName} · Escrow-Protected Delivery`) with a subtle `Powered by IBO Hub` watermark.

---

## 3. Auth, Role Separation & Session Scoping
Eliminate all role/user state bleeding across Customer, IBO, Merchant, Delivery Agent, and Founder sessions:

- **`src/surfaces/auth/LoginScreen.tsx`**:
  - **Signup (`/signup`)**: Remove the 4-role selector from customer registration. `/signup` registers `customer` accounts only, and displays clear partner onboarding links routing merchants to `/merchant/signup`, IBOs to `/ibo/signup`, and couriers to `/agent/signup` (which enforce role-specific fields and `RegistrationSecuritySteps`).
  - **Login (`/login`)**: Authenticate via `authService.verifyCredentials(email, password)` and route strictly by the authenticated user's stored `role`:
    - `merchant` → `/merchant/dashboard`
    - `ibo` → `/ibo/dashboard`
    - `agent` → `/agent/dashboard`
    - `founder` → `/admin`
    - `customer` → `/shop/${attributedSlug}` (if attributed to an IBO store) or `/`
  - Keep quick demo account fill buttons clearly labeled in a collapsible "Demo Accounts" helper box on `/login` for instant testing.
- **`src/context/AuthContext.tsx` & `src/services/authService.ts`**:
  - Clear `activeIboId`, `activeMerchantId`, and `activeAgentId` from `localStorage` on `logout()` and synchronize them with `currentAppUser.entityId` on login so switching users never leaks another user's dashboard data.
- **`src/components/SurfaceHarnessBar.tsx`**:
  - Restore the top Demo Surface Switcher bar so you can jump between Founder Marketplace (`/`), White-Label IBO Storefront (`/shop/:slug`), IBO Dashboard, Merchant Portal, Delivery Agent App, and Founder Admin during testing, automatically syncing the active demo role/entity.

---

## 4. Dashboard Micro-Feature Restoration (Restyled in Spring-Green System)
Ensure every engine capability in `platformStore` is wired and accessible inside its respective role dashboard:

- **IBO Dashboard (`src/surfaces/ibo/IboDashboardScreen.tsx`)**:
  - Strict entity resolution from `currentAppUser.entityId` (`activeIboId`).
  - **Catalog & Markup Tab**: Select/deselect merchants up to tier cap (`5` Free / `15` Pro), curate products into the store, and adjust markup (`0%–50%`) with live commission breakdown.
  - **Storefront Branding Tab**: Edit `storeName`, `tagline`, `accentColor` color picker, `supportPhone`, `supportEmail`, and `bannerImageUrl` (`platformStore.updateIboStorefront`), plus Store Boost (`platformStore.boostIboStore`) and Tier Upgrade (`platformStore.upgradeIboTier`).
  - **Customers & Orders Tab**: View attributed customers (`customerAttributions`) and orders placed through this IBO's storefront.
  - **Referrals & Earnings Tab**: T1/T2/T3 downline tree, referral link copier, Pipe B ledger settlements, and bank withdrawal form (`platformStore.requestWithdrawal`).
- **Merchant Portal (`src/surfaces/merchant/MerchantPortalScreen.tsx`)**:
  - Strict entity resolution from `currentAppUser.entityId` (`activeMerchantId`).
  - **Inventory & Tier Tab**: Add SKU (`addMerchantProduct`), inline stock editor (`updateProductStock`), SKU capacity meter (`5` Free / `50` Pro) with `upgradeMerchantTier`.
  - **Fulfillment & Pickup QR Tab**: View merchant orders, display/verify Pickup QR code (`pickupQrToken`) for courier handover, or trigger self-delivery handover QR.
  - **Campaigns, Referrals & Payouts Tabs**: Create ad campaigns (`createMerchantCampaign`), view referred merchants, inspect ledger settlements, and request withdrawals.
- **Delivery Agent App (`src/surfaces/agent/DeliveryAgentAppScreen.tsx`)**:
  - Fix `activeDeliveries` filter so an agent **only** sees orders where `o.agentId === agent.id`.
  - **Available Pool & Active Dispatch**: Claim unassigned orders (`assignAgentToOrder`), scan Merchant Pickup QR (`DeliveryAgentQrScanner`), display Customer Handover QR (`AgentQrGenerator`), and file Stage 1 Failed Delivery Disputes (`recordFailedDelivery`).
  - **Fleet Referrals & Courier Wallet**: View T1/T2/T3 courier downline, referral code copier, Pipe A trip payouts, and withdrawal requests.
- **Founder Admin (`src/surfaces/admin/FounderAdminScreen.tsx`)**:
  - Restore Stage 2 Failed Delivery Dispute adjudication buttons (`adjudicateDispute`: Reattempt, Return to Merchant, Hub Forfeiture) and pending Withdrawal approval (`approveWithdrawal`) alongside Ledger & Escrow Overview, Manual Dispatch, KYC Queue, and Fee Configuration.
