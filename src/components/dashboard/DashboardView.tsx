import React, { useState, useMemo, useRef } from 'react';
import {
  Users, DollarSign, Wallet, ShieldCheck, ArrowRight,
  Building2, AlertTriangle, FileSpreadsheet, Clock, Download,
  TrendingUp, Award, Sparkles, Filter, Printer, Image as ImageIcon
} from 'lucide-react';
import { PayslipItem, PayrollSummary } from '../../types/payroll';
import { Employee } from '../../types/employee';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import { formatVND, formatCompactVND } from '../../utils/currency';
import { TabKey } from '../layout/Navbar';
import { downloadElementAsPng } from '../../services/payslipImage';
import { exportPayrollWorkbook } from '../../services/excelExport';

interface DashboardViewProps {
  employees: Employee[];
  payrollItems: PayslipItem[];
  summary: PayrollSummary;
  companyProfile: CompanyProfile;
  legalConfig: LegalConfig;
  onNavigate: (tab: TabKey) => void;
  onLoadSampleData: () => void;
  departments: string[];
  ranks: string[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  payrollItems,
  summary,
  companyProfile,
  legalConfig,
  onNavigate,
  onLoadSampleData,
  departments,
  ranks
}) => {
  const dashboardReportRef = useRef<HTMLDivElement>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Filters
  const [filterDept, setFilterDept] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [filterContract, setFilterContract] = useState('all');
  const [filterSalaryType, setFilterSalaryType] = useState('all');

  // Filtered payroll items
  const filteredItems = useMemo(() => {
    return payrollItems.filter((item) => {
      const matchDept = filterDept === 'all' || item.employee.department === filterDept;
      const matchRank = filterRank === 'all' || item.employee.rank === filterRank;
      const matchContract = filterContract === 'all' || item.employee.contractType === filterContract;
      const matchSalType = filterSalaryType === 'all' || item.employee.salaryType === filterSalaryType;
      return matchDept && matchRank && matchContract && matchSalType;
    });
  }, [payrollItems, filterDept, filterRank, filterContract, filterSalaryType]);

  // Aggregated metrics from filtered items
  const metrics = useMemo(() => {
    let gross = 0;
    let net = 0;
    let pit = 0;
    let empIns = 0;
    let employerIns = 0;
    let totalCost = 0;
    let allowances = 0;
    let bonuses = 0;
    let overtime = 0;
    let warnings = 0;

    for (const item of filteredItems) {
      gross += item.grossIncome;
      net += item.netSalary;
      pit += item.personalIncomeTax;
      empIns += item.totalEmployeeInsurance;
      employerIns += item.totalEmployerInsurance;
      totalCost += item.totalCompanyCost;
      allowances += item.totalAllowances;
      bonuses += item.totalBonuses;
      overtime += item.totalOvertimePay;
      if (item.warnings.length > 0) warnings++;
    }

    return {
      count: filteredItems.length,
      gross,
      net,
      pit,
      empIns,
      employerIns,
      totalCost,
      allowances,
      bonuses,
      overtime,
      warnings
    };
  }, [filteredItems]);

  // Department breakdown
  const deptStats = useMemo(() => {
    const map = new Map<string, { count: number; gross: number; net: number; cost: number }>();
    for (const item of filteredItems) {
      const dept = item.employee.department || 'Chưa phân bổ';
      const existing = map.get(dept) || { count: 0, gross: 0, net: 0, cost: 0 };
      existing.count += 1;
      existing.gross += item.grossIncome;
      existing.net += item.netSalary;
      existing.cost += item.totalCompanyCost;
      map.set(dept, existing);
    }
    return Array.from(map.entries()).map(([dept, data]) => ({ dept, ...data }));
  }, [filteredItems]);

  // Rank breakdown
  const rankStats = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; gross: number }>();
    for (const item of filteredItems) {
      const r = item.employee.rank || 'Bậc chuẩn';
      const existing = map.get(r) || { count: 0, cost: 0, gross: 0 };
      existing.count += 1;
      existing.cost += item.totalCompanyCost;
      existing.gross += item.grossIncome;
      map.set(r, existing);
    }
    return Array.from(map.entries()).map(([rank, data]) => ({ rank, ...data }));
  }, [filteredItems]);

  const handleDownloadDashboardPng = async () => {
    if (!dashboardReportRef.current) return;
    setIsExportingPng(true);
    const fileName = `DopiGRIncome_Dashboard_${summary.month}.png`;
    await downloadElementAsPng(dashboardReportRef.current, fileName);
    setIsExportingPng(false);
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportPayrollWorkbook(filteredItems, summary, legalConfig, companyProfile.companyName);
  };

  if (employees.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center space-y-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dopi GRIncome – Tính Lương & Nhân Sự
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Bắt đầu nhanh bằng cách nhập danh sách nhân viên từ file Excel (chỉ cần STT & Họ tên), thêm từng người hoặc nạp dữ liệu mẫu để xem thử.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => onNavigate('import')}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel (Danh sách NV)</span>
            </button>
            <button
              onClick={() => onNavigate('employees')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-blue-700" />
              <span>Thêm nhân viên thủ công</span>
            </button>
            <button
              onClick={onLoadSampleData}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-600" />
              <span>Dùng thử dữ liệu mẫu</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">1. Nhập nhân sự đơn giản</div>
              <div>Tải lên file Excel chỉ có STT & Họ tên, sau đó tự điền lương trên web.</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">2. Tính lương chuẩn 2026</div>
              <div>Tự động tính Gross–Net, BHXH 10.5% và thuế TNCN lũy tiến 5 bậc.</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">3. Lưu trữ trên thiết bị</div>
              <div>Tự động lưu trên trình duyệt, xuất Excel và tải ảnh phiếu lương PNG.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentage composition
  const totalCostBase = metrics.totalCost > 0 ? metrics.totalCost : 1;
  const pctNet = Math.round((metrics.net / totalCostBase) * 100);
  const pctPit = Math.round((metrics.pit / totalCostBase) * 100);
  const pctEmpIns = Math.round((metrics.empIns / totalCostBase) * 100);
  const pctEmployerIns = Math.round((metrics.employerIns / totalCostBase) * 100);

  return (
    <div className="space-y-5">
      {/* Top Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{companyProfile.companyName}</span>
            {companyProfile.taxCode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">MST: {companyProfile.taxCode}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Tổng quan bảng lương – {summary.month}
          </h1>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadDashboardPng}
            disabled={isExportingPng}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{isExportingPng ? 'Đang tạo PNG...' : 'Tải ảnh PNG'}</span>
          </button>

          <button
            onClick={handlePrintDashboard}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>In / PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả phòng ban ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả cấp bậc ({ranks.length})</option>
            {ranks.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={filterContract}
            onChange={(e) => setFilterContract(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả hợp đồng</option>
            <option value="official_fixed">HĐ xác định thời hạn</option>
            <option value="official_indefinite">HĐ không thời hạn</option>
            <option value="probation">Thử việc</option>
            <option value="part_time">Bán thời gian</option>
          </select>

          <select
            value={filterSalaryType}
            onChange={(e) => setFilterSalaryType(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả hình thức (Gross & Net)</option>
            <option value="gross">Lương Gross</option>
            <option value="net">Lương Net</option>
          </select>
        </div>
      </div>

      {/* Main Dashboard Canvas (Captured for PNG/PDF) */}
      <div ref={dashboardReportRef} className="space-y-5">
        {/* Printable Organization Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 hidden print:block">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 uppercase">{companyProfile.companyName}</h2>
              {companyProfile.taxCode && <div className="text-xs text-slate-600">MST: {companyProfile.taxCode}</div>}
              {companyProfile.address && <div className="text-xs text-slate-500">Địa chỉ: {companyProfile.address}</div>}
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-800">BÁO CÁO TỔNG QUAN BẢNG LƯƠNG</div>
              <div className="text-slate-500">Kỳ lương: {summary.month} · Ngày lập: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
        </div>

        {/* 4 Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Headcount & Compliance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Nhân sự</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {metrics.count} <span className="text-xs font-normal text-slate-500">người</span>
            </div>
            <div className={`text-xs mt-1 ${metrics.warnings > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
              {metrics.warnings > 0 ? `${metrics.warnings} trường hợp cần kiểm tra` : 'Đạt chuẩn quy định 2026'}
            </div>
          </div>

          {/* Card 2: Total Gross */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Tổng quỹ Gross</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-900 truncate tabular-nums">
              {formatVND(metrics.gross)}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate tabular-nums">
              Phụ cấp & thưởng: {formatCompactVND(metrics.allowances + metrics.bonuses)} · OT: {formatCompactVND(metrics.overtime)}
            </div>
          </div>

          {/* Card 3: Total Net */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Thực nhận Net</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700 truncate tabular-nums">
              {formatVND(metrics.net)}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate tabular-nums">
              Thuế TNCN: {formatCompactVND(metrics.pit)} · BH NLĐ: {formatCompactVND(metrics.empIns)}
            </div>
          </div>

          {/* Card 4: Total Company Cost */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Tổng chi phí DN</span>
              <Building2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 truncate tabular-nums">
              {formatVND(metrics.totalCost)}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate tabular-nums">
              BH & CĐ doanh nghiệp đóng: {formatCompactVND(metrics.employerIns)}
            </div>
          </div>
        </div>

        {/* Cost Structure Proportion Stack Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Cơ cấu phân bổ tổng chi phí nhân sự ({formatVND(metrics.totalCost)})
            </h3>
            <span className="text-xs text-slate-500">100% chi phí doanh nghiệp</span>
          </div>

          {/* Stacked Bar */}
          <div className="h-6 w-full rounded-lg overflow-hidden flex bg-slate-100 text-[10px] font-bold text-white shadow-inner">
            <div
              style={{ width: `${pctNet}%` }}
              className="bg-emerald-600 flex items-center justify-center truncate px-1"
              title={`Net thực nhận: ${formatVND(metrics.net)} (${pctNet}%)`}
            >
              {pctNet > 8 && `Net ${pctNet}%`}
            </div>
            <div
              style={{ width: `${pctEmployerIns}%` }}
              className="bg-purple-700 flex items-center justify-center truncate px-1"
              title={`BH Doanh nghiệp: ${formatVND(metrics.employerIns)} (${pctEmployerIns}%)`}
            >
              {pctEmployerIns > 5 && `BH DN ${pctEmployerIns}%`}
            </div>
            <div
              style={{ width: `${pctEmpIns}%` }}
              className="bg-blue-600 flex items-center justify-center truncate px-1"
              title={`BH Người lao động: ${formatVND(metrics.empIns)} (${pctEmpIns}%)`}
            >
              {pctEmpIns > 5 && `BH NLĐ ${pctEmpIns}%`}
            </div>
            <div
              style={{ width: `${pctPit}%` }}
              className="bg-amber-600 flex items-center justify-center truncate px-1"
              title={`Thuế TNCN: ${formatVND(metrics.pit)} (${pctPit}%)`}
            >
              {pctPit > 4 && `Thuế ${pctPit}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span>Thực nhận Net: <strong>{formatVND(metrics.net)}</strong> ({pctNet}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-700" />
              <span>Bảo hiểm DN (23.5%): <strong>{formatVND(metrics.employerIns)}</strong> ({pctEmployerIns}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span>Bảo hiểm NLĐ (10.5%): <strong>{formatVND(metrics.empIns)}</strong> ({pctEmpIns}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600" />
              <span>Thuế TNCN: <strong>{formatVND(metrics.pit)}</strong> ({pctPit}%)</span>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown by Department & Rank */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>So sánh quỹ lương theo phòng ban</span>
              </h3>
              <span className="text-xs text-slate-400">{deptStats.length} phòng ban</span>
            </div>

            <div className="space-y-3">
              {deptStats.map((d) => {
                const maxCost = Math.max(...deptStats.map((s) => s.cost), 1);
                const barWidth = Math.round((d.cost / maxCost) * 100);

                return (
                  <div key={d.dept} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{d.dept} ({d.count} người)</span>
                      <span className="font-semibold text-purple-900">{formatVND(d.cost)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full bg-blue-600 rounded-full transition-all"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Quỹ Gross: {formatCompactVND(d.gross)}</span>
                      <span>Thực nhận Net: {formatCompactVND(d.net)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rank / Grade Cost Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Chi phí nhân sự theo cấp bậc</span>
              </h3>
              <span className="text-xs text-slate-400">{rankStats.length} nhóm cấp bậc</span>
            </div>

            <div className="space-y-3">
              {rankStats.map((r) => {
                const maxCost = Math.max(...rankStats.map((s) => s.cost), 1);
                const barWidth = Math.round((r.cost / maxCost) * 100);

                return (
                  <div key={r.rank} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{r.rank} ({r.count} người)</span>
                      <span className="font-semibold text-purple-900">{formatVND(r.cost)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full bg-purple-600 rounded-full transition-all"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Chi phí TB: {formatCompactVND(r.cost / (r.count || 1))}/người</span>
                      <span>Lương Gross: {formatCompactVND(r.gross)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown table of filtered employees summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Bảng kê tóm tắt theo bộ lọc ({filteredItems.length} nhân viên)
            </h3>
            <button
              onClick={() => onNavigate('payroll')}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 no-print"
            >
              <span>Xem bảng chi tiết đầy đủ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Mã NV</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5">Phòng ban</th>
                  <th className="p-2.5 text-right">Lương thỏa thuận</th>
                  <th className="p-2.5 text-right">Tổng Gross</th>
                  <th className="p-2.5 text-right">BH NLĐ</th>
                  <th className="p-2.5 text-right">Thuế TNCN</th>
                  <th className="p-2.5 text-right font-bold text-emerald-700">Thực nhận Net</th>
                  <th className="p-2.5 text-right font-bold text-purple-900">Chi phí DN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.slice(0, 10).map((p) => (
                  <tr key={p.employee.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold text-slate-800">{p.employee.code}</td>
                    <td className="p-2 font-medium text-slate-900">{p.employee.fullName}</td>
                    <td className="p-2 text-slate-600">{p.employee.department}</td>
                    <td className="p-2 text-right text-slate-600">{formatVND(p.employee.baseSalary)}</td>
                    <td className="p-2 text-right font-semibold text-blue-900">{formatVND(p.grossIncome)}</td>
                    <td className="p-2 text-right text-rose-700">{formatVND(p.totalEmployeeInsurance)}</td>
                    <td className="p-2 text-right text-amber-700">{formatVND(p.personalIncomeTax)}</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatVND(p.netSalary)}</td>
                    <td className="p-2 text-right font-bold text-purple-900">{formatVND(p.totalCompanyCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 10 && (
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
              Đang hiển thị 10 / {filteredItems.length} nhân viên. Mở bảng tính lương để xem toàn bộ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
