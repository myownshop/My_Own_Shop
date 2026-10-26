import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  Upload,
  AlertCircle,
  ArrowRight,
  Percent,
  Check,
  X,
  FileCheck,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { VehicleType, AppUser } from '../../types';
import { RegistrationSecuritySteps } from '../../components/RegistrationSecuritySteps';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface DeliveryAgentSignupScreenProps {
  initialReferralCode?: string;
  onNavigate: (path: string) => void;
}

const LAGOS_HUBS = [
  'Ikeja Central Hub',
  'Maryland / Oregun',
  'Victoria Island & Ikoyi',
  'Lekki Phase 1 & Expressway',
  'Yaba / Surulere',
  'Oshodi / Airport Corridor',
  'Alaba / Trade Fair Depot',
  'Ikorodu Road Depot',
];

const AGENT_FAQS = [
  {
    q: 'How much do delivery riders earn per trip?',
    a: 'You keep 85% to 90% of the delivery fee (₦1,500–₦4,500 per trip) plus a small bonus when riders you invite complete deliveries.',
  },
  {
    q: 'When do I get paid for a trip?',
    a: 'Your money goes into your wallet the second the buyer confirms delivery on their phone. You can withdraw to your bank account every day.',
  },
  {
    q: 'What if the buyer is not at home?',
    a: 'Mark the delivery as unsuccessful in your app. Your trip fee is still protected when you reach the buyer’s address.',
  },
  {
    q: 'What vehicles can I use?',
    a: 'Motorcycles (bikes), tricycles, mini-vans, and trucks. You just need a valid Rider Card or Driver’s License and plate number.',
  },
];

