import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  Building2,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { platformStore } from '../services/store';
import { Order, DeliveryAgentProfile } from '../types';

interface AgentQrGeneratorProps {
  order: Order;
  agent: DeliveryAgentProfile;
  onNavigate?: (path: string) => void;
  onOrderUpdated?: () => void;
}

export const AgentQrGenerator: React.FC<AgentQrGeneratorProps> = ({
  order,
  agent,
  onNavigate,
  onOrderUpdated,
}) => {
  const [qrStage, setQrStage] = useState<'pickup' | 'delivery'>(
    order.orderStatus === 'dispatched' || order.orderStatus === 'placed' || !order.isPickupConfirmed
      ? 'pickup'
      : 'delivery'
  );

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (order.orderStatus !== 'delivered') {
      if (qrStage === 'pickup' && !order.isPickupConfirmed) {
        platformStore.regeneratePickupQrToken(order.id);
      } else {
        platformStore.regenerateDeliveryQrToken(order.id);
      }
      if (onOrderUpdated) onOrderUpdated();
    }
  }, [order.id, qrStage]);

  const activeToken =
    qrStage === 'pickup'
      ? order.pickupQrToken || `QR-PICKUP-${order.orderNumber?.split('-')?.[2] || '9041'}-A1B2`
      : order.confirmationQrToken;

  useEffect(() => {
    let isMounted = true;
    const payload = JSON.stringify({
      protocol: 'AFRI_DELIVERY_V1',
      stage: qrStage,
      orderId: order.id,
      orderNumber: order.orderNumber,
      token: activeToken,
      agentId: agent.id,
      agentName: agent.name,
      amount: order.totalAmount,
      timestamp: Date.now(),
    });

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeToken, qrStage, order.id, order.orderNumber, order.totalAmount, agent.id, agent.name]);

  const handleRandomizeToken = () => {
    setIsRegenerating(true);
    if (qrStage === 'pickup') {
      platformStore.regeneratePickupQrToken(order.id);
      setFeedbackMsg('Generated fresh Pickup QR token');
    } else {
      platformStore.regenerateDeliveryQrToken(order.id);
      setFeedbackMsg('Generated fresh Customer Delivery QR token');
    }
    setTimeout(() => {
      setIsRegenerating(false);
      if (onOrderUpdated) onOrderUpdated();
    }, 200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDepotPickup = () => {
    const res = platformStore.confirmOrderPickup(order.id, order.pickupQrToken);
    if (res.success) {
      setFeedbackMsg('Depot Pickup Verified! Order is now IN TRANSIT.');
      setQrStage('delivery');
      if (onOrderUpdated) onOrderUpdated();
    }
  };

  const isDelivered = order.orderStatus === 'delivered';
  const isPickupDone = order.isPickupConfirmed || order.orderStatus === 'in_transit' || isDelivered;

  return (
    <div className="bg-surface border border-line rounded p-5 space-y-4 text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
            <h3 className="font-bold text-[16px] text-ink">Handover QR Code</h3>
          </div>
          <p className="text-[12px] text-muted mt-0.5">
            Order <strong>{order.orderNumber}</strong> • Buyer: {order.customerName}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={() => setQrStage('pickup')}
            className={`px-3 h-9 rounded font-bold border flex items-center gap-1.5 ${
              qrStage === 'pickup'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-ink border-line'
            }`}
          >
            <Building2 className="w-4 h-4" strokeWidth={1.75} />
            <span>1. Depot Pickup</span>
          </button>
          <button
            type="button"
            onClick={() => setQrStage('delivery')}
            className={`px-3 h-9 rounded font-bold border flex items-center gap-1.5 ${
              qrStage === 'delivery'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface text-ink border-line'
            }`}
          >
            <Truck className="w-4 h-4" strokeWidth={1.75} />
            <span>2. Buyer Handover</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-2.5 bg-primary-tint border border-primary-dark rounded text-[12px] font-bold text-primary-dark flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-5 bg-page rounded border border-line">
        <div className="p-3 bg-surface rounded border border-line relative">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Handover QR Code"
              className={`w-48 h-48 object-contain ${isRegenerating ? 'opacity-40' : 'opacity-100'}`}
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-muted animate-spin" strokeWidth={1.75} />
            </div>
          )}

          {isDelivered && (
            <div className="absolute inset-0 bg-surface/95 rounded flex flex-col items-center justify-center p-4 text-center border border-primary-dark">
              <CheckCircle2 className="w-8 h-8 text-primary-dark mb-1" strokeWidth={1.75} />
              <p className="font-bold text-[14px] text-ink">Delivered & Verified</p>
              <p className="text-[11px] text-primary-dark font-bold mt-0.5">
                Escrow Released (₦{order.totalAmount.toLocaleString()})
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] text-muted font-bold uppercase">
              {qrStage === 'pickup' ? 'Pickup Token' : 'Delivery Token'}:
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded border border-line bg-surface text-ink hover:border-primary-dark"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
            </button>
          </div>
          <p className="font-mono font-bold text-[12px] text-ink bg-surface py-1 px-2.5 rounded border border-line inline-block">
            {activeToken}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleRandomizeToken}
          disabled={isDelivered}
          className="flex-1 h-10 px-4 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          <span>Regenerate Single-Use QR</span>
        </button>

        {qrStage === 'pickup' && !isPickupDone && (
          <button
            type="button"
            onClick={handleSimulateDepotPickup}
            className="h-10 px-4 border border-primary-dark bg-primary-tint text-primary-dark font-bold rounded text-[13px]"
          >
            Confirm Depot Pickup
          </button>
        )}
      </div>

      <div className="p-3 rounded bg-page border border-line text-[12px] space-y-1">
        <div className="flex items-center gap-1.5 text-ink font-bold">
          <Lock className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
          <span>Buyer Scan Required for Escrow Release</span>
        </div>
        <p className="text-muted">
          Present this QR code to the buyer on arrival. When the buyer scans it, your courier payout is credited immediately.
        </p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate(`/shop/${order.iboSlug || 'amina-crafts'}`)}
            className="text-[12px] text-primary-dark font-bold hover:underline inline-flex items-center gap-1 pt-1"
          >
            <span>Open Buyer Storefront Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
};
