import React, { useState, useMemo } from 'react';
import { PayslipItem, PayrollSummary } from '../../types/payroll';
import { WorkingStatus, WORKING_STATUS_OPTIONS, getWorkingStatusMeta } from '../../types/employee';
import { MonthlyAttendance, Adjustments } from '../../types/attendance';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import {
  Calculator, Search, AlertTriangle,
  ArrowUpDown, CheckCircle, FileSpreadsheet, SlidersHorizontal,
  LayoutGrid, Table as TableIcon, FolderDown, Sliders, Eye,
  Gift, MinusCircle
} from 'lucide-react';
import { formatVND, formatCompactVND } from '../../utils/currency';
import { BatchAdjustmentPatch } from '../../engine/adjustmentsBatch';
import { PayrollAdjustmentModal } from './PayrollAdjustmentModal';
import { BatchPayrollAdjustmentModal } from './BatchPayrollAdjustmentModal';
import { PayslipBatchExportModal } from '../payslip/PayslipBatchExportModal';

interface PayrollTableProps {
  payrollItems: PayslipItem[];
  summary: PayrollSummary;
  onOpenPayslip: (item: PayslipItem) => void;
  onExportExcel: () => void;
  departments: string[];
  companyProfile: CompanyProfile;
  legalConfig: LegalConfig;
  selectedMonth: string;
  onUpdateAdjustment: (adj: Adjustments) => void;
  onUpdateAttendance: (att: MonthlyAttendance) => void;
  onBatchUpdateAdjustments: (
    employeeIds: string[],
    patch: BatchAdjustmentPatch,
    mode: 'add' | 'overwrite',
    notes?: string
  ) => void;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  payrollItems,
  summary,
  onOpenPayslip,
  onExportExcel,
  departments,
  companyProfile,
  legalConfig,
  selectedMonth,
  onUpdateAdjustment,
  onUpdateAttendance,
  onBatchUpdateAdjustments
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkingStatus>('all');
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);
  const [sortField, setSortField] = useState<'code' | 'name' | 'gross' | 'net' | 'tax'>('code');
  const [sortAsc, setSortAsc] = useState(true);

  const [adjustingItem, setAdjustingItem] = useState<PayslipItem | null>(null);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean;
    tab: 'bonus' | 'deduction';
  }>({ isOpen: false, tab: 'bonus' });

  // View mode: 'card' (optimal on mobile) or 'table' (desktop table)
  const [viewMode, setViewMode] = useState<'card' | 'table'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'card' : 'table'
  );

  // Column visibility for table mode
  const [showColumns, setShowColumns] = useState({
    department: true,
    workDays: true,
    baseSalary: true,
    allowances: true,
    overtime: true,
    bonuses: true,
    insurance: true,
    tax: true,
    deductions: true,
    employerCost: true
  });

  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    return payrollItems
      .filter((item) => {
        const matchSearch =
          item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.employee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.employee.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = selectedDept === 'all' || item.employee.department === selectedDept;
        const empStatus = item.employee.workingStatus || 'active';
        const matchStatus = statusFilter === 'all' || empStatus === statusFilter;
        const matchWarning = !showWarningsOnly || item.warnings.length > 0;
        return matchSearch && matchDept && matchStatus && matchWarning;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'code') diff = a.employee.code.localeCompare(b.employee.code);
        else if (sortField === 'name') diff = a.employee.fullName.localeCompare(b.employee.fullName);
        else if (sortField === 'gross') diff = a.grossIncome - b.grossIncome;
        else if (sortField === 'net') diff = a.netSalary - b.netSalary;
        else if (sortField === 'tax') diff = a.personalIncomeTax - b.personalIncomeTax;
        return sortAsc ? diff : -diff;
      });
  }, [payrollItems, searchTerm, selectedDept, statusFilter, showWarningsOnly, sortField, sortAsc]);

  const validSelectedIds = useMemo(() => {
    const existing = new Set(payrollItems.map((item) => item.employee.id));
    return Array.from(selectedIds).filter((id) => existing.has(id));
  }, [payrollItems, selectedIds]);

  const allProcessedSelected =
    processedItems.length > 0 &&
    processedItems.every((item) => selectedIds.has(item.employee.id));

  const toggleSelectOne = (employeeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const toggleSelectAllProcessed = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allProcessedSelected) {
        for (const item of processedItems) next.delete(item.employee.id);
      } else {
        for (const item of processedItems) next.add(item.employee.id);
      }
      return next;
    });
  };

  const handleSort = (field: 'code' | 'name' | 'gross' | 'net' | 'tax') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>Bảng tổng hợp lương & Chi phí ({summary.month})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Thưởng / khấu trừ hàng loạt, điều chỉnh từng nhân viên và xuất nhiều ảnh phiếu lương vào 1 thư mục.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
          <button
            type="button"
            disabled={payrollItems.length === 0}
            onClick={() => setBatchModalState({ isOpen: true, tab: 'bonus' })}
            className="flex-1 sm:flex-none px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-45 text-blue-800 border border-blue-200 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>
              Thưởng hàng loạt{validSelectedIds.length > 0 ? ` (${validSelectedIds.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            disabled={payrollItems.length === 0}
            onClick={() => setBatchModalState({ isOpen: true, tab: 'deduction' })}
            className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-45 text-rose-800 border border-rose-200 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <MinusCircle className="w-4 h-4 shrink-0" />
            <span>
              Khấu trừ hàng loạt{validSelectedIds.length > 0 ? ` (${validSelectedIds.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            disabled={processedItems.length === 0}
            onClick={() => setIsBatchExportOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FolderDown className="w-4 h-4 shrink-0" />
            <span>Tải nhiều ảnh (1 thư mục)</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Xuất Excel bảng lương</span>
          </button>
        </div>
      </div>

      {/* Summary KPI ribbon (responsive grid: 2 cols on mobile, 4 on tablet, 7 on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-slate-900 text-white p-3 sm:p-4 rounded-xl text-xs tabular-nums">
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">Tổng quỹ Gross:</span>
          <span className="font-bold text-xs sm:text-sm text-blue-300">{formatCompactVND(summary.totalGrossSalary)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">Thực nhận Net:</span>
          <span className="font-bold text-xs sm:text-sm text-emerald-400">{formatCompactVND(summary.totalNetSalary)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">Thuế TNCN:</span>
          <span className="font-bold text-xs sm:text-sm text-amber-300">{formatCompactVND(summary.totalPersonalIncomeTax)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">BH Người LĐ:</span>
          <span className="font-bold text-xs sm:text-sm text-slate-200">{formatCompactVND(summary.totalEmployeeInsurance)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">BH & CĐ Doanh nghiệp:</span>
          <span className="font-bold text-xs sm:text-sm text-purple-300">{formatCompactVND(summary.totalEmployerInsurance)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">Tổng chi phí DN:</span>
          <span className="font-bold text-xs sm:text-sm text-purple-300">{formatCompactVND(summary.totalCompanyCost)}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-lg sm:bg-transparent sm:p-0 col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[10px] sm:text-[11px]">Nhân sự / Cảnh báo:</span>
          <span className="font-bold text-xs sm:text-sm text-slate-100">
            {summary.totalEmployees} / <span className={summary.warningCount > 0 ? 'text-rose-400' : 'text-slate-400'}>{summary.warningCount}</span>
          </span>
        </div>
      </div>

      {/* Filter and View mode toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Dept filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs max-w-[150px] sm:max-w-none"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Working status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | WorkingStatus)}
            className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs max-w-[170px] sm:max-w-none"
          >
            <option value="all">Tất cả trạng thái làm việc</option>
            {WORKING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Warnings filter */}
          {summary.warningCount > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-xs">
              <input
                type="checkbox"
                checked={showWarningsOnly}
                onChange={(e) => setShowWarningsOnly(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span>Cảnh báo ({summary.warningCount})</span>
            </label>
          )}
        </div>

        {/* View Mode Switcher (Card vs Table) + Column Toggle */}
        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'card' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ (Phù hợp trên điện thoại)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Dạng thẻ</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng bảng đầy đủ cột"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Dạng bảng</span>
            </button>
          </div>

          {/* Column config for table */}
          {viewMode === 'table' && (
            <div className="relative">
              <button
                onClick={() => setShowColumnConfig(!showColumnConfig)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1 transition-colors text-xs"
                title="Tùy chọn ẩn hiện cột"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cột</span>
              </button>

              {showColumnConfig && (
                <div className="absolute right-0 mt-1 w-56 bg-white shadow-xl border border-slate-200 rounded-xl p-3 z-30 space-y-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 text-[11px] uppercase">
                    Tùy chọn hiển thị cột
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.department}
                      onChange={(e) => setShowColumns({ ...showColumns, department: e.target.checked })}
                    />
                    <span>Phòng ban</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.workDays}
                      onChange={(e) => setShowColumns({ ...showColumns, workDays: e.target.checked })}
                    />
                    <span>Ngày công</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.baseSalary}
                      onChange={(e) => setShowColumns({ ...showColumns, baseSalary: e.target.checked })}
                    />
                    <span>Lương thỏa thuận</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.allowances}
                      onChange={(e) => setShowColumns({ ...showColumns, allowances: e.target.checked })}
                    />
                    <span>Phụ cấp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.overtime}
                      onChange={(e) => setShowColumns({ ...showColumns, overtime: e.target.checked })}
                    />
                    <span>Tiền tăng ca</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.insurance}
                      onChange={(e) => setShowColumns({ ...showColumns, insurance: e.target.checked })}
                    />
                    <span>Bảo hiểm NLĐ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.tax}
                      onChange={(e) => setShowColumns({ ...showColumns, tax: e.target.checked })}
                    />
                    <span>Thuế TNCN</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showColumns.employerCost}
                      onChange={(e) => setShowColumns({ ...showColumns, employerCost: e.target.checked })}
                    />
                    <span>Chi phí DN</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Rows Quick Action Bar */}
      {validSelectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-blue-900 tabular-nums">
            Đã chọn {validSelectedIds.length} nhân viên
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBatchModalState({ isOpen: true, tab: 'bonus' })}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Thưởng cho {validSelectedIds.length} người</span>
            </button>
            <button
              type="button"
              onClick={() => setBatchModalState({ isOpen: true, tab: 'deduction' })}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Khấu trừ {validSelectedIds.length} người</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium whitespace-nowrap"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: MOBILE-FRIENDLY CARD VIEW */}
      {viewMode === 'card' ? (
        <div className="space-y-2.5">
          {processedItems.length > 0 && (
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allProcessedSelected}
                  onChange={toggleSelectAllProcessed}
                  className="rounded text-blue-600"
                />
                <span>Chọn tất cả ({processedItems.length})</span>
              </label>
              <span className="text-[11px] text-slate-500 tabular-nums">
                Đã tick: {validSelectedIds.length}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {processedItems.length === 0 ? (
            <div className="col-span-full bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
              Không tìm thấy nhân viên nào phù hợp với bộ lọc.
            </div>
          ) : (
            processedItems.map((p) => {
              const statusMeta = getWorkingStatusMeta(p.employee.workingStatus);
              const isSelected = selectedIds.has(p.employee.id);
              const hasAdjustments =
                p.totalBonuses > 0 ||
                p.totalOtherDeductions > 0 ||
                p.taxExemptReimbursements > 0;

              return (
                <div
                  key={p.employee.id}
                  onClick={() => onOpenPayslip(p)}
                  className={`bg-white rounded-xl border transition-colors p-4 flex flex-col justify-between cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-200'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    {/* Top card bar: Checkbox + Code + Status + Contract */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="pt-0.5 cursor-pointer shrink-0"
                          title="Chọn để thưởng/khấu trừ hàng loạt"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.employee.id)}
                            className="rounded text-blue-600"
                          />
                        </label>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {p.employee.code}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              p.employee.salaryType === 'net' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.employee.salaryType}
                            </span>
                            {(p.employee.workingStatus && p.employee.workingStatus !== 'active') && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                                {statusMeta.label}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{p.employee.fullName}</h3>
                          <div className="text-[11px] text-slate-500 truncate">
                            {p.employee.position} • {p.employee.department}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {p.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{p.warnings.length} cảnh báo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Chuẩn</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key numbers grid */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs tabular-nums">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lương Gross:</span>
                        <span className="font-bold text-blue-900">{formatVND(p.grossIncome)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Thực nhận (Net):</span>
                        <span className="font-black text-emerald-700 text-sm">{formatVND(p.netSalary)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Thưởng / Bổ sung:</span>
                        <span className="text-blue-700 font-semibold">{formatVND(p.totalBonuses)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tạm ứng & Trừ khác:</span>
                        <span className="text-rose-700 font-semibold">{formatVND(p.totalOtherDeductions)}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500">
                          BH NLĐ: <strong className="text-rose-700">{formatVND(p.totalEmployeeInsurance)}</strong>
                        </span>
                        <span className="text-slate-500">
                          Đóng trên {formatCompactVND(p.insuranceSalaryBase)} (BHXH 8%: {formatCompactVND(p.employeeSocialInsurance)})
                        </span>
                      </div>
                    </div>

                    {/* Days & overtime */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1 tabular-nums">
                      <span>Công: <strong>{p.actualWorkingDaysCount}/{p.attendance.standardWorkDays}</strong> ngày</span>
                      {hasAdjustments && (
                        <span className="text-blue-700 font-medium">Đã có điều chỉnh</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdjustingItem(p);
                      }}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Điều chỉnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPayslip(p);
                      }}
                      className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Phiếu lương</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-20 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center sticky left-0 bg-slate-100 z-30">
                    <input
                      type="checkbox"
                      checked={allProcessedSelected}
                      onChange={toggleSelectAllProcessed}
                      className="rounded text-blue-600 cursor-pointer"
                      title="Chọn tất cả nhân viên đang hiển thị"
                    />
                  </th>
                  <th className="py-2.5 px-3 sticky left-10 bg-slate-100 z-30">
                    <button onClick={() => handleSort('code')} className="flex items-center gap-1 hover:text-blue-600">
                      <span>Mã NV</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-blue-600">
                      <span>Họ và tên</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {showColumns.department && <th className="py-2.5 px-3">Phòng ban</th>}
                  {showColumns.workDays && <th className="py-2.5 px-2 text-center">Công</th>}
                  {showColumns.baseSalary && <th className="py-2.5 px-3 text-right">Lương HĐ</th>}
                  <th className="py-2.5 px-3 text-right bg-blue-50/60 text-blue-950">
                    <button onClick={() => handleSort('gross')} className="flex items-center justify-end gap-1 hover:text-blue-600 w-full">
                      <span>Tổng Gross</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {showColumns.allowances && <th className="py-2.5 px-3 text-right">Phụ cấp</th>}
                  {showColumns.overtime && <th className="py-2.5 px-3 text-right">Tăng ca</th>}
                  {showColumns.bonuses && <th className="py-2.5 px-3 text-right text-blue-800">Thưởng/BS</th>}
                  {showColumns.insurance && <th className="py-2.5 px-3 text-right text-rose-700">BH NLĐ (10.5%)</th>}
                  {showColumns.tax && (
                    <th className="py-2.5 px-3 text-right text-rose-700">
                      <button onClick={() => handleSort('tax')} className="flex items-center justify-end gap-1 hover:text-blue-600 w-full">
                        <span>Thuế TNCN</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  )}
                  {showColumns.deductions && <th className="py-2.5 px-3 text-right text-rose-700">Tạm ứng/Trừ</th>}
                  <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-950 font-bold">
                    <button onClick={() => handleSort('net')} className="flex items-center justify-end gap-1 hover:text-emerald-700 w-full">
                      <span>Thực nhận (Net)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {showColumns.employerCost && (
                    <th className="py-2.5 px-3 text-right text-purple-900 bg-purple-50/40">Chi phí DN</th>
                  )}
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {processedItems.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="py-8 text-center text-slate-400">
                      Không tìm thấy nhân viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  processedItems.map((p) => {
                    const statusMeta = getWorkingStatusMeta(p.employee.workingStatus);
                    const isSelected = selectedIds.has(p.employee.id);
                    const isCustomIns = p.insuranceSalaryBase !== p.employee.baseSalary;
                    return (
                      <tr
                        key={p.employee.id}
                        onClick={() => onOpenPayslip(p)}
                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td
                          className="py-2.5 px-3 text-center sticky left-0 bg-white whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(p.employee.id)}
                            className="rounded text-blue-600 cursor-pointer"
                            title="Chọn nhân viên"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 sticky left-10 bg-white whitespace-nowrap">
                          {p.employee.code}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                          <div>{p.employee.fullName}</div>
                          {p.employee.workingStatus && p.employee.workingStatus !== 'active' && (
                            <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded border font-semibold ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                              {statusMeta.label}
                            </span>
                          )}
                        </td>
                        {showColumns.department && (
                          <td className="py-2.5 px-3 text-slate-600">{p.employee.department}</td>
                        )}
                        {showColumns.workDays && (
                          <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                            {p.actualWorkingDaysCount}/{p.attendance.standardWorkDays}
                          </td>
                        )}
                        {showColumns.baseSalary && (
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {formatVND(p.employee.baseSalary)}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold text-blue-900 bg-blue-50/30">
                          {formatVND(p.grossIncome)}
                        </td>
                        {showColumns.allowances && (
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {formatVND(p.totalAllowances)}
                          </td>
                        )}
                        {showColumns.overtime && (
                          <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                            {formatVND(p.totalOvertimePay)}
                          </td>
                        )}
                        {showColumns.bonuses && (
                          <td className="py-2.5 px-3 text-right font-medium text-blue-700">
                            {formatVND(p.totalBonuses)}
                          </td>
                        )}
                        {showColumns.insurance && (
                          <td
                            className="py-2.5 px-3 text-right text-rose-700"
                            title={`Đóng trên mức ${formatVND(p.insuranceSalaryBase)} · BHXH (8%): ${formatVND(p.employeeSocialInsurance)} · BHYT (1.5%): ${formatVND(p.employeeHealthInsurance)} · BHTN (1%): ${formatVND(p.employeeUnemploymentInsurance)}`}
                          >
                            <div className="font-medium">{formatVND(p.totalEmployeeInsurance)}</div>
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              BHXH 8%: {formatCompactVND(p.employeeSocialInsurance)}
                              {isCustomIns ? ` · LĐBH ${formatCompactVND(p.insuranceSalaryBase)}` : ''}
                            </div>
                          </td>
                        )}
                        {showColumns.tax && (
                          <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                            {formatVND(p.personalIncomeTax)}
                          </td>
                        )}
                        {showColumns.deductions && (
                          <td className="py-2.5 px-3 text-right text-rose-700">
                            {formatVND(p.totalOtherDeductions)}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right font-black text-emerald-800 bg-emerald-50/70 text-sm">
                          {formatVND(p.netSalary)}
                        </td>
                        {showColumns.employerCost && (
                          <td className="py-2.5 px-3 text-right font-bold text-purple-900 bg-purple-50/20">
                            {formatVND(p.totalCompanyCost)}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center">
                          {p.warnings.length > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"
                              title={p.warnings.join('\n')}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {p.warnings.length}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Chuẩn
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjustingItem(p);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                              title="Điều chỉnh thưởng, tạm ứng, khấu trừ & ngày công"
                            >
                              Điều chỉnh
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPayslip(p);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              Xem
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PayrollAdjustmentModal
        isOpen={Boolean(adjustingItem)}
        onClose={() => setAdjustingItem(null)}
        employee={adjustingItem?.employee || null}
        attendance={adjustingItem?.attendance || null}
        adjustment={adjustingItem?.adjustments || null}
        legalConfig={legalConfig}
        onSave={(updatedAdj, updatedAtt) => {
          onUpdateAdjustment(updatedAdj);
          onUpdateAttendance(updatedAtt);
        }}
      />

      <PayslipBatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        payrollItems={processedItems}
        selectedMonth={selectedMonth}
        companyProfile={companyProfile}
        legalConfig={legalConfig}
      />

      <BatchPayrollAdjustmentModal
        isOpen={batchModalState.isOpen}
        initialTab={batchModalState.tab}
        onClose={() => setBatchModalState((prev) => ({ ...prev, isOpen: false }))}
        payrollItems={payrollItems}
        selectedIds={validSelectedIds}
        departments={departments}
        selectedMonth={selectedMonth}
        onApply={onBatchUpdateAdjustments}
      />
    </div>
  );
};
