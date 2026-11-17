import React from 'react';
import { PayslipItem, PayrollSummary } from '../../types/payroll';
import { LegalConfig } from '../../types/legal';
import { exportPayrollWorkbook } from '../../services/excelExport';
import {
  Download, FileSpreadsheet, Building2, Users, DollarSign,
  PieChart, Printer, ShieldCheck, CheckCircle
} from 'lucide-react';
import { formatVND, formatCompactVND } from '../../utils/currency';

interface ReportsViewProps {
  payrollItems: PayslipItem[];
  summary: PayrollSummary;
  legalConfig: LegalConfig;
  onOpenPayslip: (item: PayslipItem) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  payrollItems,
  summary,
  legalConfig,
  onOpenPayslip
}) => {
  const handleExportFullExcel = () => {
    if (payrollItems.length === 0) return;
    exportPayrollWorkbook(payrollItems, summary, legalConfig);
  };

  // Department cost distribution
  const deptBreakdown = React.useMemo(() => {
    const map = new Map<string, { count: number; gross: number; net: number; cost: number; tax: number; ins: number }>();
    for (const item of payrollItems) {
      const dept = item.employee.department || 'Chưa phân bổ';
      const prev = map.get(dept) || { count: 0, gross: 0, net: 0, cost: 0, tax: 0, ins: 0 };
      prev.count += 1;
      prev.gross += item.grossIncome;
      prev.net += item.netSalary;
      prev.cost += item.totalCompanyCost;
      prev.tax += item.personalIncomeTax;
      prev.ins += item.totalEmployerInsurance + item.totalEmployeeInsurance;
      map.set(dept, prev);
    }
    return Array.from(map.entries()).map(([dept, val]) => ({ dept, ...val }));
  }, [payrollItems]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Download className="w-6 h-6 text-emerald-600" />
            <span>Báo cáo & Xuất file bảng lương ({summary.month})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tạo workbook Excel chuẩn 5 sheet đầy đủ dữ liệu kế toán và phân tích cơ cấu chi phí nhân sự.
          </p>
        </div>

        <button
          onClick={handleExportFullExcel}
          disabled={payrollItems.length === 0}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tải file Excel đầy đủ 5 Sheet (.xlsx)</span>
        </button>
      </div>

      {/* Excel Structure Info Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
        <div className="font-bold text-sm flex items-center gap-2 text-emerald-900">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Cấu trúc workbook Excel tự động tạo trên trình duyệt:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
            <strong className="block text-emerald-800">Sheet 1: Tổng hợp lương</strong>
            Bảng tổng quát các cột lương, khấu trừ, thuế, net và chi phí DN.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
            <strong className="block text-emerald-800">Sheet 2: Chi tiết thuế TNCN</strong>
            Diễn giải từng mức giảm trừ gia cảnh, bảo hiểm và thu nhập tính thuế.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
            <strong className="block text-emerald-800">Sheet 3: Chấm công & Nghỉ</strong>
            Ngày công chuẩn, ngày làm thực tế, phép năm, ốm đau thai sản.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
            <strong className="block text-emerald-800">Sheet 4: Phụ cấp & Tăng ca</strong>
            Chi tiết các loại phụ cấp và giờ tăng ca 150%, 200%, 300%.
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
            <strong className="block text-emerald-800">Sheet 5: Căn cứ pháp luật</strong>
            Ghi nhận các tham số pháp luật 2026 áp dụng trong phiên tính.
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Báo cáo phân bổ chi phí nhân sự theo phòng ban</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Phòng ban</th>
                <th className="p-2.5 text-center">Số nhân sự</th>
                <th className="p-2.5 text-right">Tổng quỹ Gross</th>
                <th className="p-2.5 text-right">Tổng thực nhận Net</th>
                <th className="p-2.5 text-right">Tổng thuế TNCN</th>
                <th className="p-2.5 text-right">Tổng BH (NLĐ + DN)</th>
                <th className="p-2.5 text-right font-bold text-purple-900">Tổng chi phí DN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptBreakdown.map((d) => (
                <tr key={d.dept} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">{d.dept}</td>
                  <td className="p-2.5 text-center font-semibold">{d.count}</td>
                  <td className="p-2.5 text-right text-slate-700">{formatVND(d.gross)}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-700">{formatVND(d.net)}</td>
                  <td className="p-2.5 text-right text-amber-700">{formatVND(d.tax)}</td>
                  <td className="p-2.5 text-right text-slate-600">{formatVND(d.ins)}</td>
                  <td className="p-2.5 text-right font-extrabold text-purple-900 bg-purple-50/20">{formatVND(d.cost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="p-2.5">TỔNG CỘNG TOÀN DOANH NGHIỆP</td>
                <td className="p-2.5 text-center">{summary.totalEmployees}</td>
                <td className="p-2.5 text-right">{formatVND(summary.totalGrossSalary)}</td>
                <td className="p-2.5 text-right text-emerald-800">{formatVND(summary.totalNetSalary)}</td>
                <td className="p-2.5 text-right text-amber-800">{formatVND(summary.totalPersonalIncomeTax)}</td>
                <td className="p-2.5 text-right">{formatVND(summary.totalEmployerInsurance + summary.totalEmployeeInsurance)}</td>
                <td className="p-2.5 text-right text-purple-950 font-black">{formatVND(summary.totalCompanyCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Individual Payslips Quick Access Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Danh sách phiếu lương cá nhân ({payrollItems.length})</span>
        </h3>
        <p className="text-xs text-slate-500">
          Nhấn vào bất kỳ nhân viên nào để xem trước, in hoặc tải ảnh PNG phiếu lương riêng biệt.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {payrollItems.map((item) => (
            <div
              key={item.employee.id}
              onClick={() => onOpenPayslip(item)}
              className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700">{item.employee.code}</span>
                <span className="text-[11px] text-slate-400">{item.employee.department}</span>
              </div>
              <div className="font-bold text-slate-800 truncate">{item.employee.fullName}</div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 text-[11px]">Thực nhận:</span>
                <span className="font-bold text-emerald-700">{formatVND(item.netSalary)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
