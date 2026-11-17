export interface CompanyProfile {
  companyName: string;
  taxCode?: string; // Mã số thuế (MST)
  address?: string;
  phoneNumber?: string;
  email?: string;
  logoUrl?: string; // Base64 data URL
  payrollPreparer?: string; // Người lập bảng lương
  approver?: string; // Người duyệt / Giám đốc
  notes?: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'CÔNG TY TNHH / HỘ KINH DOANH DOPI',
  taxCode: '',
  address: '',
  phoneNumber: '',
  email: '',
  payrollPreparer: 'Phụ trách Tiền Lương & Nhân sự'
};
