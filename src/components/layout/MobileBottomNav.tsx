import React from 'react';
import { LayoutDashboard, Calculator, Users, Clock, Menu } from 'lucide-react';
import { TabKey } from './Navbar';

interface MobileBottomNavProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenSidebar: () => void;
  employeeCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSidebar,
  employeeCount
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-slate-400 flex items-center justify-around h-15 shadow-2xl px-1 no-print backdrop-blur-md"
    >
      {/* Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Tổng quan</span>
      </button>

      {/* Payroll */}
      <button
        onClick={() => onSelectTab('payroll')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'payroll' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Calculator className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Bảng lương</span>
      </button>

      {/* Attendance */}
      <button
        onClick={() => onSelectTab('attendance')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          activeTab === 'attendance' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Clock className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Chấm công</span>
      </button>

      {/* Employees */}
      <button
        onClick={() => onSelectTab('employees')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
          activeTab === 'employees' ? 'text-blue-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <Users className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Nhân sự</span>
        {employeeCount > 0 && (
          <span className="absolute top-0.5 right-1/4 w-3.5 h-3.5 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
            {employeeCount > 99 ? '99+' : employeeCount}
          </span>
        )}
      </button>

      {/* More / Menu */}
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Menu className="w-4 h-4 mb-0.5" />
        <span className="text-[10px]">Thêm</span>
      </button>
    </nav>
  );
};
