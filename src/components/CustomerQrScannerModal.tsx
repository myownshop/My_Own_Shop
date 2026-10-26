import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
} from 'lucide-react';
import { platformStore } from '../services/store';
import { Order } from '../types';

interface CustomerQrScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

export const CustomerQrScannerModal: React.FC<CustomerQrScannerModalProps> = ({
  isOpen = true,
  onClose,
  order,
  onSuccess,
}) => {
  const [manualToken, setManualToken] = useState('');
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen || !order) return null;

  const handleVerifyToken = (tokenToVerify: string) => {
    const result = platformStore.confirmDeliveryWithQr(order.id, tokenToVerify.trim());
    if (result.success) {
      setFeedback({
        success: true,
        message: 'Delivery confirmed! The seller and rider have now been paid.',
      });
      if (onSuccess) onSuccess();
    } else {
      setFeedback({
        success: false,
        message: result.error || 'That delivery code does not match this order.',
      });
    }
  };

  const isDelivered = order.orderStatus === 'delivered' || feedback?.success;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded max-w-md w-full p-6 space-y-4 text-ink">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
            <div>
              <h3 className="font-bold text-[15px] text-ink">Confirm You Received Your Order</h3>
              <p className="text-[12px] text-muted">
                Order {order.orderNumber} • ₦{order.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {isDelivered ? (
          <div className="space-y-4 text-center py-2">
            <CheckCircle2 className="w-10 h-10 text-primary-dark mx-auto" strokeWidth={1.75} />
            <div>
              <h4 className="font-bold text-[16px] text-ink">Delivery Confirmed!</h4>
              <p className="text-[13px] text-muted mt-1">
                {feedback?.message || 'Thank you! Your order is now complete.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-[13px]">
            {feedback && !feedback.success && (
              <div className="p-3 bg-surface border border-sale rounded text-sale text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="p-3 bg-page border border-line rounded space-y-1 text-[12px]">
              <div className="text-muted">Rider’s Delivery Code:</div>
              <div className="font-mono font-bold text-ink">{order.confirmationQrToken}</div>
            </div>

            <button
              type="button"
              onClick={() => handleVerifyToken(order.confirmationQrToken)}
              className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" strokeWidth={1.75} />
              <span>Scan Rider’s Code &amp; Confirm Delivery</span>
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualToken.trim()) handleVerifyToken(manualToken);
              }}
              className="pt-3 border-t border-line space-y-2"
            >
              <label className="block text-[12px] font-bold text-ink">
                Or Type the Delivery Code Below
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  placeholder={order.confirmationQrToken}
                  className="flex-1 h-10 px-3 bg-surface border border-line rounded font-mono text-[12px] text-ink"
                />
                <button
                  type="submit"
                  className="px-4 h-10 border border-primary-dark bg-primary-tint text-primary-dark font-bold rounded text-[12px]"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
