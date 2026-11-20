import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  Settings,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Ban,
  RotateCcw,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  Send
} from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import {
  adminCreateLicenseKeys,
  adminListLicenseKeys,
  adminSetKeyRevoked,
  normalizeLicenseKey,
  saveLicenseSettings,
  verifyKeyViaEduTechApi
} from '../../services/licenseService';
import {
  ApiHttpMethod,
  DEFAULT_PURCHASE_URL,
  LicenseKeyDoc,
  LicenseKeyStatus,
  VerificationMode
} from '../../types/license';

function formatDateVN(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const AdminLicenseView: React.FC = () => {
  const { user, licenseSettings, refreshLicenseSettings } = useFirebase();

  // API Settings state
  const [verificationMode, setVerificationMode] = useState<VerificationMode>(
    licenseSettings.verificationMode
  );
  const [apiEndpointUrl, setApiEndpointUrl] = useState(licenseSettings.apiEndpointUrl);
  const [apiMethod, setApiMethod] = useState<ApiHttpMethod>(licenseSettings.apiMethod);
  const [purchaseUrl, setPurchaseUrl] = useState(
    licenseSettings.purchaseUrl || DEFAULT_PURCHASE_URL
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // API Test state
  const [testKey, setTestKey] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Key Generator state
  const [createMode, setCreateMode] = useState<'auto' | 'custom'>('auto');
  const [keyCount, setKeyCount] = useState(5);
  const [keyPrefix, setKeyPrefix] = useState('DOPI');
  const [customKeysText, setCustomKeysText] = useState('');
  const [planPreset, setPlanPreset] = useState<'30' | '90' | '365' | '0' | 'custom'>('365');
  const [customDays, setCustomDays] = useState(30);
  const [planName, setPlanName] = useState('Gói 1 năm');
  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdBanner, setCreatedBanner] = useState<string[]>([]);

  // Key List state
  const [keys, setKeys] = useState<LicenseKeyDoc[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | LicenseKeyStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setVerificationMode(licenseSettings.verificationMode);
    setApiEndpointUrl(licenseSettings.apiEndpointUrl);
    setApiMethod(licenseSettings.apiMethod);
    setPurchaseUrl(licenseSettings.purchaseUrl || DEFAULT_PURCHASE_URL);
  }, [licenseSettings]);

  const loadKeys = async () => {
    setIsLoadingKeys(true);
    setActionError('');
    try {
      const list = await adminListLicenseKeys();
      setKeys(list);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể tải danh sách key.');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const handlePlanPresetChange = (val: '30' | '90' | '365' | '0' | 'custom') => {
    setPlanPreset(val);
    if (val === '30') setPlanName('Gói 1 tháng (30 ngày)');
    else if (val === '90') setPlanName('Gói 3 tháng (90 ngày)');
    else if (val === '365') setPlanName('Gói 1 năm (365 ngày)');
    else if (val === '0') setPlanName('Bản quyền vĩnh viễn');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsFeedback(null);

    if (verificationMode !== 'firestore_only' && !apiEndpointUrl.trim().startsWith('http')) {
      setSettingsFeedback({
        type: 'err',
        text: 'Vui lòng nhập đường dẫn API bắt đầu bằng https:// khi bật kiểm tra qua API EduTech-Hub.'
      });
      return;
    }

    setIsSavingSettings(true);
    try {
      await saveLicenseSettings({
        verificationMode,
        apiEndpointUrl: apiEndpointUrl.trim(),
        apiMethod,
        purchaseUrl: purchaseUrl.trim() || DEFAULT_PURCHASE_URL
      });
      await refreshLicenseSettings();
      setSettingsFeedback({
        type: 'ok',
        text: 'Đã lưu cấu hình xác thực key thành công.'
      });
    } catch (err) {
      setSettingsFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Không thể lưu cấu hình.'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestApi = async () => {
    setTestResult(null);
    const norm = normalizeLicenseKey(testKey);
    if (!norm) {
      setTestResult({ type: 'err', text: 'Nhập 1 mã key mẫu để kiểm tra thử API.' });
      return;
    }
    setIsTestingApi(true);
    try {
      const res = await verifyKeyViaEduTechApi(
        norm,
        { uid: user?.uid || 'admin-test', email: user?.email || null },
        {
          verificationMode,
          apiEndpointUrl: apiEndpointUrl.trim(),
          apiMethod,
          purchaseUrl: purchaseUrl.trim() || DEFAULT_PURCHASE_URL
        }
      );
      if (res.valid) {
        setTestResult({
          type: 'ok',
          text: `API phản hồi HỢP LỆ — Gói: ${res.plan}, Hạn: ${
            res.expiresAt ? formatDateVN(res.expiresAt) : 'Vĩnh viễn'
          }.`
        });
      } else {
        setTestResult({
          type: 'err',
          text: res.message || 'API trả về key không hợp lệ.'
        });
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleCreateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setCreatedBanner([]);

    const durationDays =
      planPreset === 'custom' ? Math.max(0, Math.floor(customDays)) : Number(planPreset);

    setIsCreating(true);
    try {
      const customList =
        createMode === 'custom'
          ? customKeysText
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
          : undefined;

      const created = await adminCreateLicenseKeys({
        count: keyCount,
        prefix: keyPrefix,
        customKeys: customList,
        plan: planName,
        durationDays,
        note
      });
      setCreatedBanner(created);
      setCustomKeysText('');
      setNote('');
      await loadKeys();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể tạo mã key.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRevoke = async (item: LicenseKeyDoc) => {
    setActionError('');
    try {
      await adminSetKeyRevoked(
        item.key,
        item.status !== 'revoked',
        item.assignedUid || undefined
      );
      await loadKeys();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái key.');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const filteredKeys = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return keys.filter((k) => {
      if (statusFilter !== 'all' && k.status !== statusFilter) return false;
      if (!q) return true;
      return (
        k.key.toLowerCase().includes(q) ||
        k.assignedEmail.toLowerCase().includes(q) ||
        k.plan.toLowerCase().includes(q) ||
        k.note.toLowerCase().includes(q)
      );
    });
  }, [keys, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    let available = 0;
    let active = 0;
    let revoked = 0;
    for (const k of keys) {
      if (k.status === 'available') available++;
      else if (k.status === 'active') active++;
      else if (k.status === 'revoked') revoked++;
    }
    return { total: keys.length, available, active, revoked };
  }, [keys]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
            <span>Quản trị Bản quyền & API EduTech-Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cấu hình API kiểm tra key từ EduTech-Hub, phát hành và theo dõi key kích hoạt (1 key / 1 tài khoản).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadKeys()}
          className="self-start sm:self-auto px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKeys ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Section 1: EduTech-Hub API Configuration */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Globe className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">
            1. Kết nối API kiểm tra Key từ EduTech-Hub
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chế độ xác thực key
              </label>
              <select
                value={verificationMode}
                onChange={(e) => setVerificationMode(e.target.value as VerificationMode)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="firestore_only">Kho key Firebase (Mặc định)</option>
                <option value="api_and_firestore">Kết hợp API EduTech-Hub + Kho Firebase</option>
                <option value="api_only">Chỉ xác thực qua API EduTech-Hub</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương thức HTTP
              </label>
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as ApiHttpMethod)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="POST">POST (JSON body)</option>
                <option value="GET">GET (Query string)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trang mua key (nút mở cho khách)
              </label>
              <input
                type="url"
                value={purchaseUrl}
                onChange={(e) => setPurchaseUrl(e.target.value)}
                placeholder={DEFAULT_PURCHASE_URL}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL API kiểm tra key của EduTech-Hub
            </label>
            <input
              type="url"
              value={apiEndpointUrl}
              onChange={(e) => setApiEndpointUrl(e.target.value)}
              placeholder="VD: https://api.edutech-hub.vn/verify-key hoặc URL Cloudflare Worker / Google Apps Script"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Gửi lên: <code className="font-mono text-slate-700">{'{ key, uid, email, app: "dopi-grincome" }'}</code> — API trả về JSON:{' '}
              <code className="font-mono text-slate-700">{'{ "valid": true, "plan": "Gói 1 năm", "durationDays": 365 }'}</code>{' '}
              (để <code className="font-mono">durationDays: 0</code> nếu vĩnh viễn). Key sau khi hợp lệ sẽ tự động khóa 1:1 vào tài khoản trên Firestore.
            </p>
          </div>

          {settingsFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                settingsFeedback.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {settingsFeedback.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{settingsFeedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình API'}</span>
            </button>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value.toUpperCase())}
                placeholder="Nhập key mẫu để test thử API..."
                className="flex-1 px-3 py-1.5 text-xs font-mono uppercase border border-slate-300 rounded-lg bg-white"
              />
              <button
                type="button"
                disabled={isTestingApi || !apiEndpointUrl.trim()}
                onClick={() => void handleTestApi()}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-45 border border-slate-300 rounded-lg flex items-center gap-1 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingApi ? 'Đang gọi...' : 'Test API'}</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg border text-xs ${
                testResult.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {testResult.text}
            </div>
          )}
        </form>
      </section>

      {/* Section 2: Generate / Seed Keys */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              2. Tạo mã key mới trong kho Firebase
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCreateMode('auto')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                createMode === 'auto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tạo ngẫu nhiên
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('custom')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                createMode === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Nhập danh sách key có sẵn
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateKeys} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {createMode === 'auto' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng key (1–50)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={keyCount}
                    onChange={(e) => setKeyCount(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiền tố mã key</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={keyPrefix}
                    onChange={(e) => setKeyPrefix(e.target.value.toUpperCase())}
                    placeholder="DOPI"
                    className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Danh sách mã key (mỗi dòng 1 mã, đồng bộ với EduTech-Hub)
                </label>
                <textarea
                  rows={3}
                  value={customKeysText}
                  onChange={(e) => setCustomKeysText(e.target.value.toUpperCase())}
                  placeholder={'EDUTECH-2026-0001\nEDUTECH-2026-0002'}
                  className="w-full px-3 py-2 font-mono uppercase border border-slate-300 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thời hạn sử dụng</label>
              <select
                value={planPreset}
                onChange={(e) =>
                  handlePlanPresetChange(e.target.value as '30' | '90' | '365' | '0' | 'custom')
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="30">30 ngày (1 tháng)</option>
                <option value="90">90 ngày (3 tháng)</option>
                <option value="365">365 ngày (1 năm)</option>
                <option value="0">Vĩnh viễn</option>
                <option value="custom">Tùy chỉnh số ngày</option>
              </select>
              {planPreset === 'custom' && (
                <input
                  type="number"
                  min={1}
                  max={36500}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value) || 30)}
                  placeholder="Số ngày hiệu lực"
                  className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg tabular-nums"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên gói & Ghi chú</label>
              <input
                type="text"
                maxLength={64}
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="VD: Gói 1 năm"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú đợt phát hành (tùy chọn)"
                className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Đang tạo key...' : 'Phát hành mã key'}</span>
          </button>

          {createdBanner.length > 0 && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-900">
                  Đã phát hành thành công {createdBanner.length} mã key:
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy(createdBanner.join('\n'))}
                  className="px-2.5 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  {copiedKey === createdBanner.join('\n') ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Sao chép tất cả</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-950 bg-white border border-emerald-200 rounded-md p-2.5 max-h-36 overflow-y-auto select-all">
                {createdBanner.join('\n')}
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Section 3: Key Ledger Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 tabular-nums">
            <span className="font-bold text-slate-900 text-sm">3. Sổ cái Key đã phát hành</span>
            <span>Tổng: {counts.total}</span>
            <span aria-hidden="true">·</span>
            <span className="text-blue-700 font-medium">Chưa dùng: {counts.available}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">Đang dùng: {counts.active}</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-700 font-medium">Thu hồi: {counts.revoked}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã key, email..."
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | LicenseKeyStatus)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Chưa dùng</option>
              <option value="active">Đã kích hoạt</option>
              <option value="revoked">Đã thu hồi</option>
            </select>
          </div>
        </div>

        {actionError && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {actionError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[760px]">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Mã key</th>
                <th className="py-2.5 px-3">Gói / Thời hạn</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Tài khoản kích hoạt</th>
                <th className="py-2.5 px-3">Hạn dùng</th>
                <th className="py-2.5 px-3">Nguồn</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {isLoadingKeys ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Đang tải danh sách mã key...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có mã key nào phù hợp. Hãy tạo key mới ở mục 2 hoặc kết nối API EduTech-Hub.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.key}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(item.key)}
                          className="p-1 text-slate-400 hover:text-blue-700 rounded"
                          title="Sao chép mã key"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {item.note && (
                        <div className="text-[11px] font-sans font-normal text-slate-500">
                          {item.note}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium">{item.plan}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.durationDays > 0 ? `${item.durationDays} ngày` : 'Vĩnh viễn'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {item.status === 'available' && (
                        <span className="text-blue-700">Chưa dùng</span>
                      )}
                      {item.status === 'active' && (
                        <span className="text-emerald-700">Đang hoạt động</span>
                      )}
                      {item.status === 'revoked' && (
                        <span className="text-rose-700">Đã thu hồi</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {item.assignedEmail ? (
                        <div>
                          <div className="font-medium">{item.assignedEmail}</div>
                          <div className="text-[11px] text-slate-400">
                            Kích hoạt: {formatDateVN(item.activatedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Chưa gắn tài khoản</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.status === 'available'
                        ? item.durationDays > 0
                          ? `${item.durationDays} ngày từ lúc nhập`
                          : 'Vĩnh viễn'
                        : item.expiresAt
                          ? formatDateVN(item.expiresAt)
                          : 'Vĩnh viễn'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {item.source === 'edutech_api' ? 'API EduTech-Hub' : 'Kho Firebase'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => void handleToggleRevoke(item)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 border whitespace-nowrap ${
                          item.status === 'revoked'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {item.status === 'revoked' ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>Khôi phục</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Thu hồi</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
