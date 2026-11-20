import React, { useState } from 'react';
import { HardDriveUpload, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppWorkspaceState, EncryptedVaultRecord } from '../../types/storage';
import { decryptWorkspace } from '../../services/crypto';

export interface LocalLegacyCandidate {
  type: 'plain' | 'encrypted';
  employeeCount?: number;
  savedAt?: string;
  plainWorkspace?: AppWorkspaceState;
  encryptedRecord?: EncryptedVaultRecord;
}

interface LocalMigrationBannerProps {
  candidate: LocalLegacyCandidate;
  onImportWorkspace: (state: AppWorkspaceState) => Promise<void>;
  onDismiss: () => void;
}

export const LocalMigrationBanner: React.FC<LocalMigrationBannerProps> = ({
  candidate,
  onImportWorkspace,
  onDismiss
}) => {
  const [password, setPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  const handleImportPlain = async () => {
    if (!candidate.plainWorkspace) return;
    setErrorMsg('');
    setIsImporting(true);
    try {
      await onImportWorkspace(candidate.plainWorkspace);
      setDone(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Không thể chuyển dữ liệu lên Firebase.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate.encryptedRecord || !password) return;
    setErrorMsg('');
    setIsImporting(true);
    try {
      const decrypted = await decryptWorkspace(candidate.encryptedRecord, password);
      await onImportWorkspace(decrypted);
      setDone(true);
    } catch {
      setErrorMsg('Mật khẩu mở khóa hồ sơ cục bộ không chính xác.');
    } finally {
      setIsImporting(false);
    }
  };

  if (done) {
    return (
      <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Đã nhập dữ liệu cũ từ trình duyệt và đồng bộ lên tài khoản Firebase thành công.
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-emerald-700 hover:text-emerald-900 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0">
            {candidate.type === 'encrypted' ? (
              <Lock className="w-4 h-4 text-blue-700" />
            ) : (
              <HardDriveUpload className="w-4 h-4 text-blue-700" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm">
              Phát hiện dữ liệu bảng lương cũ trên máy này
            </div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              {candidate.type === 'encrypted'
                ? 'Trình duyệt đang lưu một hồ sơ bảng lương mã hóa AES-256 trước khi kết nối Firebase. Nhập mật khẩu hồ sơ cũ để đồng bộ lên tài khoản của bạn.'
                : `Trình duyệt đang lưu dữ liệu cũ gồm ${candidate.employeeCount ?? 0} nhân viên. Bạn có muốn chuyển toàn bộ dữ liệu này lên tài khoản Firebase không?`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-700 rounded shrink-0"
          title="Để sau"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {candidate.type === 'plain' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isImporting}
            onClick={() => void handleImportPlain()}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <HardDriveUpload className="w-3.5 h-3.5" />
            <span>
              {isImporting
                ? 'Đang chuyển lên Firebase...'
                : `Chuyển ${candidate.employeeCount ?? 0} nhân viên lên Firebase`}
            </span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg whitespace-nowrap"
          >
            Bỏ qua, dùng dữ liệu mới
          </button>
        </div>
      ) : (
        <form onSubmit={handleImportEncrypted} className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            required
            placeholder="Nhập mật khẩu hồ sơ cục bộ cũ..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs min-w-[220px] flex-1 max-w-xs"
          />
          <button
            type="submit"
            disabled={isImporting || !password}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <HardDriveUpload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Đang mở khóa...' : 'Mở khóa & chuyển lên Firebase'}</span>
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
