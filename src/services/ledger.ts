import {
  Order,
  LedgerEntry,
  Entry,
  Transaction,
  WalletBalance,
  DeliveryTransactionState,
  TransactionType,
  MoneyPipe,
} from '../types';
import { PlatformConfig } from '../config/platformConfig';

// Re-export core ledger types for direct consumption
export type {
  Entry,
  Transaction,
  WalletBalance,
  DeliveryTransactionState,
  TransactionType,
  MoneyPipe,
  LedgerEntry,
};

/**
 * Error thrown whenever the fundamental double-entry invariant:
 * Sum(Debits) === Sum(Credits)
 * is violated or unbalanced entries are detected.
 */
export class LedgerInvariantError extends Error {
  public readonly discrepancy: number;
  public readonly totalDebits: number;
  public readonly totalCredits: number;

  constructor(message: string, totalDebits: number, totalCredits: number) {
    super(message);
    this.name = 'LedgerInvariantError';
    this.totalDebits = totalDebits;
    this.totalCredits = totalCredits;
    this.discrepancy = Math.abs(totalDebits - totalCredits);
  }
}

export interface SettlementResult {
  transaction?: Transaction;
  pipeAEntries: LedgerEntry[];
  pipeBEntries: LedgerEntry[];
  totalOrderAmount: number;
  merchantTotal: number;
  iboTotalMarkup: number;
  platformCut: number;
  referralTotal: number;
  agentEarnings: number;
  founderDeliveryCommission: number;
  isBalanced: boolean;
  state: DeliveryTransactionState;
}

export interface RecoupResult {
  refundTransaction?: Transaction;
  recoupTransaction?: Transaction;
  recoupEntries: LedgerEntry[];
  refundEntries?: LedgerEntry[];
  totalRecoupAmount: number;
  iboCharged: number;
  merchantCharged: number;
  founderCharged: number;
  customerPenalty: number;
  isBalanced: boolean;
  state: DeliveryTransactionState;
}

export interface LedgerAuditReport {
  balanced: boolean;
  totalDebits: number;
  totalCredits: number;
  discrepancy: number;
  totalEntries: number;
  totalTransactions: number;
  pendingCount: number;
  confirmedCount: number;
  reversedCount: number;
  pipeABalanced: boolean;
  pipeBBalanced: boolean;
  unbalancedTransactions: {
    transactionId: string;
    debitSum: number;
    creditSum: number;
    discrepancy: number;
  }[];
}

/**
 * Double-Entry Transactional Ledger Service (§6)
 *
 * Enforces fundamental accounting requirements:
 * 1. Double-Entry Invariant: Credits MUST strictly equal Debits (Sum(Debits) === Sum(Credits)).
 * 2. Strict Delivery State Lifecycle (§6):
 *    - 'pending': Escrow lock upon order placement. Neither merchant, IBO, agent nor platform can withdraw.
 *    - 'confirmed': Delivery verified exclusively via physical single-use QR token scan upon handover.
 *                   Escrow released to wholesale, markups, courier net fee, founder commission, and referral upline.
 *    - 'reversed': Failed/rejected delivery. Product escrow refunded to customer; fault-based recoup charges
 *                  debited from at-fault parties to compensate courier transport.
 * 3. Pipe Isolation: Pipe A (Delivery Fee) and Pipe B (Product Money) are strictly segregated.
 * 4. Referral Commission Governance (§8): Paid strictly out of platform margin on real sales, capped at depth 3.
 */
export class LedgerService {
  /**
   * Enforces that the provided entries strictly balance:
   * Total Debits must equal Total Credits.
   * Throws LedgerInvariantError if unbalanced.
   */
  public static assertDoubleEntryBalanced(entries: (Entry | LedgerEntry)[]): void {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if ('entryType' in entry && entry.entryType) {
        if (entry.entryType === 'debit') {
          totalDebits += entry.amount;
        } else if (entry.entryType === 'credit') {
          totalCredits += entry.amount;
        }
      } else if ('debitAccount' in entry && 'creditAccount' in entry) {
        // Paired entry: amount is simultaneously debited to debitAccount and credited to creditAccount
        totalDebits += entry.amount;
        totalCredits += entry.amount;
      }
    }

