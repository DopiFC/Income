import { describe, it, expect, vi } from 'vitest';
import {
  computeExpiresAtIso,
  evaluateLicenseStatus,
  generateRandomLicenseKey,
  isValidLicenseKeyFormat,
  normalizeLicenseKey,
  verifyKeyViaEduTechApi
} from '../services/licenseService';
import { stripUndefinedDeep } from '../services/firestoreWorkspace';
import { DEFAULT_LICENSE_SETTINGS, UserProfileDoc } from '../types/license';

const baseProfile: UserProfileDoc = {
  uid: 'user-123',
  email: 'khachhang@congty.vn',
  displayName: 'Khách hàng A',
  role: 'user',
  licenseKey: '',
  licensePlan: '',
  licenseSource: 'none',
  licenseActivatedAt: '',
  licenseExpiresAt: '',
  licenseRevoked: false
};

describe('License key normalization & validation', () => {
  it('normalizes whitespace and casing cleanly', () => {
    expect(normalizeLicenseKey('  dopi-ab12-cd34  ')).toBe('DOPI-AB12-CD34');
    expect(isValidLicenseKeyFormat('DOPI-AB12-CD34')).toBe(true);
    expect(isValidLicenseKeyFormat('AB')).toBe(false);
  });

  it('generates valid random keys with prefix', () => {
    const k = generateRandomLicenseKey('EDU');
    expect(k.startsWith('EDU-')).toBe(true);
    expect(isValidLicenseKeyFormat(k)).toBe(true);
  });

  it('computes expiration dates for finite days and empty string for lifetime', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    expect(computeExpiresAtIso(0, start)).toBe('');
    expect(computeExpiresAtIso(30, start)).toBe('2026-01-31T00:00:00.000Z');
  });
});

describe('evaluateLicenseStatus', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('denies access when licenseKey is missing', () => {
    const res = evaluateLicenseStatus(baseProfile, now);
    expect(res.isActive).toBe(false);
    expect(res.reason).toBe('missing');
  });

  it('grants access to admin accounts regardless of license key', () => {
    const adminProfile: UserProfileDoc = {
      ...baseProfile,
      email: 'nhgb2605@gmail.com',
      role: 'admin'
    };
    const res = evaluateLicenseStatus(adminProfile, now);
    expect(res.isActive).toBe(true);
    expect(res.isAdmin).toBe(true);
    expect(res.reason).toBe('admin');
  });

  it('grants lifetime access when licenseKey is set and expiresAt is empty', () => {
    const res = evaluateLicenseStatus(
      {
        ...baseProfile,
        licenseKey: 'DOPI-LIFE-0001',
        licensePlan: 'Vĩnh viễn',
        licenseSource: 'edutech_api',
        licenseExpiresAt: ''
      },
      now
    );
    expect(res.isActive).toBe(true);
    expect(res.daysRemaining).toBeNull();
  });

  it('computes remaining days for active timed license and blocks expired or revoked keys', () => {
    const active = evaluateLicenseStatus(
      {
        ...baseProfile,
        licenseKey: 'DOPI-30D-0001',
        licenseExpiresAt: '2026-06-11T00:00:00.000Z'
      },
      now
    );
    expect(active.isActive).toBe(true);
    expect(active.daysRemaining).toBe(10);

    const expired = evaluateLicenseStatus(
      {
        ...baseProfile,
        licenseKey: 'DOPI-30D-0001',
        licenseExpiresAt: '2026-05-31T23:59:59.000Z'
      },
      now
    );
    expect(expired.isActive).toBe(false);
    expect(expired.reason).toBe('expired');

    const revoked = evaluateLicenseStatus(
      {
        ...baseProfile,
        licenseKey: 'DOPI-30D-0001',
        licenseExpiresAt: '2026-12-31T00:00:00.000Z',
        licenseRevoked: true
      },
      now
    );
    expect(revoked.isActive).toBe(false);
    expect(revoked.reason).toBe('revoked');
  });
});

describe('verifyKeyViaEduTechApi', () => {
  it('parses valid POST response with durationDays', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ valid: true, plan: 'EduTech Pro 1 năm', durationDays: 365 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch;

    const result = await verifyKeyViaEduTechApi(
      'EDUTECH-2026-9999',
      { uid: 'u1', email: 'a@b.vn' },
      {
        ...DEFAULT_LICENSE_SETTINGS,
        verificationMode: 'api_only',
        apiEndpointUrl: 'https://api.example.com/verify',
        apiMethod: 'POST'
      },
      mockFetch
    );

    expect(result.valid).toBe(true);
    expect(result.plan).toBe('EduTech Pro 1 năm');
    expect(result.durationDays).toBe(365);
    expect(result.expiresAt.length).toBeGreaterThan(10);
  });

  it('returns invalid with API error message when rejected', async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ valid: false, message: 'Key chưa thanh toán' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    ) as unknown as typeof fetch;

    const result = await verifyKeyViaEduTechApi(
      'INVALID-KEY',
      { uid: 'u1', email: 'a@b.vn' },
      {
        ...DEFAULT_LICENSE_SETTINGS,
        verificationMode: 'api_only',
        apiEndpointUrl: 'https://api.example.com/verify',
        apiMethod: 'GET'
      },
      mockFetch
    );

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Key chưa thanh toán');
  });
});

describe('stripUndefinedDeep', () => {
  it('removes undefined keys deeply while keeping null, 0, and false', () => {
    const cleaned = stripUndefinedDeep({
      name: 'NV1',
      optional: undefined,
      zero: 0,
      flag: false,
      empty: null,
      nested: { a: 1, b: undefined },
      list: [{ x: 'ok', y: undefined }]
    });
    expect(cleaned).toEqual({
      name: 'NV1',
      zero: 0,
      flag: false,
      empty: null,
      nested: { a: 1 },
      list: [{ x: 'ok' }]
    });
  });
});
