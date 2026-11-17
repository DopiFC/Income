import React from 'react';
import { TabKey, navItems } from './Navbar';
import { X, Sparkles, Trash2, ShieldCheck, ChevronRight, Lock, KeyRound } from 'lucide-react';
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  employeeCount,
  onLoadSampleData,
  onOpenResetModal,
  storageStatus,
  onOpenStorageModal
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
      <div className="relative w-80 max-w-[85vw] bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col z-10 border-r border-slate-800 animate-in slide-from-left duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm">
              DG
            </div>
            <div>
              <div className="font-bold text-base text-white">Dopi GRIncome</div>
              <div className="text-xs text-slate-400">Hệ thống tính lương & Nhân sự</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.key === 'employees' && employeeCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {employeeCount}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 opacity-40 ${isActive ? 'opacity-90' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* Bottom Storage & Session Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <button
            onClick={() => {
              onClose();
              onOpenStorageModal();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Lưu trữ mã hóa (AES-256)</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
              {storageStatus === 'saved' || storageStatus === 'unlocked' ? 'Bật' : 'Cấu hình'}
            </span>
          </button>

          <div className="flex flex-col gap-2">
            {employeeCount === 0 ? (
              <button
                onClick={() => {
                  onLoadSampleData();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-lg hover:bg-emerald-900 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Nạp 8 nhân viên mẫu
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenResetModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-500/30 rounded-lg hover:bg-rose-900 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa toàn bộ dữ liệu phiên
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
