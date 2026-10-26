import React, { useState, useEffect } from 'react';
import {
  Settings,
  Scale,
  Users,
  Truck,
  Building,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  ShieldCheck,
  DollarSign,
  LogOut,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { PlatformConfig } from '../../config/platformConfig';
import { FinancialOverview } from './FinancialOverview';
import { useAuth } from '../../context/AuthContext';
import { PlatformLogo } from '../../components/PlatformLogo';

interface FounderAdminScreenProps {
  onNavigate: (path: string) => void;
}

export const FounderAdminScreen: React.FC<FounderAdminScreenProps> = ({ onNavigate }) => {
  const { signOutUser } = useAuth();
  const [, setStoreTick] = useState(0);
  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const state = platformStore.getState();
  const {
    config,
    orders,
    agents,
    merchants,
    iboProfiles,
    kycSubmissions,
    failedDeliveryDisputes,
    withdrawals,
  } = state;

  const [activeTab, setActiveTab] = useState<
    'finance' | 'withdrawals' | 'dispatch' | 'kyc' | 'disputes' | 'config'
  >('finance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<string>(
    orders[0]?.id || ''
  );
  const [selectedAgentForDispatch, setSelectedAgentForDispatch] = useState<string>(
    agents[0]?.id || ''
  );
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);
  const [editableConfig, setEditableConfig] = useState<PlatformConfig>({ ...config });
  const [configSaved, setConfigSaved] = useState(false);

  const handleManualDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch || !selectedAgentForDispatch) return;
    const res = platformStore.assignAgentToOrder(
      selectedOrderForDispatch,
      selectedAgentForDispatch
    );
    if (res.success) {
      setDispatchFeedback(`Courier assigned to order ${selectedOrderForDispatch}.`);
      setTimeout(() => setDispatchFeedback(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col md:flex-row">
      {/* Dark Left Sidebar (#14181F) */}
      <aside className="w-full md:w-60 bg-dark text-white shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-line">
        <div>
          <div className="p-4 border-b border-white/10 space-y-2.5">
            <PlatformLogo onNavigate={onNavigate} variant="dark" size="sm" />
            <div>
              <div className="text-[13px] font-bold text-white">Founder Admin</div>
              <div className="text-[11px] text-white/60">Operations &amp; Escrow Center</div>
            </div>
          </div>

          <nav className="py-2 flex md:flex-col overflow-x-auto">
            {[
              { id: 'finance', label: 'Ledger & Escrow', icon: Scale },
              {
                id: 'withdrawals',
                label: `Payout Approvals (${withdrawals.filter((w) => w.status === 'pending').length})`,
                icon: DollarSign,
              },
              { id: 'dispatch', label: `Dispatch (${orders.length})`, icon: Truck },
              {
                id: 'kyc',
                label: `KYC Queue (${kycSubmissions.length})`,
                icon: ShieldCheck,
              },
              {
                id: 'disputes',
                label: `Disputes (${failedDeliveryDisputes.length})`,
                icon: Users,
              },
              { id: 'config', label: 'Fee Configuration', icon: Settings },
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
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-primary hover:underline font-bold block cursor-pointer"
          >
            ← Back to Marketplace
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
              placeholder="Search ledger, orders, or KYC records..."
              className="w-full pl-9 pr-3 h-9 bg-page border border-line rounded text-[13px] text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
            />
          </div>
          <span className="text-[12px] font-bold text-primary-dark">Admin Console</span>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-[1200px] w-full mx-auto">
          {/* Row of 4 Compact Stat Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Verified Merchants</span>
                <Building className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{merchants.length}</div>
              <div className="text-[12px] text-muted mt-1">Wholesale Suppliers</div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Active IBO Storefronts</span>
                <Users className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{Object.keys(iboProfiles).length}</div>
              <div className="text-[12px] text-muted mt-1">Reseller Network</div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Accredited Couriers</span>
                <Truck className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{agents.length}</div>
              <div className="text-[12px] text-muted mt-1">Delivery Fleet</div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Pending KYC Reviews</span>
                <ShieldCheck className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                {kycSubmissions.filter((k) => k.status === 'pending').length}
              </div>
              <div className="text-[12px] text-primary-dark font-bold mt-1">Compliance Queue</div>
            </div>
          </div>

          {activeTab === 'finance' && <FinancialOverview onNavigate={onNavigate} />}

          {/* TAB: PAYOUT APPROVALS */}
          {activeTab === 'withdrawals' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line">
                <h2 className="section-title text-ink">
                  Bank Withdrawal Requests ({withdrawals.length})
                </h2>
                <p className="text-[12px] text-muted">
                  Approve or reject withdrawal requests from Merchants, IBOs, and Delivery Agents.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Role & Account</th>
                      <th className="py-3 px-4">Bank Destination</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted">
                          No bank withdrawal requests queued.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-primary-tint/40">
                          <td className="py-3 px-4 font-bold text-ink">{w.id}</td>
                          <td className="py-3 px-4 uppercase text-[12px] font-bold text-primary-dark">
                            {w.role} ({w.userId})
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {w.bankName} • {w.accountNumber} ({w.accountName})
                          </td>
                          <td className="py-3 px-4 font-bold text-ink">
                            ₦{w.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {w.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => platformStore.processWithdrawal(w.id, true)}
                                  className="px-2.5 h-8 rounded bg-primary text-on-primary font-bold text-[11px] cursor-pointer"
                                >
                                  Approve & Settle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => platformStore.processWithdrawal(w.id, false)}
                                  className="px-2.5 h-8 rounded border border-sale text-sale font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dispatch' && (
            <div className="bg-surface border border-line rounded p-6 space-y-4">
              <h2 className="section-title text-ink">Manual Order Dispatch Assignment</h2>
              {dispatchFeedback && (
                <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[13px] font-bold text-primary-dark">
                  {dispatchFeedback}
                </div>
              )}
              <form
                onSubmit={handleManualDispatch}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-[13px]"
              >
                <div>
                  <label className="block font-bold text-ink mb-1">Select Order</label>
                  <select
                    value={selectedOrderForDispatch}
                    onChange={(e) => setSelectedOrderForDispatch(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.customerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Assign Courier</label>
                  <select
                    value={selectedAgentForDispatch}
                    onChange={(e) => setSelectedAgentForDispatch(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.vehiclePlate})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] cursor-pointer"
                >
                  Assign Delivery Agent
                </button>
              </form>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line">
                <h2 className="section-title text-ink">KYC & Compliance Submissions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {kycSubmissions.map((k) => (
                      <tr key={k.id} className="hover:bg-primary-tint/40">
                        <td className="py-3 px-4 font-bold text-ink">
                          {k.entityName || k.userName}
                        </td>
                        <td className="py-3 px-4 uppercase text-muted text-[12px]">{k.role}</td>
                        <td className="py-3 px-4 text-ink">
                          {k.documentType} ({k.documentNumber})
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                            {k.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => platformStore.updateKycStatus(k.id, 'approved')}
                            className="text-[12px] font-bold text-primary-dark hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => platformStore.updateKycStatus(k.id, 'rejected')}
                            className="text-[12px] font-bold text-sale hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Reject</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: STAGE 2 FAILED DELIVERY DISPUTES ADJUDICATION */}
          {activeTab === 'disputes' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line">
                <h2 className="section-title text-ink">
                  Two-Stage Failed Delivery Disputes (15/15/20 Rule)
                </h2>
                <p className="text-[12px] text-muted">
                  Stage 1 automatically applies the 15% Agent / 15% Platform / 20% Reserve / 50% Customer Refund split. Use Stage 2 controls below to uphold, adjust, or dismiss disputes.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Failure Reason & Notes</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Stage 2 Adjudication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {failedDeliveryDisputes.map((d) => (
                      <tr key={d.id} className="hover:bg-primary-tint/40">
                        <td className="py-3 px-4 font-bold text-ink whitespace-nowrap">
                          {d.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-ink capitalize">
                            {(d.failureReason || '').replace(/_/g, ' ')}
                          </div>
                          <div className="text-[12px] text-muted">
                            {d.disputeReason || d.adjudicationNotes}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                            {d.adjudicationStatus || d.stage || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              platformStore.adjudicateFailedDeliveryDispute(
                                d.id,
                                'upheld',
                                'Standard 15/15/20 allocation upheld by Founder Admin.'
                              )
                            }
                            className="px-2.5 h-8 rounded bg-primary text-on-primary font-bold text-[11px] cursor-pointer"
                          >
                            Uphold 15/15/20
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              platformStore.adjudicateFailedDeliveryDispute(
                                d.id,
                                'adjusted',
                                'Fault re-assigned after Stage 2 depot evidence review.'
                              )
                            }
                            className="px-2.5 h-8 rounded border border-primary-dark bg-primary-tint text-primary-dark font-bold text-[11px] cursor-pointer"
                          >
                            Adjust Fault
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              platformStore.adjudicateFailedDeliveryDispute(
                                d.id,
                                'dismissed',
                                'Dispute claim dismissed.'
                              )
                            }
                            className="px-2.5 h-8 rounded border border-line text-muted hover:text-ink font-bold text-[11px] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-surface border border-line rounded p-6 space-y-4 max-w-xl">
              <h2 className="section-title text-ink">Platform Commission Configuration</h2>
              {configSaved && (
                <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[13px] font-bold text-primary-dark">
                  Configuration saved.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <label className="block font-bold text-ink mb-1">
                    Platform Product Cut (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editableConfig.platformProductCutPct}
                    onChange={(e) =>
                      setEditableConfig({
                        ...editableConfig,
                        platformProductCutPct: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">
                    Delivery Logistics Cut (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editableConfig.platformLogisticsCommissionPct}
                    onChange={(e) =>
                      setEditableConfig({
                        ...editableConfig,
                        platformLogisticsCommissionPct: Number(e.target.value),
                        deliveryAgentFounderCommissionPct: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  platformStore.updateConfig(editableConfig);
                  setConfigSaved(true);
                  setTimeout(() => setConfigSaved(false), 2000);
                }}
                className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" strokeWidth={1.75} />
                <span>Save Configuration</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
