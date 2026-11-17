import React from 'react';
import { PayslipItem } from '../../types/payroll';
import { CompanyProfile } from '../../types/organization';
import { LegalConfig } from '../../types/legal';
import { getWorkingStatusMeta } from '../../types/employee';
import { formatVND, readVietnameseCurrency } from '../../utils/currency';

interface PayslipCardProps {
  item: PayslipItem;
  companyProfile?: CompanyProfile;
  legalConfig: LegalConfig;
}

export const PayslipCard = React.forwardRef<HTMLDivElement, PayslipCardProps>(
  ({ item, companyProfile, legalConfig }, ref) => {
    const { employee, attendance, adjustments } = item;
    const displayCompanyName = companyProfile?.companyName || 'CÔNG TY TNHH / HỘ KINH DOANH';
    const statusMeta = getWorkingStatusMeta(employee.workingStatus);

    return (
      <div
        ref={ref}
        id="printable-payslip"
        className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-300 text-slate-800 space-y-6 mx-auto"
        style={{ width: '100%', minWidth: '680px', maxWidth: '820px', backgroundColor: '#ffffff' }}
      >
        {/* Header: Company & Title */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {companyProfile?.logoUrl ? (
              <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={companyProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                DOPI
              </div>
            )}
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-tight">
                {displayCompanyName}
              </h2>
              {companyProfile?.taxCode && (
                <div className="text-xs text-slate-600 font-mono">
                  Mã số thuế: <strong>{companyProfile.taxCode}</strong>
                </div>
              )}
              {companyProfile?.address && (
                <div className="text-xs text-slate-500">
                  Địa chỉ: {companyProfile.address}
                </div>
              )}
              {companyProfile?.phoneNumber && (
                <div className="text-xs text-slate-500">
                  Điện thoại: {companyProfile.phoneNumber}
                </div>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wide">
              Hợp đồng: {employee.contractType === 'official_fixed' || employee.contractType === 'official_indefinite' ? 'Chính thức' : employee.contractType === 'probation' ? 'Thử việc' : 'Khác'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Mã NV: <span className="font-mono font-bold text-slate-700">{employee.code}</span>
              {employee.workingStatus !== 'active' && (
                <span className="ml-2 font-semibold text-slate-700">· {statusMeta.label}</span>
              )}
            </div>
          </div>
        </div>

        {/* Payslip Title Banner */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide uppercase">
            PHIẾU THANH TOÁN TIỀN LƯƠNG
          </h1>
          <div className="text-xs font-semibold text-slate-600 mt-1">
            Kỳ tính lương: <span className="text-blue-900 font-bold">{attendance.month}</span> | Vùng lương: <strong>Vùng {employee.region}</strong>
          </div>
        </div>

        {/* Employee Information Summary Grid */}
        <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
            <strong className="text-slate-900 text-sm font-bold">{employee.fullName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Phòng ban / Bộ phận:</span>
            <strong className="text-slate-800">{employee.department}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Chức vụ / Vị trí:</span>
            <strong className="text-slate-800">{employee.position}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Người phụ thuộc:</span>
            <strong className="text-slate-800 tabular-nums">{employee.dependentsCount} người</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Hình thức lương:</span>
            <strong className="text-blue-900 font-bold uppercase">Lương {employee.salaryType}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Lương thỏa thuận:</span>
            <strong className="text-slate-900 font-bold tabular-nums">{formatVND(employee.baseSalary)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Ngày công thực tế:</span>
            <strong className="text-emerald-700 font-bold tabular-nums">
              {attendance.actualWorkDays} / {attendance.standardWorkDays} công
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Nghỉ phép hưởng lương:</span>
            <strong className="text-slate-800 tabular-nums">
              {attendance.paidAnnualLeaveDays + attendance.paidHolidayDays + attendance.paidSpecialLeaveDays + attendance.compensatoryLeaveDays} ngày
            </strong>
          </div>
        </div>

        {/* Income & Deductions Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: I. Thu nhập */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3.5 py-2 font-bold text-xs text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <span>I. CÁC KHOẢN THU NHẬP</span>
              <span>SỐ TIỀN (VNĐ)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-3.5 py-2 flex items-center justify-between">
                <div>
                  <span className="text-slate-800 font-medium">Lương thời gian / cơ bản</span>
                  <span className="text-[10px] text-slate-400 block">Theo ngày công làm việc</span>
                </div>
                <span className="font-semibold text-slate-900 tabular-nums">{formatVND(item.actualBaseSalary)}</span>
              </div>

              {item.totalOvertimePay > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between bg-amber-50/40">
                  <div>
                    <span className="text-amber-900 font-medium">Lương làm thêm giờ (OT)</span>
                    <span className="text-[10px] text-amber-700 block">
                      Ngày thường {attendance.normalDayOvertimeHours}h | Nghỉ {attendance.weekendOvertimeHours}h | Lễ {attendance.holidayOvertimeHours}h
                    </span>
                  </div>
                  <span className="font-semibold text-amber-900 tabular-nums">{formatVND(item.totalOvertimePay)}</span>
                </div>
              )}

              {item.totalLunchAllowance > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-800">Phụ cấp ăn trưa</span>
                    <span className="text-[10px] text-slate-400 block">Miễn thuế tối đa 730k</span>
                  </div>
                  <span className="text-slate-800 tabular-nums">{formatVND(item.totalLunchAllowance)}</span>
                </div>
              )}

              {item.totalAllowances > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <span className="text-slate-800">Phụ cấp chức vụ, điện thoại, xăng xe</span>
                  <span className="text-slate-800 tabular-nums">{formatVND(item.totalAllowances)}</span>
                </div>
              )}

              {item.totalBonuses - (adjustments.retroactivePay || 0) > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between bg-blue-50/30">
                  <div>
                    <span className="text-blue-900 font-medium">Thưởng KPI, Doanh số, Lễ, Hoa hồng</span>
                  </div>
                  <span className="font-semibold text-blue-900 tabular-nums">
                    {formatVND(item.totalBonuses - (adjustments.retroactivePay || 0))}
                  </span>
                </div>
              )}

              {adjustments.retroactivePay > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <span className="text-slate-800">Truy lĩnh / Bổ sung lương</span>
                  <span className="text-slate-800 tabular-nums">{formatVND(adjustments.retroactivePay)}</span>
                </div>
              )}

              {item.taxExemptReimbursements > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-800">Khoản chi công tác / hoàn ứng</span>
                    <span className="text-[10px] text-slate-400 block">Miễn tính thuế & BH</span>
                  </div>
                  <span className="text-slate-800 tabular-nums">{formatVND(item.taxExemptReimbursements)}</span>
                </div>
              )}

              <div className="px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-slate-900 flex items-center justify-between border-t border-slate-200">
                <span>TỔNG THU NHẬP (GROSS)</span>
                <span className="text-sm font-black text-slate-900 tabular-nums">{formatVND(item.grossIncome)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: II. Giảm trừ */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3.5 py-2 font-bold text-xs text-slate-900 border-b border-slate-200 flex items-center justify-between">
              <span>II. CÁC KHOẢN GIẢM TRỪ</span>
              <span>SỐ TIỀN (VNĐ)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-3.5 py-2 flex items-center justify-between">
                <div>
                  <span className="text-slate-800">BH Xã hội (8%)</span>
                  <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                    Lương BH: {formatVND(item.insuranceSalaryBase)}
                  </span>
                </div>
                <span className="text-slate-800 tabular-nums">{formatVND(item.employeeSocialInsurance)}</span>
              </div>

              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-800">BH Y tế (1.5%)</span>
                <span className="text-slate-800 tabular-nums">{formatVND(item.employeeHealthInsurance)}</span>
              </div>

              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-800">BH Thất nghiệp (1%)</span>
                <span className="text-slate-800 tabular-nums">{formatVND(item.employeeUnemploymentInsurance)}</span>
              </div>

              <div className="px-3.5 py-2 flex items-center justify-between bg-rose-50/40">
                <div>
                  <span className="text-rose-900 font-medium">Thuế TNCN phải khấu trừ</span>
                  <span className="text-[10px] text-rose-700 block">
                    Giảm trừ: Bản thân {formatVND(legalConfig.personalDeduction)} + NPT ({employee.dependentsCount}x)
                  </span>
                </div>
                <span className="font-semibold text-rose-900 tabular-nums">{formatVND(item.personalIncomeTax)}</span>
              </div>

              {adjustments.advancePayment > 0 && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <span className="text-slate-800">Tạm ứng lương đã nhận trong tháng</span>
                  <span className="text-slate-800 font-semibold tabular-nums">{formatVND(adjustments.advancePayment)}</span>
                </div>
              )}

              {(adjustments.advanceRepayment > 0 || adjustments.damageCompensation > 0 || adjustments.otherDeductions > 0) && (
                <div className="px-3.5 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-800">Hoàn ứng / Bồi thường / Khấu trừ khác</span>
                    {adjustments.deductionNotes && (
                      <span className="text-[10px] text-slate-500 block">{adjustments.deductionNotes}</span>
                    )}
                  </div>
                  <span className="text-slate-800 tabular-nums">
                    {formatVND((adjustments.advanceRepayment || 0) + (adjustments.damageCompensation || 0) + (adjustments.otherDeductions || 0))}
                  </span>
                </div>
              )}

              <div className="px-3.5 py-2.5 bg-slate-50 font-bold text-xs text-rose-900 flex items-center justify-between border-t border-slate-200">
                <span>TỔNG CÁC KHOẢN GIẢM TRỪ</span>
                <span className="text-sm font-black text-rose-700 tabular-nums">
                  {formatVND(
                    item.totalEmployeeInsurance +
                    item.personalIncomeTax +
                    (adjustments.advancePayment || 0) +
                    (adjustments.advanceRepayment || 0) +
                    (adjustments.damageCompensation || 0) +
                    (adjustments.otherDeductions || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NET SALARY - MAIN HIGHLIGHT BOX */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-300 block">
              III. THỰC LĨNH CHUYỂN KHOẢN (NET)
            </span>
            <span className="text-xs text-slate-400 italic block mt-1">
              Bằng chữ: <strong>{readVietnameseCurrency(item.netSalary)}</strong>
            </span>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight tabular-nums">
              {formatVND(item.netSalary)}
            </span>
          </div>
        </div>

        {/* IV. Minh bạch chi phí Doanh nghiệp đóng góp */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>IV. Trách nhiệm đóng góp của Doanh nghiệp (Minh bạch đãi ngộ)</span>
            <span className="font-mono text-slate-700">Tỷ lệ: 23.5%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 tabular-nums">
            <div>BHXH DN (17.5%): <strong>{formatVND(item.employerSocialInsurance)}</strong></div>
            <div>BHYT DN (3%): <strong>{formatVND(item.employerHealthInsurance)}</strong></div>
            <div>BHTN DN (1%): <strong>{formatVND(item.employerUnemploymentInsurance)}</strong></div>
            <div>Kinh phí công đoàn (2%): <strong>{formatVND(item.employerTradeUnion)}</strong></div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700 flex justify-between font-medium tabular-nums">
            <span>Tổng chi phí thực tế doanh nghiệp chi trả cho nhân sự:</span>
            <strong className="text-slate-900">{formatVND(item.totalCompanyCost)}</strong>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-slate-700">
          <div className="space-y-12">
            <div className="font-bold text-slate-900">NGƯỜI LẬP BIỂU</div>
            <div className="font-medium text-slate-800">{companyProfile?.payrollPreparer || '(Ký và ghi rõ họ tên)'}</div>
          </div>
          <div className="space-y-12">
            <div className="font-bold text-slate-900">KẾ TOÁN TRƯỞNG / PHÊ DUYỆT</div>
            <div className="font-medium text-slate-800">{companyProfile?.approver || '(Ký và ghi rõ họ tên)'}</div>
          </div>
          <div className="space-y-12">
            <div className="font-bold text-slate-900">NGƯỜI LAO ĐỘNG KÝ NHẬN</div>
            <div className="font-medium text-slate-800">{employee.fullName}</div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3">
          Phiếu lương được trích xuất từ phần mềm Dopi GRIncome. Mọi thắc mắc về số liệu vui lòng liên hệ phòng Nhân sự / Kế toán trong vòng 3 ngày làm việc.
        </div>
      </div>
    );
  }
);

PayslipCard.displayName = 'PayslipCard';
