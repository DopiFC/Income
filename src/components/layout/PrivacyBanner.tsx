import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Cam kết bảo mật" className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs py-1.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            Dữ liệu xử lý hoàn toàn trên trình duyệt và tự động lưu cục bộ trên thiết bị (IndexedDB).
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors shrink-0"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