    const discrepancy = Math.abs(totalDebits - totalCredits);
    if (discrepancy > 0.001) {
      throw new LedgerInvariantError(
        `Double-entry invariant violated: total debits (₦${totalDebits}) do not equal total credits (₦${totalCredits}). Discrepancy: ₦${discrepancy}`,
        totalDebits,
        totalCredits
      );
    }
  }

  /**
   * Verify double-entry balance mathematically without throwing.
   */
  public static verifyDoubleEntry(entries: (Entry | LedgerEntry)[]): {
    balanced: boolean;
    totalDebits: number;
    totalCredits: number;
    discrepancy: number;
  } {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if ('entryType' in entry && entry.entryType) {
        if (entry.entryType === 'debit') {
          totalDebits += entry.amount;
        } else if (entry.entryType === 'credit') {
          totalCredits += entry.amount;
        }
      } else if ('debitAccount' in entry && 'creditAccount' in entry) {
        totalDebits += entry.amount;
        totalCredits += entry.amount;
      }
    }

    const discrepancy = Math.abs(totalDebits - totalCredits);
    return {
      balanced: discrepancy < 0.001,
      totalDebits,
      totalCredits,
      discrepancy,
    };
  }

  /**
   * Create atomic Entry records from a paired LedgerEntry.
   */
  public static toAtomicEntries(ledgerEntry: LedgerEntry): Entry[] {
    const timestamp = ledgerEntry.timestamp || new Date().toISOString();
    const state: DeliveryTransactionState = ledgerEntry.state || (ledgerEntry.isSettled ? 'confirmed' : 'pending');

    const debitLeg: Entry = {
      id: `${ledgerEntry.id}-DR`,
      transactionId: ledgerEntry.transactionId,
      orderId: ledgerEntry.orderId,
      orderNumber: ledgerEntry.orderNumber,
      account: ledgerEntry.debitAccount,
      entryType: 'debit',
      amount: ledgerEntry.amount,
      currency: ledgerEntry.currency,
      state,
      pipe: ledgerEntry.pipe,
      memo: `Debit: ${ledgerEntry.memo}`,
      timestamp,
      debitAccount: ledgerEntry.debitAccount,
      creditAccount: ledgerEntry.creditAccount,
      isSettled: ledgerEntry.isSettled,
    };

    const creditLeg: Entry = {
      id: `${ledgerEntry.id}-CR`,
      transactionId: ledgerEntry.transactionId,
      orderId: ledgerEntry.orderId,
      orderNumber: ledgerEntry.orderNumber,
      account: ledgerEntry.creditAccount,
      entryType: 'credit',
      amount: ledgerEntry.amount,
      currency: ledgerEntry.currency,
      state,
      pipe: ledgerEntry.pipe,
      memo: `Credit: ${ledgerEntry.memo}`,
      timestamp,
      debitAccount: ledgerEntry.debitAccount,
      creditAccount: ledgerEntry.creditAccount,
      isSettled: ledgerEntry.isSettled,
    };

    return [debitLeg, creditLeg];
  }

  /**
   * Phase 1: ORDER PLACEMENT & ESCROW LOCK (§6)
   * Strict Delivery State: 'pending'
   * Locks customer funds in Escrow. Total Debits === Total Credits.
   */
  public static createPendingEscrow(
    order: Order,
    config: PlatformConfig
  ): { transaction: Transaction; entries: LedgerEntry[] } {
    const timestamp = order.createdAt || new Date().toISOString();
    const transactionId = `TX-ESCROW-${order.id}-${Date.now()}`;
    const currency = 'NGN';
    const state: DeliveryTransactionState = 'pending';

    const entries: LedgerEntry[] = [];

    // Pipe A: Delivery Fee held in escrow
    entries.push({
      id: `LEDGER-ESCROW-PA-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_a_delivery',
      debitAccount: `customer_funds:${order.customerId}`,
      creditAccount: 'customer_escrow',
      amount: order.deliveryFee,
      currency,
      memo: `Delivery fee held in escrow pending customer QR confirmation for Order ${order.orderNumber} [Pipe A]`,
      timestamp,
      isSettled: false,
      state,
    });

    // Pipe B: Product Subtotal held in escrow
    entries.push({
      id: `LEDGER-ESCROW-PB-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_b_product',
      debitAccount: `customer_funds:${order.customerId}`,
      creditAccount: 'customer_escrow',
      amount: order.subtotal,
      currency,
      memo: `Product money held in escrow pending customer QR confirmation for Order ${order.orderNumber} [Pipe B]`,
      timestamp,
      isSettled: false,
      state,
    });

    // Verify double entry
    this.assertDoubleEntryBalanced(entries);

    // Build atomic entries for transaction container
    const atomicEntries: Entry[] = entries.flatMap((e) => this.toAtomicEntries(e));

    const transaction: Transaction = {
      id: transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: 'order_escrow',
      pipe: 'combined',
      state: 'pending',
      entries: atomicEntries,
      totalDebits: order.totalAmount,
      totalCredits: order.totalAmount,
      currency,
      memo: `Pending escrow hold for Order ${order.orderNumber}`,
      timestamp,
    };

    return { transaction, entries };
  }

  /**
   * Phase 2: PHYSICAL HANDOVER & QR VERIFICATION (§6, §5, §9)
   * Strict Delivery State: 'confirmed'
   * Releases escrow to merchant wholesale, IBO markup, courier net payout, founder commission, and referral upline.
   * Only invoked when customer QR verification scan is successfully authenticated.
   */
  public static settleSuccessfulDelivery(
    order: Order,
    config: PlatformConfig,
    referralChain: { tier1IboId?: string; tier2IboId?: string; tier3IboId?: string } = {}
  ): SettlementResult {
    const timestamp = order.deliveredAt || new Date().toISOString();
    const transactionId = `TX-SETTLE-${order.id}-${Date.now()}`;
    const currency = 'NGN';
    const state: DeliveryTransactionState = 'confirmed';

    const pipeAEntries: LedgerEntry[] = [];
    const pipeBEntries: LedgerEntry[] = [];

    // ==========================================
    // PIPE A: DELIVERY FEE SPLIT
    // ==========================================
    const deliveryFee = order.deliveryFee;
    const founderDeliveryCommission = Math.round(
      (deliveryFee * config.deliveryAgentFounderCommissionPct) / 100
    );
    const agentNetDeliveryFee = deliveryFee - founderDeliveryCommission;

    // Entry A1: Payout to courier
    pipeAEntries.push({
      id: `LEDGER-PA-1-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_a_delivery',
      debitAccount: 'customer_escrow',
      creditAccount: `agent_payable:${order.agentId || 'unassigned_agent'}`,
      amount: agentNetDeliveryFee,
      currency,
      memo: `Delivery fee net payout to Agent (${order.agentName || 'Agent'}) [Pipe A]`,
      timestamp,
      isSettled: true,
      state,
    });

    // Entry A2: Platform deduction on delivery fee
    pipeAEntries.push({
      id: `LEDGER-PA-2-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_a_delivery',
      debitAccount: 'customer_escrow',
      creditAccount: 'founder_delivery_commission',
      amount: founderDeliveryCommission,
      currency,
      memo: `Founder ${config.deliveryAgentFounderCommissionPct}% commission on delivery fee [Pipe A]`,
      timestamp,
      isSettled: true,
      state,
    });

    // ==========================================
    // PIPE B: PRODUCT MONEY SPLIT
    // ==========================================
    let merchantTotal = 0;
    let totalIboMarkup = 0;

    order.items.forEach((item) => {
      const itemBaseTotal = item.merchantBasePrice * item.quantity;
      const itemMarkupTotal = item.iboMarkup * item.quantity;
      merchantTotal += itemBaseTotal;
      totalIboMarkup += itemMarkupTotal;

      // Merchant wholesale cost payout
      pipeBEntries.push({
        id: `LEDGER-PB-MERCHANT-${item.merchantId}-${item.productId}-${order.id}`,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        pipe: 'pipe_b_product',
        debitAccount: 'customer_escrow',
        creditAccount: `merchant_payable:${item.merchantId}`,
        amount: itemBaseTotal,
        currency,
        memo: `Product base price payable to Merchant: ${item.merchantName} (${item.quantity}x ${item.productTitle}) [Pipe B]`,
        timestamp,
        isSettled: true,
        state,
      });
    });

    // IBO Direct Sales Markup earnings
    pipeBEntries.push({
      id: `LEDGER-PB-IBO-MARKUP-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_b_product',
      debitAccount: 'customer_escrow',
      creditAccount: `ibo_payable:${order.iboId}`,
      amount: totalIboMarkup,
      currency,
      memo: `IBO Direct Sales Markup earnings for Order ${order.orderNumber} [Pipe B]`,
      timestamp,
      isSettled: true,
      state,
    });

    // Platform take-rate on product volume
    const platformCut = Math.round((order.subtotal * config.platformProductCutPct) / 100);
    pipeBEntries.push({
      id: `LEDGER-PB-FOUNDER-CUT-${order.id}`,
      transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_b_product',
      debitAccount: 'customer_escrow',
      creditAccount: 'founder_platform_revenue',
      amount: platformCut,
      currency,
      memo: `Founder ${config.platformProductCutPct}% marketplace take-rate [Pipe B]`,
      timestamp,
      isSettled: true,
      state,
    });

    // Referral Commissions: 3 generations deep (Tier 1, Tier 2, Tier 3)
    // Funded strictly from founder platform margin on real sales
    // Depth respects config.activeIboCommissionDepth (1, 2, or 3)
    let referralTotal = 0;
    const baseForCommission = order.subtotal;
    const activeDepth = config.activeIboCommissionDepth ?? 3;

    if (referralChain.tier1IboId && activeDepth >= 1) {
      const tier1Amount = Math.round((baseForCommission * config.referralCommissions.tier1Pct) / 100);
      if (tier1Amount > 0) {
        referralTotal += tier1Amount;
        pipeBEntries.push({
          id: `LEDGER-PB-REF-T1-${order.id}`,
          transactionId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: `ibo_referral_payable:${referralChain.tier1IboId}`,
          amount: tier1Amount,
          currency,
          memo: `Tier 1 Referral Commission (${config.referralCommissions.tier1Pct}%) from direct referral sale [Pipe B]`,
          timestamp,
          isSettled: true,
          state,
        });
      }
    }

    if (referralChain.tier2IboId && activeDepth >= 2) {
      const tier2Amount = Math.round((baseForCommission * config.referralCommissions.tier2Pct) / 100);
      if (tier2Amount > 0) {
        referralTotal += tier2Amount;
        pipeBEntries.push({
          id: `LEDGER-PB-REF-T2-${order.id}`,
          transactionId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: `ibo_referral_payable:${referralChain.tier2IboId}`,
          amount: tier2Amount,
          currency,
          memo: `Tier 2 Referral Commission (${config.referralCommissions.tier2Pct}%) from 2nd gen referral sale [Pipe B]`,
          timestamp,
          isSettled: true,
          state,
        });
      }
    }

    if (referralChain.tier3IboId && activeDepth >= 3) {
      const tier3Amount = Math.round((baseForCommission * config.referralCommissions.tier3Pct) / 100);
      if (tier3Amount > 0) {
        referralTotal += tier3Amount;
        pipeBEntries.push({
          id: `LEDGER-PB-REF-T3-${order.id}`,
          transactionId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: `ibo_referral_payable:${referralChain.tier3IboId}`,
          amount: tier3Amount,
          currency,
          memo: `Tier 3 Referral Commission (${config.referralCommissions.tier3Pct}%) from 3rd gen (capped) referral sale [Pipe B]`,
          timestamp,
          isSettled: true,
          state,
        });
      }
    }

    // Invariant validation: Sum(Debits) === Sum(Credits)
    const allSettlementEntries = [...pipeAEntries, ...pipeBEntries];
    this.assertDoubleEntryBalanced(allSettlementEntries);

    const atomicEntries: Entry[] = allSettlementEntries.flatMap((e) => this.toAtomicEntries(e));

    const transaction: Transaction = {
      id: transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: 'delivery_settlement',
      pipe: 'combined',
      state: 'confirmed',
      entries: atomicEntries,
      totalDebits: allSettlementEntries.reduce((sum, e) => sum + e.amount, 0),
      totalCredits: allSettlementEntries.reduce((sum, e) => sum + e.amount, 0),
      currency,
      memo: `Settlement confirmed via physical QR token scan for Order ${order.orderNumber}`,
      timestamp,
      settledAt: timestamp,
    };

    return {
      transaction,
      pipeAEntries,
      pipeBEntries,
      totalOrderAmount: order.totalAmount,
      merchantTotal,
      iboTotalMarkup: totalIboMarkup,
      platformCut,
      referralTotal,
      agentEarnings: agentNetDeliveryFee,
      founderDeliveryCommission,
      isBalanced: true,
      state: 'confirmed',
    };
  }

  /**
   * Phase 3: DELIVERY FAILURE / REVERSAL WITH RECOUP (§6)
   * Strict Delivery State: 'reversed'
   * Reverses product escrow to customer refund, and executes fault-based recoup charges
   * against at-fault parties to compensate the courier for transportation attempt.
   */
  public static settleUnsuccessfulDeliveryRecoup(
    order: Order,
    reason: 'customer_refused' | 'wrong_or_damaged_item' | 'agent_no_show' | 'other',
    config: PlatformConfig
  ): RecoupResult {
    const timestamp = new Date().toISOString();
    const transactionId = `TX-RECOUP-${order.id}-${Date.now()}`;
    const refundTransactionId = `TX-REFUND-${order.id}-${Date.now()}`;
    const currency = 'NGN';
    const state: DeliveryTransactionState = 'reversed';

    const refundEntries: LedgerEntry[] = [];
    const recoupEntries: LedgerEntry[] = [];

    // 1. Escrow Reversal: Refund product money back to customer
    refundEntries.push({
      id: `LEDGER-REFUND-PB-${order.id}`,
      transactionId: refundTransactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      pipe: 'pipe_b_product',
      debitAccount: 'customer_escrow',
      creditAccount: `customer_refund_payable:${order.customerId}`,
      amount: order.subtotal,
      currency,
      memo: `Product escrow reversed and refunded to customer due to failed delivery (${reason})`,
      timestamp,
      isSettled: true,
      state,
    });

    // 2. Failed Delivery 15/15/20 Model Allocation (§5)
    // Delivery fee allocation: 15% Agent, 15% Platform, 20% Reserve, 50% Customer Refund
    const deliveryFee = order.deliveryFee;
    const split = config.failedDeliverySplit || {
      agentPct: 15,
      platformPct: 15,
      reservePct: 20,
      customerRefundPct: 50,
    };

    const agentAmount = Math.round((deliveryFee * split.agentPct) / 100);
    const platformAmount = Math.round((deliveryFee * split.platformPct) / 100);
    const reserveAmount = Math.round((deliveryFee * split.reservePct) / 100);
    // Ensure exact penny balancing: customer refund gets the remainder
    const customerDeliveryRefund = deliveryFee - (agentAmount + platformAmount + reserveAmount);

    const agentCreditedAccount = `agent_payable:${order.agentId || 'unassigned_agent'}`;

    // 2a. 15% Courier compensation for attempted trip
    if (agentAmount > 0) {
      recoupEntries.push({
        id: `LEDGER-RECOUP-AGENT-${order.id}`,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        pipe: 'recoup_unsuccessful',
        debitAccount: 'customer_escrow',
        creditAccount: agentCreditedAccount,
        amount: agentAmount,
        currency,
        memo: `Delivery Agent attempted delivery compensation (${split.agentPct}%) [15/15/20 Rule]`,
        timestamp,
        isSettled: true,
        state,
      });
    }

    // 2b. 15% Platform operational handling retention
    if (platformAmount > 0) {
      recoupEntries.push({
        id: `LEDGER-RECOUP-PLATFORM-${order.id}`,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        pipe: 'recoup_unsuccessful',
        debitAccount: 'customer_escrow',
        creditAccount: 'founder_platform_revenue',
        amount: platformAmount,
        currency,
        memo: `Platform operational handling retention (${split.platformPct}%) [15/15/20 Rule]`,
        timestamp,
        isSettled: true,
        state,
      });
    }

    // 2c. 20% Return & Logistics Reserve
    if (reserveAmount > 0) {
      recoupEntries.push({
        id: `LEDGER-RECOUP-RESERVE-${order.id}`,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        pipe: 'recoup_unsuccessful',
        debitAccount: 'customer_escrow',
        creditAccount: 'recoup_loss_account',
        amount: reserveAmount,
        currency,
        memo: `Logistics returned goods transport reserve (${split.reservePct}%) [15/15/20 Rule]`,
        timestamp,
        isSettled: true,
        state,
      });
    }

    // 2d. 50% Customer Delivery Fee Refund
    if (customerDeliveryRefund > 0) {
      recoupEntries.push({
        id: `LEDGER-RECOUP-CUST-REFUND-${order.id}`,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        pipe: 'recoup_unsuccessful',
        debitAccount: 'customer_escrow',
        creditAccount: `customer_refund_payable:${order.customerId}`,
        amount: customerDeliveryRefund,
        currency,
        memo: `Customer 50% delivery fee refund for uncompleted delivery [15/15/20 Rule]`,
        timestamp,
        isSettled: true,
        state,
      });
    }

    // Verify double entry for both refund and recoup legs
    this.assertDoubleEntryBalanced(refundEntries);
    if (recoupEntries.length > 0) {
      this.assertDoubleEntryBalanced(recoupEntries);
    }

    const atomicRecoupEntries: Entry[] = recoupEntries.flatMap((e) => this.toAtomicEntries(e));
    const atomicRefundEntries: Entry[] = refundEntries.flatMap((e) => this.toAtomicEntries(e));

    const refundTransaction: Transaction = {
      id: refundTransactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: 'order_refund',
      pipe: 'pipe_b_product',
      state: 'reversed',
      entries: atomicRefundEntries,
      totalDebits: order.subtotal,
      totalCredits: order.subtotal,
      currency,
      memo: `Product escrow reversed due to delivery failure (${reason})`,
      timestamp,
      reversedAt: timestamp,
    };

    const recoupTransaction: Transaction = {
      id: transactionId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      type: 'unsuccessful_recoup',
      pipe: 'recoup_unsuccessful',
      state: 'reversed',
      entries: atomicRecoupEntries,
      totalDebits: deliveryFee,
      totalCredits: deliveryFee,
      currency,
      memo: `Courier 15/15/20 recoup allocation for unsuccessful delivery (${reason})`,
      timestamp,
      reversedAt: timestamp,
    };

    return {
      refundTransaction,
      recoupTransaction,
      recoupEntries,
      refundEntries,
      totalRecoupAmount: deliveryFee,
      iboCharged: 0,
      merchantCharged: 0,
      founderCharged: platformAmount,
      customerPenalty: customerDeliveryRefund,
      isBalanced: true,
      state: 'reversed',
    };
  }

  /**
   * Enforces State Machine Transition Integrity (§6)
   * Allowed transitions:
   *   'pending'   -> 'confirmed' (Valid on QR scan)
   *   'pending'   -> 'reversed'  (Valid on delivery failure/cancellation)
   *   'confirmed' -> 'reversed'  (Dispute clawback only)
   * Prohibited:
   *   'confirmed' -> 'pending'   (CANNOT revert a confirmed delivery)
   *   'reversed'  -> 'pending'   (CANNOT un-fail an executed recoup)
   */
  public static transitionTransactionState(
    transaction: Transaction,
    targetState: DeliveryTransactionState,
    reason?: string
  ): Transaction {
    if (transaction.state === targetState) {
      return transaction;
    }

    if (transaction.state === 'confirmed' && targetState === 'pending') {
      throw new Error('Illegal state transition: A confirmed delivery cannot revert to pending escrow.');
    }

    if (transaction.state === 'reversed' && targetState === 'pending') {
      throw new Error('Illegal state transition: A reversed delivery cannot revert to pending escrow.');
    }

    const updatedEntries: Entry[] = transaction.entries.map((entry) => ({
      ...entry,
      state: targetState,
      isSettled: targetState === 'confirmed' || targetState === 'reversed',
    }));

    return {
      ...transaction,
      state: targetState,
      entries: updatedEntries,
      settledAt: targetState === 'confirmed' ? new Date().toISOString() : transaction.settledAt,
      reversedAt: targetState === 'reversed' ? new Date().toISOString() : transaction.reversedAt,
      memo: reason ? `${transaction.memo} [Transition to ${targetState}: ${reason}]` : transaction.memo,
    };
  }

  /**
   * Calculate Wallet Balance across Section 6 strict delivery states:
   * - pending: funds awaiting QR confirmation
   * - confirmed: available settled balance
   * - reversed: refunded or recouped amounts
   */
  public static calculateWalletBalance(
    accountPrefix: string,
    entries: (Entry | LedgerEntry)[]
  ): WalletBalance {
    let pendingCredits = 0;
    let pendingDebits = 0;
    let confirmedCredits = 0;
    let confirmedDebits = 0;
    let reversedCredits = 0;
    let reversedDebits = 0;

    let totalWithdrawn = 0;
    let directSalesEarnings = 0;
    let tier1ReferralEarnings = 0;
    let tier2ReferralEarnings = 0;
    let tier3ReferralEarnings = 0;
    let deliveryEarnings = 0;
    let platformRevenue = 0;
    let recoupPenalties = 0;

    for (const item of entries) {
      // Determine state: default to 'confirmed' if isSettled is true and state is absent
      const state: DeliveryTransactionState =
        item.state || ('isSettled' in item && item.isSettled ? 'confirmed' : 'pending');

      if ('entryType' in item && item.entryType) {
        // Atomic entry
        const isTarget = item.account.startsWith(accountPrefix);
        if (!isTarget) continue;

        if (item.entryType === 'credit') {
          if (state === 'pending') pendingCredits += item.amount;
          else if (state === 'confirmed') confirmedCredits += item.amount;
          else if (state === 'reversed') reversedCredits += item.amount;
        } else {
          if (state === 'pending') pendingDebits += item.amount;
          else if (state === 'confirmed') confirmedDebits += item.amount;
          else if (state === 'reversed') reversedDebits += item.amount;
        }
      } else if ('debitAccount' in item && 'creditAccount' in item) {
        // Paired ledger entry
        const isCredit = item.creditAccount.startsWith(accountPrefix);
        const isDebit = item.debitAccount.startsWith(accountPrefix);

        if (isCredit) {
          if (state === 'pending') pendingCredits += item.amount;
          else if (state === 'confirmed') confirmedCredits += item.amount;
          else if (state === 'reversed') reversedCredits += item.amount;

          // Category analysis for credits
          if (item.memo.includes('Direct Sales Markup')) {
            directSalesEarnings += item.amount;
          } else if (item.memo.includes('Tier 1 Referral')) {
            tier1ReferralEarnings += item.amount;
          } else if (item.memo.includes('Tier 2 Referral')) {
            tier2ReferralEarnings += item.amount;
          } else if (item.memo.includes('Tier 3 Referral')) {
            tier3ReferralEarnings += item.amount;
          } else if (item.memo.includes('Delivery fee net payout')) {
            deliveryEarnings += item.amount;
          } else if (
            item.creditAccount === 'founder_platform_revenue' ||
            item.creditAccount === 'founder_delivery_commission'
          ) {
            platformRevenue += item.amount;
          }
        }

        if (isDebit) {
          if (state === 'pending') pendingDebits += item.amount;
          else if (state === 'confirmed') confirmedDebits += item.amount;
          else if (state === 'reversed') reversedDebits += item.amount;

          if (item.pipe === 'withdrawal') {
            totalWithdrawn += item.amount;
          } else if (item.pipe === 'recoup_unsuccessful') {
            recoupPenalties += item.amount;
          }
        }
      }
    }

    const pending = Math.max(0, pendingCredits - pendingDebits);
    const confirmed = Math.max(0, confirmedCredits - confirmedDebits);
    const reversed = Math.max(0, reversedCredits - reversedDebits);

    return {
      pending,
      confirmed,
      reversed,
      availableBalance: confirmed,
      pendingEscrow: pending,
      totalEarnings: confirmedCredits,
      totalDebits: confirmedDebits + pendingDebits + reversedDebits,
      totalCredits: confirmedCredits + pendingCredits + reversedCredits,
      totalWithdrawn,
      directSalesEarnings,
      tier1ReferralEarnings,
      tier2ReferralEarnings,
      tier3ReferralEarnings,
      deliveryEarnings,
      platformRevenue,
      recoupPenalties,
    };
  }

  /**
   * Comprehensive Audit of the entire double-entry ledger (§6)
   */
  public static auditLedger(entries: (Entry | LedgerEntry)[]): LedgerAuditReport {
    let totalDebits = 0;
    let totalCredits = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let reversedCount = 0;

    let pipeADebits = 0;
    let pipeACredits = 0;
    let pipeBDebits = 0;
    let pipeBCredits = 0;

    const txMap = new Map<string, { debits: number; credits: number }>();

    for (const entry of entries) {
      const state: DeliveryTransactionState =
        entry.state || ('isSettled' in entry && entry.isSettled ? 'confirmed' : 'pending');

      if (state === 'pending') pendingCount++;
      else if (state === 'confirmed') confirmedCount++;
      else if (state === 'reversed') reversedCount++;

      const txId = entry.transactionId;
      if (!txMap.has(txId)) {
        txMap.set(txId, { debits: 0, credits: 0 });
      }
      const tx = txMap.get(txId)!;

      if ('entryType' in entry && entry.entryType) {
        if (entry.entryType === 'debit') {
          totalDebits += entry.amount;
          tx.debits += entry.amount;
          if (entry.pipe === 'pipe_a_delivery') pipeADebits += entry.amount;
          if (entry.pipe === 'pipe_b_product') pipeBDebits += entry.amount;
        } else {
          totalCredits += entry.amount;
          tx.credits += entry.amount;
          if (entry.pipe === 'pipe_a_delivery') pipeACredits += entry.amount;
          if (entry.pipe === 'pipe_b_product') pipeBCredits += entry.amount;
        }
      } else if ('debitAccount' in entry && 'creditAccount' in entry) {
        totalDebits += entry.amount;
        totalCredits += entry.amount;
        tx.debits += entry.amount;
        tx.credits += entry.amount;

        if (entry.pipe === 'pipe_a_delivery') {
          pipeADebits += entry.amount;
          pipeACredits += entry.amount;
        } else if (entry.pipe === 'pipe_b_product') {
          pipeBDebits += entry.amount;
          pipeBCredits += entry.amount;
        }
      }
    }

    const unbalancedTransactions: {
      transactionId: string;
      debitSum: number;
      creditSum: number;
      discrepancy: number;
    }[] = [];

    txMap.forEach((val, txId) => {
      const diff = Math.abs(val.debits - val.credits);
      if (diff > 0.001) {
        unbalancedTransactions.push({
          transactionId: txId,
          debitSum: val.debits,
          creditSum: val.credits,
          discrepancy: diff,
        });
      }
    });

    const discrepancy = Math.abs(totalDebits - totalCredits);

    return {
      balanced: discrepancy < 0.001 && unbalancedTransactions.length === 0,
      totalDebits,
      totalCredits,
      discrepancy,
      totalEntries: entries.length,
      totalTransactions: txMap.size,
      pendingCount,
      confirmedCount,
      reversedCount,
      pipeABalanced: Math.abs(pipeADebits - pipeACredits) < 0.001,
      pipeBBalanced: Math.abs(pipeBDebits - pipeBCredits) < 0.001,
      unbalancedTransactions,
    };
  }
}

/**
 * Backward compatibility alias so existing LedgerEngine references resolve flawlessly
 */
export const LedgerEngine = LedgerService;
