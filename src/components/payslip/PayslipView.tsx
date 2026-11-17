import React, { useState, useRef, useMemo } from 'react';
import {
  FileText, Download, Printer, Search, ChevronLeft, ChevronRight, FolderDown
} from 'lucide-react';
import { PayslipItem } from '../../types/payroll';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import { formatVND } from '../../utils/currency';
import { downloadElementAsPng, buildSafeEmployeePayslipFileName } from '../../services/payslipImage';
import { PayslipCard } from './PayslipCard';
import { PayslipBatchExportModal } from './PayslipBatchExportModal';

interface PayslipViewProps {
  payrollItems: PayslipItem[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  companyProfile: CompanyProfile;
  legalConfig: LegalConfig;
  onGoToAttendance?: () => void;
  onGoToEmployees?: () => void;
}

export const PayslipView: React.FC<PayslipViewProps> = ({
  payrollItems,
  selectedMonth,
  companyProfile,
  legalConfig,
  onGoToEmployees
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);

  const payslipCardRef = useRef<HTMLDivElement>(null);

  // Filtered employees list
  const filteredItems = useMemo(() => {
    return payrollItems.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        item.employee.fullName.toLowerCase().includes(term) ||
        item.employee.code.toLowerCase().includes(term) ||
        item.employee.department.toLowerCase().includes(term)
      );
    });
  }, [payrollItems, searchTerm]);

  // Active selected item
  const currentItem = useMemo(() => {
    if (!payrollItems.length) return null;
    if (!selectedEmpId) return payrollItems[0];
    return payrollItems.find((p) => p.employee.id === selectedEmpId) || payrollItems[0];
  }, [payrollItems, selectedEmpId]);

  const currentIndex = useMemo(() => {
    if (!currentItem) return -1;
    return filteredItems.findIndex((p) => p.employee.id === currentItem.employee.id);
  }, [filteredItems, currentItem]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedEmpId(filteredItems[currentIndex - 1].employee.id);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < filteredItems.length - 1) {
      setSelectedEmpId(filteredItems[currentIndex + 1].employee.id);
    }
  };

  const handleDownloadSingle = async () => {
    if (!payslipCardRef.current || !currentItem) return;
    setIsExportingSingle(true);
    const fileName = buildSafeEmployeePayslipFileName(
      currentItem.employee.fullName,
      currentItem.employee.code,
      new Set()
    );
    await downloadElementAsPng(payslipCardRef.current, fileName);
    setIsExportingSingle(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (payrollItems.length === 0 || !currentItem) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có dữ liệu phiếu lương</h3>
        <p className="text-sm text-slate-600 mb-6">
          Vui lòng thêm nhân viên hoặc nạp dữ liệu mẫu để tạo và xuất phiếu lương tự động cho kỳ lương {selectedMonth}.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onGoToEmployees && (
            <button
              onClick={onGoToEmployees}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Thêm nhân viên ngay
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeItem = currentItem;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Phiếu Lương Nhân Viên</h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Kỳ: {selectedMonth}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tải ảnh phiếu lương theo tên từng nhân viên hoặc xuất toàn bộ vào 1 thư mục
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadSingle}
            disabled={isExportingSingle}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            title="Tải ảnh PNG phiếu lương theo tên nhân viên đang chọn"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingSingle ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-slate-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            title="In phiếu lương chuẩn khổ A4"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu lương</span>
          </button>

          <button
            onClick={() => setIsBatchExportOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            title="Tải nhiều bảng lương cùng lúc vào 1 thư mục với tên từng nhân viên"
          >
            <FolderDown className="w-4 h-4" />
            <span>Tải nhiều ảnh vào 1 thư mục ({payrollItems.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Employee Selector + Right High-Fidelity Payslip Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Employee Selector (hidden on print) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden no-print">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Danh sách nhân sự ({filteredItems.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition-colors"
                title="Nhân viên trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {currentIndex + 1}/{filteredItems.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= filteredItems.length - 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition-colors"
                title="Nhân viên tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm họ tên, mã NV, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Employee list scroll */}
          <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isSelected = item.employee.id === (currentItem?.employee.id || '');
              return (
                <button
                  key={item.employee.id}
                  onClick={() => setSelectedEmpId(item.employee.id)}
                  className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {item.employee.fullName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {item.employee.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.employee.department} • {item.employee.position}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-700 tabular-nums">
                      {formatVND(item.netSalary)}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">
                      Lương {item.employee.salaryType}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed High-Fidelity Payslip (Printable & Exportable) */}
        <div className="lg:col-span-8 bg-slate-100/60 p-2 sm:p-4 rounded-xl border border-slate-200 overflow-x-auto">
          <PayslipCard
            ref={payslipCardRef}
            item={activeItem}
            companyProfile={companyProfile}
            legalConfig={legalConfig}
          />
        </div>
      </div>

      <PayslipBatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        payrollItems={filteredItems.length > 0 ? filteredItems : payrollItems}
        selectedMonth={selectedMonth}
        companyProfile={companyProfile}
        legalConfig={legalConfig}
      />
    </div>
  );
};
