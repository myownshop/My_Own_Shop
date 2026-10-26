import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  CreditCard,
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Search,
  Package,
  QrCode,
  Check,
} from 'lucide-react';
import { platformStore } from '../../services/store';
import { Order } from '../../types';
import { CustomerQrScannerModal } from '../../components/CustomerQrScannerModal';
import { LiveDeliveryTrackingMap } from '../../components/LiveDeliveryTrackingMap';

export type InfoPageType =
  | 'help'
  | 'track-order'
  | 'returns-policy'
  | 'contact'
  | 'about'
  | 'verified-sellers'
  | 'terms'
  | 'privacy'
  | 'fee-schedule'
  | 'escrow-protection'
  | 'payment-methods'
  | 'delivery-rates';

interface InfoPagesScreenProps {
  page: InfoPageType;
  onNavigate: (path: string) => void;
}

const SIDEBAR_ITEMS: { id: InfoPageType; label: string; path: string }[] = [
  { id: 'help', label: 'Help & Common Questions', path: '/help' },
  { id: 'track-order', label: 'Track My Order', path: '/track-order' },
  { id: 'escrow-protection', label: 'Safe Payment Protection', path: '/escrow-protection' },
  { id: 'delivery-rates', label: 'Delivery Times & Cost', path: '/delivery-rates' },
  { id: 'returns-policy', label: 'Returns & Refunds', path: '/returns-policy' },
  { id: 'contact', label: 'Contact Us', path: '/contact' },
];

const SIMPLE_FAQS = [
  {
    q: 'How does shopping on IBO Hub work?',
    a: 'Pick the items you want and place your order. We keep your payment safe while the seller packs your order and our delivery rider brings it to your door.',
  },
  {
    q: 'When does the seller get my money?',
    a: 'The seller is only paid after your package arrives, you check that everything is okay, and you confirm delivery with the rider.',
  },
  {
    q: 'How much does delivery cost?',
    a: 'Delivery is FREE on all orders from ₦20,000 and above! For orders under ₦20,000, picking up at a local pickup point costs ₦1,000 and home delivery costs ₦2,500 in major cities.',
  },
  {
    q: 'What if I receive the wrong item or something is damaged?',
    a: 'You can check your package when the rider brings it. If it is the wrong item or damaged, simply refuse it and you will get all your money back. You also have 7 days after delivery to return faulty items.',
  },
  {
    q: 'How can I pay for my order?',
    a: 'You can pay with your bank card (Verve, Visa, or Mastercard), make a normal bank transfer from your phone, or pay when the rider arrives at your door.',
  },
  {
    q: 'How do I earn money with IBO Hub?',
    a: 'You can open your own free online shop ("Become an IBO") to resell products and add your own profit, list your own goods ("Sell on IBO Hub"), or deliver packages with your bike or van ("Become a delivery agent").',
  },
];

