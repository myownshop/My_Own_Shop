import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ShieldCheck,
  Users,
  Copy,
  Check,
  Edit3,
  Crown,
  X,
  QrCode,
  Megaphone,
  LogOut,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { Product, MerchantTier, Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PlatformLogo } from '../../components/PlatformLogo';
import {
  ProductListingFormPage,
  MerchantProductPageSubmission,
} from '../../components/ProductListingFormPage';

interface MerchantPortalScreenProps {
  onNavigate: (path: string) => void;
}

export const MerchantPortalScreen: React.FC<MerchantPortalScreenProps> = ({ onNavigate }) => {
  const { currentAppUser, signOutUser } = useAuth();
  const [, setStoreTick] = useState(0);
  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const state = platformStore.getState();
  const {
    products,
    merchants,
    config,
    orders,
    withdrawals,
    ledger,
    merchantCampaigns,
  } = state;

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(() => {
    if (
      currentAppUser?.role === 'merchant' &&
      currentAppUser.entityId &&
      merchants.some((m) => m.id === currentAppUser.entityId)
    ) {
      return currentAppUser.entityId;
    }
    const urlId =
      new URLSearchParams(window.location.search).get('id') ||
      new URLSearchParams(window.location.search).get('merchantId');
    if (urlId && merchants.some((m) => m.id === urlId)) return urlId;
    const saved = localStorage.getItem('activeMerchantId');
    if (saved && merchants.some((m) => m.id === saved)) return saved;
    return merchants[0]?.id || 'mrc-1';
  });

  useEffect(() => {
    if (
      currentAppUser?.role === 'merchant' &&
      currentAppUser.entityId &&
      merchants.some((m) => m.id === currentAppUser.entityId) &&
      currentAppUser.entityId !== selectedMerchantId
    ) {
      setSelectedMerchantId(currentAppUser.entityId);
    }
  }, [currentAppUser, merchants, selectedMerchantId]);

  const merchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];
  const handleSelectMerchant = (id: string) => {
    setSelectedMerchantId(id);
    localStorage.setItem('activeMerchantId', id);
  };

  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);
  const merchantOrders = orders.filter((o) =>
    o.items.some((i) => i.merchantId === merchant.id)
  );
  const myCampaigns = merchantCampaigns.filter((c) => c.merchantId === merchant.id);
  const activeTier: MerchantTier = merchant.tier || 'pro';
  const tierConfig = config.merchantTiers[activeTier] || config.merchantTiers.pro;
  const wallet = platformStore.getWalletBalanceForAccount(`merchant_payable:${merchant.id}`);
  const merchantLedgerEntries = ledger.filter(
    (l) =>
      l.creditAccount === `merchant_payable:${merchant.id}` ||
      l.debitAccount === `merchant_payable:${merchant.id}`
  );

  const [activeTab, setActiveTab] = useState<
    'orders' | 'products' | 'campaigns' | 'payouts' | 'subscription' | 'kyc' | 'referrals'
  >('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'title' | 'stock'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Waybill / Depot Pickup QR Modal
  const [waybillOrder, setWaybillOrder] = useState<Order | null>(null);
  const [waybillFeedback, setWaybillFeedback] = useState<string | null>(null);

  // Full Product Page Builder Modal (Add or Edit Product)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  // Create IBO Ad Campaign Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignHeadline, setCampaignHeadline] = useState('');
  const [campaignBudget, setCampaignBudget] = useState<number>(25000);
  const [campaignDaily, setCampaignDaily] = useState<number>(2500);

  // Payout Modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(15000);
  const [payoutBank, setPayoutBank] = useState('GTBank');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('0123456789');
  const [payoutAccountName, setPayoutAccountName] = useState(merchant?.businessName || '');
  const [payoutFeedback, setPayoutFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Tier switch error feedback
  const [tierError, setTierError] = useState<string | null>(null);

  // Referral Copy
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const merchantReferralCode =
    (merchant as any).referralCode || merchant.code || merchant.id;
  const merchantReferralLink = `${window.location.origin}/merchant/signup?ref=${merchantReferralCode}`;

  // KYC Upload
  const [kycDocType, setKycDocType] = useState('CAC Certificate');
  const [kycDocNumber, setKycDocNumber] = useState(
    merchant.cacRegistrationNumber || 'RC-192041'
  );
  const [kycMessage, setKycMessage] = useState<string | null>(null);

  const toggleSort = (field: 'date' | 'amount' | 'title' | 'stock') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSaveMerchantProductPage = (data: MerchantProductPageSubmission) => {
    setProductError(null);
    if (!editingProduct && merchantProducts.length >= tierConfig.maxActiveProducts) {
      setProductError(
        `Tier limit reached (${tierConfig.maxActiveProducts} products). Upgrade tier to add more.`
      );
      return;
    }

    if (editingProduct) {
      platformStore.updateProduct(editingProduct.id, {
        title: data.title,
        brand: data.brand,
        sku: data.sku,
        condition: data.condition,
        category: data.category,
        subCategory: data.subCategory,
        description: data.description,
        keyFeatures: data.keyFeatures,
        whatsInTheBox: data.whatsInTheBox,
        merchantBasePrice: data.merchantBasePrice,
        recommendedRetailPrice: data.recommendedRetailPrice,
        vatIncluded: data.vatIncluded,
        fulfillmentType: data.fulfillmentType,
        stockQty: data.stockQty,
        dispatchLocation: data.dispatchLocation,
        weightKg: data.weightKg,
        dimensions: data.dimensions,
        warranty: data.warranty,
        returnPolicy: data.returnPolicy,
        imageUrl: data.imageUrl,
        galleryImages: data.galleryImages,
        specs: data.specs,
        variants: data.variants,
        isAvailable: data.stockQty > 0,
        isProductPageCompleted: true,
      });
      setEditingProduct(null);
      setIsAddProductOpen(false);
    } else {
      platformStore.addProduct({
        merchantId: merchant.id,
        merchantName: merchant.businessName,
        merchantCode: merchant.code,
        title: data.title,
        brand: data.brand,
        sku: data.sku,
        condition: data.condition,
        description: data.description,
        keyFeatures: data.keyFeatures,
        whatsInTheBox: data.whatsInTheBox,
        category: data.category,
        subCategory: data.subCategory,
        merchantBasePrice: data.merchantBasePrice,
        recommendedRetailPrice: data.recommendedRetailPrice,
        vatIncluded: data.vatIncluded,
        vatRate: 0.075,
        fulfillmentType: data.fulfillmentType,
        stockQty: data.stockQty,
        dispatchLocation: data.dispatchLocation,
        weightKg: data.weightKg,
        dimensions: data.dimensions,
        warranty: data.warranty,
        returnPolicy: data.returnPolicy,
        imageUrl: data.imageUrl,
        galleryImages: data.galleryImages,
        specs: data.specs,
        variants: data.variants,
        isAvailable: data.stockQty > 0,
        isProductPageCompleted: true,
      });
      setIsAddProductOpen(false);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignHeadline.trim()) return;
    platformStore.createMerchantCampaign({
      merchantId: merchant.id,
      merchantName: merchant.businessName,
      headline: campaignHeadline.trim(),
      category: merchantProducts[0]?.category || 'general',
      targetAudience: 'ibos',
      dailyBudget: campaignDaily,
      totalBudget: campaignBudget,
      status: 'active',
    });
    setCampaignHeadline('');
    setIsCampaignModalOpen(false);
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutFeedback(null);
    const res = platformStore.requestWithdrawal(merchant.id, 'merchant', payoutAmount, {
      bankName: payoutBank,
      accountNumber: payoutAccountNumber.trim(),
      accountName: payoutAccountName.trim() || merchant.businessName,
    });
    if (!res.success) {
      setPayoutFeedback({
        type: 'error',
        message: res.error || 'Failed to request payout.',
      });
    } else {
      setPayoutFeedback({
        type: 'success',
        message: `Payout request for ₦${payoutAmount.toLocaleString()} submitted.`,
      });
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutFeedback(null);
      }, 1500);
    }
  };

  const totalOrderRevenue = merchantOrders.reduce(
    (sum, ord) =>
      sum +
      ord.items
        .filter((i) => i.merchantId === merchant.id)
        .reduce((s, i) => s + i.merchantBasePrice * i.quantity, 0),
    0
  );

  const filteredOrders = merchantOrders
    .filter(
      (o) =>
        !searchQuery.trim() ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === 'amount') {
        const amtA = a.items
          .filter((i) => i.merchantId === merchant.id)
          .reduce((s, i) => s + i.merchantBasePrice * i.quantity, 0);
        const amtB = b.items
          .filter((i) => i.merchantId === merchant.id)
          .reduce((s, i) => s + i.merchantBasePrice * i.quantity, 0);
        return (amtA - amtB) * mul;
      }
      return a.orderNumber.localeCompare(b.orderNumber) * mul;
    });

  const filteredProducts = merchantProducts
    .filter(
      (p) =>
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === 'amount') return (a.merchantBasePrice - b.merchantBasePrice) * mul;
      if (sortField === 'stock') return (a.stockQty - b.stockQty) * mul;
      return a.title.localeCompare(b.title) * mul;
    });

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col md:flex-row">
      {/* Dark Left Sidebar (#14181F) */}
      <aside className="w-full md:w-60 bg-dark text-white shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-line">
        <div>
          <div className="p-4 border-b border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <PlatformLogo onNavigate={onNavigate} variant="dark" size="sm" />
              <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold uppercase">
                {tierConfig.name.replace('Merchant ', '')}
              </span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Merchant Portal</div>
              <div className="text-[11px] text-white/60 truncate max-w-[180px]">
                {merchant.businessName}
              </div>
            </div>
          </div>

          <nav className="py-2 flex md:flex-col overflow-x-auto">
            {[
              { id: 'orders', label: `Orders & Waybills (${merchantOrders.length})`, icon: Clock },
              {
                id: 'products',
                label: `Catalog SKUs (${merchantProducts.length}/${tierConfig.maxActiveProducts})`,
                icon: Package,
              },
              {
                id: 'campaigns',
                label: `IBO Ad Campaigns (${myCampaigns.length})`,
                icon: Megaphone,
              },
              { id: 'payouts', label: 'Payouts & Ledger', icon: DollarSign },
              { id: 'subscription', label: 'Subscription Tiers', icon: Crown },
              { id: 'kyc', label: 'Compliance & KYC', icon: ShieldCheck },
              { id: 'referrals', label: 'Supplier Referrals', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-l-[3px] cursor-pointer ${
                    isActive
                      ? 'border-primary bg-primary/10 text-white font-bold'
                      : 'border-transparent text-white/75 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-white/10 space-y-2 text-[12px]">
          <div className="text-white/60">Merchant Code: {merchant.code}</div>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-primary hover:underline font-bold block cursor-pointer"
          >
            ← Return to Marketplace
          </button>
          <button
            type="button"
            onClick={() => {
              signOutUser();
              onNavigate('/login');
            }}
            className="text-white/60 hover:text-white flex items-center gap-1.5 pt-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Search and Profile */}
        <header className="bg-surface border-b border-line px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, SKUs, or buyers..."
              className="w-full pl-9 pr-3 h-9 bg-page border border-line rounded text-[13px] text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div className="flex items-center gap-3">
            {(!currentAppUser || currentAppUser.role === 'founder') && (
              <select
                value={selectedMerchantId}
                onChange={(e) => handleSelectMerchant(e.target.value)}
                aria-label="Select active merchant"
                className="h-9 px-2.5 bg-surface border border-line rounded text-[12px] font-bold text-ink focus:outline-none focus:border-primary-dark"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName} ({m.code})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setProductError(null);
                setIsAddProductOpen(true);
              }}
              className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span>Add Product</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-[1200px] w-full mx-auto">
          {/* Row of 4 Compact Stat Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Available Payout Wallet</span>
                <DollarSign className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                ₦{(wallet?.availableBalance ?? 0).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="text-[12px] font-bold text-primary-dark hover:underline mt-1 inline-block cursor-pointer"
              >
                Withdraw funds →
              </button>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Fulfillment Orders</span>
                <Clock className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{merchantOrders.length}</div>
              <div className="text-[12px] text-muted mt-1">
                ₦{totalOrderRevenue.toLocaleString()} gross wholesale
              </div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Active Catalog SKUs</span>
                <Package className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                {merchantProducts.length} / {tierConfig.maxActiveProducts}
              </div>
              <div className="text-[12px] text-muted mt-1">
                {merchant.warehouseStockDeposited ? 'Hub Depot Active' : 'Merchant-Held'}
              </div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Compliance Status</span>
                <ShieldCheck className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="text-[18px] font-bold text-ink mt-1">Verified</div>
              <div className="text-[12px] text-primary-dark font-bold mt-1">
                {merchant.state || 'Lagos'} Dispatch Hub
              </div>
            </div>
          </div>

          {/* TAB 1: ORDERS & WAYBILL PICKUP QR TABLE */}
          {activeTab === 'orders' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="section-title text-ink">
                    Fulfillment Orders & Courier Pickup Waybills
                  </h2>
                  <p className="text-[12px] text-muted">
                    Present the Waybill Pickup QR token when handing packages to the assigned courier. Escrow releases to your wallet upon final customer QR scan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="text-[13px] font-bold text-primary-dark hover:underline cursor-pointer"
                >
                  Manage Catalog ({merchantProducts.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSort('date')}
                          className="flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Order ID</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4">Buyer & Destination</th>
                      <th className="py-3 px-4">Items Sourced</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSort('amount')}
                          className="flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Wholesale Payout</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4">Depot Handover</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Waybill / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted">
                          No matching orders found for this merchant.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const myItems = ord.items.filter((i) => i.merchantId === merchant.id);
                        const myTotal = myItems.reduce(
                          (s, i) => s + i.merchantBasePrice * i.quantity,
                          0
                        );
                        return (
                          <tr
                            key={ord.id}
                            className="hover:bg-primary-tint/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                              {ord.orderNumber}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-ink">{ord.customerName}</div>
                              <div className="text-[12px] text-muted truncate max-w-[200px]">
                                {ord.deliveryAddress}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-ink">
                              {myItems.map((i) => `${i.quantity}x ${i.productTitle}`).join(', ')}
                            </td>
                            <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                              ₦{myTotal.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  ord.isPickupConfirmed
                                    ? 'bg-primary-tint text-primary-dark'
                                    : 'bg-page text-muted'
                                }`}
                              >
                                {ord.isPickupConfirmed ? 'Picked Up' : 'Awaiting Courier'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                                  ord.orderStatus === 'delivered'
                                    ? 'bg-primary-tint border-primary-dark text-primary-dark'
                                    : 'bg-page border-line text-ink'
                                }`}
                              >
                                {ord.orderStatus.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setWaybillFeedback(null);
                                  setWaybillOrder(ord);
                                }}
                                className="px-2.5 h-8 rounded border border-primary-dark bg-primary-tint text-primary-dark font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" strokeWidth={1.75} />
                                <span>Waybill QR</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS TABLE */}
          {activeTab === 'products' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="section-title text-ink">
                    Wholesale Product Catalog &amp; Product Pages
                  </h2>
                  <p className="text-[12px] text-muted">
                    Every item requires a completed online-shopping Product Page (photos, key features, specifications, what&apos;s in the box, and warranty) before listing. Using {merchantProducts.length} of {tierConfig.maxActiveProducts} active slots on {tierConfig.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductError(null);
                    setIsAddProductOpen(true);
                  }}
                  className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  <span>Create Product Page &amp; List Item</span>
                </button>
              </div>

              {productError && (
                <div className="m-4 p-3 bg-surface border border-sale rounded text-sale text-[12px] font-bold">
                  {productError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSort('title')}
                          className="flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Product &amp; Page Status</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4">Category &amp; Brand</th>
                      <th className="py-3 px-4">Fulfillment</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSort('amount')}
                          className="flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Wholesale Price</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSort('stock')}
                          className="flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Stock</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">Product Page Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-primary-tint/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-11 h-11 rounded object-cover border border-line shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-ink">{p.title}</div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-muted">{p.subCategory}</span>
                                <span className="px-1.5 py-0.5 rounded bg-primary-tint text-primary-dark text-[10px] font-bold">
                                  Product Page Live
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="capitalize font-medium text-ink">{p.category}</div>
                          <div className="text-[11px] text-muted">
                            {p.brand || merchant.businessName.split(' ')[0]}
                            {p.sku ? ` • ${p.sku}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-tint border border-primary-dark text-primary-dark">
                            {p.fulfillmentType === 'warehouse_deposit'
                              ? 'Hub Depot'
                              : 'Merchant Depot'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-ink">
                          ₦{(p.merchantBasePrice ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-ink">{p.stockQty} units</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigate(`/product/${p.id}`)}
                              className="px-2.5 h-8 rounded border border-line bg-surface hover:bg-page text-ink font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>View Page</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setProductError(null);
                                setIsAddProductOpen(true);
                              }}
                              className="px-2.5 h-8 rounded border border-primary-dark bg-primary-tint text-primary-dark font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Edit Product Page</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: IBO AD CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="section-title text-ink">
                    Direct Advertising Campaigns to IBO Storefronts
                  </h2>
                  <p className="text-[12px] text-muted">
                    Promote your wholesale catalog inside the IBO Dashboard so more resellers curate and sell your products.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  <span>Launch IBO Campaign</span>
                </button>
              </div>

              <div className="divide-y divide-line">
                {myCampaigns.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-muted">
                    No active IBO advertising campaigns for {merchant.businessName}.
                  </div>
                ) : (
                  myCampaigns.map((cmp) => (
                    <div
                      key={cmp.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                    >
                      <div>
                        <div className="font-bold text-ink">
                          {cmp.headline || cmp.campaignTitle}
                        </div>
                        <div className="text-[12px] text-muted">
                          Budget: ₦{(cmp.totalBudget || 0).toLocaleString()} (₦
                          {(cmp.dailyBudget || 0).toLocaleString()}/day) • {cmp.impressions || 0}{' '}
                          impressions • {cmp.iboPickups || 0} IBO storefronts curating
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-primary-tint border border-primary-dark text-primary-dark text-[11px] font-bold uppercase self-start sm:self-center">
                        {cmp.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PAYOUTS & LEDGER */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div className="bg-surface border border-line rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="section-title text-ink">Wholesale Payouts & Ledger</h2>
                  <p className="text-[12px] text-muted">
                    Available balance:{' '}
                    <strong>₦{(wallet?.availableBalance ?? 0).toLocaleString()}</strong> • Total
                    earned: <strong>₦{(wallet?.totalEarnings ?? 0).toLocaleString()}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Request Bank Withdrawal
                </button>
              </div>

              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line">
                  <h3 className="font-bold text-[15px] text-ink">Settlement Ledger Entries</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {merchantLedgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted">
                            No ledger transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        merchantLedgerEntries.map((entry) => {
                          const isCredit =
                            entry.creditAccount === `merchant_payable:${merchant.id}`;
                          return (
                            <tr key={entry.id} className="hover:bg-primary-tint/40">
                              <td className="py-3 px-4 font-bold text-ink">
                                {entry.orderId || entry.id}
                              </td>
                              <td className="py-3 px-4 text-muted">{entry.memo}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                                    isCredit
                                      ? 'bg-primary-tint border-primary-dark text-primary-dark'
                                      : 'bg-page border-line text-ink'
                                  }`}
                                >
                                  {isCredit ? 'Credit' : 'Debit'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-ink">
                                {isCredit ? '+' : '-'}₦{entry.amount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUBSCRIPTION TIERS */}
          {activeTab === 'subscription' && (
            <div className="bg-surface border border-line rounded p-6 space-y-4">
              <div>
                <h2 className="section-title text-ink">Merchant Subscription Tiers</h2>
                <p className="text-[13px] text-muted">
                  Upgrade your monthly plan to list more wholesale SKUs and unlock regional hub shelf capacity.
                </p>
              </div>
              {tierError && (
                <div className="p-3 bg-surface border border-sale rounded text-[12px] text-sale font-bold">
                  {tierError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(config.merchantTiers) as MerchantTier[]).map((tKey) => {
                  const tier = config.merchantTiers[tKey];
                  const isCurrent = tKey === activeTier;
                  return (
                    <div
                      key={tKey}
                      className={`border rounded p-4 flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-primary-tint border-primary-dark'
                          : 'bg-surface border-line'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[14px] text-ink uppercase">
                            {tier.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="price-text text-ink">
                          ₦{tier.priceMonthlyNgn.toLocaleString()}{' '}
                          <span className="text-[12px] font-normal text-muted">/mo</span>
                        </div>
                        <div className="text-[12px] font-bold text-primary-dark">
                          Up to {tier.maxActiveProducts} Active SKUs
                        </div>
                        <ul className="space-y-1 text-[12px] text-muted pt-2 border-t border-line">
                          {tier.features.map((f, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check
                                className="w-3.5 h-3.5 text-primary-dark shrink-0 mt-0.5"
                                strokeWidth={1.75}
                              />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          setTierError(null);
                          const res = platformStore.updateMerchantTier(merchant.id, tKey);
                          if (!res.success && res.error) setTierError(res.error);
                        }}
                        className={`mt-4 w-full h-10 rounded text-[13px] font-bold cursor-pointer ${
                          isCurrent
                            ? 'bg-surface border border-primary-dark text-primary-dark cursor-default'
                            : 'bg-primary hover:bg-primary-dark text-on-primary'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : `Switch to ${tier.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: COMPLIANCE & KYC */}
          {activeTab === 'kyc' && (
            <div className="bg-surface border border-line rounded p-6 space-y-4 max-w-2xl">
              <h2 className="section-title text-ink">
                Corporate Compliance & CAC Verification
              </h2>
              <p className="text-[13px] text-muted">
                Submit your Corporate Affairs Commission (CAC) registration or TIN certificate for verified supplier badge status.
              </p>
              {kycMessage && (
                <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[13px] font-bold text-primary-dark">
                  {kycMessage}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  platformStore.submitKyc({
                    userId: merchant.userId,
                    userName: merchant.businessName,
                    entityName: merchant.businessName,
                    role: 'merchant',
                    documentType: kycDocType,
                    documentNumber: kycDocNumber,
                    documentUrl: '',
                    documents: [],
                  });
                  setKycMessage(
                    'Corporate KYC dossier updated and submitted for compliance review.'
                  );
                }}
                className="space-y-4 text-[13px]"
              >
                <div>
                  <label className="block font-bold text-ink mb-1">Document Type</label>
                  <select
                    value={kycDocType}
                    onChange={(e) => setKycDocType(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  >
                    <option value="CAC Certificate">CAC Certificate of Incorporation</option>
                    <option value="TIN Certificate">
                      FIRS Tax Identification Number (TIN)
                    </option>
                    <option value="NAFDAC Permit">NAFDAC Product Registration</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">
                    Registration / RC Number
                  </label>
                  <input
                    type="text"
                    value={kycDocNumber}
                    onChange={(e) => setKycDocNumber(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Submit Compliance Record
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: SUPPLIER REFERRALS */}
          {activeTab === 'referrals' && (
            <div className="bg-surface border border-line rounded p-6 space-y-4 max-w-2xl">
              <h2 className="section-title text-ink">Supplier Referral Alliance</h2>
              <p className="text-[13px] text-muted">
                Invite verified manufacturers and wholesale distributors to list on IBO Hub using your merchant referral link.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={merchantReferralLink}
                  className="w-full h-10 px-3 bg-page border border-line rounded text-[13px] text-ink"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(merchantReferralLink);
                    setCopiedReferralLink(true);
                    setTimeout(() => setCopiedReferralLink(false), 2000);
                  }}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedReferralLink ? (
                    <Check className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Copy className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  <span>{copiedReferralLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Waybill / Depot Pickup QR Modal */}
      {waybillOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="section-title text-ink">Warehouse Dispatch Waybill</h3>
                <p className="text-[12px] text-muted">Order {waybillOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setWaybillOrder(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {waybillFeedback && (
              <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{waybillFeedback}</span>
              </div>
            )}

            <div className="p-4 bg-page border border-line rounded space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Assigned Courier:</span>
                <span className="font-bold text-ink">
                  {waybillOrder.agentName || 'Awaiting Courier Assignment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Destination:</span>
                <span className="font-bold text-ink text-right max-w-[220px] truncate">
                  {waybillOrder.deliveryAddress}
                </span>
              </div>
              <div className="pt-2 border-t border-line">
                <div className="text-[11px] font-bold text-muted uppercase">
                  Depot Pickup QR Token:
                </div>
                <div className="font-mono font-bold text-[14px] text-primary-dark mt-0.5">
                  {waybillOrder.pickupQrToken}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!waybillOrder.isPickupConfirmed && (
                <button
                  type="button"
                  onClick={() => {
                    const res = platformStore.confirmOrderPickup(
                      waybillOrder.id,
                      waybillOrder.pickupQrToken
                    );
                    if (res.success) {
                      setWaybillFeedback(
                        'Courier pickup verified! Order marked In Transit.'
                      );
                    }
                  }}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Verify Courier Handover
                </button>
              )}
              <button
                type="button"
                onClick={() => setWaybillOrder(null)}
                className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch IBO Ad Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="section-title text-ink">Promote Catalog to IBOs</h3>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-ink mb-1">Campaign Headline *</label>
                <input
                  type="text"
                  required
                  value={campaignHeadline}
                  onChange={(e) => setCampaignHeadline(e.target.value)}
                  placeholder="e.g. Fast-Moving Solar Inverters — 35% IBO Markup Potential!"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1">Daily Budget (₦)</label>
                  <input
                    type="number"
                    required
                    value={campaignDaily}
                    onChange={(e) => setCampaignDaily(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Total Budget (₦)</label>
                  <input
                    type="number"
                    required
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Product Page Builder & Listing Form Modal (Merchant) */}
      {(isAddProductOpen || editingProduct) && (
        <ProductListingFormPage
          mode="merchant"
          merchantName={merchant.businessName}
          merchantState={merchant.state || 'Lagos'}
          initialProduct={editingProduct}
          onClose={() => {
            setIsAddProductOpen(false);
            setEditingProduct(null);
          }}
          onSubmitMerchantProduct={handleSaveMerchantProductPage}
        />
      )}

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="section-title text-ink">Withdraw to Nigerian Bank</h3>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            {payoutFeedback && (
              <div
                className={`p-3 rounded border text-[12px] font-bold ${
                  payoutFeedback.type === 'success'
                    ? 'bg-primary-tint border-primary-dark text-primary-dark'
                    : 'bg-surface border-sale text-sale'
                }`}
              >
                {payoutFeedback.message}
              </div>
            )}
            <form onSubmit={handleRequestPayout} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-ink mb-1">Amount (₦)</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Bank Name</label>
                <select
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                >
                  <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="First Bank">First Bank of Nigeria</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Submit Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
