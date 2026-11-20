import React, { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import {
  activateLicenseKeyForUser,
  normalizeLicenseKey
} from '../../services/licenseService';
import { DEFAULT_PURCHASE_URL } from '../../types/license';

function formatDateVN(iso: string): string {
  if (!iso) return 'Vĩnh viễn';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const LicenseGateScreen: React.FC = () => {
  const { user, profile, licenseEval, licenseSettings, signOutUser } = useFirebase();
  const [keyInput, setKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const purchaseUrl = licenseSettings.purchaseUrl || DEFAULT_PURCHASE_URL;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    setSuccessMsg('');

    const normalized = normalizeLicenseKey(keyInput);
    if (normalized.length < 4) {
      setErrorMsg('Vui lòng nhập đầy đủ mã key bản quyền bạn đã mua tại EduTech-Hub.');
      return;
    }

    setIsActivating(true);
    try {
      const result = await activateLicenseKeyForUser(normalized, user);
      setSuccessMsg(
        `Kích hoạt thành công gói "${result.plan}" (${
          result.expiresAt ? `Hạn dùng đến ${formatDateVN(result.expiresAt)}` : 'Sử dụng vĩnh viễn'
        }). Đang mở phần mềm...`
      );
      setKeyInput('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể kích hoạt mã key. Vui lòng kiểm tra lại.'
      );
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-sm text-white shrink-0">
              DG
            </div>
            <span className="font-bold text-base tracking-tight whitespace-nowrap">
              Dopi GRIncome
            </span>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-slate-300 truncate max-w-[160px] sm:max-w-[260px]">
              {profile?.email || user?.email}
            </span>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Activation Panel */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              {licenseEval.reason === 'expired' || licenseEval.reason === 'revoked' ? (
                <ShieldAlert className="w-5 h-5 text-rose-700" />
              ) : (
                <Lock className="w-5 h-5 text-blue-700" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 text-balance">
                {licenseEval.reason === 'expired'
                  ? 'Mã bản quyền của bạn đã hết hạn'
                  : licenseEval.reason === 'revoked'
                    ? 'Mã bản quyền của tài khoản đã bị thu hồi'
                    : 'Kích hoạt key bản quyền để sử dụng Dopi GRIncome'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {licenseEval.reason === 'expired'
                  ? `Mã key cũ (${licenseEval.licenseKey}) đã hết hạn vào ngày ${formatDateVN(
                      licenseEval.expiresAt
                    )}. Vui lòng mua key gia hạn tại EduTech-Hub và nhập bên dưới để tiếp tục truy cập dữ liệu.`
                  : licenseEval.reason === 'revoked'
                    ? `Mã key (${licenseEval.licenseKey}) không còn hiệu lực. Vui lòng nhập mã key hợp lệ mới mua từ EduTech-Hub.`
                    : 'Tài khoản của bạn đã đăng nhập thành công, nhưng cần nhập mã key bản quyền hợp lệ để mở khóa toàn bộ tính năng quản lý nhân sự và tính lương.'}
              </p>
            </div>
          </div>

          {/* Step 1: Buy Key CTA */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-slate-900">Bước 1: Mua key bản quyền</div>
              <div className="text-xs text-slate-600 break-all">
                Trang phân phối chính thức: <span className="font-medium text-blue-700">{purchaseUrl}</span>
              </div>
            </div>
            <a
              href={purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Mua key tại EduTech-Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2: Enter & Activate Key */}
          <form onSubmit={handleActivate} className="space-y-3.5">
            <div>
              <label
                htmlFor="license-key-input"
                className="block text-xs font-bold text-slate-900 mb-1.5"
              >
                Bước 2: Nhập mã key để kích hoạt tài khoản
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="license-key-input"
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="VD: DOPI-ABCD-1234-EFGH"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums tracking-wider uppercase border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Quy tắc bản quyền: mỗi mã key chỉ gắn cố định cho <strong>1 tài khoản duy nhất</strong>{' '}
                (hỗ trợ gói theo thời hạn hoặc vĩnh viễn).
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivating || !keyInput.trim()}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isActivating ? 'Đang kiểm tra & kích hoạt key...' : 'Kích hoạt bản quyền'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
