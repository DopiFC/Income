import React, { useState } from 'react';
import {
  X, Lock, KeyRound, ShieldCheck, ShieldAlert, Download,
  Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { StorageStatus, EncryptedVaultRecord } from '../../types/storage';
import { createBackupFileContent, restoreFromBackupFile } from '../../services/crypto';
import { AppWorkspaceState } from '../../types/storage';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageStatus: StorageStatus;
  hasStoredProfile: boolean;
  lastSavedAt: string | null;
  currentVaultRecord: EncryptedVaultRecord | null;
  onEnableStorage: (password: string) => Promise<boolean>;
  onUnlockStorage: (password: string) => Promise<boolean>;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  onLockStorage: () => void;
  onDeleteStorageProfile: () => Promise<void>;
  onRestoreBackup: (state: AppWorkspaceState, newPassword: string) => Promise<void>;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  storageStatus,
  hasStoredProfile,
  lastSavedAt,
  currentVaultRecord,
  onEnableStorage,
  onUnlockStorage,
  onChangePassword,
  onLockStorage,
  onDeleteStorageProfile,
  onRestoreBackup
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'setup' | 'unlock' | 'changePass' | 'backup'>('status');

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Backup restore file state
  const [restoreFileText, setRestoreFileText] = useState('');
  const [restorePassword, setRestorePassword] = useState('');

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password || password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsProcessing(true);
    try {
      const ok = await onEnableStorage(password);
      if (ok) {
        setSuccessMessage('Đã kích hoạt chế độ tự lưu mã hóa AES-256 thành công!');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi kích hoạt lưu trữ.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu hồ sơ.');
      return;
    }

    setIsProcessing(true);
    try {
      const ok = await onUnlockStorage(password);
      if (ok) {
        setSuccessMessage('Mở khóa hồ sơ thành công!');
        setPassword('');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1000);
      } else {
        setErrorMessage('Mật khẩu không đúng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể giải mã hồ sơ.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!oldPassword || !newPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ mật khẩu cũ và mới.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }

    setIsProcessing(true);
    try {
      const ok = await onChangePassword(oldPassword, newPassword);
      if (ok) {
        setSuccessMessage('Đổi mật khẩu hồ sơ thành công!');
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          setSuccessMessage('');
          setActiveTab('status');
        }, 1500);
      } else {
        setErrorMessage('Mật khẩu cũ không đúng.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportBackupFile = () => {
    if (!currentVaultRecord) {
      alert('Chưa có hồ sơ đã mã hóa để xuất file sao lưu.');
      return;
    }
    const content = createBackupFileContent(currentVaultRecord);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DopiGRIncome_Backup_${new Date().toISOString().split('T')[0]}.dopigr`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreFileText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    setErrorMessage('');
    if (!restoreFileText) {
      setErrorMessage('Vui lòng chọn file sao lưu .dopigr.');
      return;
    }
    if (!restorePassword) {
      setErrorMessage('Vui lòng nhập mật khẩu của file sao lưu.');
      return;
    }

    setIsProcessing(true);
    try {
      const { state } = await restoreFromBackupFile(restoreFileText, restorePassword);
      if (window.confirm('Khôi phục sẽ thay thế dữ liệu bảng lương hiện tại trong phiên. Bạn có chắc chắn muốn tiếp tục?')) {
        await onRestoreBackup(state, restorePassword);
        setSuccessMessage('Khôi phục dữ liệu từ bản sao lưu thành công!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi khôi phục từ file sao lưu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa hồ sơ lưu cục bộ trên trình duyệt này không? Dữ liệu đã lưu sẽ bị xóa vĩnh viễn khỏi IndexedDB.')) {
      await onDeleteStorageProfile();
      setActiveTab('status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base">Lưu trữ cục bộ mã hóa (IndexedDB)</h2>
              <p className="text-[11px] text-slate-400">Bảo mật thiết bị với chuẩn mã hóa AES-256-GCM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="shrink-0 flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 text-center transition-colors ${
              activeTab === 'status' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trạng thái
          </button>
          {!hasStoredProfile && (
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                activeTab === 'setup' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bật tự lưu
            </button>
          )}
          {hasStoredProfile && storageStatus === 'locked' && (
            <button
              onClick={() => setActiveTab('unlock')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                activeTab === 'unlock' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mở khóa
            </button>
          )}
          {hasStoredProfile && storageStatus !== 'locked' && (
            <button
              onClick={() => setActiveTab('changePass')}
              className={`flex-1 py-2.5 text-center transition-colors ${
                activeTab === 'changePass' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đổi mật khẩu
            </button>
          )}
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2.5 text-center transition-colors ${
              activeTab === 'backup' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sao lưu / Nhập
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm overscroll-contain">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Chế độ lưu trữ:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    storageStatus === 'saved' || storageStatus === 'unlocked'
                      ? 'bg-emerald-100 text-emerald-800'
                      : storageStatus === 'locked'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {storageStatus === 'saved' || storageStatus === 'unlocked'
                      ? 'Đã bật tự lưu (AES-256)'
                      : storageStatus === 'locked'
                      ? 'Hồ sơ đang bị khóa'
                      : 'Chế độ tạm thời (Không lưu)'}
                  </span>
                </div>

                {lastSavedAt && (
                  <div className="text-xs text-slate-500">
                    Lần lưu gần nhất: <strong>{new Date(lastSavedAt).toLocaleString('vi-VN')}</strong>
                  </div>
                )}

                <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-2">
                  🛡️ <strong>Nguyên lý bảo vệ quyền riêng tư:</strong> Dữ liệu chỉ lưu trong IndexedDB của trình duyệt trên thiết bị này và được mã hóa bằng AES-256-GCM. Không có máy chủ nào nhận được dữ liệu nhân sự hay tiền lương.
                </div>
              </div>

              {/* Action buttons depending on state */}
              <div className="space-y-2 pt-2">
                {!hasStoredProfile ? (
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Đặt mật khẩu & Bật tự lưu trên thiết bị</span>
                  </button>
                ) : storageStatus === 'locked' ? (
                  <button
                    onClick={() => setActiveTab('unlock')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Nhập mật khẩu mở khóa hồ sơ</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={onLockStorage}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Khóa hồ sơ</span>
                    </button>
                    <button
                      onClick={handleDeleteProfile}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                      title="Xóa hồ sơ khỏi IndexedDB"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa hồ sơ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SETUP MASTER PASSWORD */}
          {activeTab === 'setup' && (
            <form onSubmit={handleSetup} className="space-y-4">
              <p className="text-xs text-slate-600">
                Tạo mật khẩu để bảo vệ và tự động lưu hồ sơ nhân sự vào bộ nhớ IndexedDB của thiết bị này.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hồ sơ mới</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                ⚠️ <strong>Cảnh báo quan trọng:</strong> Vì dữ liệu được mã hóa đầu cuối bằng thuật toán AES-256, <strong>nếu quên mật khẩu sẽ KHÔNG thể khôi phục lại dữ liệu</strong>. Vui lòng ghi nhớ mật khẩu cẩn thận!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Kích hoạt mã hóa & lưu</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: UNLOCK PROFILE */}
          {activeTab === 'unlock' && (
            <form onSubmit={handleUnlock} className="space-y-4">
              <p className="text-xs text-slate-600">
                Hồ sơ Dopi GRIncome trên thiết bị này đang được mã hóa. Nhập mật khẩu để mở khóa và tải dữ liệu.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hồ sơ</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Mở khóa hồ sơ</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Quên mật khẩu hồ sơ?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90">
                  Dữ liệu được mã hóa cục bộ bằng thuật toán <strong>AES-256-GCM</strong>. Hệ thống <strong>không lưu mật khẩu và dữ liệu đã mã hóa không thể tự khôi phục nếu không có mật khẩu</strong>. Nếu quên mật khẩu, bạn có thể nhập lại từ file sao lưu <span className="font-mono font-semibold">.dopigr</span> hoặc xóa hồ sơ để khởi tạo lại.
                </p>
              </div>
            </form>
          )}

          {/* TAB: CHANGE PASSWORD */}
          {activeTab === 'changePass' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (Tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          )}

          {/* TAB: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              {/* Export backup */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Xuất file sao lưu mã hóa (.dopigr)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  File sao lưu được mã hóa nguyên vẹn bằng AES-256. Bạn có thể lưu giữ an toàn hoặc chuyển sang thiết bị khác mà không sợ lộ thông tin.
                </p>
                <button
                  onClick={handleExportBackupFile}
                  disabled={!currentVaultRecord}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors mt-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file sao lưu .dopigr</span>
                </button>
              </div>

              {/* Import backup */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Khôi phục từ file sao lưu (.dopigr)</span>
                </h4>
                <div>
                  <input
                    type="file"
                    accept=".dopigr,.json"
                    onChange={handleSelectRestoreFile}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {restoreFileText && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mật khẩu của file sao lưu:
                    </label>
                    <input
                      type="password"
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      placeholder="Nhập mật khẩu giải mã"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
                <button
                  onClick={handleExecuteRestore}
                  disabled={!restoreFileText || !restorePassword || isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Giải mã & Khôi phục dữ liệu</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
