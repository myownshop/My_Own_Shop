import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Building2,
  ShieldCheck,
  Warehouse,
  Clock,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { RegistrationSecuritySteps } from '../../components/RegistrationSecuritySteps';
import { authService } from '../../services/authService';
import { AppUser } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface MerchantSignupScreenProps {
  initialReferralCode?: string;
  onNavigate: (path: string) => void;
}

const NIGERIAN_STATES = [
  'Lagos',
  'Abuja (FCT)',
  'Ogun',
  'Rivers',
  'Kano',
  'Oyo',
  'Anambra',
  'Edo',
  'Enugu',
  'Kaduna',
  'Delta',
];

const WHOLESALE_CATEGORIES = [
  { id: 'electronics', label: 'Phones, Inverters & Electronics' },
  { id: 'groceries', label: 'Groceries, Rice & Packaged Foods' },
  { id: 'home', label: 'Home Appliances & Kitchen' },
  { id: 'fashion', label: 'Fashion, Textiles & Footwear' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'agriculture', label: 'Agro-Equipment & Supplies' },
];

const MERCHANT_FAQS = [
  {
    q: 'How much does it cost to list my products?',
    a: 'You can start for FREE with up to 5 products. If you want to list up to 50 products, our Pro Plan is ₦15,000/month. We only charge a small 5% fee when your item is sold and delivered.',
  },
  {
    q: 'How fast do I get paid?',
    a: 'We hold the buyer’s money safely during delivery and send your payment straight to your wallet as soon as the buyer receives their package. Bank withdrawals arrive within 24 hours.',
  },
  {
    q: 'Do I have to keep my goods in an IBO Hub warehouse?',
    a: 'No. You can either drop fast-selling items at our Lagos, Abuja, or Port Harcourt centers for same-day delivery, or riders can pick up directly from your own shop or warehouse.',
  },
  {
    q: 'What do I need to register?',
    a: 'Your business or shop name, an active phone number, and your shop or warehouse address so riders know where to pick up orders.',
  },
];

