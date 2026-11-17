import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, FolderDown, CheckSquare, Square, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { PayslipItem } from '../../types/payroll';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import { formatVND } from '../../utils/currency';
import { PayslipCard } from './PayslipCard';
import {
  PayslipBlobEntry,
  buildSafeEmployeePayslipFileName,
  renderElementToPngBlob,
  exportPayslipsToZipFolder,
  exportPayslipsToLocalFolder,
  supportsDirectFolderSave
} from '../../services/payslipImage';

interface PayslipBatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollItems: PayslipItem[];
  selectedMonth: string;
  companyProfile?: CompanyProfile;
  legalConfig: LegalConfig;
}

export const PayslipBatchExportModal: React.FC<PayslipBatchExportModalProps> = ({
  isOpen,
  onClose,
  payrollItems,
  selectedMonth,
  companyProfile,
  legalConfig
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [activeRenderItem, setActiveRenderItem] = useState<PayslipItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const canPickLocalDir = useMemo(() => supportsDirectFolderSave(), []);
  const folderName = `Bang_Luong_${selectedMonth}`;

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(payrollItems.map((p) => p.employee.id)));
      setStatusMessage(null);
      setProgress(null);
    }
  }, [isOpen, payrollItems]);

  const selectedItems = useMemo(() => {
    return payrollItems.filter((p) => selectedIds.has(p.employee.id));
  }, [payrollItems, selectedIds]);

  const previewNames = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<string, string>();
    for (const item of selectedItems) {
      map.set(
        item.employee.id,
        buildSafeEmployeePayslipFileName(item.employee.fullName, item.employee.code, seen)
      );
    }
    return map;
  }, [selectedItems]);

  const toggleAll = () => {
    if (selectedIds.size === payrollItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payrollItems.map((p) => p.employee.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRunBatchExport = async (mode: 'zip' | 'folder') => {
    if (selectedItems.length === 0 || isExporting) return;

    setIsExporting(true);
    setStatusMessage(null);
    const seenNames = new Set<string>();
    const entries: PayslipBlobEntry[] = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      setActiveRenderItem(item);
      setProgress({
        current: i + 1,
        total: selectedItems.length,
        currentName: item.employee.fullName
      });

      // Chờ React render xong thẻ phiếu lương của nhân viên hiện tại
      await new Promise((r) => setTimeout(r, 120));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      if (hiddenCardRef.current) {
        const blob = await renderElementToPngBlob(hiddenCardRef.current);
        if (blob) {
          const fileName = buildSafeEmployeePayslipFileName(
            item.employee.fullName,
            item.employee.code,
            seenNames
          );
          entries.push({ fileName, blob });
        }
      }
    }

    setActiveRenderItem(null);

    if (entries.length === 0) {
      setStatusMessage({ type: 'error', text: 'Không tạo được ảnh phiếu lương nào.' });
      setIsExporting(false);
      setProgress(null);
      return;
    }

    if (mode === 'folder') {
      const res = await exportPayslipsToLocalFolder(entries, folderName);
      if (res === 'saved') {
        setStatusMessage({
          type: 'success',
          text: `Đã lưu ${entries.length} ảnh phiếu lương vào thư mục "${folderName}".`
        });
      } else if (res === 'cancelled') {
        setStatusMessage({ type: 'error', text: 'Bạn đã hủy chọn thư mục.' });
      } else {
        await exportPayslipsToZipFolder(entries, folderName);
        setStatusMessage({
          type: 'success',
          text: `Đã tải về 1 file ${folderName}.zip chứa đủ ${entries.length} ảnh theo tên nhân viên.`
        });
      }
    } else {
      const ok = await exportPayslipsToZipFolder(entries, folderName);
      if (ok) {
        setStatusMessage({
          type: 'success',
          text: `Đã tải ${folderName}.zip chứa 1 thư mục gồm ${entries.length} ảnh mang tên từng nhân viên.`
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Lỗi khi đóng gói file tải xuống.' });
      }
    }

    setIsExporting(false);
    setProgress(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-950/55 p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" onClick={!isExporting ? onClose : undefined} />

      <div className="relative w-full sm:max-w-xl bg-white rounded-t-xl sm:rounded-xl border border-slate-200 shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Tải nhiều bảng lương vào 1 thư mục</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tên mỗi file ảnh PNG được đặt theo họ tên của từng nhân viên trong thư mục <span className="font-mono font-semibold text-slate-700">{folderName}</span>.
            </p>
          </div>
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={isExporting}
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
            >
              {selectedIds.size === payrollItems.length && payrollItems.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Chọn tất cả ({selectedIds.size}/{payrollItems.length} nhân viên)</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {payrollItems.map((p) => {
              const checked = selectedIds.has(p.employee.id);
              const fileLabel = previewNames.get(p.employee.id);
              return (
                <label
                  key={p.employee.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 ${
                    checked ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      disabled={isExporting}
                      checked={checked}
                      onChange={() => toggleOne(p.employee.id)}
                      className="rounded text-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {p.employee.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {checked && fileLabel ? `File: ${folderName}/${fileLabel}` : p.employee.code}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 shrink-0 tabular-nums">
                    {formatVND(p.netSalary)}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span>Đang xuất ảnh: {progress.currentName}</span>
                <span className="tabular-nums">{progress.current}/{progress.total}</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150"
                  style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Status */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium disabled:opacity-40"
          >
            Đóng
          </button>

          {canPickLocalDir && (
            <button
              type="button"
              disabled={isExporting || selectedItems.length === 0}
              onClick={() => handleRunBatchExport('folder')}
              className="px-3.5 py-2 text-xs sm:text-sm bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Chọn thư mục trên máy</span>
            </button>
          )}

          <button
            type="button"
            disabled={isExporting || selectedItems.length === 0}
            onClick={() => handleRunBatchExport('zip')}
            className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap"
          >
            <FolderDown className="w-4 h-4" />
            <span>
              {isExporting
                ? 'Đang tạo thư mục ảnh...'
                : `Tải thư mục ảnh ZIP (${selectedItems.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Offscreen Renderer for High-Res Payslip Capture */}
      {activeRenderItem && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '820px',
            pointerEvents: 'none',
            zIndex: -1
          }}
        >
          <PayslipCard
            ref={hiddenCardRef}
            item={activeRenderItem}
            companyProfile={companyProfile}
            legalConfig={legalConfig}
          />
        </div>
      )}
    </div>
  );
};
