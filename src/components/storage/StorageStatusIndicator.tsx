import React from 'react';
import { StorageStatus } from '../../types/storage';
import { Lock, Unlock, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

interface StorageStatusIndicatorProps {
  status: StorageStatus;
  hasStoredProfile: boolean;
  onOpenModal: () => void;
}

export const StorageStatusIndicator: React.FC<StorageStatusIndicatorProps> = ({
  status,
  hasStoredProfile,
  onOpenModal
}) => {
  return (
    <button
      onClick={onOpenModal}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
        status === 'saving'
          ? 'bg-blue-900/60 border-blue-500/40 text-blue-200'
          : status === 'saved' || status === 'unlocked'
          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
          : status === 'locked'
          ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
          : status === 'error'
          ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/80'
      }`}
      title="Quản lý lưu trữ mã hóa cục bộ trên thiết bị (AES-256)"
    >
      {status === 'saving' ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span className="hidden sm:inline font-medium">Đang lưu...</span>
        </>
      ) : status === 'saved' || status === 'unlocked' ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-medium">Đã lưu trên thiết bị</span>
        </>
      ) : status === 'locked' ? (
        <>
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline font-medium">Đã khóa bảo mật</span>
        </>
      ) : status === 'error' ? (
        <>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline font-medium">Lưu thất bại</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline font-medium">Tự lưu thiết bị</span>
        </>
      )}
    </button>
  );
};