export const MerchantSignupScreen: React.FC<MerchantSignupScreenProps> = ({
  initialReferralCode,
  onNavigate,
}) => {
  const { currentAppUser, userProfile, setSessionUser } = useAuth();
  const activeRole = currentAppUser?.role || userProfile?.role;
  const state = platformStore.getState();
  const { merchants } = state;

  const urlRef = new URLSearchParams(window.location.search).get('ref');
  const rawCode = urlRef || initialReferralCode || '';
  const initialCode =
    rawCode.trim().toUpperCase() === 'FOUNDER' ? '' : rawCode.trim().toUpperCase();

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [selectedState, setSelectedState] = useState('Lagos');
  const [selectedCategory, setSelectedCategory] = useState('electronics');
  const [cacNumber, setCacNumber] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(initialCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cleanRef = referralCodeInput.trim().toUpperCase();
  const referringMerchant = cleanRef
    ? merchants.find(
        (m) =>
          (m.referralCode && m.referralCode.toUpperCase() === cleanRef) ||
          (m.code && m.code.toUpperCase() === cleanRef)
      )
    : undefined;

  const handleInitialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!businessName.trim()) {
      setErrorMessage('Enter your official business or store name.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMessage('Enter a valid work email address.');
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMessage('Enter an active contact phone number.');
      return;
    }
    if (!warehouseAddress.trim()) {
      setErrorMessage('Enter your warehouse or dispatch address.');
      return;
    }

    setIsVerifyingSecurity(true);
  };

  const handleSecurityCompleted = (newUser: AppUser) => {
    try {
      const newMerchant = platformStore.registerMerchant({
        businessName: businessName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        warehouseAddress: warehouseAddress.trim(),
        state: selectedState,
        category: selectedCategory,
        cacRegistrationNumber: cacNumber.trim() || undefined,
        referralCodeUsed: referralCodeInput.trim() || undefined,
      });

      const updatedUser = { ...newUser, entityId: newMerchant.id };
      authService.syncUserToDatabase(updatedUser).catch(() => {});
      setSessionUser(updatedUser);

      localStorage.setItem('activeMerchantId', newMerchant.id);
      setIsVerifyingSecurity(false);
      onNavigate(`/merchant/dashboard?id=${newMerchant.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not register merchant account.');
      setIsVerifyingSecurity(false);
    }
  };

  return (
    <div className="bg-page min-h-screen py-6">
      <div className="container-market space-y-6">
        {/* Top Section: Plain Headline + Specific Benefits + Signup Form Beside It */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Headline & Specific Benefit List */}
          <div className="lg:col-span-5 bg-surface border border-line rounded p-6 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark">
                <Building2 className="w-4 h-4" strokeWidth={1.75} />
                <span>Merchant Onboarding</span>
              </div>
              <h1 className="page-title text-ink">
                Sell wholesale and retail across Nigeria
              </h1>
              <p className="text-[14px] text-muted">
                List your inventory once. Sell directly to marketplace buyers and through verified Independent Business Owners (IBOs) nationwide.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line">
              <h2 className="text-[14px] font-bold text-ink">
                Why Sell on IBO Hub
              </h2>
              <ul className="space-y-2.5 text-[13px] text-ink">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Free to Start:</strong> List up to 5 products for ₦0/month. You only pay a 5% fee when an item is sold.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Fast Payouts:</strong> Money goes to your wallet as soon as the customer receives the item, and you can withdraw to any Nigerian bank.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Warehouse className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Easy Delivery:</strong> Keep items at your own shop for riders to pick up, or drop them at our local centers.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>More Sales:</strong> Hundreds of Independent Shop Owners (IBOs) can also help promote and sell your products across Nigeria.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-between text-[13px]">
              <span className="text-muted">Already have a merchant account?</span>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    activeRole === 'merchant' || activeRole === 'founder'
                      ? '/merchant/dashboard'
                      : '/login'
                  )
                }
                className="font-bold text-primary-dark hover:underline cursor-pointer"
              >
                {activeRole === 'merchant' || activeRole === 'founder'
                  ? 'Open Merchant Dashboard →'
                  : 'Sign In to Merchant Account →'}
              </button>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7 bg-surface border border-line rounded p-6">
            {isVerifyingSecurity ? (
              <RegistrationSecuritySteps
                role="merchant"
                fullName={contactName.trim() || businessName.trim()}
                email={contactEmail.trim()}
                phone={contactPhone.trim()}
                suggestedUsername={businessName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}
                onCompleted={handleSecurityCompleted}
                onCancel={() => setIsVerifyingSecurity(false)}
              />
            ) : (
              <>
                <div className="border-b border-line pb-3 mb-4">
                  <h2 className="section-title text-ink">Create Merchant Account</h2>
                  <p className="text-[12px] text-muted mt-0.5">
                    Complete your store details to start listing products immediately.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded bg-surface border border-sale text-sale text-[13px] font-medium">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleInitialFormSubmit} className="space-y-4 text-[13px]" id="merchant-signup-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Business / Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Slot Systems Ikeja"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chinedu Okafor"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="orders@yourstore.ng"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Active Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+234 803 000 0000"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Primary Product Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink focus:outline-none focus:border-primary-dark"
                      >
                        {WHOLESALE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Operating State
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink focus:outline-none focus:border-primary-dark"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-ink font-bold mb-1">
                      Warehouse / Dispatch Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Plot 14, Simbiat Abiola Road, Ikeja, Lagos"
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        CAC RC / BN Number <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="RC-1849201"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Referral Code <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="MRC-AGRO-01"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-surface border border-line rounded px-3 h-10 text-ink placeholder-muted uppercase focus:outline-none focus:border-primary-dark"
                      />
                      {referringMerchant && (
                        <span className="text-[11px] font-bold text-primary-dark mt-1 block">
                          Referred by {referringMerchant.businessName}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Register & Open Merchant Dashboard</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* 3-Step Numbered "How it works" Row */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="section-title text-ink mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 1</div>
              <h3 className="text-[15px] font-bold text-ink">Register & List Products</h3>
              <p className="text-[13px] text-muted">
                Create your merchant profile in 2 minutes and upload product photos, specs, and wholesale base prices in Naira.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 2</div>
              <h3 className="text-[15px] font-bold text-ink">Receive Escrow-Backed Orders</h3>
              <p className="text-[13px] text-muted">
                Customers buy directly on IBO Hub or via IBO reseller storefronts. Accredited delivery agents pick up from your depot or hub.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 3</div>
              <h3 className="text-[15px] font-bold text-ink">Get Paid on Delivery Scan</h3>
              <p className="text-[13px] text-muted">
                As soon as the buyer scans the delivery QR code, your wholesale payout is credited to your wallet for instant withdrawal.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="section-title text-ink mb-4">Frequently Asked Questions</h2>
          <div className="divide-y divide-line border border-line rounded">
            {MERCHANT_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="p-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-[14px] text-ink"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                    )}
                  </button>
                  {isOpen && (
                    <p className="text-[13px] text-muted mt-2 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-surface border border-line rounded p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="section-title text-ink">Ready to sell your products on IBO Hub?</h2>
            <p className="text-[13px] text-muted mt-0.5">
              Start free with up to 5 products and fast payouts to your Nigerian bank account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('merchant-signup-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] shrink-0"
          >
            Start Selling Now
          </button>
        </section>
      </div>
    </div>
  );
};
