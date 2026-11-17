import React from 'react';
import {
  Menu, X, Sparkles, Trash2, Calendar, FileSpreadsheet,
  Users, Building2, Sliders, Clock, Calculator, Download,
  Scale, HelpCircle, LayoutDashboard, ShieldCheck, Lock
} from 'lucide-react';
import { StorageStatus } from '../../types/storage';
import { StorageStatusIndicator } from '../storage/StorageStatusIndicator';

export type TabKey =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'payroll'
  | 'payslip'
  | 'reports'
  | 'settings'
  | 'guide'
  | 'company'
  | 'import'
  | 'organization'
  | 'salary-config'
  | 'legal';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  employeeCount: number;
  onLoadSampleData: () => void;
  onOpenResetModal: () => void;
  storageStatus: StorageStatus;
  hasStoredProfile: boolean;
  onOpenStorageModal: () => void;
}

export const navItems: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'employees', label: 'Nhân viên', icon: Users },
  { key: 'attendance', label: 'Chấm công & Dữ liệu', icon: Clock },
  { key: 'payroll', label: 'Bảng lương', icon: Calculator },
  { key: 'payslip', label: 'Phiếu lương', icon: FileSpreadsheet },
  { key: 'reports', label: 'Báo cáo', icon: Download },
  { key: 'settings', label: 'Cài đặt doanh nghiệp & Dữ liệu', icon: Sliders },
  { key: 'guide', label: 'Hướng dẫn sử dụng', icon: HelpCircle },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  selectedMonth,
  setSelectedMonth,
  employeeCount,
  onLoadSampleData,
  onOpenResetModal,
  storageStatus,
  hasStoredProfile,
  onOpenStorageModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-hidden"
            aria-label="Toggle navigation menu"
            title="Menu điều hướng"
          >
            {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold tracking-tight text-white text-sm group-hover:bg-blue-500 transition-colors shrink-0">
              DG
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap shrink-0">
              Dopi GRIncome
            </span>
          </div>
        </div>

        {/* Center: Month Selector (compact on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-700/60 text-xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="hidden lg:inline text-slate-300 font-medium">Kỳ lương:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer text-xs w-24 sm:w-auto"
          />
        </div>

        {/* Right: Storage Status + Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Storage status button */}
          <StorageStatusIndicator
            status={storageStatus}
            hasStoredProfile={hasStoredProfile}
            onOpenModal={onOpenStorageModal}
          />

          {employeeCount === 0 && (
            <button
              onClick={onLoadSampleData}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg hover:bg-emerald-900/60 transition-all shadow-sm"
              title="Nạp dữ liệu mẫu 8 nhân viên để dùng thử ngay"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nạp mẫu</span>
            </button>
          )}

          {employeeCount > 0 && (
            <button
              onClick={onOpenResetModal}
              className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg hover:bg-rose-900/60 transition-colors"
              title="Xóa toàn bộ dữ liệu phiên làm việc"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Xóa phiên</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
