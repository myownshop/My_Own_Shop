import React, { useState, useEffect } from 'react';
import {
  Store,
  Share2,
  Copy,
  Check,
  DollarSign,
  Users,
  ExternalLink,
  Search,
  ArrowUpDown,
  Building,
  Edit3,
  X,
  Palette,
  Crown,
  Zap,
  Award,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { IboProfile, IboListing, ReferralNode, IboCapacityTier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PlatformLogo } from '../../components/PlatformLogo';

interface IboDashboardScreenProps {
  onNavigate: (path: string) => void;
}

const BRAND_COLOR_PRESETS = [
  { label: 'Emerald Teal', hex: '#0F766E' },
  { label: 'Royal Indigo', hex: '#1E40AF' },
  { label: 'Crimson Berry', hex: '#9F1239' },
  { label: 'Terracotta Bronze', hex: '#9A3412' },
  { label: 'Forest Green', hex: '#166534' },
  { label: 'Obsidian Slate', hex: '#1E293B' },
];

export const IboDashboardScreen: React.FC<IboDashboardScreenProps> = ({ onNavigate }) => {
  const { currentAppUser, signOutUser } = useAuth();
  const [, setStoreTick] = useState(0);
  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const state = platformStore.getState();
  const {
    iboProfiles,
    iboListings,
    merchants,
    config,
    iboReferralTrees,
    orders,
    withdrawals,
    customerAttributions,
    merchantCampaigns,
  } = state;

  const [selectedIboId, setSelectedIboId] = useState<string>(() => {
    if (currentAppUser?.role === 'ibo' && currentAppUser.entityId && iboProfiles[currentAppUser.entityId]) {
      return currentAppUser.entityId;
    }
    const urlParam =
      new URLSearchParams(window.location.search).get('id') ||
      new URLSearchParams(window.location.search).get('iboId');
    if (urlParam && iboProfiles[urlParam]) return urlParam;
    const saved = localStorage.getItem('activeIboId');
    if (saved && iboProfiles[saved]) return saved;
    return Object.keys(iboProfiles)[0] || 'ibo-1';
  });

  useEffect(() => {
    if (
      currentAppUser?.role === 'ibo' &&
      currentAppUser.entityId &&
      iboProfiles[currentAppUser.entityId] &&
      currentAppUser.entityId !== selectedIboId
    ) {
      setSelectedIboId(currentAppUser.entityId);
    }
  }, [currentAppUser, iboProfiles, selectedIboId]);

  const ibo: IboProfile =
    iboProfiles[selectedIboId] || Object.values(iboProfiles)[0] || iboProfiles['ibo-1'];
  const listings: IboListing[] = iboListings[ibo.id] || [];
  const referralNodes: ReferralNode[] = iboReferralTrees[ibo.id] || [];
  const iboOrders = orders.filter((o) => o.iboId === ibo.id);
  const myAttributions = customerAttributions.filter((a) => a.attributedIboId === ibo.id);
  const myWithdrawals = withdrawals.filter(
    (w) => w.userId === ibo.userId || w.userId === ibo.id
  );

  const handleSelectIbo = (id: string) => {
    setSelectedIboId(id);
    localStorage.setItem('activeIboId', id);
  };

  const [activeTab, setActiveTab] = useState<
    'referrals' | 'catalog' | 'merchants' | 'branding' | 'customers' | 'earnings' | 'links'
  >('referrals');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const [copiedShopLink, setCopiedShopLink] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  // Markup modal state
  const [editingListing, setEditingListing] = useState<IboListing | null>(null);
  const [markupInput, setMarkupInput] = useState<number>(0);
  const [markupError, setMarkupError] = useState<string | null>(null);

  // Merchant curation feedback
  const [curationFeedback, setCurationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Storefront branding form state
  const [storeNameInput, setStoreNameInput] = useState(ibo.shopBranding.storeName);
  const [taglineInput, setTaglineInput] = useState(ibo.shopBranding.tagline);
  const [accentColorInput, setAccentColorInput] = useState(ibo.shopBranding.accentColor || '#0F766E');
  const [bannerUrlInput, setBannerUrlInput] = useState(ibo.shopBranding.bannerImageUrl || '');
  const [supportEmailInput, setSupportEmailInput] = useState(ibo.shopBranding.supportEmail);
  const [supportPhoneInput, setSupportPhoneInput] = useState(ibo.shopBranding.supportPhone);
  const [brandingSavedMsg, setBrandingSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setStoreNameInput(ibo.shopBranding.storeName);
    setTaglineInput(ibo.shopBranding.tagline);
    setAccentColorInput(ibo.shopBranding.accentColor || '#0F766E');
    setBannerUrlInput(ibo.shopBranding.bannerImageUrl || '');
    setSupportEmailInput(ibo.shopBranding.supportEmail);
    setSupportPhoneInput(ibo.shopBranding.supportPhone);
  }, [ibo.id]);

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [bankName, setBankName] = useState('Access Bank Plc');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [withdrawFeedback, setWithdrawFeedback] = useState<string | null>(null);

  const shopUrl = `${window.location.origin}/shop/${ibo.slug}`;
  const referralUrl = `${window.location.origin}/ibo/signup?ref=${ibo.referralCode}`;

  const tierConfig = config.tierCaps[ibo.tier] || config.tierCaps.free;
  const wallet = platformStore.getWalletBalanceForAccount(`ibo_payable:${ibo.id}`);
  const totalReferralEarnings = referralNodes.reduce((s, n) => s + n.earnedFromMember, 0);
  const totalAvailable = (wallet?.availableBalance ?? 0) + totalReferralEarnings;

  const handleSaveMarkup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setMarkupError(null);
    const result = platformStore.updateIboMarkup(ibo.id, editingListing.productId, markupInput);
    if (!result.success) {
      setMarkupError(result.error || 'Markup cannot exceed 50% of merchant wholesale price.');
    } else {
      setEditingListing(null);
    }
  };

  const handleToggleMerchant = (merchantId: string) => {
    setCurationFeedback(null);
    const res = platformStore.toggleSelectMerchantInIboHub(ibo.id, merchantId);
    if (!res.success) {
      setCurationFeedback({
        type: 'error',
        message: res.error || 'Could not update supplier selection.',
      });
    } else {
      setCurationFeedback({
        type: 'success',
        message: 'Storefront supplier selection updated. Curated products synchronized.',
      });
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    platformStore.updateIboBranding(ibo.id, {
      storeName: storeNameInput.trim() || ibo.shopBranding.storeName,
      tagline: taglineInput.trim() || ibo.shopBranding.tagline,
      accentColor: accentColorInput.trim() || '#0F766E',
      bannerImageUrl: bannerUrlInput.trim() || undefined,
      supportEmail: supportEmailInput.trim(),
      supportPhone: supportPhoneInput.trim(),
    });
    setBrandingSavedMsg('White-label storefront branding saved! Open your live shop to preview.');
    setTimeout(() => setBrandingSavedMsg(null), 3000);
  };

  const handleBoostStore = (pkg: 'boost_24h' | 'boost_7d' | 'boost_30d') => {
    const profile = platformStore.getState().iboProfiles[ibo.id];
    if (profile) {
      const days = pkg === 'boost_24h' ? 1 : pkg === 'boost_7d' ? 7 : 30;
      profile.isBoostedOnFounderHome = true;
      profile.activeBoostPackage = pkg;
      profile.boostExpiry = new Date(Date.now() + days * 86400000).toISOString();
      platformStore.saveState();
      setBrandingSavedMsg(`Storefront Boost (${pkg.replace('boost_', '')}) activated!`);
      setTimeout(() => setBrandingSavedMsg(null), 3000);
    }
  };

  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawFeedback(null);
    const res = platformStore.requestWithdrawal(ibo.id, 'ibo', withdrawAmount, {
      bankName,
      accountNumber,
      accountName: ibo.name,
    });
    if (!res.success) {
      setWithdrawFeedback(res.error || 'Could not submit withdrawal.');
    } else {
      setIsWithdrawModalOpen(false);
    }
  };

  const t1Rate = config.referralCommissions?.tier1Pct ?? 3.0;
  const t2Rate = config.referralCommissions?.tier2Pct ?? 1.5;
  const t3Rate = config.referralCommissions?.tier3Pct ?? 0.5;

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col md:flex-row">
      {/* Dark Left Sidebar (#14181F) */}
      <aside className="w-full md:w-60 bg-dark text-white shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-line">
        <div>
          <div className="p-4 border-b border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <PlatformLogo onNavigate={onNavigate} variant="dark" size="sm" />
              <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold uppercase">
                {tierConfig.name.split(' ')[0]}
              </span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">IBO Dashboard</div>
              <div className="text-[11px] text-white/60 truncate max-w-[180px]">
                {ibo.name} ({ibo.iboNumber})
              </div>
            </div>
          </div>

          <nav className="py-2 flex md:flex-col overflow-x-auto">
            {[
              { id: 'referrals', label: `3-Tier Referrals (${referralNodes.length})`, icon: Users },
              { id: 'catalog', label: `Storefront Pricing (${listings.length})`, icon: Store },
              {
                id: 'merchants',
                label: `Suppliers & Tier (${ibo.selectedMerchantIds.length}/${tierConfig.maxSelectableMerchants})`,
                icon: Building,
              },
              { id: 'branding', label: 'White-Label Brand & Boost', icon: Palette },
              {
                id: 'customers',
                label: `Customers & Orders (${iboOrders.length})`,
                icon: CheckCircle2,
              },
              { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
              { id: 'links', label: 'Shop & Invite Links', icon: Share2 },
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
          <div className="text-white/60">Referral Code: {ibo.referralCode}</div>
          <button
            type="button"
            onClick={() => onNavigate(`/shop/${ibo.slug}`)}
            className="text-primary hover:underline font-bold block cursor-pointer"
          >
            Open My White-Label Shop →
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

      {/* Main Content */}
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
              placeholder="Search referrals, customers, or products..."
              className="w-full pl-9 pr-3 h-9 bg-page border border-line rounded text-[13px] text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div className="flex items-center gap-3">
            {(!currentAppUser || currentAppUser.role === 'founder') && (
              <select
                value={selectedIboId}
                onChange={(e) => handleSelectIbo(e.target.value)}
                aria-label="Select IBO profile"
                className="h-9 px-2.5 bg-surface border border-line rounded text-[12px] font-bold text-ink focus:outline-none focus:border-primary-dark"
              >
                {Object.values(iboProfiles).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (/shop/{p.slug})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => onNavigate(`/shop/${ibo.slug}`)}
              className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Preview Live Storefront</span>
              <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-[1200px] w-full mx-auto">
          {/* Row of 4 Compact Stat Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Available Payout Balance</span>
                <DollarSign className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">₦{totalAvailable.toLocaleString()}</div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawFeedback(null);
                  setIsWithdrawModalOpen(true);
                }}
                className="text-[12px] font-bold text-primary-dark hover:underline mt-1 inline-block cursor-pointer"
              >
                Request payout →
              </button>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Direct Markup Earnings</span>
                <Store className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                ₦{(wallet?.totalEarnings ?? 0).toLocaleString()}
              </div>
              <div className="text-[12px] text-muted mt-1">100% of retail markup</div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Referral Overrides (T1–T3)</span>
                <Users className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                ₦{totalReferralEarnings.toLocaleString()}
              </div>
              <div className="text-[12px] text-muted mt-1">
                {referralNodes.length} active IBOs in network
              </div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>White-Label Storefront</span>
                <Palette className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="text-[15px] font-bold text-ink mt-1 truncate">
                {ibo.shopBranding.storeName}
              </div>
              <div className="flex items-center gap-2 text-[12px] mt-1">
                <span
                  className="w-3 h-3 rounded-full border border-line inline-block"
                  style={{ backgroundColor: ibo.shopBranding.accentColor }}
                />
                <span className="font-bold text-primary-dark">/shop/{ibo.slug}</span>
              </div>
            </div>
          </div>

          {/* TAB 1: REFERRALS TABLE */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface border border-line rounded p-4">
                  <div className="text-[12px] font-bold text-muted uppercase">
                    Tier 1 Direct Recruits ({t1Rate}%)
                  </div>
                  <div className="price-text text-ink mt-1">
                    {referralNodes.filter((n) => n.tierLevel === 1).length} IBOs
                  </div>
                  <div className="text-[12px] text-primary-dark font-bold mt-1">
                    +₦
                    {referralNodes
                      .filter((n) => n.tierLevel === 1)
                      .reduce((s, n) => s + n.earnedFromMember, 0)
                      .toLocaleString()}{' '}
                    earned
                  </div>
                </div>

                <div className="bg-surface border border-line rounded p-4">
                  <div className="text-[12px] font-bold text-muted uppercase">
                    Tier 2 Generation ({t2Rate}%)
                  </div>
                  <div className="price-text text-ink mt-1">
                    {referralNodes.filter((n) => n.tierLevel === 2).length} IBOs
                  </div>
                  <div className="text-[12px] text-primary-dark font-bold mt-1">
                    +₦
                    {referralNodes
                      .filter((n) => n.tierLevel === 2)
                      .reduce((s, n) => s + n.earnedFromMember, 0)
                      .toLocaleString()}{' '}
                    earned
                  </div>
                </div>

                <div className="bg-surface border border-line rounded p-4">
                  <div className="text-[12px] font-bold text-muted uppercase">
                    Tier 3 Generation ({t3Rate}%)
                  </div>
                  <div className="price-text text-ink mt-1">
                    {referralNodes.filter((n) => n.tierLevel === 3).length} IBOs
                  </div>
                  <div className="text-[12px] text-primary-dark font-bold mt-1">
                    +₦
                    {referralNodes
                      .filter((n) => n.tierLevel === 3)
                      .reduce((s, n) => s + n.earnedFromMember, 0)
                      .toLocaleString()}{' '}
                    earned
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="section-title text-ink">3-Tier IBO Referral Tree</h2>
                    <p className="text-[12px] text-muted">
                      Earn {t1Rate}% Tier 1, {t2Rate}% Tier 2, and {t3Rate}% Tier 3 commission overrides on verified QR-settled product sales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(referralUrl);
                      setCopiedReferralLink(true);
                      setTimeout(() => setCopiedReferralLink(false), 2000);
                    }}
                    className="px-3.5 h-9 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>
                      {copiedReferralLink
                        ? 'Invite Link Copied!'
                        : `Copy IBO Invite Link (${ibo.referralCode})`}
                    </span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                        <th className="py-3 px-4">IBO Name</th>
                        <th className="py-3 px-4">Referral Code</th>
                        <th className="py-3 px-4">Generation Tier</th>
                        <th className="py-3 px-4">Override Rate</th>
                        <th className="py-3 px-4">Active Listings</th>
                        <th className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSortAsc(!sortAsc)}
                            className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
                          >
                            <span>Your Earned Override</span>
                            <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {referralNodes
                        .filter(
                          (n) =>
                            !searchQuery.trim() ||
                            n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            n.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .sort((a, b) =>
                          sortAsc
                            ? a.earnedFromMember - b.earnedFromMember
                            : b.earnedFromMember - a.earnedFromMember
                        )
                        .map((node) => (
                          <tr key={node.id} className="hover:bg-primary-tint/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-ink">{node.name}</td>
                            <td className="py-3 px-4 text-muted font-mono">{node.referralCode}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-tint border border-primary-dark text-primary-dark">
                                Tier {node.tierLevel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-ink font-bold">
                              {node.tierLevel === 1
                                ? `${t1Rate}%`
                                : node.tierLevel === 2
                                ? `${t2Rate}%`
                                : `${t3Rate}%`}
                            </td>
                            <td className="py-3 px-4 text-muted">
                              {node.activeShopListings} products
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-ink">
                              +₦{node.earnedFromMember.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOREFRONT CATALOG & MARKUP TABLE */}
          {activeTab === 'catalog' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="section-title text-ink">Curated Storefront Products & Markup</h2>
                  <p className="text-[12px] text-muted">
                    Set your retail markup (up to {config.maxIboMarkupPercentage}% of merchant wholesale price). You keep 100% of your markup on every sale.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('merchants')}
                  className="text-[13px] font-bold text-primary-dark hover:underline cursor-pointer"
                >
                  Curate Suppliers ({ibo.selectedMerchantIds.length}/{tierConfig.maxSelectableMerchants}) →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Wholesale Base</th>
                      <th className="py-3 px-4">Your Markup</th>
                      <th className="py-3 px-4">Retail Shop Price</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {listings.map((item) => {
                      const pct = Math.round(
                        (item.iboMarkup / item.product.merchantBasePrice) * 100
                      );
                      return (
                        <tr key={item.id} className="hover:bg-primary-tint/40">
                          <td className="py-3 px-4 font-bold text-ink">{item.product.title}</td>
                          <td className="py-3 px-4 text-muted">{item.product.merchantName}</td>
                          <td className="py-3 px-4 text-ink">
                            ₦{item.product.merchantBasePrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-primary-dark">
                            +₦{item.iboMarkup.toLocaleString()} ({pct}%)
                          </td>
                          <td className="py-3 px-4 font-bold text-ink">
                            ₦{item.finalCustomerPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingListing(item);
                                setMarkupInput(item.iboMarkup);
                                setMarkupError(null);
                              }}
                              className="text-[12px] font-bold text-primary-dark hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                              <span>Adjust Markup</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPLIERS CURATION & CAPACITY TIERS */}
          {activeTab === 'merchants' && (
            <div className="space-y-6">
              {curationFeedback && (
                <div
                  className={`p-3 rounded border text-[13px] font-bold flex items-center gap-2 ${
                    curationFeedback.type === 'success'
                      ? 'bg-primary-tint border-primary-dark text-primary-dark'
                      : 'bg-surface border-sale text-sale'
                  }`}
                >
                  {curationFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  )}
                  <span>{curationFeedback.message}</span>
                </div>
              )}

              {/* Sponsored Merchant Campaigns to IBOs */}
              {merchantCampaigns.length > 0 && (
                <div className="bg-surface border border-line rounded p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title text-ink">
                      Featured Supplier Promotions for IBOs
                    </h3>
                    <span className="text-[11px] font-bold uppercase text-primary-dark">
                      High-Margin Wholesale
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {merchantCampaigns.map((cmp) => {
                      const isSourced = ibo.selectedMerchantIds.includes(cmp.merchantId);
                      return (
                        <div
                          key={cmp.id}
                          className="p-3.5 bg-page border border-line rounded flex flex-col justify-between gap-2 text-[13px]"
                        >
                          <div>
                            <div className="text-[11px] font-bold text-primary-dark uppercase">
                              {cmp.merchantName} • {cmp.category}
                            </div>
                            <div className="font-bold text-ink mt-0.5">
                              {cmp.headline || cmp.campaignTitle}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-line">
                            <span className="text-[11px] text-muted">
                              {cmp.iboPickups || 0} IBOs curating
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleMerchant(cmp.merchantId)}
                              className={`px-3 h-8 rounded text-[12px] font-bold cursor-pointer ${
                                isSourced
                                  ? 'bg-surface border border-line text-ink'
                                  : 'bg-primary text-on-primary'
                              }`}
                            >
                              {isSourced ? 'Sourced in Shop' : '+ Add Supplier to Shop'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Merchants Directory for Curation */}
              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="section-title text-ink">
                      Select Verified Wholesale Suppliers ({ibo.selectedMerchantIds.length} /{' '}
                      {tierConfig.maxSelectableMerchants})
                    </h2>
                    <p className="text-[12px] text-muted">
                      Selecting a merchant automatically imports their verified products into your white-label storefront.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-line">
                  {merchants.map((m) => {
                    const isSelected = ibo.selectedMerchantIds.includes(m.id);
                    const mProductsCount = state.products.filter(
                      (p) => p.merchantId === m.id
                    ).length;
                    return (
                      <div
                        key={m.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink">{m.businessName}</span>
                            <span className="px-2 py-0.5 rounded bg-primary-tint border border-primary-dark text-primary-dark text-[10px] font-bold uppercase">
                              CAC Verified ({m.code})
                            </span>
                          </div>
                          <div className="text-[12px] text-muted">
                            {m.warehouseAddress} • {mProductsCount} wholesale SKUs available
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleMerchant(m.id)}
                          className={`px-4 h-9 rounded text-[12px] font-bold shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-surface border border-sale text-sale hover:bg-page'
                              : 'bg-primary hover:bg-primary-dark text-on-primary'
                          }`}
                        >
                          {isSelected ? 'Remove Supplier' : '+ Add Supplier to My Shop'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* IBO Capacity Tiers */}
              <div className="bg-surface border border-line rounded p-5 space-y-4">
                <div>
                  <h3 className="section-title text-ink">IBO Storefront Capacity Tiers</h3>
                  <p className="text-[12px] text-muted">
                    Upgrade your capacity tier to curate products from more wholesale merchants. Commission rates remain identical across all tiers.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['free', 'tier_2', 'tier_3'] as IboCapacityTier[]).map((tKey) => {
                    const tInfo = config.tierCaps[tKey];
                    const isCurrent = ibo.tier === tKey;
                    return (
                      <div
                        key={tKey}
                        className={`p-4 rounded border flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-primary-tint border-primary-dark'
                            : 'bg-surface border-line'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[14px] text-ink">{tInfo.name}</span>
                            <Crown className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                          </div>
                          <div className="price-text text-ink">
                            ₦{tInfo.costMonthlyNgn.toLocaleString()}{' '}
                            <span className="text-[12px] font-normal text-muted">/mo</span>
                          </div>
                          <div className="text-[12px] font-bold text-primary-dark">
                            Up to {tInfo.maxSelectableMerchants} Verified Suppliers
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => {
                            if (tKey === 'tier_2' || tKey === 'tier_3') {
                              platformStore.upgradeIboTier(ibo.id, tKey);
                            } else {
                              const p = platformStore.getState().iboProfiles[ibo.id];
                              if (p) {
                                p.tier = 'free';
                                platformStore.saveState();
                              }
                            }
                          }}
                          className={`mt-4 w-full h-9 rounded text-[12px] font-bold cursor-pointer ${
                            isCurrent
                              ? 'bg-surface border border-primary-dark text-primary-dark cursor-default'
                              : 'bg-primary hover:bg-primary-dark text-on-primary'
                          }`}
                        >
                          {isCurrent ? 'Active Capacity Tier' : `Switch to ${tInfo.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHITE-LABEL BRANDING & STOREFRONT BOOST */}
          {activeTab === 'branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-surface border border-line rounded p-6 space-y-4">
                <div>
                  <h2 className="section-title text-ink">
                    White-Label Storefront Branding (/shop/{ibo.slug})
                  </h2>
                  <p className="text-[12px] text-muted">
                    Customize how your retail storefront looks to your customers. Your store uses your own brand name, tagline, and accent color—never the platform’s header.
                  </p>
                </div>

                {brandingSavedMsg && (
                  <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>{brandingSavedMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBranding} className="space-y-3.5 text-[13px]">
                  <div>
                    <label className="block font-bold text-ink mb-1">Storefront Name *</label>
                    <input
                      type="text"
                      required
                      value={storeNameInput}
                      onChange={(e) => setStoreNameInput(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Store Tagline *</label>
                    <input
                      type="text"
                      required
                      value={taglineInput}
                      onChange={(e) => setTaglineInput(e.target.value)}
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1.5">
                      Storefront Brand Accent Color
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {BRAND_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setAccentColorInput(preset.hex)}
                          className={`h-8 px-2.5 rounded border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                            accentColorInput.toLowerCase() === preset.hex.toLowerCase()
                              ? 'border-ink bg-page'
                              : 'border-line bg-surface'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColorInput}
                        onChange={(e) => setAccentColorInput(e.target.value)}
                        className="w-10 h-10 p-1 bg-surface border border-line rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColorInput}
                        onChange={(e) => setAccentColorInput(e.target.value)}
                        className="flex-1 h-10 px-3 bg-surface border border-line rounded font-mono text-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      Hero Banner Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={bannerUrlInput}
                      onChange={(e) => setBannerUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Customer Support Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={supportPhoneInput}
                        onChange={(e) => setSupportPhoneInput(e.target.value)}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        Customer Support Email
                      </label>
                      <input
                        type="email"
                        value={supportEmailInput}
                        onChange={(e) => setSupportEmailInput(e.target.value)}
                        className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                    >
                      Save Storefront Branding
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/shop/${ibo.slug}`)}
                      className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink hover:bg-page cursor-pointer"
                    >
                      Open Live Shop →
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-5 space-y-6">
                {/* Storefront Boost Packages */}
                <div className="bg-surface border border-line rounded p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title text-ink">Boost Storefront Visibility</h3>
                    <Zap className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                  </div>
                  <p className="text-[12px] text-muted">
                    Feature your storefront on the Founder Marketplace discovery carousel to acquire unattributed direct shoppers.
                  </p>
                  <div className="space-y-2 text-[13px]">
                    {[
                      {
                        id: 'boost_24h' as const,
                        label: '24-Hour Spotlight Boost',
                        price: config.iboBoostPricing?.boost24hNgn ?? 500,
                      },
                      {
                        id: 'boost_7d' as const,
                        label: '7-Day Category Feature',
                        price: config.iboBoostPricing?.boost7dNgn ?? 2500,
                      },
                      {
                        id: 'boost_30d' as const,
                        label: '30-Day Homepage Rotation',
                        price: config.iboBoostPricing?.boost30dNgn ?? 7500,
                      },
                    ].map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-page border border-line rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-ink">{b.label}</div>
                          <div className="text-[12px] text-muted">₦{b.price.toLocaleString()}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBoostStore(b.id)}
                          className="px-3 h-8 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[12px] cursor-pointer"
                        >
                          {ibo.activeBoostPackage === b.id ? 'Active Boost' : 'Activate'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specialist Certification */}
                <div className="bg-surface border border-line rounded p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="section-title text-ink">IBO Specialist Badges</h3>
                    <Award className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(ibo.cosmeticBadges || []).map((b) => (
                      <span
                        key={b}
                        className="px-2.5 py-1 rounded bg-primary-tint border border-primary-dark text-primary-dark text-[11px] font-bold"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  {!ibo.completedTraining && (
                    <button
                      type="button"
                      onClick={() => platformStore.completeTraining(ibo.id)}
                      className="w-full h-9 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[12px] cursor-pointer"
                    >
                      Complete Affiliate Operations Certification
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMERS & ORDERS TABLE */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* 90-Day Customer Attribution Lock Table */}
              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line">
                  <h2 className="section-title text-ink">
                    90-Day Attributed Customers ({myAttributions.length})
                  </h2>
                  <p className="text-[12px] text-muted">
                    Customers who visited or ordered through your link are locked to your IBO profile for {config.customerAttributionDays} days.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                        <th className="py-3 px-4">Customer Phone / Email</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4">Lifetime Orders</th>
                        <th className="py-3 px-4 text-right">90-Day Lock Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {myAttributions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted">
                            No attributed customers recorded yet. Share /shop/{ibo.slug} to lock customers for 90 days.
                          </td>
                        </tr>
                      ) : (
                        myAttributions.map((attr) => (
                          <tr key={attr.id} className="hover:bg-primary-tint/40">
                            <td className="py-3 px-4 font-bold text-ink">
                              {attr.customerPhone}{' '}
                              {attr.customerEmail ? `(${attr.customerEmail})` : ''}
                            </td>
                            <td className="py-3 px-4 uppercase text-[11px] font-bold text-primary-dark">
                              {(attr.attributionSource || 'shared_link').replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 text-ink">
                              {attr.lifetimeOrdersCount || 1} orders (₦
                              {(attr.lifetimeGrossValue || 0).toLocaleString()})
                            </td>
                            <td className="py-3 px-4 text-right text-muted">
                              {new Date(attr.expiresAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storefront Orders */}
              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line">
                  <h2 className="section-title text-ink">
                    Storefront Orders (/shop/{ibo.slug})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Delivery Address</th>
                        <th className="py-3 px-4">Order Total</th>
                        <th className="py-3 px-4">Your Markup</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {iboOrders.map((ord) => {
                        const markupEarned = ord.items.reduce(
                          (s, i) => s + i.iboMarkup * i.quantity,
                          0
                        );
                        return (
                          <tr key={ord.id} className="hover:bg-primary-tint/40">
                            <td className="py-3 px-4 font-bold text-ink">{ord.orderNumber}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-ink">{ord.customerName}</div>
                              <div className="text-[12px] text-muted">{ord.customerPhone}</div>
                            </td>
                            <td className="py-3 px-4 text-muted truncate max-w-[240px]">
                              {ord.deliveryAddress}
                            </td>
                            <td className="py-3 px-4 font-bold text-ink">
                              ₦{ord.totalAmount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-primary-dark">
                              +₦{markupEarned.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                                {ord.orderStatus.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EARNINGS TABLE */}
          {activeTab === 'earnings' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="section-title text-ink">Earnings & Withdrawal History</h2>
                  <p className="text-[12px] text-muted">
                    All direct markups and referral overrides settled to your IBO wallet ({ibo.id}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawFeedback(null);
                    setIsWithdrawModalOpen(true);
                  }}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Withdraw Funds
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Payout ID</th>
                      <th className="py-3 px-4">Bank Destination</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {myWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted">
                          No withdrawals requested for {ibo.name} yet.
                        </td>
                      </tr>
                    ) : (
                      myWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-primary-tint/40">
                          <td className="py-3 px-4 font-bold text-ink">{w.id}</td>
                          <td className="py-3 px-4 text-muted">
                            {w.bankName} • {w.accountNumber} ({w.accountName})
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-ink">
                            ₦{w.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LINKS */}
          {activeTab === 'links' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface border border-line rounded p-5 space-y-3">
                <h3 className="section-title text-ink">1. Customer White-Label Storefront Link</h3>
                <p className="text-[13px] text-muted">
                  Share this link with retail buyers. Displays only your custom-branded store ({ibo.shopBranding.storeName}) and your retail prices.
                </p>
                <div className="p-2.5 bg-page border border-line rounded font-mono text-[12px] text-ink break-all">
                  {shopUrl}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shopUrl);
                      setCopiedShopLink(true);
                      setTimeout(() => setCopiedShopLink(false), 2000);
                    }}
                    className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedShopLink ? (
                      <Check className="w-4 h-4" strokeWidth={1.75} />
                    ) : (
                      <Copy className="w-4 h-4" strokeWidth={1.75} />
                    )}
                    <span>{copiedShopLink ? 'Copied' : 'Copy Shop Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/shop/${ibo.slug}`)}
                    className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink hover:border-primary-dark cursor-pointer"
                  >
                    Open Storefront
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-line rounded p-5 space-y-3">
                <h3 className="section-title text-ink">2. IBO Referral Link</h3>
                <p className="text-[13px] text-muted">
                  Share this link with prospective IBOs to register them permanently in your Tier 1 referral network.
                </p>
                <div className="p-2.5 bg-page border border-line rounded font-mono text-[12px] text-ink break-all">
                  {referralUrl}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(referralUrl);
                    setCopiedReferralLink(true);
                    setTimeout(() => setCopiedReferralLink(false), 2000);
                  }}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedReferralLink ? (
                    <Check className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Copy className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  <span>{copiedReferralLink ? 'Copied' : 'Copy Referral Link'}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Adjust Markup Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="section-title text-ink">Adjust Product Markup</h3>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            {markupError && (
              <div className="p-3 bg-surface border border-sale rounded text-sale text-[12px]">
                {markupError}
              </div>
            )}
            <form onSubmit={handleSaveMarkup} className="space-y-3.5 text-[13px]">
              <div className="font-bold text-ink">{editingListing.product.title}</div>
              <div className="text-[12px] text-muted">
                Wholesale Price: ₦{editingListing.product.merchantBasePrice.toLocaleString()} • Max 50% Markup: ₦
                {Math.round(editingListing.product.merchantBasePrice * 0.5).toLocaleString()}
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Your Markup (₦)</label>
                <input
                  type="number"
                  value={markupInput}
                  onChange={(e) => setMarkupInput(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Save Markup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="section-title text-ink">Request Bank Withdrawal</h3>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            {withdrawFeedback && (
              <div className="p-3 bg-surface border border-sale rounded text-sale text-[12px]">
                {withdrawFeedback}
              </div>
            )}
            <form onSubmit={handleRequestWithdrawal} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-ink mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
