import { LedgerEntry } from '../types';

/**
 * Generates 30 days of balanced double-entry ledger transactions
 * spanning August 12, 2026 to September 11, 2026.
 * All debits and credits strictly balance: Sum(Debits) === Sum(Credits).
 */
export function generate30DayHistoricalLedger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  // Seed sample products & merchants for realistic narratives
  const merchants = [
    { id: 'mrc-1', name: 'AgroFresh Mega Farms', product: 'Certified Organic Fertilizer 50kg', wholesale: 18500, markup: 3500 },
    { id: 'mrc-2', name: 'Lagos Prime Automobile Spares', product: 'Heavy-Duty Alternator Assembly', wholesale: 34000, markup: 5000 },
    { id: 'mrc-3', name: 'GreenVolt Solar Tech Ltd', product: '350W Monocrystalline Solar Panel', wholesale: 42000, markup: 6000 },
    { id: 'mrc-4', name: 'Lekki Loom Textiles & Footwear', product: 'Artisanal Genuine Calfskin Loafers', wholesale: 38000, markup: 4500 },
    { id: 'mrc-5', name: 'AfroGourmet Natural Spices', product: 'Premium Stone-Free Ofada Rice 10kg', wholesale: 22000, markup: 3000 },
  ];

  const agents = [
    { id: 'agt-1', name: 'Tunde Balogun (Rider)' },
    { id: 'agt-2', name: 'Emeka Nwosu (Van Rider)' },
    { id: 'agt-3', name: 'Kabiru Sanusi (Cargo Tricycle)' },
  ];

  const ibos = ['ibo-1', 'ibo-2'];

  // Base date: 2026-09-11
  const baseDate = new Date('2026-09-11T12:00:00Z');

  // Daily seed pattern across 30 days (day 29 down to day 0)
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = dayDate.toISOString().split('T')[0];

    // 2 to 4 orders per day with pseudo-random deterministic variation
    const ordersCount = 2 + ((daysAgo * 7 + 3) % 3);

    for (let orderIdx = 0; orderIdx < ordersCount; orderIdx++) {
      const orderNum = `ORD-2026-${String(7000 + daysAgo * 10 + orderIdx)}`;
      const orderId = `ord-hist-${daysAgo}-${orderIdx}`;
      const txId = `TX-${orderId}-${dateStr}`;

      const mrc = merchants[(daysAgo + orderIdx) % merchants.length];
      const agt = agents[(daysAgo + orderIdx) % agents.length];
      const iboId = ibos[(daysAgo + orderIdx) % ibos.length];
      const qty = 1 + ((daysAgo + orderIdx) % 2);

      const subtotal = (mrc.wholesale + mrc.markup) * qty;
      const wholesaleTotal = mrc.wholesale * qty;
      const markupTotal = mrc.markup * qty;
      const deliveryFee = 3500 + (((daysAgo + orderIdx) % 3) * 500); // 3500, 4000, 4500
      const founderDeliveryComm = Math.round(deliveryFee * 0.15); // 15% platform delivery cut
      const agentPayout = deliveryFee - founderDeliveryComm; // 85% courier payout

      const platformProductCut = Math.round(subtotal * 0.05); // 5% marketplace take-rate
      const tier1Comm = Math.round(subtotal * 0.05); // 5% Tier 1 upline
      const tier2Comm = Math.round(subtotal * 0.03); // 3% Tier 2 upline
      const tier3Comm = Math.round(subtotal * 0.02); // 2% Tier 3 upline

      const orderTime = `${dateStr}T${String(9 + (orderIdx * 3)).padStart(2, '0')}:15:00Z`;
      const deliverTime = `${dateStr}T${String(13 + (orderIdx * 3)).padStart(2, '0')}:45:00Z`;

      // Is it delivered or in-transit?
      // Only the last 1-2 orders from today (daysAgo === 0) are in transit; all others are settled
      const isDelivered = daysAgo > 0 || orderIdx === 0;

      // 1. Escrow Placement (Both Pipe A and Pipe B)
      // Pipe A: Delivery Fee Escrow Inflow
      entries.push({
        id: `LEDGER-HIST-ESC-PA-${orderId}`,
        transactionId: `${txId}-HOLD`,
        orderId,
        orderNumber: orderNum,
        pipe: 'pipe_a_delivery',
        debitAccount: `customer_funds:cust-hist-${daysAgo}`,
        creditAccount: 'customer_escrow',
        amount: deliveryFee,
        currency: 'NGN',
        memo: `Delivery fee escrow lock for ${orderNum} [Pipe A]`,
        timestamp: orderTime,
        isSettled: isDelivered,
        state: isDelivered ? 'confirmed' : 'pending',
      });

      // Pipe B: Product Escrow Inflow
      entries.push({
        id: `LEDGER-HIST-ESC-PB-${orderId}`,
        transactionId: `${txId}-HOLD`,
        orderId,
        orderNumber: orderNum,
        pipe: 'pipe_b_product',
        debitAccount: `customer_funds:cust-hist-${daysAgo}`,
        creditAccount: 'customer_escrow',
        amount: subtotal,
        currency: 'NGN',
        memo: `Product funds escrow lock for ${orderNum} [Pipe B]`,
        timestamp: orderTime,
        isSettled: isDelivered,
        state: isDelivered ? 'confirmed' : 'pending',
      });

      if (isDelivered) {
        // 2. Pipe A Settlement (Escrow to Courier + Founder Delivery Commission)
        entries.push({
          id: `LEDGER-HIST-PA-AGT-${orderId}`,
          transactionId: `${txId}-SETTLE`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_a_delivery',
          debitAccount: 'customer_escrow',
          creditAccount: `agent_payable:${agt.id}`,
          amount: agentPayout,
          currency: 'NGN',
          memo: `Delivery courier payout to ${agt.name} (${orderNum}) [Pipe A]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        entries.push({
          id: `LEDGER-HIST-PA-FND-${orderId}`,
          transactionId: `${txId}-SETTLE`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_a_delivery',
          debitAccount: 'customer_escrow',
          creditAccount: 'founder_delivery_commission',
          amount: founderDeliveryComm,
          currency: 'NGN',
          memo: `Founder 15% delivery commission on ${orderNum} [Pipe A]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        // 3. Pipe B Settlement (Merchant Base + IBO Direct Markup + Founder Platform Cut)
        entries.push({
          id: `LEDGER-HIST-PB-MRC-${orderId}`,
          transactionId: `${txId}-SETTLE`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'customer_escrow',
          creditAccount: `merchant_payable:${mrc.id}`,
          amount: wholesaleTotal,
          currency: 'NGN',
          memo: `Merchant wholesale release to ${mrc.name} for ${qty}x ${mrc.product} [Pipe B]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        entries.push({
          id: `LEDGER-HIST-PB-IBO-${orderId}`,
          transactionId: `${txId}-SETTLE`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'customer_escrow',
          creditAccount: `ibo_payable:${iboId}`,
          amount: markupTotal,
          currency: 'NGN',
          memo: `IBO direct retail markup for ${orderNum} [Pipe B]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        entries.push({
          id: `LEDGER-HIST-PB-FND-${orderId}`,
          transactionId: `${txId}-SETTLE`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'customer_escrow',
          creditAccount: 'founder_platform_revenue',
          amount: platformProductCut,
          currency: 'NGN',
          memo: `Founder 5% platform cut for ${orderNum} [Pipe B]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        // 4. Referral Commission Chain (3 Generations)
        // Funded from platform revenue to reward upline network
        entries.push({
          id: `LEDGER-HIST-REF-T1-${orderId}`,
          transactionId: `${txId}-REF`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: 'ibo_referral_payable:ibo-1',
          amount: tier1Comm,
          currency: 'NGN',
          memo: `Tier 1 Affiliate Commission (5%) for direct referral sale [${orderNum}]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        entries.push({
          id: `LEDGER-HIST-REF-T2-${orderId}`,
          transactionId: `${txId}-REF`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: 'ibo_referral_payable:ibo-2',
          amount: tier2Comm,
          currency: 'NGN',
          memo: `Tier 2 Affiliate Commission (3%) for 2nd-gen referral sale [${orderNum}]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });

        entries.push({
          id: `LEDGER-HIST-REF-T3-${orderId}`,
          transactionId: `${txId}-REF`,
          orderId,
          orderNumber: orderNum,
          pipe: 'pipe_b_product',
          debitAccount: 'founder_platform_revenue',
          creditAccount: 'ibo_referral_payable:ibo-3',
          amount: tier3Comm,
          currency: 'NGN',
          memo: `Tier 3 Affiliate Commission (2%) for 3rd-gen referral sale [${orderNum}]`,
          timestamp: deliverTime,
          isSettled: true,
          state: 'confirmed',
        });
      }
    }
  }

  return entries;
}
