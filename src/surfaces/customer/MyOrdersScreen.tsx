import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Package,
  Search,
  MapPin,
  QrCode,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CustomerQrScannerModal } from '../../components/CustomerQrScannerModal';
import { LiveDeliveryTrackingMap } from '../../components/LiveDeliveryTrackingMap';

interface MyOrdersScreenProps {
  onNavigate: (path: string) => void;
  initialOrderNumber?: string;
}

function formatFriendlyStatus(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'Waiting for payment';
    case 'placed':
    case 'paid_in_escrow':
      return 'Order received — Preparing your items';
    case 'awaiting_merchant_prep':
      return 'Seller is packing your order';
    case 'ready_for_pickup':
      return 'Ready for delivery rider pickup';
    case 'dispatched':
    case 'assigned_to_agent':
      return 'Delivery rider assigned';
    case 'in_transit':
      return 'Rider is on the way to you';
    case 'arrived_at_customer':
      return 'Rider has arrived at your address';
    case 'delivered':
      return 'Delivered';
    case 'failed_delivery':
      return 'Delivery could not be completed';
    default:
      return status.replace(/_/g, ' ');
  }
}

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({
  onNavigate,
  initialOrderNumber = '',
}) => {
  const { currentAppUser, userProfile } = useAuth();
  const [, setStoreTick] = useState(0);

  useEffect(() => {
    return platformStore.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const allOrders = platformStore.getState().orders;

  // Filter orders belonging to the signed-in customer, or fallback to customer orders in demo
  const activeName = (currentAppUser?.name || userProfile?.displayName || '').toLowerCase();
  const activePhone = (currentAppUser?.phone || userProfile?.phone || '').replace(/\D/g, '');
  const myOrders = allOrders.filter((ord) => {
    if (!activeName && !activePhone) return true;
    const matchName = activeName && ord.customerName.toLowerCase().includes(activeName);
    const matchPhone =
      activePhone &&
      ord.customerPhone.replace(/\D/g, '').slice(-8) === activePhone.slice(-8);
    return matchName || matchPhone;
  });

  const displayedOrders = myOrders.length > 0 ? myOrders : allOrders;

  // Track My Order lookup state inside My Orders page
  const [orderQuery, setOrderQuery] = useState(initialOrderNumber);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(() => {
    if (!initialOrderNumber) return null;
    const q = initialOrderNumber.trim().toUpperCase();
    return (
      allOrders.find((o) => o.orderNumber.toUpperCase() === q) ||
      allOrders.find((o) => o.id.toUpperCase() === q) ||
      null
    );
  });
  const [searchAttempted, setSearchAttempted] = useState(Boolean(initialOrderNumber));

  // Expanded live map per order ID
  const [expandedMapOrderId, setExpandedMapOrderId] = useState<string | null>(null);
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderQuery.trim().toUpperCase();
    setSearchAttempted(true);
    if (!q) {
      setTrackedOrder(null);
      return;
    }
    const found =
      allOrders.find((o) => o.orderNumber.toUpperCase() === q) ||
      allOrders.find((o) => o.id.toUpperCase() === q) ||
      null;
    setTrackedOrder(found);
    if (found) {
      setExpandedMapOrderId(found.id);
    }
  };

  const filteredOrders = displayedOrders.filter((ord) => {
    if (statusFilter === 'active') return ord.orderStatus !== 'delivered';
    if (statusFilter === 'delivered') return ord.orderStatus === 'delivered';
    return true;
  });

  return (
    <div className="bg-page min-h-screen py-6">
      <div className="container-market space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-muted">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="hover:text-primary-dark cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span className="text-ink font-medium">My Orders &amp; Track Order</span>
        </nav>

        {/* Page Header */}
        <div className="bg-surface border border-line rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
              <Package className="w-4 h-4" strokeWidth={1.75} />
              <span>Orders &amp; Live Delivery Tracking</span>
            </div>
            <h1 className="page-title text-ink">My Orders</h1>
            <p className="text-[13px] text-muted mt-0.5">
              View your orders, track your delivery rider on the live map, and confirm delivery when your package arrives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-10 px-4 bg-surface border border-line hover:border-primary-dark text-ink font-bold text-[13px] rounded flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* TRACK MY ORDER SECTION (Inside My Orders Page) */}
        <section
          aria-label="Track my order by order number"
          className="bg-surface border border-line rounded p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="section-title text-ink">Track My Order</h2>
              <p className="text-[12px] text-muted">
                Enter an Order Number below to check its live delivery status or open the live GPS map.
              </p>
            </div>
            {allOrders[0] && (
              <button
                type="button"
                onClick={() => {
                  const sampleNo = allOrders[0].orderNumber;
                  setOrderQuery(sampleNo);
                  setSearchAttempted(true);
                  setTrackedOrder(allOrders[0]);
                  setExpandedMapOrderId(allOrders[0].id);
                }}
                className="text-[12px] text-primary-dark font-bold hover:underline cursor-pointer self-start sm:self-auto"
              >
                Track sample order ({allOrders[0].orderNumber})
              </button>
            )}
          </div>

          <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Enter your Order Number (e.g. ORD-2026-9041)..."
                className="w-full h-10 pl-10 pr-4 bg-page border border-line rounded text-[14px] text-ink focus:outline-none focus:border-primary-dark"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded cursor-pointer shrink-0"
            >
              Track Order
            </button>
            {searchAttempted && (
              <button
                type="button"
                onClick={() => {
                  setOrderQuery('');
                  setTrackedOrder(null);
                  setSearchAttempted(false);
                }}
                className="h-10 px-4 bg-surface border border-line text-muted hover:text-ink font-bold text-[13px] rounded cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </form>

          {searchAttempted && !trackedOrder && (
            <div className="p-4 bg-page border border-line rounded text-[13px] text-ink">
              We couldn't find an order matching <strong>"{orderQuery}"</strong>. Please check the order number from your checkout receipt or select one of your orders below.
            </div>
          )}

          {trackedOrder && (
            <div className="p-4 bg-primary-tint/40 border border-primary-dark rounded space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <div className="text-[11px] font-bold text-primary-dark uppercase">
                    Tracked Order Result
                  </div>
                  <div className="text-[17px] font-bold text-ink">
                    {trackedOrder.orderNumber} · ₦{trackedOrder.totalAmount.toLocaleString()}
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-surface border border-primary-dark text-primary-dark font-bold text-[12px]">
                  {formatFriendlyStatus(trackedOrder.orderStatus)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                <div className="bg-surface border border-line rounded p-3">
                  <div className="text-muted text-[11px] uppercase font-bold">Delivering To</div>
                  <div className="font-bold text-ink mt-0.5">{trackedOrder.customerName}</div>
                  <div className="text-muted text-[12px] mt-0.5">{trackedOrder.deliveryAddress}</div>
                </div>
                <div className="bg-surface border border-line rounded p-3">
                  <div className="text-muted text-[11px] uppercase font-bold">Delivery Rider</div>
                  <div className="font-bold text-ink mt-0.5">
                    {trackedOrder.agentName || 'Assigning nearest rider'}
                  </div>
                  <div className="text-muted text-[12px] mt-0.5">
                    {trackedOrder.agentVehicle || 'Standard Express Dispatch'}
                  </div>
                </div>
                <div className="bg-surface border border-line rounded p-3">
                  <div className="text-muted text-[11px] uppercase font-bold">Safe Payment Status</div>
                  <div className="font-bold text-primary-dark mt-0.5">
                    {trackedOrder.orderStatus === 'delivered'
                      ? 'Delivered & Paid'
                      : 'Payment held safely until delivery'}
                  </div>
                  <div className="text-muted text-[12px] mt-0.5 font-mono">
                    Code: {trackedOrder.confirmationQrToken}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <LiveDeliveryTrackingMap
                  mode="customer"
                  order={trackedOrder}
                  onOpenQrModal={(ord) => setQrModalOrder(ord)}
                />
              </div>
            </div>
          )}
        </section>

        {/* MY ORDERS LIST */}
        <section aria-label="Order history" className="bg-surface border border-line rounded p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="section-title text-ink">
                Your Orders ({filteredOrders.length})
              </h2>
              <p className="text-[12px] text-muted">
                Click "Track Live Map" on any order to see your rider's progress or "Confirm Delivery" when your package arrives.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-page p-1 rounded border border-line self-start">
              {[
                { id: 'all', label: `All (${displayedOrders.length})` },
                {
                  id: 'active',
                  label: `In Progress (${displayedOrders.filter((o) => o.orderStatus !== 'delivered').length})`,
                },
                {
                  id: 'delivered',
                  label: `Delivered (${displayedOrders.filter((o) => o.orderStatus === 'delivered').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded text-[12px] font-bold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-surface text-primary-dark border border-line'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <Package className="w-10 h-10 text-muted mx-auto" strokeWidth={1.75} />
              <div className="font-bold text-[15px] text-ink">No orders in this view</div>
              <p className="text-[13px] text-muted max-w-md mx-auto">
                When you place an order on IBO Hub or any partner shop, it will appear right here so you can track delivery.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="h-10 px-5 bg-primary text-on-primary font-bold text-[13px] rounded cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredOrders.map((ord) => {
                const isMapExpanded = expandedMapOrderId === ord.id;
                const isDelivered = ord.orderStatus === 'delivered';
                return (
                  <div key={ord.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold text-ink">{ord.orderNumber}</span>
                          <span className="text-muted">·</span>
                          <span className="price-text text-ink">
                            ₦{ord.totalAmount.toLocaleString()}
                          </span>
                          <span className="text-muted">·</span>
                          <span className="text-[12px] text-muted">
                            {new Date(ord.createdAt).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="text-[13px] text-ink font-medium">
                          {ord.items.map((i) => `${i.quantity}x ${i.productTitle}`).join(', ')}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                            <span>{ord.deliveryAddress}</span>
                          </span>
                          {ord.agentName && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 text-ink font-medium">
                                <Truck className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                                <span>
                                  Rider: {ord.agentName} ({ord.agentVehicle || 'Assigned'})
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded text-[12px] font-bold inline-flex items-center gap-1.5 border ${
                            isDelivered
                              ? 'bg-primary-tint border-primary-dark text-primary-dark'
                              : 'bg-page border-line text-ink'
                          }`}
                        >
                          {isDelivered ? (
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                          )}
                          <span>{formatFriendlyStatus(ord.orderStatus)}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMapOrderId(isMapExpanded ? null : ord.id)
                          }
                          className="h-9 px-3.5 bg-surface border border-line hover:border-primary-dark text-ink font-bold text-[12px] rounded flex items-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                          <span>{isMapExpanded ? 'Hide Live Map' : 'Track Live Map'}</span>
                        </button>

                        {!isDelivered && ord.orderStatus !== 'failed_delivery' && (
                          <button
                            type="button"
                            onClick={() => setQrModalOrder(ord)}
                            className="h-9 px-3.5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[12px] rounded flex items-center gap-1.5 cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" strokeWidth={1.75} />
                            <span>Confirm Delivery</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items Breakdown Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-page border border-line rounded flex items-center gap-3 text-[12px]"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.productTitle}
                            className="w-11 h-11 rounded object-cover border border-line bg-surface shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onNavigate(`/product/${item.productId}`)}
                              className="font-bold text-ink hover:text-primary-dark truncate block text-left w-full cursor-pointer"
                            >
                              {item.productTitle}
                            </button>
                            <div className="text-muted">
                              Qty: {item.quantity} · ₦{(item.unitPrice * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isMapExpanded && (
                      <div className="pt-2">
                        <LiveDeliveryTrackingMap
                          mode="customer"
                          order={ord}
                          onOpenQrModal={(selectedOrd) => setQrModalOrder(selectedOrd)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Safe Payment Assurance Banner */}
        <div className="bg-surface border border-line rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
            <span>
              <strong>Safe Payment Protection:</strong> Your payment is kept safe until your package arrives and you confirm delivery with the rider.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="text-primary-dark font-bold hover:underline shrink-0 cursor-pointer"
          >
            Need help with an order? Contact Support →
          </button>
        </div>
      </div>

      {qrModalOrder && (
        <CustomerQrScannerModal
          order={qrModalOrder}
          onClose={() => setQrModalOrder(null)}
          onSuccess={() => {
            const refreshed =
              platformStore.getState().orders.find((o) => o.id === qrModalOrder.id) || null;
            if (trackedOrder && trackedOrder.id === qrModalOrder.id) {
              setTrackedOrder(refreshed);
            }
            setStoreTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
};