function formatFriendlyStatus(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'Waiting for payment';
    case 'paid_in_escrow':
      return 'Order received — Preparing your items';
    case 'awaiting_merchant_prep':
      return 'Seller is packing your order';
    case 'ready_for_pickup':
      return 'Ready for delivery rider pickup';
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

export const InfoPagesScreen: React.FC<InfoPagesScreenProps> = ({ page, onNavigate }) => {
  const allOrders = platformStore.getState().orders;

  // Track Order state — clean and empty until the shopper enters an order number
  const [orderQuery, setOrderQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  const [showLiveMap, setShowLiveMap] = useState<boolean>(false);

  // Help search state
  const [faqQuery, setFaqQuery] = useState('');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrderNo, setContactOrderNo] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

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
    setShowLiveMap(false);
  };

  const filteredFaqs = SIMPLE_FAQS.filter(
    (f) =>
      !faqQuery.trim() ||
      f.q.toLowerCase().includes(faqQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(faqQuery.toLowerCase())
  );

  return (
    <div className="bg-page min-h-screen py-6">
      <div className="container-market space-y-4">
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
          <button
            type="button"
            onClick={() => onNavigate('/help')}
            className="hover:text-primary-dark cursor-pointer"
          >
            Help
          </button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Help Navigation */}
          <aside className="lg:col-span-3 bg-surface border border-line rounded p-2">
            <div className="px-3 py-2 text-[12px] font-bold text-muted uppercase border-b border-line mb-1">
              Customer Help
            </div>
            <ul className="space-y-0.5">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = item.id === page;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.path)}
                      className={`w-full h-9 px-3 rounded text-left text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-primary-tint text-primary-dark font-bold border border-primary-dark'
                          : 'text-ink hover:bg-page font-medium'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-60" strokeWidth={1.75} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Right Content Panel */}
          <div className="lg:col-span-9 bg-surface border border-line rounded p-6 space-y-6">
            {/* 1. HELP & COMMON QUESTIONS */}
            {page === 'help' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <HelpCircle className="w-4 h-4" strokeWidth={1.75} />
                    <span>Help Center</span>
                  </div>
                  <h1 className="page-title text-ink">How can we help you today?</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Simple answers about ordering, safe payment, delivery, and returns.
                  </p>
                </div>

                {/* Search FAQs */}
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    value={faqQuery}
                    onChange={(e) => setFaqQuery(e.target.value)}
                    placeholder="Type a question (e.g. delivery cost, refund, how payment works)..."
                    className="w-full h-10 pl-10 pr-4 bg-page border border-line rounded text-[14px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>

                {/* Common Questions */}
                <div className="space-y-3">
                  <h2 className="section-title text-ink">Common Questions</h2>
                  <div className="divide-y divide-line border border-line rounded">
                    {filteredFaqs.map((faq, i) => (
                      <div key={i} className="p-4 space-y-1">
                        <div className="font-bold text-[14px] text-ink">{faq.q}</div>
                        <p className="text-[13px] text-muted leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Need more help */}
                <div className="p-4 bg-page border border-line rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[14px] text-ink">Still need help with an order?</div>
                    <p className="text-[12px] text-muted">
                      Our support team is available Monday to Saturday, 8 AM – 8 PM.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('/track-order')}
                      className="h-9 px-4 bg-surface border border-line text-ink font-bold text-[13px] rounded hover:bg-white cursor-pointer"
                    >
                      Track My Order
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('/contact')}
                      className="h-9 px-4 bg-primary text-on-primary font-bold text-[13px] rounded cursor-pointer"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 2. TRACK MY ORDER */}
            {page === 'track-order' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <Package className="w-4 h-4" strokeWidth={1.75} />
                    <span>Order Tracker</span>
                  </div>
                  <h1 className="page-title text-ink">Track Your Order</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Enter your order number below to check where your package is.
                  </p>
                </div>

                <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Enter Order Number (e.g. ORD-2026-101)"
                    className="flex-1 h-10 px-3 bg-surface border border-line rounded text-[14px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded cursor-pointer"
                  >
                    Find Order
                  </button>
                </form>

                {!searchAttempted && (
                  <div className="p-4 bg-page border border-line rounded text-[13px] text-muted flex flex-wrap items-center justify-between gap-2">
                    <span>
                      You can find your order number on the confirmation screen after checkout.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleNo = allOrders[0]?.orderNumber || 'ORD-2026-101';
                        setOrderQuery(sampleNo);
                        setSearchAttempted(true);
                        setTrackedOrder(allOrders[0] || null);
                      }}
                      className="text-primary-dark font-bold hover:underline cursor-pointer"
                    >
                      Try sample order ({allOrders[0]?.orderNumber || 'ORD-2026-101'})
                    </button>
                  </div>
                )}

                {searchAttempted && !trackedOrder && (
                  <div className="p-6 bg-page border border-line rounded text-center space-y-2">
                    <div className="font-bold text-[14px] text-ink">
                      We couldn't find an order with "{orderQuery}"
                    </div>
                    <p className="text-[13px] text-muted">
                      Please check the spelling of your order number and try again.
                    </p>
                  </div>
                )}

                {trackedOrder && (
                  <div className="border border-line rounded p-5 space-y-4 bg-page">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <div className="text-[12px] text-muted">Order Number</div>
                        <div className="text-[18px] font-bold text-ink">
                          {trackedOrder.orderNumber}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded bg-primary-tint border border-primary-dark text-primary-dark font-bold text-[12px]">
                        {formatFriendlyStatus(trackedOrder.orderStatus)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                      <div className="bg-surface border border-line rounded p-3">
                        <div className="text-muted text-[12px]">Delivering To</div>
                        <div className="font-bold text-ink mt-0.5">{trackedOrder.customerName}</div>
                        <div className="text-muted text-[12px] mt-0.5">
                          {trackedOrder.deliveryAddress}
                        </div>
                      </div>
                      <div className="bg-surface border border-line rounded p-3">
                        <div className="text-muted text-[12px]">Payment Protection</div>
                        <div className="font-bold text-primary-dark mt-0.5">
                          {trackedOrder.orderStatus === 'delivered'
                            ? 'Delivered & Completed'
                            : 'Money kept safe until you get your order'}
                        </div>
                        <div className="text-muted text-[12px] mt-0.5">
                          Total: ₦{trackedOrder.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-line rounded p-3 space-y-2 text-[13px]">
                      <div className="font-bold text-ink">Items in this Order</div>
                      {trackedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-ink">
                          <span>
                            {item.quantity}x {item.productTitle}
                          </span>
                          <span className="font-bold">₦{item.lineTotal.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowLiveMap(!showLiveMap)}
                        className="h-10 px-4 bg-surface border border-line hover:bg-white text-ink font-bold text-[13px] rounded flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                        <span>{showLiveMap ? 'Hide Live Map' : 'Show Live Delivery Map'}</span>
                      </button>

                      {trackedOrder.orderStatus !== 'delivered' && (
                        <button
                          type="button"
                          onClick={() => setQrModalOrder(trackedOrder)}
                          className="h-10 px-4 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[13px] rounded flex items-center gap-2 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" strokeWidth={1.75} />
                          <span>Confirm Delivery</span>
                        </button>
                      )}
                    </div>

                    {showLiveMap && (
                      <div className="pt-2">
                        <LiveDeliveryTrackingMap
                          mode="customer"
                          order={trackedOrder}
                          onOpenQrModal={(ord) => setQrModalOrder(ord)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {qrModalOrder && (
                  <CustomerQrScannerModal
                    order={qrModalOrder}
                    onClose={() => setQrModalOrder(null)}
                    onSuccess={() => {
                      const refreshed =
                        platformStore
                          .getState()
                          .orders.find((o) => o.id === qrModalOrder.id) || null;
                      setTrackedOrder(refreshed);
                    }}
                  />
                )}
              </>
            )}

            {/* 3. SAFE PAYMENT PROTECTION */}
            {page === 'escrow-protection' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                    <span>100% Buyer Protection</span>
                  </div>
                  <h1 className="page-title text-ink">
                    Safe Payment Protection — Pay Only For What You Receive
                  </h1>
                  <p className="text-[14px] text-muted mt-1">
                    Your money is never sent directly to a seller before you see your package.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="text-[12px] font-bold text-primary-dark uppercase">
                      Step 1: Place Your Order
                    </div>
                    <h3 className="font-bold text-[15px] text-ink">We Keep Your Money Safe</h3>
                    <p className="text-[13px] text-muted">
                      When you pay by card or bank transfer, IBO Hub holds your payment safely while the seller packs your order.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="text-[12px] font-bold text-primary-dark uppercase">
                      Step 2: Check Your Item
                    </div>
                    <h3 className="font-bold text-[15px] text-ink">Look Before You Accept</h3>
                    <p className="text-[13px] text-muted">
                      When our delivery rider arrives at your door, check your package to make sure it is the right item and in good condition.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="text-[12px] font-bold text-primary-dark uppercase">
                      Step 3: Confirm Delivery
                    </div>
                    <h3 className="font-bold text-[15px] text-ink">Scan to Complete</h3>
                    <p className="text-[13px] text-muted">
                      Once you are happy with your order, scan the rider’s delivery code on your phone. Only then do we pay the seller.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 4. PAYMENT METHODS */}
            {page === 'payment-methods' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                    <span>Easy Ways to Pay</span>
                  </div>
                  <h1 className="page-title text-ink">Payment Options</h1>
                  <p className="text-[14px] text-muted mt-1">
                    All prices are shown clearly in Naira (₦) with no hidden charges.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="font-bold text-ink text-[15px]">1. Bank Cards</div>
                    <p className="text-muted">
                      Pay quickly with your Verve, Mastercard, or Visa debit card.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="font-bold text-ink text-[15px]">2. Bank Transfer</div>
                    <p className="text-muted">
                      Transfer from any Nigerian bank app on your phone and your order is confirmed right away.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <div className="font-bold text-ink text-[15px]">3. Pay on Delivery</div>
                    <p className="text-muted">
                      Pay with a POS machine, transfer, or cash when the delivery rider brings your package.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 5. DELIVERY TIMES & COST */}
            {page === 'delivery-rates' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <Truck className="w-4 h-4" strokeWidth={1.75} />
                    <span>Delivery Guide</span>
                  </div>
                  <h1 className="page-title text-ink">Delivery Times &amp; Cost</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Home delivery is <strong>FREE</strong> on all orders of ₦20,000 and above!
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-line text-[13px]">
                    <thead className="bg-page border-b border-line text-left">
                      <tr>
                        <th className="p-3 font-bold text-ink">City / Area</th>
                        <th className="p-3 font-bold text-ink">How Long It Takes</th>
                        <th className="p-3 font-bold text-ink">Pickup Point</th>
                        <th className="p-3 font-bold text-ink">Home Delivery (Under ₦20k)</th>
                        <th className="p-3 font-bold text-ink">Orders ₦20,000+</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      <tr>
                        <td className="p-3 font-bold text-ink">Lagos (Ikeja, Yaba, Lekki, VI)</td>
                        <td className="p-3 text-ink">Same day (when ordered before 2 PM)</td>
                        <td className="p-3 text-ink">₦1,000</td>
                        <td className="p-3 text-ink">₦2,500</td>
                        <td className="p-3 font-bold text-primary-dark">FREE</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-ink">Abuja &amp; Kano</td>
                        <td className="p-3 text-ink">Same day or next day</td>
                        <td className="p-3 text-ink">₦1,000</td>
                        <td className="p-3 text-ink">₦2,500</td>
                        <td className="p-3 font-bold text-primary-dark">FREE</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-ink">Port Harcourt, Ibadan, Abeokuta</td>
                        <td className="p-3 text-ink">1 to 2 days</td>
                        <td className="p-3 text-ink">₦1,000</td>
                        <td className="p-3 text-ink">₦2,500</td>
                        <td className="p-3 font-bold text-primary-dark">FREE</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-ink">Other States</td>
                        <td className="p-3 text-ink">2 to 4 days</td>
                        <td className="p-3 text-ink">₦1,500</td>
                        <td className="p-3 text-ink">₦3,500</td>
                        <td className="p-3 font-bold text-primary-dark">FREE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 6. TRUSTED SELLERS */}
            {page === 'verified-sellers' && (
              <>
                <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="page-title text-ink">How We Check Our Sellers</h1>
                    <p className="text-[14px] text-muted mt-1">
                      Every seller on IBO Hub is checked so you only get genuine, quality items.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('/merchants')}
                    className="h-10 px-4 bg-primary text-on-primary font-bold text-[13px] rounded shrink-0 cursor-pointer"
                  >
                    See All Sellers
                  </button>
                </div>

                <div className="space-y-3 text-[13px]">
                  <div className="border border-line rounded p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <div className="font-bold text-ink text-[14px]">1. Real Business &amp; Store Check</div>
                      <p className="text-muted mt-0.5">
                        We check every seller’s business registration, owner ID, and physical shop or warehouse before they can list items.
                      </p>
                    </div>
                  </div>
                  <div className="border border-line rounded p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <div className="font-bold text-ink text-[14px]">2. Quality &amp; Safety Check</div>
                      <p className="text-muted mt-0.5">
                        Food, skincare, electronics, and solar equipment are checked for genuine manufacturer warranties and safety approvals.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 7. PARTNER EARNINGS GUIDE */}
            {page === 'fee-schedule' && (
              <>
                <div className="border-b border-line pb-4">
                  <h1 className="page-title text-ink">Partner Earnings &amp; Fees</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Simple, clear earnings for Sellers, Online Shop Owners (IBOs), and Delivery Riders.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div className="border border-line rounded p-4 space-y-2">
                    <div className="font-bold text-[15px] text-ink">Sellers (Merchants)</div>
                    <p className="text-muted">
                      Start free with up to 5 products. You keep 95% of your price on every item sold (5% platform fee).
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('/sell')}
                      className="h-9 px-3 bg-primary text-on-primary font-bold rounded text-[12px] cursor-pointer"
                    >
                      Sell on IBO Hub
                    </button>
                  </div>

                  <div className="border border-line rounded p-4 space-y-2">
                    <div className="font-bold text-[15px] text-ink">Online Shop Owners (IBOs)</div>
                    <p className="text-muted">
                      Free to join. Pick products from sellers, add up to 50% profit on top, and keep 100% of the profit you add.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('/become-an-ibo')}
                      className="h-9 px-3 bg-surface border border-primary-dark text-primary-dark font-bold rounded text-[12px] cursor-pointer"
                    >
                      Become an IBO
                    </button>
                  </div>

                  <div className="border border-line rounded p-4 space-y-2">
                    <div className="font-bold text-[15px] text-ink">Delivery Riders</div>
                    <p className="text-muted">
                      Free to sign up. Keep 85% to 90% of the delivery fee for every trip, paid straight to your wallet when delivered.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('/become-a-delivery-agent')}
                      className="h-9 px-3 bg-surface border border-line text-ink font-bold rounded text-[12px] cursor-pointer"
                    >
                      Join as a Rider
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 8. ABOUT IBO HUB */}
            {page === 'about' && (
              <>
                <div className="border-b border-line pb-4">
                  <h1 className="page-title text-ink">About IBO Hub</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Nigeria’s trusted marketplace connecting everyday shoppers, verified sellers, online shop owners, and local delivery riders.
                  </p>
                </div>

                <div className="space-y-4 text-[14px] text-ink leading-relaxed">
                  <p>
                    IBO Hub makes buying and selling across Nigeria safe and simple. Shoppers get genuine products at fair prices, while everyday people can open their own online shops without buying stock upfront.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="border border-line rounded p-4 space-y-1.5">
                      <h3 className="font-bold text-[15px] text-ink">For Shoppers</h3>
                      <p className="text-[13px] text-muted">
                        Buy phones, food items, home appliances, fashion, and solar equipment knowing your money is kept safe until your package arrives.
                      </p>
                    </div>
                    <div className="border border-line rounded p-4 space-y-1.5">
                      <h3 className="font-bold text-[15px] text-ink">For Partners</h3>
                      <p className="text-[13px] text-muted">
                        Sellers supply quality goods, IBOs share their own shop links to earn profit, and delivery riders get paid immediately after each drop-off.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 9. RETURNS POLICY */}
            {page === 'returns-policy' && (
              <>
                <div className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-primary-dark text-[12px] font-bold uppercase mb-1">
                    <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                    <span>Easy Returns</span>
                  </div>
                  <h1 className="page-title text-ink">7-Day Returns &amp; Refund Policy</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Simple, fair return rules if something is wrong with your order.
                  </p>
                </div>

                <div className="space-y-3 text-[13px] text-ink">
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <h2 className="font-bold text-[15px] text-ink">1. Check Your Package at the Door</h2>
                    <p className="text-muted">
                      You can look at your package when the delivery rider arrives before confirming delivery. If the wrong item was sent or it is damaged, hand it back to the rider and you will get a full refund.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <h2 className="font-bold text-[15px] text-ink">2. 7 Days to Return Faulty Items</h2>
                    <p className="text-muted">
                      If an item is faulty or not as described, you can return it within 7 days of delivery in its original box with all accessories.
                    </p>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1.5">
                    <h2 className="font-bold text-[15px] text-ink">3. Quick Bank Refunds</h2>
                    <p className="text-muted">
                      Once your returned item reaches our local pickup center, we send your refund back to your bank account within 24 to 48 hours.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 10. TERMS OF SERVICE */}
            {page === 'terms' && (
              <>
                <div className="border-b border-line pb-4">
                  <h1 className="page-title text-ink">Terms of Use</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Simple rules that keep IBO Hub fair and safe for everyone.
                  </p>
                </div>

                <div className="space-y-4 text-[13px] text-ink leading-relaxed">
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">1. Safe Buying &amp; Selling</h2>
                    <p className="text-muted">
                      IBO Hub connects shoppers, sellers, independent shop owners (IBOs), and delivery riders across Nigeria. All customer payments are held safely until delivery is confirmed.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">2. Fair Pricing</h2>
                    <p className="text-muted">
                      Sellers set their product prices in Naira. Independent shop owners (IBOs) can add a fair profit margin of up to 50% on items in their shops.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">3. Delivery Confirmation</h2>
                    <p className="text-muted">
                      Delivery riders cannot mark an order as delivered on their own. The buyer confirms receipt using the delivery code when the package arrives.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">4. Live Map &amp; Google Maps Terms</h2>
                    <p className="text-muted">
                      Live delivery tracking uses Google Maps. Using the map is subject to the{' '}
                      <a
                        href="https://maps.google.com/help/terms_maps/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-dark font-bold hover:underline"
                      >
                        Google Maps Additional Terms of Service
                      </a>{' '}
                      and the{' '}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-dark font-bold hover:underline"
                      >
                        Google Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 11. PRIVACY NOTICE */}
            {page === 'privacy' && (
              <>
                <div className="border-b border-line pb-4">
                  <h1 className="page-title text-ink">Privacy Policy</h1>
                  <p className="text-[14px] text-muted mt-1">
                    How we protect your personal information.
                  </p>
                </div>

                <div className="space-y-4 text-[13px] text-ink leading-relaxed">
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">1. Only What We Need</h2>
                    <p className="text-muted">
                      We only ask for your name, phone number, and delivery address so we can deliver your order and contact you when your rider arrives.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-bold text-[15px] text-ink mb-1">2. Live Delivery Location</h2>
                    <p className="text-muted">
                      Delivery riders choose when to share their live location during a trip. Shoppers can only see the rider’s live location on the map after the rider picks up the package, and location sharing stops as soon as the delivery is finished.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 12. CONTACT US */}
            {page === 'contact' && (
              <>
                <div className="border-b border-line pb-4">
                  <h1 className="page-title text-ink">Contact Us</h1>
                  <p className="text-[14px] text-muted mt-1">
                    Call, chat on WhatsApp, or send us a message Monday–Saturday, 8:00 AM – 8:00 PM.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                  <div className="border border-line rounded p-4 space-y-1">
                    <Phone className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
                    <div className="font-bold text-ink">Phone &amp; WhatsApp</div>
                    <div className="text-muted">+234 700 426 4820</div>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1">
                    <Mail className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
                    <div className="font-bold text-ink">Email Support</div>
                    <div className="text-muted">support@ibohub.ng</div>
                  </div>
                  <div className="border border-line rounded p-4 space-y-1">
                    <MapPin className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
                    <div className="font-bold text-ink">Main Pickup Center</div>
                    <div className="text-muted">Plot 14, Simbiat Abiola Rd, Ikeja, Lagos</div>
                  </div>
                </div>

                {contactSubmitted ? (
                  <div className="p-4 bg-primary-tint border border-primary-dark rounded flex items-center gap-2 text-[13px] font-bold text-primary-dark">
                    <Check className="w-4 h-4" strokeWidth={1.75} />
                    <span>Thank you! We received your message and will reply within 2 hours.</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSubmitted(true);
                    }}
                    className="space-y-4 text-[13px] pt-2 border-t border-line"
                  >
                    <h2 className="section-title text-ink">Send Us a Message</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-ink mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Chidinma Nwosu"
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-ink mb-1">Email or Phone *</label>
                        <input
                          type="text"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="chidinma@example.com"
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-ink mb-1">Order Number (Optional)</label>
                        <input
                          type="text"
                          value={contactOrderNo}
                          onChange={(e) => setContactOrderNo(e.target.value)}
                          placeholder="ORD-2026-101"
                          className="w-full h-10 px-3 bg-surface border border-line rounded text-ink"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-ink mb-1">How can we help? *</label>
                      <textarea
                        rows={4}
                        required
                        value={contactMsg}
                        onChange={(e) => setContactMsg(e.target.value)}
                        placeholder="Tell us what you need help with..."
                        className="w-full p-3 bg-surface border border-line rounded text-ink"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] cursor-pointer"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