export const DeliveryAgentSignupScreen: React.FC<DeliveryAgentSignupScreenProps> = ({
  initialReferralCode = '',
  onNavigate,
}) => {
  const { currentAppUser, userProfile, setSessionUser } = useAuth();
  const activeRole = currentAppUser?.role || userProfile?.role;
  const urlRef = new URLSearchParams(window.location.search).get('ref') || initialReferralCode;
  const initialCode = urlRef && urlRef.trim().toUpperCase() !== 'FOUNDER' ? urlRef.trim().toUpperCase() : '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [selectedHubs, setSelectedHubs] = useState<string[]>(['Ikeja Central Hub', 'Maryland / Oregun']);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(initialCode);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const state = platformStore.getState();
  const referringAgent = referralCodeInput.trim()
    ? state.agents.find(
        (a) => a.referralCode.toUpperCase() === referralCodeInput.trim().toUpperCase()
      )
    : undefined;

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [docCategory, setDocCategory] = useState<string>("Driver's License / Rider ID");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleHub = (hub: string) => {
    if (selectedHubs.includes(hub)) {
      if (selectedHubs.length > 1) {
        setSelectedHubs(selectedHubs.filter((h) => h !== hub));
      }
    } else {
      setSelectedHubs([...selectedHubs, hub]);
    }
  };

  const handleFileProcess = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Document size exceeds 10MB limit.');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const sizeStr =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setUploadedFile({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/pdf',
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInitialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !vehiclePlate.trim()) {
      setErrorMsg('Please complete your name, phone number, and vehicle plate.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please confirm compliance with QR handover guidelines.');
      return;
    }

    setErrorMsg(null);
    setIsVerifyingSecurity(true);
  };

  const handleSecurityCompleted = (newUser: AppUser) => {
    try {
      const newAgent = platformStore.registerDeliveryAgent({
        name: fullName.trim(),
        phone: phone.trim(),
        vehicleType,
        vehiclePlate: vehiclePlate.trim(),
        operatingAreas: selectedHubs,
        referralCodeUsed: referralCodeInput.trim() || undefined,
        documentType: docCategory,
        documentNumber: licenseNumber.trim() || undefined,
        documentFileName: uploadedFile?.name,
        documentDataUrl: uploadedFile?.dataUrl,
      });

      const updatedUser = { ...newUser, entityId: newAgent.id };
      authService.syncUserToDatabase(updatedUser).catch(() => {});
      setSessionUser(updatedUser);

      localStorage.setItem('activeAgentId', newAgent.id);
      setIsVerifyingSecurity(false);
      onNavigate(`/agent/dashboard?id=${newAgent.id}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete courier registration.');
      setIsVerifyingSecurity(false);
    }
  };

  return (
    <div className="bg-page min-h-screen py-6">
      <div className="container-market space-y-6">
        {/* Top Section: Plain Headline + Specific Benefits + Signup Form Beside It */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 bg-surface border border-line rounded p-6 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark">
                <Truck className="w-4 h-4" strokeWidth={1.75} />
                <span>Logistics & Courier Fleet</span>
              </div>
              <h1 className="page-title text-ink">
                Deliver marketplace orders and get paid daily
              </h1>
              <p className="text-[14px] text-muted">
                Pick up pre-packaged orders from regional IBO Hub depots and verified merchants. Complete deliveries with a quick QR scan.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-line">
              <h2 className="text-[14px] font-bold text-ink">
                Why Deliver With IBO Hub
              </h2>
              <ul className="space-y-2.5 text-[13px] text-ink">
                <li className="flex items-start gap-2.5">
                  <Percent className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Keep 85%–90% of Every Trip:</strong> Earn ₦1,500 to ₦4,500 per delivery depending on distance and vehicle type.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>Instant Payment:</strong> Your trip money goes straight into your wallet as soon as the customer scans your delivery code.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>No Cash Hassles:</strong> Orders are already paid for or confirmed on your phone at the door.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span>
                    <strong>What You Need:</strong> A working bike, tricycle, van, or truck, a valid Rider ID or Driver’s License, and a smartphone.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-between text-[13px]">
              <span className="text-muted">Already an accredited courier?</span>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    activeRole === 'agent' || activeRole === 'founder'
                      ? '/agent/dashboard'
                      : '/login'
                  )
                }
                className="font-bold text-primary-dark hover:underline cursor-pointer"
              >
                {activeRole === 'agent' || activeRole === 'founder'
                  ? 'Open Agent Dashboard →'
                  : 'Sign In to Courier Account →'}
              </button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 bg-surface border border-line rounded p-6">
            {isVerifyingSecurity ? (
              <RegistrationSecuritySteps
                role="agent"
                fullName={fullName.trim()}
                email={email.trim() || `${phone.replace(/\D/g, '')}@courier.ibohub.ng`}
                phone={phone.trim()}
                suggestedUsername={fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}
                onCompleted={handleSecurityCompleted}
                onCancel={() => setIsVerifyingSecurity(false)}
              />
            ) : (
              <>
                <div className="border-b border-line pb-3 mb-4">
                  <h2 className="section-title text-ink">Courier Onboarding Form</h2>
                  <p className="text-[12px] text-muted mt-0.5">
                    Register your vehicle and preferred dispatch hubs to start receiving delivery jobs.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-surface border border-sale rounded flex items-center gap-2 text-sale text-[13px]">
                    <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleInitialFormSubmit} className="space-y-4 text-[13px]" id="agent-signup-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tunde Bakare"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 813 000 0000"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">Vehicle Type *</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                      >
                        <option value="motorcycle">Dispatch Motorcycle (Bike)</option>
                        <option value="van">Delivery Van / Mini-Bus</option>
                        <option value="truck">Heavy Truck</option>
                        <option value="bicycle">Cargo Bicycle</option>
                        <option value="electric_bike">Electric Bike</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">Vehicle Plate Number *</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="KJA-512-AB"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink uppercase focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-ink font-bold mb-1.5">
                      Operating Dispatch Hubs
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LAGOS_HUBS.map((hub) => {
                        const isSelected = selectedHubs.includes(hub);
                        return (
                          <button
                            type="button"
                            key={hub}
                            onClick={() => toggleHub(hub)}
                            className={`px-3 py-1.5 rounded text-[12px] font-bold border transition-colors ${
                              isSelected
                                ? 'bg-primary-tint border-primary-dark text-primary-dark'
                                : 'bg-surface border-line text-muted hover:text-ink'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 inline-block mr-1" strokeWidth={1.75} />}
                            {hub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-ink font-bold mb-1">ID / License Type</label>
                      <select
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                      >
                        <option value="Driver's License / Rider ID">Driver's License / Rider Card</option>
                        <option value="LASG Roadworthiness Certificate">Roadworthiness Certificate</option>
                        <option value="Vehicle Insurance Certificate">Vehicle Insurance Policy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-ink font-bold mb-1">License Number</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="DL-902184-LG"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Upload License Scan <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      {uploadedFile ? (
                        <div className="px-3 h-10 bg-primary-tint border border-primary-dark rounded flex items-center justify-between text-[12px]">
                          <span className="font-bold text-primary-dark truncate flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                            {uploadedFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadedFile(null)}
                            className="text-muted hover:text-sale"
                          >
                            <X className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full px-3 h-10 bg-surface border border-line rounded flex items-center justify-center gap-2 text-[12px] font-bold text-primary-dark cursor-pointer hover:bg-primary-tint">
                          <Upload className="w-4 h-4" strokeWidth={1.75} />
                          <span>Choose File (PDF/JPG)</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target?.files?.[0];
                              if (file) handleFileProcess(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-ink font-bold mb-1">
                        Referral Code <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        placeholder="TUNDE-RIDER"
                        className="w-full px-3 h-10 bg-surface border border-line rounded text-ink uppercase focus:outline-none focus:border-primary-dark"
                      />
                      {referringAgent && (
                        <span className="text-[11px] font-bold text-primary-dark mt-0.5 block">
                          Referred by {referringAgent.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-line text-primary-dark focus:ring-primary-dark"
                    />
                    <span className="text-[12px] text-muted">
                      I confirm my vehicle is roadworthy and agree to release packages only upon buyer QR scan verification.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Complete Onboarding & Open Dashboard</span>
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
              <h3 className="text-[15px] font-bold text-ink">Accept Jobs in Your Zone</h3>
              <p className="text-[13px] text-muted">
                View available dispatches in your selected operating hubs with clear pickup addresses, drop-off locations, and trip fees.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 2</div>
              <h3 className="text-[15px] font-bold text-ink">Pick Up & Deliver</h3>
              <p className="text-[13px] text-muted">
                Collect pre-packed parcels from the regional hub or merchant depot and deliver directly to the buyer’s address.
              </p>
            </div>
            <div className="border border-line rounded p-4 space-y-1.5">
              <div className="text-[12px] font-bold text-primary-dark uppercase">Step 3</div>
              <h3 className="text-[15px] font-bold text-ink">Scan QR for Instant Payout</h3>
              <p className="text-[13px] text-muted">
                Present your order QR code at handover. The customer’s scan immediately releases your delivery fee into your wallet.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="section-title text-ink mb-4">Frequently Asked Questions</h2>
          <div className="divide-y divide-line border border-line rounded">
            {AGENT_FAQS.map((faq, idx) => {
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
            <h2 className="section-title text-ink">Ready to earn with your bike, van, or truck?</h2>
            <p className="text-[13px] text-muted mt-0.5">
              Sign up in 2 minutes and start accepting verified dispatch jobs in your area.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('agent-signup-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] shrink-0"
          >
            Become a Delivery Agent
          </button>
        </section>
      </div>
    </div>
  );
};
