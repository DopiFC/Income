export const ADMIN_EMAILS = ['nhgb2605@gmail.com'] as const;

export const DEFAULT_PURCHASE_URL = 'https://dopifc.github.io/EduTech-Hub/';

export type UserRole = 'user' | 'admin';
export type LicenseSource = 'none' | 'edutech_api' | 'firestore_store';
export type LicenseKeyStatus = 'available' | 'active' | 'revoked';
export type VerificationMode = 'firestore_only' | 'api_and_firestore' | 'api_only';
export type ApiHttpMethod = 'POST' | 'GET';

export interface UserProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  licenseKey: string;
  licensePlan: string;
  licenseSource: LicenseSource;
  licenseActivatedAt: string;
  licenseExpiresAt: string; // '' means lifetime or unlicensed
  licenseRevoked: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LicenseKeyDoc {
  key: string;
  plan: string;
  durationDays: number; // 0 = vĩnh viễn
  status: LicenseKeyStatus;
  assignedUid: string;
  assignedEmail: string;
  activatedAt: string;
  expiresAt: string; // '' = vĩnh viễn hoặc chưa kích hoạt
  source: 'edutech_api' | 'firestore_store';
  note: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LicenseSettingsDoc {
  verificationMode: VerificationMode;
  apiEndpointUrl: string;
  apiMethod: ApiHttpMethod;
  purchaseUrl: string;
  updatedAt?: unknown;
}

export const DEFAULT_LICENSE_SETTINGS: LicenseSettingsDoc = {
  verificationMode: 'firestore_only',
  apiEndpointUrl: '',
  apiMethod: 'POST',
  purchaseUrl: DEFAULT_PURCHASE_URL
};

export interface LicenseEvaluation {
  isActive: boolean;
  isAdmin: boolean;
  reason: 'admin' | 'ok' | 'missing' | 'revoked' | 'expired';
  daysRemaining: number | null; // null = vĩnh viễn hoặc không áp dụng
  expiresAt: string;
  plan: string;
  licenseKey: string;
}

export interface ExternalApiVerifyResult {
  valid: boolean;
  plan: string;
  durationDays: number; // 0 = vĩnh viễn
  expiresAt: string; // '' = vĩnh viễn
  message?: string;
}
