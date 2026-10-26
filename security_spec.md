# Security Specification & Security TDD (Firestore RBAC)

## 1. Data Invariants
1. **Isolated Role Surfaces**: No user can act across unauthorized boundaries. Founder/Admin actions require administrative authorization verified against the `admins` collection or verified admin token.
2. **Double-Entry Accounting Invariant**: All ledger records require valid schema, debit and credit account bindings, and positive monetary amounts. Direct modification of historical ledger entries is prohibited (Append-only immutability).
3. **QR Verification Token Integrity**: Customer single-use confirmation QR tokens cannot be altered or scanned except during formal physical delivery completion.
4. **Escrow Lock**: Customer order payment status and escrow funds remain strictly isolated in escrow until confirmed by customer QR scan or resolved through authorized recoups.
5. **PII Isolation**: Customer phone numbers and addresses are restricted to the customer, the assigned delivery agent, the selling IBO, and founder admins.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Payload 1 (Privilege Escalation)**: Attacker attempts to write `role: 'founder'` or `isAdmin: true` into `/users/{attackerUid}`.
2. **Payload 2 (Ghost Field Injection)**: Attacker injects `{ isVerified: true, fakeCredit: 999999 }` on order creation.
3. **Payload 3 (Direct Escrow Release)**: Non-admin or unassigned agent attempts to update `paymentStatus: 'released'` without scanning the physical QR token.
4. **Payload 4 (Ledger Tampering)**: Attacker attempts to update an existing entry in `/ledger/{entryId}` to alter debit/credit amounts.
5. **Payload 5 (Oversized ID / Denial of Wallet)**: Attacker uses a 2KB junk character string for `{orderId}`.
6. **Payload 6 (Unauthorized Product Modification)**: Merchant B attempts to edit or delete wholesale price for Merchant A's product.
7. **Payload 7 (Unverified Email Admin Spoof)**: Attacker sets email to `afolayanchampion@gmail.com` with `email_verified: false`.
8. **Payload 8 (Orphaned Write)**: Attacker submits an order referencing a non-existent `iboId`.
9. **Payload 9 (Withdrawal State Forgery)**: Participant attempts to directly change their withdrawal request status from `pending` to `processed`.
10. **Payload 10 (Negative Money Invariant)**: User submits a ledger entry or order with negative amounts (`amount: -5000`).
11. **Payload 11 (Blanket Query Leak)**: Unauthenticated user queries all orders or users via a broad list request.
12. **Payload 12 (KYC Identity Impersonation)**: User submits KYC verification claiming another user's `userId`.

## 3. Test Runner Invariants
All operations matching the Dirty Dozen must return `PERMISSION_DENIED` across security rule evaluation.
