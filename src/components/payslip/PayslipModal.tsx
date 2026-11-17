import React, { useRef, useState } from 'react';
import { PayslipItem } from '../../types/payroll';
import { LegalConfig } from '../../types/legal';
import { X, Download, Printer, ShieldCheck, AlertTriangle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { formatVND, readVietnameseCurrency } from '../../utils/currency';
import { downloadElementAsPng, buildSafeEmployeePayslipFileName } from '../../services/payslipImage';

import { CompanyProfile } from '../../types/organization';

interface PayslipModalProps {
  item: PayslipItem | null;
  onClose: () => void;
  legalConfig: LegalConfig;
  companyProfile?: CompanyProfile;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  item,
  onClose,
  legalConfig,
  companyProfile
}) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const displayCompanyName = companyProfile?.companyName || 'CÔNG TY TNHH / HỘ KINH DOANH';

  if (!item) return null;

  const { employee, attendance, adjustments } = item;

  const handleDownloadPng = async () => {
    if (!payslipRef.current) return;
    setIsExporting(true);
    const fileName = buildSafeEmployeePayslipFileName(employee.fullName, employee.code, new Set());
    await downloadElementAsPng(payslipRef.current, fileName);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-300">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base">Phiếu lương nhân viên: {employee.fullName}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white font-mono">{employee.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Đang tạo ảnh...' : 'Tải ảnh PNG'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto bg-slate-50">
          <div
            ref={payslipRef}
            className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 space-y-6 text-slate-800"
            style={{ minWidth: '600px' }}
          >
            {/* Header */}
            <div className="border-b-2 border-blue-900 pb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {companyProfile?.logoUrl && (
                  <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={companyProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {displayCompanyName}
                  </h3>
                  {companyProfile?.taxCode && (
                    <div className="text-xs text-slate-600 font-mono">
                      MST: <strong>{companyProfile.taxCode}</strong>
                    </div>
                  )}
                  {companyProfile?.address && (
                    <div className="text-xs text-slate-500">
                      Địa chỉ: {companyProfile.address}
                    </div>
                  )}
                  {companyProfile?.phoneNumber && (
                    <div className="text-xs text-slate-500">
                      ĐT: {companyProfile.phoneNumber}
                    </div>
                  )}
                  <h1 className="text-xl sm:text-2xl font-black text-blue-950 mt-2">
                    PHIẾU THANH TOÁN TIỀN LƯƠNG
                  </h1>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5">
                    Kỳ tính lương: <strong>{attendance.month}</strong> | Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs uppercase">
                  Hình thức: Lương {employee.salaryType}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Mã hồ sơ: <span className="font-mono font-bold text-slate-700">{employee.code}</span>
                </div>
              </div>
            </div>

            {/* Employee profile grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Họ và tên:</span>
                <span className="font-bold text-slate-900 text-sm">{employee.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phòng ban:</span>
                <span className="font-semibold text-slate-800">{employee.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Chức vụ - Cấp bậc:</span>
                <span className="font-semibold text-slate-800">{employee.position} ({employee.rank})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Loại hợp đồng:</span>
                <span className="font-semibold text-slate-800">
                  {employee.contractType === 'probation' ? 'HĐ Thử việc' : 'HĐ Lao động chính thức'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Công chuẩn / Thực tế:</span>
                <span className="font-bold text-slate-900">
                  {attendance.actualWorkDays} / {attendance.standardWorkDays} ngày
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Nghỉ phép hưởng lương:</span>
                <span className="font-semibold text-slate-800">
                  {attendance.paidAnnualLeaveDays + attendance.paidHolidayDays + attendance.paidSpecialLeaveDays} ngày
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Số người phụ thuộc (NPT):</span>
                <span className="font-semibold text-slate-800">{employee.dependentsCount} người</span>
              </div>
              <div>
                <span className="text-slate-500 block">Vùng tối thiểu áp dụng:</span>
                <span className="font-semibold text-slate-800">Vùng {employee.region}</span>
              </div>
            </div>

            {/* Income & Deductions 2-Column Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* CỘT I: THU NHẬP (GROSS) */}
              <div className="space-y-3">
                <div className="bg-blue-900 text-white font-bold py-1.5 px-3 rounded-md text-xs flex justify-between items-center">
                  <span>I. CÁC KHOẢN THU NHẬP</span>
                  <span>SỐ TIỀN (VND)</span>
                </div>

                <div className="space-y-1.5 text-slate-700 divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span>1. Lương thỏa thuận HĐ:</span>
                    <span className="font-semibold text-slate-900">{formatVND(employee.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-medium">
                    <span>2. Lương thực tế theo ngày công:</span>
                    <span className="font-bold text-slate-900">{formatVND(item.actualBaseSalary)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>3. Phụ cấp ăn trưa:</span>
                    <span>{formatVND(item.totalLunchAllowance)}</span>
                  </div>
                  {employee.positionAllowance > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>4. Phụ cấp chức vụ:</span>
                      <span>{formatVND(employee.positionAllowance)}</span>
                    </div>
                  )}
                  {(employee.phoneAllowance > 0 || employee.transportAllowance > 0) && (
                    <div className="flex justify-between pt-1">
                      <span>5. Phụ cấp điện thoại, xăng xe:</span>
                      <span>{formatVND((employee.phoneAllowance || 0) + (employee.transportAllowance || 0))}</span>
                    </div>
                  )}
                  {item.totalOvertimePay > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>
                        6. Tiền làm thêm giờ ({attendance.normalDayOvertimeHours + attendance.weekendOvertimeHours + attendance.holidayOvertimeHours}h):
                      </span>
                      <span className="font-semibold text-amber-700">{formatVND(item.totalOvertimePay)}</span>
                    </div>
                  )}
                  {item.totalBonuses > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>7. Thưởng KPI & Doanh số:</span>
                      <span className="font-semibold text-emerald-700">{formatVND(item.totalBonuses)}</span>
                    </div>
                  )}
                  {item.taxExemptReimbursements > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>8. Hoàn trả công tác phí hợp lệ:</span>
                      <span>{formatVND(item.taxExemptReimbursements)}</span>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex justify-between items-center text-xs font-bold text-blue-950">
                  <span>TỔNG THU NHẬP GROSS:</span>
                  <span className="text-sm">{formatVND(item.grossIncome)}</span>
                </div>
              </div>

              {/* CỘT II: CÁC KHOẢN KHẤU TRỪ */}
              <div className="space-y-3">
                <div className="bg-slate-800 text-white font-bold py-1.5 px-3 rounded-md text-xs flex justify-between items-center">
                  <span>II. BẢO HIỂM & KHẤU TRỪ</span>
                  <span>SỐ TIỀN (VND)</span>
                </div>

                <div className="space-y-1.5 text-slate-700 divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span>1. BHXH NLĐ (8%):</span>
                    <span className="text-rose-700 font-semibold">{formatVND(item.employeeSocialInsurance)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>2. BHYT NLĐ (1.5%):</span>
                    <span className="text-rose-700 font-semibold">{formatVND(item.employeeHealthInsurance)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>3. BHTN NLĐ (1%):</span>
                    <span className="text-rose-700 font-semibold">{formatVND(item.employeeUnemploymentInsurance)}</span>
                  </div>
                  {item.employeeTradeUnion > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>4. Đoàn phí công đoàn NLĐ:</span>
                      <span className="text-rose-700 font-semibold">{formatVND(item.employeeTradeUnion)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 font-medium bg-rose-50/50 p-1 rounded">
                    <span>5. Thuế Thu nhập cá nhân (TNCN):</span>
                    <span className="font-bold text-rose-700">{formatVND(item.personalIncomeTax)}</span>
                  </div>
                  {item.advancePayment > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>6. Đã tạm ứng lương trong kỳ:</span>
                      <span className="font-semibold text-rose-700">{formatVND(item.advancePayment)}</span>
                    </div>
                  )}
                  {item.damageCompensation + item.otherDeductions > 0 && (
                    <div className="flex justify-between pt-1">
                      <span>7. Khấu trừ khác:</span>
                      <span className="text-rose-700 font-semibold">{formatVND(item.damageCompensation + item.otherDeductions)}</span>
                    </div>
                  )}
                </div>

                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex justify-between items-center text-xs font-bold text-rose-950">
                  <span>TỔNG CÁC KHOẢN KHẤU TRỪ:</span>
                  <span className="text-sm">
                    {formatVND(item.totalEmployeeInsurance + item.personalIncomeTax + item.totalOtherDeductions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Chi tiết tính thuế Thu nhập cá nhân */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Diễn giải căn cứ tính thuế TNCN (Luật thuế áp dụng 2026):</span>
                <span className="text-slate-500 font-normal">
                  TNTT = Thu nhập chịu thuế - Các khoản giảm trừ
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Thu nhập chịu thuế:</span>
                  <span className="font-bold text-slate-900">{formatVND(item.assessableIncome)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Giảm trừ bản thân:</span>
                  <span className="font-semibold text-slate-800">{formatVND(item.personalDeduction)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Giảm trừ NPT ({employee.dependentsCount} người):</span>
                  <span className="font-semibold text-slate-800">{formatVND(item.dependentDeduction)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thu nhập tính thuế (TNTT):</span>
                  <span className="font-bold text-blue-900">{formatVND(item.taxableIncome)}</span>
                </div>
              </div>
            </div>

            {/* Grand Total Net Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 block">
                  SỐ TIỀN THỰC LĨNH CHUYỂN KHOẢN (NET)
                </span>
                <span className="text-xs text-slate-300 italic block mt-1">
                  Bằng chữ: <strong>{readVietnameseCurrency(item.netSalary)}</strong>
                </span>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {formatVND(item.netSalary)}
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">Đã trừ BHXH, Thuế TNCN & Tạm ứng</div>
              </div>
            </div>

            {/* Company contributions info */}
            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span>Phần bảo hiểm & kinh phí do Doanh nghiệp đóng thêm: </span>
                <strong className="text-slate-700">{formatVND(item.totalEmployerInsurance)}</strong> (BHXH 17.5%, BHYT 3%, BHTN 1%, CĐ 2%)
              </div>
              <div>
                <span>Tổng chi phí nhân sự của DN: </span>
                <strong className="text-purple-900">{formatVND(item.totalCompanyCost)}</strong>
              </div>
            </div>

            {/* Signatures */}
            <div className={`grid ${companyProfile?.approver ? 'grid-cols-3' : 'grid-cols-2'} pt-6 text-center text-xs font-semibold text-slate-700`}>
              <div>
                <p className="uppercase">Người lập biểu</p>
                <p className="text-[11px] font-normal text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-14" />
                <p className="font-bold text-slate-900">{companyProfile?.payrollPreparer || ''}</p>
              </div>
              {companyProfile?.approver && (
                <div>
                  <p className="uppercase">Người duyệt / Giám đốc</p>
                  <p className="text-[11px] font-normal text-slate-400 mt-0.5">(Ký, đóng dấu nếu có)</p>
                  <div className="h-14" />
                  <p className="font-bold text-slate-900">{companyProfile.approver}</p>
                </div>
              )}
              <div>
                <p className="uppercase">Người lao động xác nhận</p>
                <p className="text-[11px] font-normal text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
                <div className="h-14" />
                <p className="font-bold text-slate-900">{employee.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
