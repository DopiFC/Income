import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { Employee } from '../../types/employee';
import { MonthlyAttendance, Adjustments } from '../../types/attendance';
import { LegalConfig } from '../../types/legal';
import { calculateEmployeePayroll } from '../../engine/salaryCalculation';
import { solveGrossFromTargetNet } from '../../engine/grossToNet';
import { formatVND, formatVNDNumber, formatLiveVNDInput, parseVND } from '../../utils/currency';

interface PayrollAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendance: MonthlyAttendance | null;
  adjustment: Adjustments | null;
  legalConfig: LegalConfig;
  onSave: (updatedAdjustment: Adjustments, updatedAttendance: MonthlyAttendance) => void;
}

export const PayrollAdjustmentModal: React.FC<PayrollAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  attendance,
  adjustment,
  legalConfig,
  onSave
}) => {
  // Thu nhập bổ sung
  const [bonusKpi, setBonusKpi] = useState('0');
  const [bonusSales, setBonusSales] = useState('0');
  const [bonusTet, setBonusTet] = useState('0');
  const [commission, setCommission] = useState('0');
  const [retroactivePay, setRetroactivePay] = useState('0');
  const [taxExemptReimbursement, setTaxExemptReimbursement] = useState('0');

  // Tạm ứng & Khấu trừ
  const [advancePayment, setAdvancePayment] = useState('0');
  const [advanceRepayment, setAdvanceRepayment] = useState('0');
  const [damageCompensation, setDamageCompensation] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [deductionNotes, setDeductionNotes] = useState('');

  // Ngày công & OT nhanh
  const [standardWorkDays, setStandardWorkDays] = useState(22);
  const [actualWorkDays, setActualWorkDays] = useState(22);
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(0);
  const [normalOtHours, setNormalOtHours] = useState(0);
  const [weekendOtHours, setWeekendOtHours] = useState(0);
  const [holidayOtHours, setHolidayOtHours] = useState(0);

  useEffect(() => {
    if (isOpen && employee && attendance) {
      const adj = adjustment || {
        employeeId: employee.id,
        bonusKpi: 0,
        bonusSales: 0,
        bonusTet: 0,
        commission: 0,
        retroactivePay: 0,
        taxExemptReimbursement: 0,
        advancePayment: 0,
        advanceRepayment: 0,
        damageCompensation: 0,
        otherDeductions: 0
      };

      setBonusKpi(adj.bonusKpi ? formatVNDNumber(adj.bonusKpi) : '');
      setBonusSales(adj.bonusSales ? formatVNDNumber(adj.bonusSales) : '');
      setBonusTet(adj.bonusTet ? formatVNDNumber(adj.bonusTet) : '');
      setCommission(adj.commission ? formatVNDNumber(adj.commission) : '');
      setRetroactivePay(adj.retroactivePay ? formatVNDNumber(adj.retroactivePay) : '');
      setTaxExemptReimbursement(adj.taxExemptReimbursement ? formatVNDNumber(adj.taxExemptReimbursement) : '');
      setAdvancePayment(adj.advancePayment ? formatVNDNumber(adj.advancePayment) : '');
      setAdvanceRepayment(adj.advanceRepayment ? formatVNDNumber(adj.advanceRepayment) : '');
      setDamageCompensation(adj.damageCompensation ? formatVNDNumber(adj.damageCompensation) : '');
      setOtherDeductions(adj.otherDeductions ? formatVNDNumber(adj.otherDeductions) : '');
      setDeductionNotes(adj.deductionNotes || '');

      setStandardWorkDays(attendance.standardWorkDays);
      setActualWorkDays(attendance.actualWorkDays);
      setUnpaidLeaveDays(attendance.unpaidLeaveDays);
      setNormalOtHours(attendance.normalDayOvertimeHours);
      setWeekendOtHours(attendance.weekendOvertimeHours);
      setHolidayOtHours(attendance.holidayOvertimeHours);
    }
  }, [isOpen, employee, attendance, adjustment]);

  const draftAdjustment: Adjustments | null = useMemo(() => {
    if (!employee) return null;
    return {
      employeeId: employee.id,
      bonusKpi: parseVND(bonusKpi),
      bonusSales: parseVND(bonusSales),
      bonusTet: parseVND(bonusTet),
      commission: parseVND(commission),
      retroactivePay: parseVND(retroactivePay),
      taxExemptReimbursement: parseVND(taxExemptReimbursement),
      advancePayment: parseVND(advancePayment),
      advanceRepayment: parseVND(advanceRepayment),
      damageCompensation: parseVND(damageCompensation),
      otherDeductions: parseVND(otherDeductions),
      deductionNotes: deductionNotes.trim() || undefined
    };
  }, [
    employee,
    bonusKpi,
    bonusSales,
    bonusTet,
    commission,
    retroactivePay,
    taxExemptReimbursement,
    advancePayment,
    advanceRepayment,
    damageCompensation,
    otherDeductions,
    deductionNotes
  ]);

  const draftAttendance: MonthlyAttendance | null = useMemo(() => {
    if (!attendance) return null;
    return {
      ...attendance,
      standardWorkDays: Math.max(1, standardWorkDays),
      actualWorkDays: Math.max(0, actualWorkDays),
      unpaidLeaveDays: Math.max(0, unpaidLeaveDays),
      normalDayOvertimeHours: Math.max(0, normalOtHours),
      weekendOvertimeHours: Math.max(0, weekendOtHours),
      holidayOvertimeHours: Math.max(0, holidayOtHours)
    };
  }, [attendance, standardWorkDays, actualWorkDays, unpaidLeaveDays, normalOtHours, weekendOtHours, holidayOtHours]);

  // Tính nháp lương thực nhận ngay trong lúc chỉnh sửa
  const previewPayslip = useMemo(() => {
    if (!employee || !draftAttendance || !draftAdjustment) return null;
    if (employee.salaryType === 'net') {
      return solveGrossFromTargetNet(employee.baseSalary, employee, draftAttendance, draftAdjustment, legalConfig).payslip;
    }
    return calculateEmployeePayroll(employee, draftAttendance, draftAdjustment, legalConfig);
  }, [employee, draftAttendance, draftAdjustment, legalConfig]);

  const handleResetAdjustments = () => {
    setBonusKpi('');
    setBonusSales('');
    setBonusTet('');
    setCommission('');
    setRetroactivePay('');
    setTaxExemptReimbursement('');
    setAdvancePayment('');
    setAdvanceRepayment('');
    setDamageCompensation('');
    setOtherDeductions('');
    setDeductionNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftAdjustment || !draftAttendance) return;
    onSave(draftAdjustment, draftAttendance);
    onClose();
  };

  if (!isOpen || !employee || !attendance) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-950/55 p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-2xl bg-white rounded-t-xl sm:rounded-xl border border-slate-200 shadow-xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-base truncate">
              Điều chỉnh bảng lương: {employee.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              <span className="font-mono">{employee.code}</span> · Lương HĐ: {formatVND(employee.baseSalary)} ({employee.salaryType.toUpperCase()}) · Kỳ {attendance.month}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm overscroll-contain">
          {/* Ngày công & Tăng ca */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              1. Ngày công & Tăng ca trong tháng
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Công chuẩn (ngày)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={standardWorkDays}
                  onChange={(e) => setStandardWorkDays(parseFloat(e.target.value) || 22)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Công thực tế (ngày)</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="0.5"
                  value={actualWorkDays}
                  onChange={(e) => setActualWorkDays(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg bg-white font-bold text-emerald-800 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nghỉ không lương</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="0.5"
                  value={unpaidLeaveDays}
                  onChange={(e) => setUnpaidLeaveDays(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">OT ngày thường (150%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={normalOtHours}
                  onChange={(e) => setNormalOtHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">OT cuối tuần (200%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={weekendOtHours}
                  onChange={(e) => setWeekendOtHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">OT ngày lễ (300%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={holidayOtHours}
                  onChange={(e) => setHolidayOtHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Các khoản cộng thêm */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Thưởng & Thu nhập bổ sung (VNĐ)
              </span>
              <button
                type="button"
                onClick={handleResetAdjustments}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại 0 đ</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng KPI</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={bonusKpi}
                  onChange={(e) => setBonusKpi(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng doanh số</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={bonusSales}
                  onChange={(e) => setBonusSales(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng Lễ / Tết</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={bonusTet}
                  onChange={(e) => setBonusTet(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Hoa hồng</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={commission}
                  onChange={(e) => setCommission(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Truy lĩnh kỳ trước</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={retroactivePay}
                  onChange={(e) => setRetroactivePay(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Chi công tác / Hoàn ứng (miễn thuế)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={taxExemptReimbursement}
                  onChange={(e) => setTaxExemptReimbursement(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Tạm ứng & Khấu trừ */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              3. Tạm ứng & Khoản trừ khác (VNĐ)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Đã tạm ứng trong tháng</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Hoàn trả tạm ứng kỳ trước</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={advanceRepayment}
                  onChange={(e) => setAdvanceRepayment(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Bồi thường thiệt hại (có biên bản)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={damageCompensation}
                  onChange={(e) => setDamageCompensation(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Khấu trừ khác</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(formatLiveVNDInput(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Ghi chú lý do điều chỉnh</label>
                <input
                  type="text"
                  placeholder="VD: Thưởng đạt KPI tháng 3, trừ tạm ứng đợt 1..."
                  value={deductionNotes}
                  onChange={(e) => setDeductionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Live Preview */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {previewPayslip && (
            <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
              <div>
                <span className="text-slate-500">Tổng Gross: </span>
                <strong className="text-blue-900">{formatVND(previewPayslip.grossIncome)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Thực nhận Net: </span>
                <strong className="text-emerald-700 text-sm">{formatVND(previewPayslip.netSalary)}</strong>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu điều chỉnh</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
