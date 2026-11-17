export type ContractType = 'probation' | 'official_fixed' | 'official_indefinite' | 'part_time';
export type PayFrequency = 'month' | 'day' | 'hour';
export type SalaryType = 'gross' | 'net';
export type ResidencyStatus = 'resident' | 'non_resident';
export type WorkingStatus =
  | 'active'
  | 'leave'
  | 'resignation_submitted'
  | 'resignation_approved'
  | 'abandoned'
  | 'terminated'
  | 'resigned';
export type RegionType = 'I' | 'II' | 'III' | 'IV';

export interface WorkingStatusMeta {
  value: WorkingStatus;
  label: string;
  shortLabel: string;
  textClass: string;
  bgClass: string;
  isOffboarded: boolean;
}

export const WORKING_STATUS_OPTIONS: WorkingStatusMeta[] = [
  {
    value: 'active',
    label: 'Đang làm việc',
    shortLabel: 'Đang làm',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200',
    isOffboarded: false
  },
  {
    value: 'resignation_submitted',
    label: 'Đã nộp đơn xin nghỉ',
    shortLabel: 'Nộp đơn nghỉ',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50 border-amber-200',
    isOffboarded: false
  },
  {
    value: 'resignation_approved',
    label: 'Duyệt nghỉ',
    shortLabel: 'Duyệt nghỉ',
    textClass: 'text-blue-800',
    bgClass: 'bg-blue-50 border-blue-200',
    isOffboarded: true
  },
  {
    value: 'abandoned',
    label: 'Nghỉ ngang',
    shortLabel: 'Nghỉ ngang',
    textClass: 'text-rose-800',
    bgClass: 'bg-rose-50 border-rose-200',
    isOffboarded: true
  },
  {
    value: 'terminated',
    label: 'Sa thải',
    shortLabel: 'Sa thải',
    textClass: 'text-red-900',
    bgClass: 'bg-red-100 border-red-300',
    isOffboarded: true
  }
];

export function getWorkingStatusMeta(status?: WorkingStatus): WorkingStatusMeta {
  if (status === 'leave') {
    return {
      value: 'leave',
      label: 'Tạm nghỉ',
      shortLabel: 'Tạm nghỉ',
      textClass: 'text-slate-700',
      bgClass: 'bg-slate-100 border-slate-200',
      isOffboarded: false
    };
  }
  if (status === 'resigned') {
    return {
      value: 'resigned',
      label: 'Đã nghỉ việc',
      shortLabel: 'Đã nghỉ',
      textClass: 'text-slate-700',
      bgClass: 'bg-slate-100 border-slate-300',
      isOffboarded: true
    };
  }
  return WORKING_STATUS_OPTIONS.find((opt) => opt.value === status) || WORKING_STATUS_OPTIONS[0];
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  isTaxable: boolean;
  isSubjectToInsurance: boolean;
  notes?: string;
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  department: string;
  position: string;
  rank: string;
  joinDate: string;
  contractType: ContractType;
  contractStartDate?: string;
  contractEndDate?: string;
  salaryType: SalaryType; // Gross or Net target
  baseSalary: number; // Thỏa thuận (Gross hoặc Net)
  insuranceSalary: number; // Lương làm căn cứ đóng bảo hiểm (mặc định = baseSalary nếu Gross, hoặc cấu hình riêng)
  useCustomInsuranceSalary: boolean;
  region: RegionType; // Vùng I, II, III, IV
  dependentsCount: number;
  residencyStatus: ResidencyStatus;

  // Tham gia bảo hiểm
  hasSocialInsurance: boolean; // BHXH
  hasHealthInsurance: boolean; // BHYT
  hasUnemploymentInsurance: boolean; // BHTN
  hasTradeUnion: boolean; // Đoàn phí

  // Phụ cấp cố định
  lunchAllowance: number; // Tiền ăn trưa (miễn thuế tới 730k theo chuẩn, hoặc quy định)
  phoneAllowance: number;
  transportAllowance: number;
  housingAllowance: number;
  positionAllowance: number; // Phụ cấp chức vụ (chịu thuế, chịu BHXH)
  otherAllowances: Allowance[];

  workingStatus: WorkingStatus;
  statusUpdatedAt?: string;
  statusNote?: string;
  bankAccount?: string;
  bankName?: string;
}
