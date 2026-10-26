import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { platformStore } from '../services/store';
import { updateOrderStatusInBackend } from '../services/supabaseSync';
import { Order, DeliveryAgentProfile } from '../types';

export interface DeliveryAgentQrScannerProps {
  agent: DeliveryAgentProfile;
  activeOrder?: Order | null;
  assignedOrders?: Order[];
  onOrderDelivered?: (order: Order) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const DeliveryAgentQrScanner: React.FC<DeliveryAgentQrScannerProps> = ({
  agent,
  activeOrder,
  assignedOrders = [],
  onOrderDelivered,
  onClose,
  isModal = false,
}) => {
  const availableOrders =
    assignedOrders.length > 0
      ? assignedOrders
      : platformStore.getState().orders;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (activeOrder && activeOrder.orderStatus !== 'delivered') return activeOrder.id;
    const undelivered = availableOrders.find((o) => o.orderStatus !== 'delivered');
    return undelivered ? undelivered.id : availableOrders[0]?.id || '';
  });

  const selectedOrder =
    availableOrders.find((o) => o.id === selectedOrderId) || activeOrder || availableOrders[0];

  const [manualToken, setManualToken] = useState('');
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    deliveredOrder?: Order;
  } | null>(null);

  const handleVerifyToken = async (rawToken: string) => {
    if (!selectedOrder) return;
    const cleanToken = rawToken.trim();

    try {
      await updateOrderStatusInBackend(selectedOrder.id, 'delivered', {
        isQrScanned: true,
        paymentStatus: 'completed',
        deliveredAt: new Date().toISOString(),
        deliveredByAgentId: agent.id,
        deliveredByAgentName: agent.name,
        deliveredByVehicle: agent.vehicleType,
      });
    } catch {
      // Handled via local store sync
    }

    const result = platformStore.confirmDeliveryWithQr(selectedOrder.id, cleanToken);
    if (result.success) {
      const updated =
        platformStore.getState().orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
      setFeedback({
        success: true,
        message: `Order ${selectedOrder.orderNumber} verified and marked Delivered. Escrow payout credited.`,
        deliveredOrder: updated,
      });
      if (onOrderDelivered) onOrderDelivered(updated);
    } else {
      setFeedback({
        success: false,
        message: result.error || 'Token did not match active order.',
      });
    }
  };

  const isDelivered = selectedOrder?.orderStatus === 'delivered';

  const content = (
    <div className="bg-surface border border-line rounded p-5 space-y-4 text-ink">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
          <div>
            <h3 className="font-bold text-[15px] text-ink">Delivery Handover Verification</h3>
            <p className="text-[12px] text-muted">
              Verify recipient delivery token to release escrow
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {availableOrders.length > 0 && (
        <div>
          <label className="block text-[12px] font-bold text-ink mb-1">Select Order</label>
          <select
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              setFeedback(null);
            }}
            className="w-full h-10 px-3 bg-surface border border-line rounded text-[13px] text-ink"
          >
            {availableOrders.map((ord) => (
              <option key={ord.id} value={ord.id}>
                {ord.orderNumber} — {ord.customerName} (₦{ord.deliveryFee.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {feedback?.success ? (
        <div className="p-4 bg-primary-tint border border-primary-dark rounded space-y-2 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-primary-dark">
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
            <span>Handover Verified</span>
          </div>
          <p className="text-ink">{feedback.message}</p>
        </div>
      ) : (
        <>
          {feedback && !feedback.success && (
            <div className="p-3 bg-surface border border-sale rounded text-sale text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{feedback.message}</span>
            </div>
          )}

          {selectedOrder && (
            <div className="space-y-3">
              <div className="p-3 bg-page border border-line rounded text-[12px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Order Number:</span>
                  <span className="font-bold text-ink">{selectedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Recipient:</span>
                  <span className="font-bold text-ink">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Active Handover Token:</span>
                  <span className="font-mono font-bold text-primary-dark">
                    {selectedOrder.confirmationQrToken}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isDelivered}
                onClick={() => handleVerifyToken(selectedOrder.confirmationQrToken)}
                className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" strokeWidth={1.75} />
                <span>
                  {isDelivered
                    ? 'Order Already Delivered'
                    : `Simulate Optical QR Scan (${selectedOrder.orderNumber})`}
                </span>
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualToken.trim()) handleVerifyToken(manualToken);
                }}
                className="pt-3 border-t border-line space-y-2"
              >
                <label className="block text-[12px] font-bold text-ink">
                  Or Enter Verification Token Manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                    placeholder={selectedOrder.confirmationQrToken}
                    className="flex-1 h-10 px-3 bg-surface border border-line rounded text-[13px] font-mono text-ink"
                  />
                  <button
                    type="submit"
                    className="px-4 h-10 border border-primary-dark bg-primary-tint text-primary-dark font-bold rounded text-[13px]"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
};
