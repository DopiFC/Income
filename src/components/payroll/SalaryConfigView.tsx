import React, { useState } from 'react';
import { Employee, Allowance, SalaryType } from '../../types/employee';
import { LegalConfig } from '../../types/legal';
import { DEFAULT_LEGAL_CONFIG_2026 } from '../../legal/rules';
import { Sliders, Plus, Trash2 } from 'lucide-react';
import { formatVND, formatVNDNumber, formatLiveVNDInput, parseVND } from '../../utils/currency';

interface SalaryConfigViewProps {
  employees: Employee[];
  onUpdateEmployee: (emp: Employee) => void;
  onBatchApplySalaryType: (salaryType: SalaryType) => void;
  onBatchApplyInsuranceMode?: (mode: 'regional_min' | 'contract_salary') => void;
  legalConfig?: LegalConfig;
}

export const SalaryConfigView: React.FC<SalaryConfigViewProps> = ({
  employees,
  onUpdateEmployee,
  onBatchApplySalaryType,
  onBatchApplyInsuranceMode,
  legalConfig = DEFAULT_LEGAL_CONFIG_2026
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');

  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];

  // Custom allowance input
  const [allwName, setAllwName] = useState('');
  const [allwAmount, setAllwAmount] = useState('');
  const [allwIsTaxable, setAllwIsTaxable] = useState(true);
  const [allwIsInsurance, setAllwIsInsurance] = useState(false);

  const handleAddCustomAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !allwName.trim()) return;

    const parsedAmount = parseVND(allwAmount);
    if (parsedAmount <= 0) return;

    const newAllowance: Allowance = {
      id: `allw-${Date.now()}`,
      name: allwName.trim(),
      amount: parsedAmount,
      isTaxable: allwIsTaxable,
      isSubjectToInsurance: allwIsInsurance
    };

    const updated: Employee = {
      ...selectedEmp,
      otherAllowances: [...(selectedEmp.otherAllowances || []), newAllowance]
    };

    onUpdateEmployee(updated);
    setAllwName('');
    setAllwAmount('');
  };

  const handleRemoveCustomAllowance = (allwId: string) => {
    if (!selectedEmp) return;
    const updated: Employee = {
      ...selectedEmp,
      otherAllowances: (selectedEmp.otherAllowances || []).filter((a) => a.id !== allwId)
    };
    onUpdateEmployee(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Cấu hình lương & Phụ cấp thu nhập</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Thiết lập cơ chế tính Gross/Net, phân loại thuế TNCN và căn cứ bảo hiểm cho các thành phần thu nhập.
          </p>
        </div>

        {/* Batch toggles: Gross/Net & Bảo hiểm */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-slate-500 px-2 font-medium whitespace-nowrap">Áp dụng tất cả:</span>
            <button
              type="button"
              onClick={() => onBatchApplySalaryType('gross')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded font-semibold whitespace-nowrap"
            >
              Sang Gross
            </button>
            <button
              type="button"
              onClick={() => onBatchApplySalaryType('net')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded font-semibold whitespace-nowrap"
            >
              Sang Net
            </button>
          </div>

          {onBatchApplyInsuranceMode && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onBatchApplyInsuranceMode('regional_min')}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold whitespace-nowrap"
              >
                Đóng BH theo LTT Vùng (tất cả)
              </button>
              <button
                type="button"
                onClick={() => onBatchApplyInsuranceMode('contract_salary')}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded font-semibold whitespace-nowrap"
              >
                Đóng BH theo Lương HĐ
              </button>
            </div>
          )}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
          Chưa có nhân viên nào trong danh sách. Vui lòng thêm nhân viên hoặc import Excel trước.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Employee Selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Chọn nhân viên thiết lập ({employees.length})
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedEmp?.id === emp.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate">{emp.fullName}</div>
                    <div className={`text-[11px] ${selectedEmp?.id === emp.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {emp.code} - {emp.department}
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    selectedEmp?.id === emp.id ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {emp.salaryType}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Salary & Allowance settings for selected employee */}
          {selectedEmp && (
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Hồ sơ: {selectedEmp.fullName} ({selectedEmp.code})
                    </h2>
                    <span className="text-xs text-slate-500">
                      {selectedEmp.position} - {selectedEmp.department}
                    </span>
                  </div>

                  {/* Mode switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">Hình thức tính:</span>
                    <select
                      value={selectedEmp.salaryType}
                      onChange={(e) =>
                        onUpdateEmployee({ ...selectedEmp, salaryType: e.target.value as SalaryType })
                      }
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-800"
                    >
                      <option value="gross">Lương Gross (Khấu trừ thuế/BHXH)</option>
                      <option value="net">Lương Net (Quy đổi ngược Gross)</option>
                    </select>
                  </div>
                </div>

                {/* Salary breakdown cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Mức lương thỏa thuận (HĐLĐ)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedEmp.baseSalary > 0 ? formatVNDNumber(selectedEmp.baseSalary) : ''}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Math.max(0, parseVND(formatLiveVNDInput(e.target.value)));
                        onUpdateEmployee({
                          ...selectedEmp,
                          baseSalary: val,
                          insuranceSalary: selectedEmp.useCustomInsuranceSalary ? selectedEmp.insuranceSalary : val
                        });
                      }}
                      className="w-full text-sm font-bold p-1.5 border border-slate-300 rounded bg-white tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block tabular-nums">
                      {formatVND(selectedEmp.baseSalary)}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Lương đóng BHXH (Vùng {selectedEmp.region || 'I'})</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEmployee({
                              ...selectedEmp,
                              useCustomInsuranceSalary: false,
                              insuranceSalary: selectedEmp.baseSalary
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap ${
                            !selectedEmp.useCustomInsuranceSalary
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Theo lương HĐ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const minWage = legalConfig.regionalMinWage[selectedEmp.region || 'I'];
                            onUpdateEmployee({
                              ...selectedEmp,
                              useCustomInsuranceSalary: true,
                              insuranceSalary: minWage
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap tabular-nums ${
                            selectedEmp.useCustomInsuranceSalary &&
                            selectedEmp.insuranceSalary === legalConfig.regionalMinWage[selectedEmp.region || 'I']
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          LTT Vùng ({formatVNDNumber(legalConfig.regionalMinWage[selectedEmp.region || 'I'])}đ)
                        </button>
                      </div>
                    </div>

                    {selectedEmp.useCustomInsuranceSalary ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={selectedEmp.insuranceSalary > 0 ? formatVNDNumber(selectedEmp.insuranceSalary) : ''}
                        placeholder="0"
                        onChange={(e) =>
                          onUpdateEmployee({
                            ...selectedEmp,
                            insuranceSalary: Math.max(0, parseVND(formatLiveVNDInput(e.target.value)))
                          })
                        }
                        className="w-full text-sm font-bold p-1.5 border border-slate-300 rounded bg-white tabular-nums"
                      />
                    ) : (
                      <div className="text-sm font-medium text-slate-700 py-1">
                        Mặc định bằng lương thỏa thuận ({formatVND(selectedEmp.baseSalary)})
                      </div>
                    )}

                    {(() => {
                      const insBase =
                        selectedEmp.useCustomInsuranceSalary && selectedEmp.insuranceSalary > 0
                          ? selectedEmp.insuranceSalary
                          : selectedEmp.baseSalary;
                      const bhxh = selectedEmp.hasSocialInsurance
                        ? Math.round(insBase * legalConfig.employeeRates.socialInsurance)
                        : 0;
                      const bhyt = selectedEmp.hasHealthInsurance
                        ? Math.round(insBase * legalConfig.employeeRates.healthInsurance)
                        : 0;
                      const bhtn = selectedEmp.hasUnemploymentInsurance
                        ? Math.round(insBase * legalConfig.employeeRates.unemploymentInsurance)
                        : 0;
                      return (
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          BHXH (8%): <strong className="text-rose-700">{formatVND(bhxh)}</strong> · Tổng 10,5%: <strong className="text-slate-800">{formatVND(bhxh + bhyt + bhtn)}</strong>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Allowances Table */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Các khoản phụ cấp hiện tại
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Khoản phụ cấp</th>
                          <th className="p-2 text-right">Số tiền</th>
                          <th className="p-2 text-center">Thuế TNCN</th>
                          <th className="p-2 text-center">Căn cứ BHXH</th>
                          <th className="p-2 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Lunch */}
                        <tr>
                          <td className="p-2 font-medium">Ăn trưa</td>
                          <td className="p-2 text-right font-semibold">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={selectedEmp.lunchAllowance > 0 ? formatVNDNumber(selectedEmp.lunchAllowance) : ''}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdateEmployee({ ...selectedEmp, lunchAllowance: parseVND(formatLiveVNDInput(e.target.value)) })
                              }
                              className="w-28 text-right p-1 border border-slate-300 rounded tabular-nums"
                            />
                          </td>
                          <td className="p-2 text-center text-emerald-600 font-medium">Miễn thuế đến 730k</td>
                          <td className="p-2 text-center text-slate-400">Không tính</td>
                          <td className="p-2 text-center text-slate-400">-</td>
                        </tr>

                        {/* Phone */}
                        <tr>
                          <td className="p-2 font-medium">Điện thoại</td>
                          <td className="p-2 text-right font-semibold">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={selectedEmp.phoneAllowance > 0 ? formatVNDNumber(selectedEmp.phoneAllowance) : ''}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdateEmployee({ ...selectedEmp, phoneAllowance: parseVND(formatLiveVNDInput(e.target.value)) })
                              }
                              className="w-28 text-right p-1 border border-slate-300 rounded tabular-nums"
                            />
                          </td>
                          <td className="p-2 text-center text-emerald-600 font-medium">Miễn theo quy chế</td>
                          <td className="p-2 text-center text-slate-400">Không tính</td>
                          <td className="p-2 text-center text-slate-400">-</td>
                        </tr>

                        {/* Transport */}
                        <tr>
                          <td className="p-2 font-medium">Đi lại / Xăng xe</td>
                          <td className="p-2 text-right font-semibold">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={selectedEmp.transportAllowance > 0 ? formatVNDNumber(selectedEmp.transportAllowance) : ''}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdateEmployee({ ...selectedEmp, transportAllowance: parseVND(formatLiveVNDInput(e.target.value)) })
                              }
                              className="w-28 text-right p-1 border border-slate-300 rounded tabular-nums"
                            />
                          </td>
                          <td className="p-2 text-center text-emerald-600 font-medium">Miễn theo quy chế</td>
                          <td className="p-2 text-center text-slate-400">Không tính</td>
                          <td className="p-2 text-center text-slate-400">-</td>
                        </tr>

                        {/* Position */}
                        <tr>
                          <td className="p-2 font-medium">Phụ cấp chức vụ</td>
                          <td className="p-2 text-right font-semibold">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={selectedEmp.positionAllowance > 0 ? formatVNDNumber(selectedEmp.positionAllowance) : ''}
                              placeholder="0"
                              onChange={(e) =>
                                onUpdateEmployee({ ...selectedEmp, positionAllowance: parseVND(formatLiveVNDInput(e.target.value)) })
                              }
                              className="w-28 text-right p-1 border border-slate-300 rounded tabular-nums"
                            />
                          </td>
                          <td className="p-2 text-center text-rose-600 font-medium">Chịu thuế</td>
                          <td className="p-2 text-center text-blue-600 font-medium">Tính đóng BHXH</td>
                          <td className="p-2 text-center text-slate-400">-</td>
                        </tr>

                        {/* Custom allowances */}
                        {selectedEmp.otherAllowances?.map((allw) => (
                          <tr key={allw.id}>
                            <td className="p-2 font-medium text-slate-900">{allw.name}</td>
                            <td className="p-2 text-right font-semibold">{formatVND(allw.amount)}</td>
                            <td className="p-2 text-center">
                              {allw.isTaxable ? (
                                <span className="text-rose-600 font-medium">Chịu thuế</span>
                              ) : (
                                <span className="text-emerald-600 font-medium">Miễn thuế</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {allw.isSubjectToInsurance ? (
                                <span className="text-blue-600 font-medium">Tính BHXH</span>
                              ) : (
                                <span className="text-slate-400">Không tính</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveCustomAllowance(allw.id)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form to add custom allowance */}
                <form onSubmit={handleAddCustomAllowance} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800">Thêm khoản phụ cấp tùy chỉnh:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Tên phụ cấp (VD: Chuyên cần)"
                      value={allwName}
                      onChange={(e) => setAllwName(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Số tiền (VD: 500.000)"
                      value={allwAmount}
                      onChange={(e) => setAllwAmount(formatLiveVNDInput(e.target.value))}
                      className="px-2.5 py-1.5 border border-slate-300 rounded bg-white tabular-nums"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={allwIsTaxable}
                        onChange={(e) => setAllwIsTaxable(e.target.checked)}
                        className="rounded"
                      />
                      <span>Chịu thuế TNCN</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={allwIsInsurance}
                        onChange={(e) => setAllwIsInsurance(e.target.checked)}
                        className="rounded"
                      />
                      <span>Tính vào BHXH</span>
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm phụ cấp
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
