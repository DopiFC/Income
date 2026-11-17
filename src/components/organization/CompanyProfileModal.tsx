import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../../types/organization';
import { Building2, X, Check, Upload, Trash2, ShieldCheck, Phone, Mail, MapPin, Hash, UserCheck } from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [companyName, setCompanyName] = useState(profile.companyName || '');
  const [taxCode, setTaxCode] = useState(profile.taxCode || '');
  const [address, setAddress] = useState(profile.address || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [email, setEmail] = useState(profile.email || '');
  const [payrollPreparer, setPayrollPreparer] = useState(profile.payrollPreparer || '');
  const [approver, setApprover] = useState(profile.approver || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setCompanyName(profile.companyName || '');
    setTaxCode(profile.taxCode || '');
    setAddress(profile.address || '');
    setPhoneNumber(profile.phoneNumber || '');
    setEmail(profile.email || '');
    setPayrollPreparer(profile.payrollPreparer || '');
    setApprover(profile.approver || '');
    setLogoUrl(profile.logoUrl || '');
    setError('');
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước logo không nên vượt quá 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Tên công ty hoặc hộ kinh doanh không được để trống.');
      return;
    }

    onSaveProfile({
      companyName: companyName.trim(),
      taxCode: taxCode.trim(),
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      payrollPreparer: payrollPreparer.trim(),
      approver: approver.trim(),
      logoUrl
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-200">
        {/* Header (Sticky Top) */}
        <div className="shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base">Thông tin tổ chức / Hộ kinh doanh</h2>
              <p className="text-[11px] text-slate-400">Hiển thị trên phiếu lương, bảng tính và xuất file báo cáo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm overscroll-contain">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {error}
              </div>
            )}

          {/* Logo upload and Preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {logoUrl ? (
              <div className="relative w-16 h-16 rounded-lg bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700"
                  title="Xóa logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logo doanh nghiệp / hộ kinh doanh (tùy chọn)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 block mt-0.5">Hỗ trợ PNG, JPG, SVG dưới 2MB</span>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên công ty hoặc hộ kinh doanh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="VD: CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ DOPI"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Tax code & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>Mã số thuế (MST)</span>
              </label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="VD: 0101234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Số điện thoại</span>
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 024.3999.8888"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Địa chỉ trụ sở / kinh doanh</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Số 123 Đường Cầu Giấy, Hà Nội"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email liên hệ</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: ketoan@dopi.vn"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preparer & Approver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Người lập bảng lương</span>
              </label>
              <input
                type="text"
                value={payrollPreparer}
                onChange={(e) => setPayrollPreparer(e.target.value)}
                placeholder="VD: Nguyễn Thị Lan (Kế toán tiền lương)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Người duyệt / Giám đốc</span>
              </label>
              <input
                type="text"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="VD: Trần Văn Bình (Giám đốc)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 bg-slate-50 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs sm:text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-sm text-xs sm:text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Lưu thông tin tổ chức</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
