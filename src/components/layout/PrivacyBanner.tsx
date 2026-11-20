import React, { useState } from 'react';
import { ShieldCheck, X, Cloud, AlertTriangle, ExternalLink } from 'lucide-react';
import { DEFAULT_PURCHASE_URL } from '../../types/license';

interface PrivacyBannerProps {
  userEmail?: string;
  licensePlan?: string;
  daysRemaining?: number | null;
  purchaseUrl?: string;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({
  userEmail,
  licensePlan,
  daysRemaining,
  purchaseUrl = DEFAULT_PURCHASE_URL
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isExpiringSoon = typeof daysRemaining === 'number' && daysRemaining <= 7;

  return (
    <aside
      aria-label="Thông tin tài khoản và đồng bộ đám mây"
      className={`border-b text-xs py-1.5 px-4 ${
        isExpiringSoon
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 truncate">
          {isExpiringSoon ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          ) : userEmail ? (
            <Cloud className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="truncate">
            {isExpiringSoon ? (
              <>
                Bản quyền ({licensePlan || 'Gói hiện tại'}) còn{' '}
                <strong className="tabular-nums">{daysRemaining} ngày</strong>. Vui lòng gia hạn
                key mới tại EduTech-Hub để không gián đoạn dữ liệu.
              </>
            ) : userEmail ? (
              <>
                Đang đồng bộ đám mây Firebase cho tài khoản <strong>{userEmail}</strong>
                {licensePlan ? ` · ${licensePlan}` : ''}.
              </>
            ) : (
              'Dữ liệu được bảo vệ và đồng bộ theo tài khoản Firebase.'
            )}
          </span>
          {isExpiringSoon && (
            <a
              href={purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-900 underline shrink-0 whitespace-nowrap"
            >
              <span>Gia hạn ngay</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button
          type="button"
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
