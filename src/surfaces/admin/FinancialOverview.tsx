import React, { useState } from 'react';
import { Scale, DollarSign, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { platformStore } from '../../services/store';

interface FinancialOverviewProps {
  onNavigate?: (path: string) => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = () => {
  const [sortAsc, setSortAsc] = useState(false);
  const state = platformStore.getState();
  const { ledger } = state;
  const auditReport = platformStore.auditLedger();

  const sortedLedger = [...ledger].sort((a, b) =>
    sortAsc ? a.amount - b.amount : b.amount - a.amount
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded p-4">
          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>Double-Entry Balance Check</span>
            <Scale className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </div>
          <div className="price-text text-ink mt-1">
            {auditReport.balanced ? 'Balanced (₦0 Diff)' : 'Audit Alert'}
          </div>
          <div className="text-[12px] text-primary-dark font-bold mt-1">
            Debits: ₦{auditReport.totalDebits.toLocaleString()}
          </div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>Total Ledger Credits</span>
            <DollarSign className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </div>
          <div className="price-text text-ink mt-1">
            ₦{auditReport.totalCredits.toLocaleString()}
          </div>
          <div className="text-[12px] text-muted mt-1">{ledger.length} entries recorded</div>
        </div>

        <div className="bg-surface border border-line rounded p-4">
          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>Escrow Settlement Rule</span>
            <ShieldCheck className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </div>
          <div className="text-[18px] font-bold text-ink mt-1">Pipe A & Pipe B</div>
          <div className="text-[12px] text-primary-dark font-bold mt-1">
            QR Handover Verified
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="section-title text-ink">Double-Entry Financial Ledger</h3>
          <span className="text-[12px] text-muted">{sortedLedger.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-page border-b border-line text-[12px] font-bold text-muted uppercase">
                <th className="py-3 px-4">Entry ID</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Debit Account</th>
                <th className="py-3 px-4">Credit Account</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    <span>Amount (₦)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sortedLedger.map((entry) => (
                <tr key={entry.id} className="hover:bg-primary-tint/40">
                  <td className="py-3 px-4 font-mono text-[12px] text-ink">{entry.id}</td>
                  <td className="py-3 px-4 font-bold text-ink">{entry.orderId || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[12px] text-muted">{entry.debitAccount}</td>
                  <td className="py-3 px-4 font-mono text-[12px] text-primary-dark font-bold">
                    {entry.creditAccount}
                  </td>
                  <td className="py-3 px-4 text-ink">{entry.memo}</td>
                  <td className="py-3 px-4 text-right font-bold text-ink">
                    ₦{entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
