# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: A user can only read or write their own `/users/{uid}` profile and `/users/{uid}/workspaces/{workspaceId}` data. No regular user can list `/users` or `/licenseKeys`.
2. **Verified Identity & Anti-Spoofing**: All standard writes and admin checks require `request.auth != null && request.auth.token.email_verified == true`.
3. **No Self-Assigned Role or License**: On `/users/{uid}` creation, non-admin users must set `role == 'user'`, `licenseKey == ''`, `licenseSource == 'none'`, and `licenseRevoked == false`. On update, non-admin users can only set `licenseKey` if atomically claiming/binding `/licenseKeys/{keyId}` in the same transaction (`existsAfter` + `getAfter`).
4. **Master Gate on Payroll Workspaces**: Non-admin users cannot read or write `/users/{uid}/workspaces/{workspaceId}` unless their parent `/users/{uid}` document has an active, non-revoked `licenseKey`.
5. **1 Key = 1 Account & Terminal State Locking**: Once a `/licenseKeys/{keyId}` document is `active` or `revoked`, non-admin users can never re-claim or modify it. Non-admin users cannot create `edutech_api` keys when `appConfig/licenseSettings.verificationMode == 'firestore_only'`.
6. **Strict Schema, Boundaries & Server Timestamps**: Every document write validates exact key allowlists (`hasAll`/`hasOnly`), field types, string `.size()` limits, bounded array sizes, immutable `uid`/`ownerUid`/`createdAt`, and `request.time` timestamps.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read of `/users/u1`**: `auth: null` -> DENIED.
2. **Unverified email spoofing admin**: `auth: { uid: 'attacker', email: 'nhgb2605@gmail.com', email_verified: false }` trying to read `/licenseKeys` -> DENIED.
3. **Cross-user PII read**: `u2` reading `/users/u1` -> DENIED.
4. **Self-assigned admin role on signup**: `u1` creating `/users/u1` with `{ role: 'admin', ... }` -> DENIED.
5. **Self-granted free license on signup**: `u1` creating `/users/u1` with `{ licenseKey: 'FREE-KEY', licenseSource: 'firestore_store', ... }` -> DENIED.
6. **Shadow/ghost field injection**: `u1` updating `/users/u1` with extra key `{ isVip: true }` -> DENIED.
7. **Unlicensed workspace write**: `u1` (with `licenseKey: ''`) writing `/users/u1/workspaces/primary` -> DENIED.
8. **License hijacking (already active key)**: `u2` updating `/licenseKeys/KEY-1` (currently `status: 'active'`, `assignedUid: 'u1'`) -> DENIED.
9. **Key scraping via list query**: `u1` listing `/licenseKeys` -> DENIED.
10. **Forging EduTech API key while in firestore_only mode**: `u1` creating `/licenseKeys/FAKE-1` with `source: 'edutech_api'` when `verificationMode == 'firestore_only'` -> DENIED.
11. **Client-forged timestamp**: `u1` updating `/users/u1` with `updatedAt` != `request.time` -> DENIED.
12. **ID poisoning / oversized payload**: `u1` creating document with 1.5KB key ID or `displayName` > 120 chars -> DENIED.
