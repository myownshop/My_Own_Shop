import { platformStore, SEED_PRODUCTS, SEED_MERCHANTS, SEED_AGENTS, SEED_IBO_PROFILES, SEED_ORDERS, SEED_LEDGER } from './store';
import { Product, MerchantProfile, IboProfile, DeliveryAgentProfile, Order, LedgerEntry } from '../types';

let isSyncInitialized = false;

export async function initSupabaseBackendSync() {
  if (isSyncInitialized) return;
  isSyncInitialized = true;

  try {
    // 1. Fetch products from SQL/Supabase backend API
    const productsRes = await fetch('/api/products').catch(() => null);
    if (productsRes && productsRes.ok) {
      const dbProducts = await productsRes.json();
      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        platformStore.syncProductsFromRemote(dbProducts as Product[]);
      }
    }

    // 2. Fetch merchants from SQL/Supabase backend API
    const merchantsRes = await fetch('/api/merchants').catch(() => null);
    if (merchantsRes && merchantsRes.ok) {
      const dbMerchants = await merchantsRes.json();
      if (Array.isArray(dbMerchants) && dbMerchants.length > 0) {
        platformStore.syncMerchantsFromRemote(dbMerchants);
      }
    }

    // 3. Fetch IBOs from SQL/Supabase backend API
    const ibosRes = await fetch('/api/ibos').catch(() => null);
    if (ibosRes && ibosRes.ok) {
      const dbIbos = await ibosRes.json();
      if (Array.isArray(dbIbos) && dbIbos.length > 0) {
        const iboMap: Record<string, IboProfile> = {};
        for (const ibo of dbIbos) {
          iboMap[ibo.id] = {
            id: ibo.id,
            iboNumber: ibo.iboNumber,
            userId: ibo.userId,
            name: ibo.name,
            slug: ibo.slug,
            referralCode: ibo.referralCode,
            tier: ibo.tier || 'free',
            referredById: ibo.referredById,
            tier1Count: ibo.tier1Count || 0,
            tier2Count: ibo.tier2Count || 0,
            tier3Count: ibo.tier3Count || 0,
            shopBranding: {
              storeName: ibo.storeName || ibo.name,
              tagline: ibo.tagline || 'Curated Storefront',
              accentColor: ibo.accentColor || '#10b981',
              supportEmail: ibo.supportEmail || 'support@ibohub.ng',
              supportPhone: ibo.supportPhone || '+234 800 000 0000',
            },
            selectedMerchantIds: ['mrc-1', 'mrc-2'],
            completedTraining: true,
            cosmeticBadges: [],
            isBoostedOnFounderHome: false,
          };
        }
        platformStore.syncIbosFromRemote(iboMap);
      }
    }

    console.log('Supabase backend synchronization initialized successfully.');
  } catch (err) {
    console.warn('Backend synchronization note:', err);
  }
}

// Persist single order to Supabase / Backend API
export async function syncOrderToBackend(order: Order): Promise<boolean> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Update order status in Supabase / Backend API
export async function updateOrderStatusInBackend(
  orderId: string,
  status: Order['orderStatus'],
  additionalFields: Record<string, any> = {}
): Promise<boolean> {
  try {
    const res = await fetch('/api/delivery/confirm-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        qrToken: additionalFields.qrToken || 'qr-confirmed',
        deliveryNotes: additionalFields,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend order update note:', err);
    return false;
  }
}

export const updateOrderStatusInFirestore = updateOrderStatusInBackend;

export async function syncOrderMutation(order: Order, ledgerEntries: LedgerEntry[]) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (err) {
    console.warn('Order sync note:', err);
  }
}

export async function pushIboToFirestore(ibo: IboProfile) {
  try {
    await fetch('/api/ibos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ibo),
    });
  } catch (err) {
    console.warn('IBO sync note:', err);
  }
}

export async function pushMerchantToFirestore(merchant: any) {
  try {
    await fetch('/api/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merchant),
    });
  } catch (err) {
    console.warn('Merchant sync note:', err);
  }
}

export async function pushAgentToFirestore(agent: DeliveryAgentProfile) {
  try {
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
  } catch (err) {
    console.warn('Agent sync note:', err);
  }
}

export async function pushKycToFirestore(kyc: any) {
  try {
    await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kyc),
    });
  } catch (err) {
    console.warn('KYC sync note:', err);
  }
}

export async function syncUserAccountToFirestore(user: any) {
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
    });
  } catch (err) {
    console.warn('User sync note:', err);
  }
}


