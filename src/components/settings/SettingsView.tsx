import React, { useState } from 'react';
import {
  Building2, Scale, Users, ShieldCheck, Lock, KeyRound, Download,
  Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Save, Sliders, Check
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import { StorageStatus, EncryptedVaultRecord, AppWorkspaceState } from '../../types/storage';
import { LegalRulesView } from '../legal/LegalRulesView';
import { DepartmentRankManager } from '../organization/DepartmentRankManager';
import { SalaryConfigView } from '../payroll/SalaryConfigView';
import { formatVND } from '../../utils/currency';
import { createBackupFileContent, restoreFromBackupFile } from '../../services/crypto';

interface SettingsViewProps {
  employees: Employee[];
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  legalConfig: LegalConfig;
  onUpdateLegalConfig: (config: LegalConfig) => void;
  onResetDefaultConfig: () => void;
  departments: string[];
  ranks: string[];
  onAddDepartment: (name: string) => void;
  onAddRank: (name: string) => void;
  onBatchUpdateDepartment: (ids: string[], dept: string) => void;
  onBatchUpdateRank: (ids: string[], rank: string) => void;
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
  onOpenResetModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  employees,
  companyProfile,
  onSaveCompanyProfile,
  legalConfig,
  onUpdateLegalConfig,
  onResetDefaultConfig,
  departments,
  ranks,
  onAddDepartment,
  onAddRank,
  onBatchUpdateDepartment,
  onBatchUpdateRank,
  storageStatus,
  hasStoredProfile,
  lastSavedAt,
  currentVaultRecord,
  onEnableStorage,
  onUnlockStorage,
  onChangePassword,
  onLockStorage,
  onDeleteStorageProfile,
  onRestoreBackup,
  onOpenResetModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'legal' | 'organization' | 'security'>('company');

  // Company Form state
  const [compName, setCompName] = useState(companyProfile.companyName);
  const [taxCode, setTaxCode] = useState(companyProfile.taxCode || '');
  const [address, setAddress] = useState(companyProfile.address || '');
  const [phone, setPhone] = useState(companyProfile.phoneNumber || '');
  const [email, setEmail] = useState(companyProfile.email || '');
  const [preparer, setPreparer] = useState(companyProfile.payrollPreparer || '');
  const [approver, setApprover] = useState(companyProfile.approver || '');
  const [logoUrl, setLogoUrl] = useState(companyProfile.logoUrl || '');
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  // Security Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Backup restore
  const [restoreText, setRestoreText] = useState('');
  const [restorePass, setRestorePass] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanyProfile({
      companyName: compName.trim() || 'CÔNG TY TNHH / HỘ KINH DOANH',
      taxCode: taxCode.trim(),
      address: address.trim(),
      phoneNumber: phone.trim(),
      email: email.trim(),
      payrollPreparer: preparer.trim(),
      approver: approver.trim(),
      logoUrl
    });
    setCompanySaveSuccess(true);
    setTimeout(() => setCompanySaveSuccess(false), 2500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước logo không nên vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setSecurityMsg({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'Xác nhận mật khẩu không trùng khớp.' });
      return;
    }

    setIsProcessing(true);
    try {
      await onEnableStorage(newPassword);
      setSecurityMsg({ type: 'success', text: 'Đã thiết lập mật khẩu mã hóa hồ sơ thành công!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMsg({ type: 'error', text: err.message || 'Lỗi khi cài đặt mật khẩu.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBackup = () => {
    if (!currentVaultRecord) {
      alert('Chưa có hồ sơ mã hóa để xuất. Bạn có thể đặt mật khẩu mã hóa trước khi xuất file .dopigr');
      return;
    }
    const content = createBackupFileContent(currentVaultRecord);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_DopiGR_${new Date().toISOString().slice(0, 10)}.dopigr`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);
    if (!restoreText) {
      setSecurityMsg({ type: 'error', text: 'Vui lòng chọn hoặc dán nội dung file sao lưu .dopigr.' });
      return;
    }
    if (!restorePass) {
      setSecurityMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu của file sao lưu để giải mã.' });
      return;
    }

    setIsProcessing(true);
    try {
      const { state } = await restoreFromBackupFile(restoreText, restorePass);
      await onRestoreBackup(state, restorePass);
      setSecurityMsg({ type: 'success', text: 'Đã khôi phục thành công toàn bộ dữ liệu từ bản sao lưu!' });
      setRestoreText('');
      setRestorePass('');
    } catch (err: any) {
      setSecurityMsg({ type: 'error', text: err.message || 'Lỗi khi giải mã file sao lưu.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreText(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Cài Đặt Doanh Nghiệp & Dữ Liệu</h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin tổ chức, quy tắc tính lương năm 2026, cơ cấu nhân sự và bảo mật lưu trữ trên thiết bị
        </p>

        {/* Sub-tabs navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('company')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'company'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Thông tin doanh nghiệp</span>
          </button>

          <button
            onClick={() => setActiveSubTab('legal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'legal'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Quy tắc pháp luật 2026</span>
          </button>

          <button
            onClick={() => setActiveSubTab('organization')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'organization'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Phòng ban & Cấp bậc</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'security'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Lưu trữ & Bảo mật</span>
            {hasStoredProfile && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Company Profile */}
      {activeSubTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Thông tin Công ty / Hộ kinh doanh</h2>
              <p className="text-xs text-slate-500">Thông tin này được hiển thị chính thức trên Phiếu lương và Báo cáo xuất Excel</p>
            </div>
            {companySaveSuccess && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Đã lưu thông tin
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Tên công ty hoặc Hộ kinh doanh <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="Ví dụ: CÔNG TY CỔ PHẦN CÔNG NGHỆ & THƯƠNG MẠI DOPI"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-600 uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã số thuế (MST)</label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="Ví dụ: 0109876543"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ví dụ: 024.3888.9999"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trụ sở / Địa điểm kinh doanh</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ví dụ: Tầng 12, Tòa nhà Dopi Tower, Q. Cầu Giấy, Hà Nội"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ kế toán / HR</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@dopi.vn"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logo doanh nghiệp</label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="w-10 h-10 border border-slate-200 rounded p-1 bg-white shrink-0 overflow-hidden">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                    Trống
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-rose-600 hover:text-rose-800 text-xs"
                  >
                    Xóa logo
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người lập bảng lương</label>
              <input
                type="text"
                value={preparer}
                onChange={(e) => setPreparer(e.target.value)}
                placeholder="Ví dụ: Đỗ Hải Yến (Chuyên viên C&B)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người duyệt / Kế toán trưởng</label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An (Tổng Giám Đốc)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thông tin doanh nghiệp</span>
            </button>
          </div>
        </form>
      )}

      {/* Sub-Tab 2: Legal Rules 2026 */}
      {activeSubTab === 'legal' && (
        <LegalRulesView
          legalConfig={legalConfig}
          onUpdateLegalConfig={onUpdateLegalConfig}
          onResetDefaultConfig={onResetDefaultConfig}
        />
      )}

      {/* Sub-Tab 3: Organization & Ranks */}
      {activeSubTab === 'organization' && (
        <div className="space-y-6">
          <DepartmentRankManager
            employees={employees}
            departments={departments}
            ranks={ranks}
            onAddDepartment={onAddDepartment}
            onAddRank={onAddRank}
            onBatchUpdateDepartment={onBatchUpdateDepartment}
            onBatchUpdateRank={onBatchUpdateRank}
          />
        </div>
      )}

      {/* Sub-Tab 4: Security & Data Storage */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h3 className="font-bold text-emerald-950 text-sm">
                Tự động lưu trữ trên trình duyệt (IndexedDB) đang hoạt động
              </h3>
              <p className="text-emerald-800 mt-0.5">
                Mọi thay đổi về nhân viên, chấm công, thông tin doanh nghiệp và kết quả tính lương đều được tự động lưu ngay trên thiết bị của bạn. Khi bạn tải lại trang (F5) hoặc mở lại website sau này, toàn bộ dữ liệu sẽ được khôi phục nguyên vẹn.
              </p>
              {lastSavedAt && (
                <div className="mt-2 text-emerald-700 font-mono text-[11px]">
                  Thời gian lưu gần nhất: {new Date(lastSavedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>

          {/* Optional Password Protection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Khóa mật khẩu mã hóa nâng cao (Tùy chọn)
                </h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                storageStatus === 'unlocked' || storageStatus === 'saved'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {storageStatus === 'unlocked' || storageStatus === 'saved' ? 'Mã hóa AES-256-GCM' : 'Lưu cục bộ tiêu chuẩn'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu bạn dùng chung máy tính với người khác hoặc muốn bảo mật tuyệt đối, bạn có thể thiết lập mật khẩu bảo vệ. Dữ liệu sẽ được mã hóa bằng chuẩn quân đội <strong>AES-256-GCM</strong> trước khi lưu vào IndexedDB. Khi mở lại website, người dùng phải nhập đúng mật khẩu này mới có thể giải mã và xem dữ liệu.
            </p>

            {securityMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                securityMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {securityMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{securityMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSetPassword} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu bảo vệ hồ sơ (ít nhất 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận lại mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Đang thiết lập...' : 'Bật bảo vệ mật khẩu'}</span>
                </button>

                {hasStoredProfile && (
                  <button
                    type="button"
                    onClick={onLockStorage}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Khóa phiên làm việc ngay
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Backup & Restore Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Backup */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Xuất file sao lưu (.dopigr)</span>
              </div>
              <p className="text-xs text-slate-500">
                Tải file sao lưu mã hóa an toàn về máy tính để lưu trữ định kỳ hoặc chuyển sang thiết bị khác mà không lo lộ số liệu.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Tải file sao lưu (.dopigr)</span>
              </button>
            </div>

            {/* Import Backup */}
            <form onSubmit={handleRestoreFile} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Khôi phục từ file sao lưu</span>
              </div>
              <p className="text-xs text-slate-500">
                Chọn file sao lưu .dopigr đã xuất trước đó và nhập mật khẩu giải mã tương ứng.
              </p>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".dopigr,.json"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                <input
                  type="password"
                  value={restorePass}
                  onChange={(e) => setRestorePass(e.target.value)}
                  placeholder="Nhập mật khẩu giải mã của file..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Khôi phục dữ liệu từ file</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone: Clear data */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-xs text-rose-900 uppercase tracking-wide">
                Khu vực nhạy cảm: Xóa trắng phiên làm việc
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Xóa sạch danh sách nhân viên, dữ liệu chấm công và thông tin tạm thời để bắt đầu một bảng lương mới hoàn toàn.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenResetModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa toàn bộ dữ liệu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
