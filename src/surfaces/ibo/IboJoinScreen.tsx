import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Store,
  Percent,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { AppUser } from '../../types';
import { RegistrationSecuritySteps } from '../../components/RegistrationSecuritySteps';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface IboJoinScreenProps {
  initialReferralCode?: string;
  referralCode?: string;
  onNavigate: (path: string) => void;
}

const IBO_FAQS = [
  {
    q: 'How much does it cost to join?',
    a: 'It is 100% free to join! You can pick products from up to 5 trusted sellers and put them in your own online shop without paying anything upfront.',
  },
  {
    q: 'How do I make money?',
    a: 'You add your own profit (up to 50% extra) on top of the seller’s price. Whenever someone buys from your shop link, you keep 100% of the profit you added.',
  },
  {
    q: 'What happens when I invite other shop owners?',
    a: 'When people you invite make sales in their own shops, you earn a small bonus from IBO Hub (5% on direct invites, 3% on second level, and 2% on third level). Bonuses are paid only when real products are sold.',
  },
  {
    q: 'When do I get my money?',
    a: 'Your profit goes straight into your wallet as soon as the customer gets their package and confirms delivery. You can withdraw to any Nigerian bank account from ₦2,000.',
  },
];

export const IboJoinScreen: React.FC<IboJoinScreenProps> = ({
  initialReferralCode,
  referralCode,
  onNavigate,
}) => {
  const { currentAppUser, userProfile, setSessionUser } = useAuth();
  const activeRole = currentAppUser?.role || userProfile?.role;
  const state = platformStore.getState();
  const { iboProfiles } = state;

  const urlRef = new URLSearchParams(window.location.search).get('ref');
  const rawCode = urlRef || initialReferralCode || referralCode || '';
  const initialCode = rawCode.trim().toUpperCase() === 'FOUNDER' ? '' : rawCode.trim().toUpperCase();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(initialCode);
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const matchingIbo = referralCodeInput.trim()
    ? Object.values(iboProfiles).find(
        (i) => i.referralCode.toUpperCase() === referralCodeInput.trim().toUpperCase()
      )
    : undefined;

  const handleInitialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !slug) return;
    setIsVerifyingSecurity(true);
  };

  const handleSecurityCompleted = (newUser: AppUser) => {
    const newIbo = platformStore.registerIbo({
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      storeName: storeName.trim() || `${fullName.trim()}'s Store`,
      referralCodeUsed: referralCodeInput.trim() || undefined,
    });

    const updatedUser = { ...newUser, entityId: newIbo.id };
    authService.syncUserToDatabase(updatedUser).catch(() => {});
    setSessionUser(updatedUser);

    localStorage.setItem('activeIboId', newIbo.id);
    setIsVerifyingSecurity(false);
    onNavigate(`/ibo/dashboard?id=${newIbo.id}`);
  };

  return (
    <div className="bg-page min-h-screen py-6">
      <div className="container-market space-y-6">
        {/* Top Section: Headline + Specific Benefits + Signup Form Beside It */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 bg-surface border border-line rounded p-6 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark">
                <Store className="w-4 h-4" strokeWidth={1.75} />
                <span>Independent Business Owner (IBO)</span>
              </div>
              <h1 className="page-title text-ink">
                Open your own online shop without buying stock
              </h1>
              <p className="text-[14px] text-muted">
                Start your own online shop in minutes. Pick products from trusted Nigerian sellers, add your own profit, and share your shop link with customers.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line">
              <h2 className="text-[14px] font-bold text-ink">
                Why People Love Being an IBO
              </h2>
              <ul className="space-y-2.5 text-[13px] text-ink">
                <li className="flex items-start gap-2.5">
                  <Percent className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Keep 100% of Your Profit:</strong> Add up to 50% profit on products and keep every Naira of the profit you added.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Free to Start:</strong> Open your own `/shop/your-name` link for ₦0 and pick items from up to 5 sellers right away.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Get Paid on Delivery:</strong> Your profit is added to your wallet the moment your customer receives their order.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>What You Need:</strong> Just your phone number, email address, and a Nigerian bank account to receive your earnings.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-between text-[13px]">
              <span className="text-muted">Already registered as an IBO?</span>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    activeRole === 'ibo' || activeRole === 'founder' ? '/ibo/dashboard' : '/login'
                  )
                }
                className="font-bold text-primary-dark hover:underline cursor-pointer"
              >
                {activeRole === 'ibo' || activeRole === 'founder'
                  ? 'Open IBO Dashboard →'
                  : 'Sign In to IBO Account →'}
              </button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 bg-surface border border-line rounded p-6">
            {isVerifyingSecurity ? (
              <RegistrationSecuritySteps
                role="ibo"
                fullName={fullName}
                email={email}
                phone={phone}
                suggestedUsername={slug}
                onCompleted={handleSecurityCompleted}
                onCancel={() => setIsVerifyingSecurity(false)}
              />
            ) : (
              <>
                <div className="border-b border-line pb-3 mb-4">
                  <h2 className="section-title text-ink">Create Your IBO Storefront</h2>
                  <p className="text-[12px] text-muted mt-0.5">
                    Configure your white-label shop URL and start curating products.
                  </p>
                </div>

                <form onSubmit={handleInitialFormSubmit} className="space-y-4 text-[13px]" id="ibo-signup-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amina Bello"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 803 000 0000"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="amina@example.com"
                      className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink mb-1">Storefront Display Name *</label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => {
                          setStoreName(e.target.value);
                          if (!slug) {
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          }
                        }}
                        placeholder="e.g. Amina Direct Mart"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">Store URL Handle *</label>
                      <div className="flex items-center">
                        <span className="px-2.5 h-10 flex items-center bg-page border border-r-0 border-line rounded-l text-muted text-[12px]">
                          /shop/
                        </span>
                        <input
                          type="text"
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          placeholder="amina-mart"
                          className="w-full px-3 h-10 bg-surface border border-line rounded-r text-ink focus:outline-none focus:border-primary-dark"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-ink">
                        Sponsor Referral Code <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      {matchingIbo && (
                        <span className="text-[12px] font-bold text-primary-dark">
                          Referred by {matchingIbo.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AMINA77"
                      className="w-full px-3 h-10 bg-surface border border-line rounded text-ink uppercase focus:outline-none focus:border-primary-dark"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Create Storefront & Open Dashboard</span>
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
              <h3 className="text-[15px] font-bold text-ink">Pick Products You Like</h3>
              <p className="text-[13px] text-muted">
                Browse products from trusted sellers and add the ones you want to sell into your own online shop.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 2</div>
              <h3 className="text-[15px] font-bold text-ink">Add Your Profit &amp; Share</h3>
              <p className="text-[13px] text-muted">
                Add up to 50% profit on any item and share your personal `/shop/` link on WhatsApp, Instagram, or with friends.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 3</div>
              <h3 className="text-[15px] font-bold text-ink">We Deliver, You Get Paid</h3>
              <p className="text-[13px] text-muted">
                Our delivery riders pick up and deliver the order to your customer. Your profit goes into your wallet right after delivery.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="section-title text-ink mb-4">Frequently Asked Questions</h2>
          <div className="divide-y divide-line border border-line rounded">
            {IBO_FAQS.map((faq, idx) => {
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
            <h2 className="section-title text-ink">Launch your custom storefront today</h2>
            <p className="text-[13px] text-muted mt-0.5">
              Zero stock risk, up to 50% markup per item, and instant escrow payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('ibo-signup-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] shrink-0"
          >
            Become an IBO
          </button>
        </section>
      </div>
    </div>
  );
};
