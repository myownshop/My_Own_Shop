import React, { useState, useEffect } from 'react';
import {
  Truck,
  QrCode,
  Camera,
  Clock,
  DollarSign,
  Search,
  ArrowUpDown,
  Users,
  Copy,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  MapPin,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { DeliveryAgentProfile, Order } from '../../types';
import { AgentQrGenerator } from '../../components/AgentQrGenerator';
import { DeliveryAgentQrScanner } from '../../components/DeliveryAgentQrScanner';
import { LiveDeliveryTrackingMap } from '../../components/LiveDeliveryTrackingMap';
import { useAuth } from '../../context/AuthContext';

interface DeliveryAgentAppScreenProps {
  onNavigate: (path: string) => void;
}

export const DeliveryAgentAppScreen: React.FC<DeliveryAgentAppScreenProps> = ({
  onNavigate,
}) => {
  const { currentAppUser, signOutUser } = useAuth();
  const [, setStoreTick] = useState(0);
  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const state = platformStore.getState();
  const { agents, orders, config, withdrawals } = state;

  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    if (
      currentAppUser?.role === 'agent' &&
      currentAppUser.entityId &&
      agents.some((a) => a.id === currentAppUser.entityId)
    ) {
      return currentAppUser.entityId;
    }
    const urlId =
      new URLSearchParams(window.location.search).get('id') ||
      new URLSearchParams(window.location.search).get('agentId');
    if (urlId && agents.some((a) => a.id === urlId)) return urlId;
    const saved = localStorage.getItem('activeAgentId');
    if (saved && agents.some((a) => a.id === saved)) return saved;
    return agents[0]?.id || 'agt-1';
  });

  useEffect(() => {
    if (
      currentAppUser?.role === 'agent' &&
      currentAppUser.entityId &&
      agents.some((a) => a.id === currentAppUser.entityId) &&
      currentAppUser.entityId !== selectedAgentId
    ) {
      setSelectedAgentId(currentAppUser.entityId);
    }
  }, [currentAppUser, agents, selectedAgentId]);

  const agent: DeliveryAgentProfile =
    agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Strictly scope orders: unassigned orders vs orders assigned specifically to THIS agent
  const availableJobs = orders.filter(
    (o) => !o.agentId && o.orderStatus === 'placed'
  );
  const activeDeliveries = orders.filter((o) => o.agentId === agent.id);
  const myWithdrawals = withdrawals.filter(
    (w) => w.userId === agent.id || w.userId === agent.userId
  );

  const [activeTab, setActiveTab] = useState<
    'available' | 'active' | 'map' | 'earnings' | 'qr' | 'scan'
  >('active');
  const [selectedJobId, setSelectedJobId] = useState<string>(
    activeDeliveries[0]?.id || orders[0]?.id || ''
  );
  const selectedJob =
    orders.find((j) => j.id === selectedJobId) ||
    activeDeliveries[0] ||
    orders[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Failed delivery dispute reporting modal (15/15/20 recoup rule)
  const [failedOrderModal, setFailedOrderModal] = useState<Order | null>(null);
  const [failureReason, setFailureReason] = useState<
    'customer_refused' | 'wrong_or_damaged_item' | 'agent_no_show' | 'other'
  >('customer_refused');

  // Courier bank withdrawal modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(3000);
  const [bankName, setBankName] = useState('OPay / Paycom');
  const [accountNumber, setAccountNumber] = useState('8031234567');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const wallet = platformStore.getWalletBalanceForAccount(`agent_payable:${agent.id}`);
  const downlineCouriers = agents.filter((a) => a.referredByAgentId === agent.id);

  const handleOpenQrModal = (orderId: string) => {
    setSelectedJobId(orderId);
    const job = orders.find((o) => o.id === orderId);
    if (job && job.orderStatus !== 'delivered') {
      if (job.isPickupConfirmed) {
        platformStore.regenerateDeliveryQrToken(job.id);
      } else {
        platformStore.regeneratePickupQrToken(job.id);
      }
    }
    setActiveTab('qr');
  };

  const handleClaimJob = (orderId: string) => {
    const res = platformStore.claimOrderAsAgent(orderId, agent.id);
    if (res.success) {
      setSelectedJobId(orderId);
      setStatusFeedback(`Order claimed and assigned to ${agent.name} (${agent.vehiclePlate}).`);
      setActiveTab('active');
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  const handleReportFailedDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedOrderModal) return;
    const recoup = platformStore.markDeliveryFailed(failedOrderModal.id, failureReason);
    if (recoup) {
      setStatusFeedback(
        `Failed delivery logged for ${failedOrderModal.orderNumber}. Stage 1 (15/15/20) recoup split applied.`
      );
      setTimeout(() => setStatusFeedback(null), 4000);
    }
    setFailedOrderModal(null);
  };

  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    const res = platformStore.requestWithdrawal(agent.id, 'agent', withdrawAmount, {
      bankName,
      accountNumber,
      accountName: agent.name,
    });
    if (!res.success) {
      setWithdrawError(res.error || 'Failed to submit withdrawal.');
    } else {
      setIsWithdrawModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col md:flex-row">
      {/* Dark Left Sidebar (#14181F) */}
      <aside className="w-full md:w-60 bg-dark text-white shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-line">
        <div>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-white">Delivery Agent</div>
              <div className="text-[11px] text-white/60 truncate max-w-[150px]">
                {agent.name} • {agent.vehiclePlate}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-bold uppercase">
              ONLINE
            </span>
          </div>

          <nav className="py-2 flex md:flex-col overflow-x-auto">
            {[
              {
                id: 'active',
                label: `My Assigned Trips (${activeDeliveries.length})`,
                icon: Truck,
              },
              {
                id: 'map',
                label: 'Live Route Map',
                icon: MapPin,
              },
              {
                id: 'available',
                label: `Unassigned Pool (${availableJobs.length})`,
                icon: Clock,
              },
              { id: 'earnings', label: 'Earnings & Fleet', icon: DollarSign },
              { id: 'qr', label: 'Handover QR Code', icon: QrCode },
              { id: 'scan', label: 'Scan QR Camera', icon: Camera },
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
          <div className="text-white/60">
            Hub: {agent.operatingHubCity || agent.operatingAreas?.[0] || 'Lagos'}
          </div>
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
              placeholder="Search order number, destination, or buyer..."
              className="w-full pl-9 pr-3 h-9 bg-page border border-line rounded text-[13px] text-ink placeholder-muted focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div className="flex items-center gap-3">
            {(!currentAppUser || currentAppUser.role === 'founder') && (
              <select
                value={agent.id}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  localStorage.setItem('activeAgentId', e.target.value);
                }}
                aria-label="Select courier profile"
                className="h-9 px-2.5 bg-surface border border-line rounded text-[12px] font-bold text-ink focus:outline-none focus:border-primary-dark"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.vehiclePlate})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4" strokeWidth={1.75} />
              <span>Show QR</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-[1200px] w-full mx-auto">
          {statusFeedback && (
            <div className="p-3 bg-primary-tint border border-primary-dark rounded text-[13px] font-bold text-primary-dark flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Row of 4 Compact Stat Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Available Courier Balance</span>
                <DollarSign className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">
                ₦{(wallet?.availableBalance ?? 0).toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawError(null);
                  setIsWithdrawModalOpen(true);
                }}
                className="text-[12px] font-bold text-primary-dark hover:underline mt-1 inline-block cursor-pointer"
              >
                Withdraw payout →
              </button>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Unassigned Dispatch Pool</span>
                <Clock className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{availableJobs.length}</div>
              <div className="text-[12px] text-muted mt-1">
                {agent.operatingHubCity || 'Lagos'} Zone
              </div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>My Assigned Trips</span>
                <Truck className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{activeDeliveries.length}</div>
              <div className="text-[12px] text-muted mt-1">Vehicle: {agent.vehiclePlate}</div>
            </div>

            <div className="bg-surface border border-line rounded p-4">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>Referred Couriers</span>
                <Users className="w-4 h-4 text-ink" strokeWidth={1.75} />
              </div>
              <div className="price-text text-ink mt-1">{downlineCouriers.length}</div>
              <div className="text-[12px] text-primary-dark font-bold mt-1">
                Code: {agent.referralCode}
              </div>
            </div>
          </div>

          {/* TAB 1: MY ASSIGNED DELIVERIES TABLE (Strictly scoped to agent.id) */}
          {activeTab === 'active' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="section-title text-ink">
                    My Assigned Deliveries ({activeDeliveries.length})
                  </h2>
                  <p className="text-[12px] text-muted">
                    Orders assigned specifically to {agent.name} ({agent.vehiclePlate}). Present the handover QR code to the buyer on arrival to release escrow.
                  </p>
                </div>
                {availableJobs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className="text-[12px] font-bold text-primary-dark hover:underline cursor-pointer"
                  >
                    View Unassigned Pool ({availableJobs.length}) →
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer & Phone</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Net Fee (90%)</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {activeDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted">
                          No orders currently assigned to {agent.name}. Check the Unassigned Pool to claim a job.
                        </td>
                      </tr>
                    ) : (
                      activeDeliveries
                        .filter(
                          (o) =>
                            !searchQuery.trim() ||
                            o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((job) => {
                          const netPayout = Math.round(
                            job.deliveryFee *
                              (1 - (config?.platformLogisticsCommissionPct ?? 10) / 100)
                          );
                          return (
                            <tr key={job.id} className="hover:bg-primary-tint/40">
                              <td className="py-3 px-4 font-bold text-ink">{job.orderNumber}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-ink">{job.customerName}</div>
                                <div className="text-[12px] text-muted">{job.customerPhone}</div>
                              </td>
                              <td className="py-3 px-4 text-muted truncate max-w-[220px]">
                                {job.deliveryAddress}
                              </td>
                              <td className="py-3 px-4 font-bold text-ink">
                                ₦{netPayout.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                                    job.orderStatus === 'delivered'
                                      ? 'bg-primary-tint border-primary-dark text-primary-dark'
                                      : job.orderStatus === 'failed_delivery'
                                      ? 'bg-surface border-sale text-sale'
                                      : 'bg-page border-line text-ink'
                                  }`}
                                >
                                  {job.orderStatus.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJobId(job.id);
                                    setActiveTab('map');
                                  }}
                                  className="px-2.5 h-8 rounded border border-primary-dark text-primary-dark font-bold text-[11px] hover:bg-primary-tint cursor-pointer"
                                >
                                  Live Map
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQrModal(job.id)}
                                  className="px-2.5 h-8 rounded bg-primary text-on-primary font-bold text-[11px] cursor-pointer"
                                >
                                  Show QR
                                </button>
                                {job.orderStatus !== 'delivered' &&
                                  job.orderStatus !== 'failed_delivery' && (
                                    <button
                                      type="button"
                                      onClick={() => setFailedOrderModal(job)}
                                      className="px-2.5 h-8 rounded border border-sale text-sale font-bold text-[11px] hover:bg-page cursor-pointer"
                                    >
                                      Report Issue
                                    </button>
                                  )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {selectedJob && activeDeliveries.some((d) => d.id === selectedJob.id) && (
                <div className="p-4 border-t border-line bg-page space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[12px] font-bold text-ink uppercase">
                      Active Route Telemetry ({selectedJob.orderNumber})
                    </div>
                    {activeDeliveries.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {activeDeliveries.map((trip) => (
                          <button
                            key={trip.id}
                            type="button"
                            onClick={() => setSelectedJobId(trip.id)}
                            className={`px-2.5 h-7 rounded text-[11px] font-bold border cursor-pointer ${
                              selectedJob.id === trip.id
                                ? 'bg-primary text-on-primary border-primary-dark'
                                : 'bg-surface text-ink border-line hover:bg-page'
                            }`}
                          >
                            {trip.orderNumber}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <LiveDeliveryTrackingMap
                    mode="agent"
                    order={selectedJob}
                    agent={agent}
                    onOpenQrModal={(ord) => handleOpenQrModal(ord.id)}
                    onScanPickupQr={() => setActiveTab('scan')}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 1B: DEDICATED LIVE ROUTE MAP */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              {activeDeliveries.length > 0 && (
                <div className="bg-surface border border-line rounded p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink">
                    Select Assigned Trip to Track on Map:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeDeliveries.map((trip) => (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => setSelectedJobId(trip.id)}
                        className={`px-3 h-8 rounded text-[12px] font-bold border cursor-pointer ${
                          selectedJob?.id === trip.id
                            ? 'bg-primary text-on-primary border-primary-dark'
                            : 'bg-page text-ink border-line hover:bg-surface'
                        }`}
                      >
                        {trip.orderNumber} ({trip.isPickupConfirmed ? 'In Transit' : 'To Pickup Hub'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob ? (
                <LiveDeliveryTrackingMap
                  mode="agent"
                  order={selectedJob}
                  agent={agent}
                  onOpenQrModal={(ord) => handleOpenQrModal(ord.id)}
                  onScanPickupQr={() => setActiveTab('scan')}
                />
              ) : (
                <div className="bg-surface border border-line rounded p-8 text-center text-[13px] text-muted">
                  No assigned trips to track. Claim an order from the Unassigned Pool first.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UNASSIGNED AVAILABLE JOBS POOL */}
          {activeTab === 'available' && (
            <div className="bg-surface border border-line rounded overflow-hidden">
              <div className="p-4 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="section-title text-ink">
                    Unassigned Dispatch Pool ({availableJobs.length})
                  </h2>
                  <p className="text-[12px] text-muted">
                    Claim unassigned orders in your operating zone to pick up from the hub and deliver.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Pickup Hub</th>
                      <th className="py-3 px-4">Drop-off Address</th>
                      <th className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSortAsc(!sortAsc)}
                          className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
                        >
                          <span>Your Net Fee (90%)</span>
                          <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {availableJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted">
                          All current orders have been claimed by couriers. Place a new order in a storefront to test claiming!
                        </td>
                      </tr>
                    ) : (
                      availableJobs
                        .sort((a, b) =>
                          sortAsc
                            ? a.deliveryFee - b.deliveryFee
                            : b.deliveryFee - a.deliveryFee
                        )
                        .map((job) => {
                          const netPayout = Math.round(
                            job.deliveryFee *
                              (1 - (config?.platformLogisticsCommissionPct ?? 10) / 100)
                          );
                          return (
                            <tr
                              key={job.id}
                              className="hover:bg-primary-tint/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-bold text-ink">{job.orderNumber}</td>
                              <td className="py-3 px-4 text-muted">Ikeja Central Hub</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-ink">{job.customerName}</div>
                                <div className="text-[12px] text-muted truncate max-w-[240px]">
                                  {job.deliveryAddress}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold text-ink">
                                ₦{netPayout.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                                  UNASSIGNED
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleClaimJob(job.id)}
                                  className="px-3.5 h-8 rounded bg-primary hover:bg-primary-dark text-on-primary font-bold text-[12px] cursor-pointer"
                                >
                                  Claim Delivery Job
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

          {/* TAB 3: EARNINGS & FLEET REFERRALS */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-surface border border-line rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="section-title text-ink">Courier Fleet Referral Link</h2>
                  <p className="text-[13px] text-muted">
                    Earn 2% Tier 1, 1% Tier 2, and 0.5% Tier 3 overrides on every delivery completed by riders you refer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/agent/signup?ref=${agent.referralCode}`
                    );
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Copy className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  <span>
                    {copiedLink ? 'Copied!' : `Copy Invite Link (${agent.referralCode})`}
                  </span>
                </button>
              </div>

              <div className="bg-surface border border-line rounded overflow-hidden">
                <div className="p-4 border-b border-line">
                  <h3 className="font-bold text-[15px] text-ink">Referred Downline Couriers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                        <th className="py-3 px-4">Courier Name</th>
                        <th className="py-3 px-4">Vehicle & Plate</th>
                        <th className="py-3 px-4">Operating Hub</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {downlineCouriers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted">
                            No referred couriers yet. Share your code {agent.referralCode} to grow your fleet.
                          </td>
                        </tr>
                      ) : (
                        downlineCouriers.map((dl) => (
                          <tr key={dl.id} className="hover:bg-primary-tint/40">
                            <td className="py-3 px-4 font-bold text-ink">{dl.name}</td>
                            <td className="py-3 px-4 text-muted">
                              {dl.vehicleType} ({dl.vehiclePlate})
                            </td>
                            <td className="py-3 px-4 text-muted">
                              {dl.operatingHubCity || dl.operatingAreas?.[0] || 'Lagos'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                                {dl.status || 'active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Courier Withdrawals */}
              {myWithdrawals.length > 0 && (
                <div className="bg-surface border border-line rounded overflow-hidden">
                  <div className="p-4 border-b border-line">
                    <h3 className="font-bold text-[15px] text-ink">Courier Payout History</h3>
                  </div>
                  <div className="divide-y divide-line text-[13px]">
                    {myWithdrawals.map((w) => (
                      <div key={w.id} className="p-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-ink">₦{w.amount.toLocaleString()}</div>
                          <div className="text-[12px] text-muted">
                            {w.bankName} • {w.accountNumber}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-tint border border-primary-dark text-primary-dark">
                          {w.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HANDOVER QR PRESENTATION */}
          {activeTab === 'qr' && selectedJob && (
            <div className="bg-surface border border-line rounded p-6 max-w-lg mx-auto">
              <AgentQrGenerator
                order={selectedJob}
                agent={agent}
                onNavigate={onNavigate}
                onOrderUpdated={() => setStoreTick((t) => t + 1)}
              />
            </div>
          )}

          {/* TAB 5: SCAN QR CAMERA */}
          {activeTab === 'scan' && (
            <div className="bg-surface border border-line rounded p-6 max-w-lg mx-auto">
              <DeliveryAgentQrScanner
                agent={agent}
                activeOrder={selectedJob}
                assignedOrders={activeDeliveries}
                onOrderDelivered={(order) => {
                  setSelectedJobId(order.id);
                  setStoreTick((t) => t + 1);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Report Failed Delivery Modal (15/15/20 Recoup Rule) */}
      {failedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sale" strokeWidth={1.75} />
                <h3 className="section-title text-ink">Report Failed Delivery</h3>
              </div>
              <button
                type="button"
                onClick={() => setFailedOrderModal(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-[12px] text-muted">
              Reporting a failed delivery for <strong>{failedOrderModal.orderNumber}</strong> triggers Stage 1 of the 15/15/20 Recoup Rule (15% courier compensation, 15% platform fee, 20% reserve, 50% customer refund) and opens a Stage 2 review in Founder Admin.
            </p>

            <form onSubmit={handleReportFailedDelivery} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-ink mb-1">Failure Reason *</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value as any)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                >
                  <option value="customer_refused">
                    Customer Refused Package / Unavailable at Doorstep
                  </option>
                  <option value="wrong_or_damaged_item">
                    Wrong or Damaged Item Discovered at Inspection
                  </option>
                  <option value="agent_no_show">Vehicle Breakdown / Unable to Complete</option>
                  <option value="other">Other Delivery Exception</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailedOrderModal(null)}
                  className="px-4 h-10 border border-line rounded text-[13px] font-bold text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 bg-sale text-white font-bold rounded text-[13px] cursor-pointer"
                >
                  Confirm Failed Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courier Bank Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="section-title text-ink">Withdraw Courier Earnings</h3>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
            {withdrawError && (
              <div className="p-3 bg-surface border border-sale rounded text-sale text-[12px]">
                {withdrawError}
              </div>
            )}
            <form onSubmit={handleRequestWithdrawal} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-ink mb-1">Amount (₦)</label>
                <input
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Bank / Mobile Money</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                />
              </div>
              <div>
                <label className="block font-bold text-ink mb-1">Account Number</label>
                <input
                  type="text"
                  required
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
                  Submit Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
