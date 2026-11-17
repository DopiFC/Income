import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Gift, MinusCircle, Users } from 'lucide-react';
import { PayslipItem } from '../../types/payroll';
import { getWorkingStatusMeta } from '../../types/employee';
import { AdjustmentNumericField, BatchAdjustmentPatch } from '../../engine/adjustmentsBatch';
import { formatLiveVNDInput, parseVND } from '../../utils/currency';

type BatchTab = 'bonus' | 'deduction';
type TargetScope = 'selected' | 'department' | 'all';
type UpdateMode = 'add' | 'overwrite';

interface BatchPayrollAdjustmentModalProps {
  isOpen: boolean;
  initialTab: BatchTab;
  onClose: () => void;
  payrollItems: PayslipItem[];
  selectedIds: string[];
  departments: string[];
  selectedMonth: string;
  onApply: (
    employeeIds: string[],
    patch: BatchAdjustmentPatch,
    mode: UpdateMode,
    notes?: string
  ) => void;
}

export const BatchPayrollAdjustmentModal: React.FC<BatchPayrollAdjustmentModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  payrollItems,
  selectedIds,
  departments,
  selectedMonth,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState<BatchTab>(initialTab);
  const [scope, setScope] = useState<TargetScope>('all');
  const [targetDept, setTargetDept] = useState<string>(departments[0] || '');
  const [activeStaffOnly, setActiveStaffOnly] = useState<boolean>(true);
  const [updateMode, setUpdateMode] = useState<UpdateMode>('add');

  // Bonus fields (empty string = skip)
  const [bonusKpi, setBonusKpi] = useState('');
  const [bonusSales, setBonusSales] = useState('');
  const [bonusTet, setBonusTet] = useState('');
  const [commission, setCommission] = useState('');
  const [retroactivePay, setRetroactivePay] = useState('');
  const [taxExemptReimbursement, setTaxExemptReimbursement] = useState('');

  // Deduction fields (empty string = skip)
  const [advancePayment, setAdvancePayment] = useState('');
  const [advanceRepayment, setAdvanceRepayment] = useState('');
  const [damageCompensation, setDamageCompensation] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const availableDepartments = useMemo(() => {
    const set = new Set(departments);
    for (const item of payrollItems) {
      if (item.employee.department) set.add(item.employee.department);
    }
    return Array.from(set);
  }, [departments, payrollItems]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setScope(selectedIds.length > 0 ? 'selected' : 'all');
      setTargetDept(availableDepartments[0] || '');
      setActiveStaffOnly(true);
      setUpdateMode('add');
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
      setNotes('');
      setErrorMsg('');
    }
  }, [isOpen, initialTab, selectedIds.length, availableDepartments]);

  const targetItems = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return payrollItems.filter((item) => {
      if (scope === 'selected') {
        return selectedSet.has(item.employee.id);
      }
      if (scope === 'department') {
        const matchDept = item.employee.department === targetDept;
        if (!matchDept) return false;
      }
      if (activeStaffOnly) {
        const meta = getWorkingStatusMeta(item.employee.workingStatus);
        if (meta.isOffboarded) return false;
      }
      return true;
    });
  }, [payrollItems, selectedIds, scope, targetDept, activeStaffOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (targetItems.length === 0) {
      setErrorMsg('Chưa có nhân viên nào trong phạm vi áp dụng.');
      return;
    }

    const patch: BatchAdjustmentPatch = {};
    const bindField = (field: AdjustmentNumericField, raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') return;
      patch[field] = parseVND(trimmed);
    };

    if (activeTab === 'bonus') {
      bindField('bonusKpi', bonusKpi);
      bindField('bonusSales', bonusSales);
      bindField('bonusTet', bonusTet);
      bindField('commission', commission);
      bindField('retroactivePay', retroactivePay);
      bindField('taxExemptReimbursement', taxExemptReimbursement);
    } else {
      bindField('advancePayment', advancePayment);
      bindField('advanceRepayment', advanceRepayment);
      bindField('damageCompensation', damageCompensation);
      bindField('otherDeductions', otherDeductions);
    }

    if (Object.keys(patch).length === 0) {
      setErrorMsg('Vui lòng nhập ít nhất một khoản tiền cần áp dụng.');
      return;
    }

    onApply(
      targetItems.map((p) => p.employee.id),
      patch,
      updateMode,
      notes
    );
    onClose();
  };

  if (!isOpen) return null;

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
              {activeTab === 'bonus'
                ? 'Thưởng & Bổ sung thu nhập hàng loạt'
                : 'Tạm ứng & Khấu trừ hàng loạt'}
            </h2>
            <p className="text-xs text-slate-500">
              Áp dụng nhanh cho nhiều nhân viên cùng lúc trong kỳ lương {selectedMonth}
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

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 pb-0 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('bonus');
              setErrorMsg('');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border border-b-0 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'bonus'
                ? 'bg-white text-blue-700 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Thưởng hàng loạt</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('deduction');
              setErrorMsg('');
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border border-b-0 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'deduction'
                ? 'bg-white text-rose-700 border-slate-200'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Khấu trừ hàng loạt</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm overscroll-contain">
          {/* Step 1: Phạm vi áp dụng */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              1. Chọn đối tượng nhân viên áp dụng
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setScope('selected')}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  scope === 'selected'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed'
                }`}
              >
                <div className="text-xs font-semibold">Đã tick chọn</div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {selectedIds.length} nhân viên
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('department')}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  scope === 'department'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Theo phòng ban</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {targetDept || 'Chọn phòng'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  scope === 'all'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Toàn bộ danh sách</div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  Tối đa {payrollItems.length} nhân viên
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {scope === 'department' && (
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white min-w-[200px]"
                >
                  {availableDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              {scope !== 'selected' && (
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeStaffOnly}
                    onChange={(e) => setActiveStaffOnly(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Bỏ qua nhân sự đã duyệt nghỉ / nghỉ ngang / sa thải</span>
                </label>
              )}
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
              <Users className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-900 tabular-nums">
                  Áp dụng cho {targetItems.length} nhân viên:
                </span>{' '}
                {targetItems.length === 0 ? (
                  <span className="text-rose-600">Không có nhân viên phù hợp.</span>
                ) : (
                  <span className="text-slate-600">
                    {targetItems
                      .slice(0, 6)
                      .map((p) => p.employee.fullName)
                      .join(', ')}
                    {targetItems.length > 6 ? ` và ${targetItems.length - 6} người khác` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Cách cập nhật số liệu cũ */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              2. Cách xử lý nếu nhân viên đã có số liệu cũ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUpdateMode('add')}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  updateMode === 'add'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Cộng thêm vào số hiện có</div>
                <div className="text-[11px] text-slate-500">
                  VD: Đã có 500k + nhập 1.000k = 1.500k
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUpdateMode('overwrite')}
                className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                  updateMode === 'overwrite'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold">Ghi đè thay thế số cũ</div>
                <div className="text-[11px] text-slate-500">
                  Ô để trống giữ nguyên; nhập 0 để đưa về 0đ
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Nhập số tiền */}
          {activeTab === 'bonus' ? (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Nhập các khoản thưởng & bổ sung (VNĐ)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng KPI</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={bonusKpi}
                    onChange={(e) => setBonusKpi(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng doanh số</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={bonusSales}
                    onChange={(e) => setBonusSales(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Thưởng Lễ / Tết</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={bonusTet}
                    onChange={(e) => setBonusTet(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Hoa hồng</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={commission}
                    onChange={(e) => setCommission(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Truy lĩnh kỳ trước</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={retroactivePay}
                    onChange={(e) => setRetroactivePay(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Công tác / Hoàn ứng (miễn thuế)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={taxExemptReimbursement}
                    onChange={(e) => setTaxExemptReimbursement(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Nhập các khoản tạm ứng & khấu trừ (VNĐ)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Đã tạm ứng trong tháng</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Hoàn trả tạm ứng kỳ trước</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={advanceRepayment}
                    onChange={(e) => setAdvanceRepayment(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Bồi thường thiệt hại (có biên bản)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={damageCompensation}
                    onChange={(e) => setDamageCompensation(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Khấu trừ khác</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Để trống = giữ nguyên"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(formatLiveVNDInput(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white tabular-nums font-semibold text-rose-700 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Ghi chú áp dụng chung (không bắt buộc)</label>
            <input
              type="text"
              placeholder={
                activeTab === 'bonus'
                  ? 'VD: Thưởng hoàn thành mục tiêu tháng'
                  : 'VD: Khấu trừ đồng phục / tạm ứng đợt 1'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium whitespace-nowrap"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={targetItems.length === 0}
            className={`px-4 py-2 text-xs sm:text-sm text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-45 whitespace-nowrap ${
              activeTab === 'bonus'
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-rose-700 hover:bg-rose-800'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              Áp dụng cho {targetItems.length} nhân viên
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
