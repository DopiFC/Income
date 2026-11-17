import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ResetSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeCount: number;
}

export const ResetSessionModal: React.FC<ResetSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employeeCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-700 font-semibold text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Xác nhận xóa toàn bộ dữ liệu phiên</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-sm text-slate-600 space-y-3">
          <p>
            Bạn có chắc chắn muốn xóa toàn bộ <strong>{employeeCount}</strong> hồ sơ nhân viên, dữ liệu chấm công, cấu hình lương và bảng tính trong phiên làm việc hiện tại không?
          </p>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
            ⚠️ <strong>Lưu ý quan trọng:</strong> Vì ứng dụng không lưu trữ dữ liệu trên máy chủ hoặc trình duyệt, thao tác này sẽ giải phóng toàn bộ bộ nhớ RAM và <strong>không thể hoàn tác</strong>. Hãy đảm bảo bạn đã xuất bảng lương Excel nếu cần lưu trữ.
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Xóa sạch phiên làm việc
          </button>
        </div>
      </div>
    </div>
  );
};
