import React from 'react';
import { TabKey, navItems } from './Navbar';
import {
  X,
  Sparkles,
  Trash2,
  ChevronRight,
  KeyRound,
  LogOut,
  ShieldCheck,
  Database
} from 'lucide-react';
import { StorageStatus } from '../../types/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  employeeCount: number;
  onLoadSampleData: () => void;
  onOpenResetModal: () => void;
  storageStatus: StorageStatus;
  onOpenStorageModal: () => void;
  userEmail?: string;
  userDisplayName?: string;
  licenseLabel?: string;
  isAdmin?: boolean;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  employeeCount,
  onLoadSampleData,
  onOpenResetModal,
  onOpenStorageModal,
  userEmail,
  userDisplayName,
  licenseLabel,
  isAdmin,
  onSignOut
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col z-10 border-r border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shrink-0">
              DG
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base text-white truncate">Dopi GRIncome</div>
              <div className="text-xs text-slate-400 truncate">Hệ thống tính lương & Nhân sự</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Summary */}
        {userEmail && (
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-xs space-y-1">
            <div className="font-semibold text-white truncate">
              {userDisplayName || userEmail}
            </div>
            <div className="text-slate-400 truncate">{userEmail}</div>
            {licenseLabel && (
              <div className="text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{licenseLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Chức năng nghiệp vụ
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectTab(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.key === 'employees' && employeeCount > 0 && (
                    <span className="text-xs font-mono tabular-nums text-slate-300">
                      {employeeCount}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 opacity-40 ${isActive ? 'opacity-90' : ''}`} />
                </div>
              </button>
            );
          })}

          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-slate-800 space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-amber-400 uppercase">
                Quản trị hệ thống
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('admin-license');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin-license'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-amber-200 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="truncate">Quản trị Key & API</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Storage & Session Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenStorageModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Database className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">Sao lưu & Dữ liệu trên máy</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
          </button>

          <div className="flex flex-col gap-2">
            {employeeCount === 0 ? (
              <button
                type="button"
                onClick={() => {
                  onLoadSampleData();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nạp 8 nhân viên mẫu</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa toàn bộ dữ liệu phiên</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
