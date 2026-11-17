import React, { useState } from 'react';
import { Employee } from '../../types/employee';
import { MonthlyAttendance } from '../../types/attendance';
import { Clock, CheckCircle2, AlertTriangle, Sparkles, Filter, Search } from 'lucide-react';

interface AttendanceManagerProps {
  employees: Employee[];
  attendanceMap: Record<string, MonthlyAttendance>;
  onUpdateAttendance: (attendance: MonthlyAttendance) => void;
  onBatchSetFullWorkDays: (standardDays: number) => void;
  selectedMonth: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  employees,
  attendanceMap,
  onUpdateAttendance,
  onBatchSetFullWorkDays,
  selectedMonth
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [globalStandardDays, setGlobalStandardDays] = useState(22);

  const filteredEmployees = employees.filter((e) =>
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = (empId: string, partial: Partial<MonthlyAttendance>) => {
    const current = attendanceMap[empId] || {
      employeeId: empId,
      month: selectedMonth,
      standardWorkDays: globalStandardDays,
      standardWorkHoursPerDay: 8,
      actualWorkDays: globalStandardDays,
      paidAnnualLeaveDays: 0,
      paidHolidayDays: 0,
      paidSpecialLeaveDays: 0,
      unpaidLeaveDays: 0,
      sickLeaveDays: 0,
      maternityLeaveDays: 0,
      compensatoryLeaveDays: 0,
      normalDayOvertimeHours: 0,
      weekendOvertimeHours: 0,
      holidayOvertimeHours: 0,
      nightWorkHours: 0,
      nightOvertimeHours: 0
    };

    onUpdateAttendance({ ...current, ...partial });
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>Chấm công, Ngày nghỉ & Tăng ca ({selectedMonth})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Theo dõi ngày công thực tế, phân loại nghỉ phép hưởng lương / BHXH chi trả, và số giờ làm thêm theo Điều 98 BLLĐ.
          </p>
        </div>

        {/* Global batch actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs">
            <span className="text-slate-600 font-medium">Công chuẩn:</span>
            <input
              type="number"
              min="1"
              max="31"
              value={globalStandardDays}
              onChange={(e) => setGlobalStandardDays(parseInt(e.target.value, 10) || 22)}
              className="w-12 text-center p-1 font-bold border border-slate-300 rounded bg-white text-slate-900"
            />
            <span className="text-slate-500">ngày</span>
          </div>

          <button
            onClick={() => onBatchSetFullWorkDays(globalStandardDays)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Đặt tất cả đủ {globalStandardDays} công
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã NV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          💡 <em>Nghỉ ốm & thai sản do quỹ BHXH chi trả, không trừ hoặc cộng trùng vào lương DN.</em>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10 w-44">Nhân viên</th>
                <th className="py-2.5 px-2 text-center w-16 bg-blue-50/50 text-blue-900">Công chuẩn</th>
                <th className="py-2.5 px-2 text-center w-16 bg-emerald-50/50 text-emerald-900">Công đi làm</th>
                <th className="py-2.5 px-2 text-center w-16">Phép năm</th>
                <th className="py-2.5 px-2 text-center w-16">Nghỉ lễ</th>
                <th className="py-2.5 px-2 text-center w-16">Việc riêng</th>
                <th className="py-2.5 px-2 text-center w-16 text-rose-700">Nghỉ K.Lương</th>
                <th className="py-2.5 px-2 text-center w-16 text-purple-700">Ốm/TS (BHXH)</th>
                <th className="py-2.5 px-2 text-center w-18 bg-amber-50 text-amber-900">TC Thường (150%)</th>
                <th className="py-2.5 px-2 text-center w-18 bg-amber-50 text-amber-900">TC Cuối tuần (200%)</th>
                <th className="py-2.5 px-2 text-center w-18 bg-amber-50 text-amber-900">TC Lễ (300%)</th>
                <th className="py-2.5 px-2 text-center w-16 bg-amber-50 text-amber-900">Đêm (+30%)</th>
                <th className="py-2.5 px-2 text-center w-16">Tổng giờ OT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const att = attendanceMap[emp.id] || {
                  employeeId: emp.id,
                  month: selectedMonth,
                  standardWorkDays: 22,
                  standardWorkHoursPerDay: 8,
                  actualWorkDays: 22,
                  paidAnnualLeaveDays: 0,
                  paidHolidayDays: 0,
                  paidSpecialLeaveDays: 0,
                  unpaidLeaveDays: 0,
                  sickLeaveDays: 0,
                  maternityLeaveDays: 0,
                  compensatoryLeaveDays: 0,
                  normalDayOvertimeHours: 0,
                  weekendOvertimeHours: 0,
                  holidayOvertimeHours: 0,
                  nightWorkHours: 0,
                  nightOvertimeHours: 0
                };

                const totalOtHours =
                  (att.normalDayOvertimeHours || 0) +
                  (att.weekendOvertimeHours || 0) +
                  (att.holidayOvertimeHours || 0) +
                  (att.nightOvertimeHours || 0);

                const isOtExceeded = totalOtHours > 40;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    {/* Sticky Name Col */}
                    <td className="py-2 px-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="font-bold text-slate-800 truncate">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {emp.code} - {emp.department}
                      </div>
                    </td>

                    {/* Standard days */}
                    <td className="py-2 px-2 text-center bg-blue-50/20">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={att.standardWorkDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { standardWorkDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-12 text-center p-1 border border-slate-300 rounded font-semibold"
                      />
                    </td>

                    {/* Actual work days */}
                    <td className="py-2 px-2 text-center bg-emerald-50/20">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        step="0.5"
                        value={att.actualWorkDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { actualWorkDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-12 text-center p-1 border border-emerald-400 rounded font-bold text-emerald-800 bg-emerald-50/50"
                      />
                    </td>

                    {/* Paid Annual leave */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={att.paidAnnualLeaveDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { paidAnnualLeaveDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-slate-200 rounded"
                      />
                    </td>

                    {/* Paid Holiday */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="1"
                        value={att.paidHolidayDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { paidHolidayDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-slate-200 rounded"
                      />
                    </td>

                    {/* Special leave */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={att.paidSpecialLeaveDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { paidSpecialLeaveDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-slate-200 rounded"
                      />
                    </td>

                    {/* Unpaid leave */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        step="0.5"
                        value={att.unpaidLeaveDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { unpaidLeaveDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-rose-300 rounded text-rose-700 bg-rose-50/40 font-semibold"
                      />
                    </td>

                    {/* Sick / Maternity */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={att.sickLeaveDays + att.maternityLeaveDays}
                        onChange={(e) =>
                          handleUpdate(emp.id, { sickLeaveDays: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-purple-300 rounded text-purple-700 bg-purple-50/40"
                      />
                    </td>

                    {/* Normal OT (150%) */}
                    <td className="py-2 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={att.normalDayOvertimeHours}
                        onChange={(e) =>
                          handleUpdate(emp.id, { normalDayOvertimeHours: parseFloat(e.target.value) || 0 })
                        }
                        className="w-12 text-center p-1 border border-amber-300 rounded font-medium"
                      />
                    </td>

                    {/* Weekend OT (200%) */}
                    <td className="py-2 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={att.weekendOvertimeHours}
                        onChange={(e) =>
                          handleUpdate(emp.id, { weekendOvertimeHours: parseFloat(e.target.value) || 0 })
                        }
                        className="w-12 text-center p-1 border border-amber-300 rounded font-medium"
                      />
                    </td>

                    {/* Holiday OT (300%) */}
                    <td className="py-2 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={att.holidayOvertimeHours}
                        onChange={(e) =>
                          handleUpdate(emp.id, { holidayOvertimeHours: parseFloat(e.target.value) || 0 })
                        }
                        className="w-12 text-center p-1 border border-amber-300 rounded font-medium"
                      />
                    </td>

                    {/* Night hours */}
                    <td className="py-2 px-2 text-center bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={att.nightWorkHours}
                        onChange={(e) =>
                          handleUpdate(emp.id, { nightWorkHours: parseFloat(e.target.value) || 0 })
                        }
                        className="w-11 text-center p-1 border border-amber-300 rounded"
                      />
                    </td>

                    {/* Total OT Hours + Warning */}
                    <td className="py-2 px-2 text-center font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${isOtExceeded ? 'text-rose-600 font-extrabold' : 'text-slate-700'}`}
                        title={isOtExceeded ? 'Vượt trần 40h/tháng theo Điều 107 BLLĐ' : undefined}
                      >
                        {totalOtHours}h
                        {isOtExceeded && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
