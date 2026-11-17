import React, { useState, useMemo } from 'react';
import {
  Employee,
  WorkingStatus,
  WORKING_STATUS_OPTIONS,
  getWorkingStatusMeta
} from '../../types/employee';
import {
  Search, Plus, Trash2, Edit2, Copy, Users,
  CheckSquare, Square, Building2, Award, Clipboard,
  ChevronDown, FileSpreadsheet, Columns3, UserX, UserCheck
} from 'lucide-react';
import { formatVND, formatVNDNumber, formatLiveVNDInput, parseVND } from '../../utils/currency';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onOpenBatchModal: () => void;
  onOpenImport: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDuplicateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteBatch: (ids: string[]) => void;
  onBatchUpdateDepartment: (ids: string[], department: string) => void;
  onBatchUpdateRank: (ids: string[], rank: string) => void;
  onBatchUpdateWorkingStatus: (ids: string[], status: WorkingStatus) => void;
  onUpdateEmployee: (employee: Employee) => void;
  departments: string[];
  ranks: string[];
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onAddEmployee,
  onOpenBatchModal,
  onOpenImport,
  onEditEmployee,
  onDuplicateEmployee,
  onDeleteEmployee,
  onDeleteBatch,
  onBatchUpdateDepartment,
  onBatchUpdateRank,
  onBatchUpdateWorkingStatus,
  onUpdateEmployee,
  departments,
  ranks
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showExtraCols, setShowExtraCols] = useState(false);

  // Inline quick salary edit
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editingSalaryVal, setEditingSalaryVal] = useState('');

  // Selected checkbox IDs for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch action state
  const [showBatchDept, setShowBatchDept] = useState(false);
  const [targetDept, setTargetDept] = useState(departments[0] || 'Kinh doanh');
  const [showBatchRank, setShowBatchRank] = useState(false);
  const [targetRank, setTargetRank] = useState(ranks[0] || 'Cấp 3 - Chuyên viên');
  const [showBatchStatus, setShowBatchStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<WorkingStatus>('resignation_submitted');

  // Status counts for quick overview
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: employees.length };
    for (const opt of WORKING_STATUS_OPTIONS) counts[opt.value] = 0;
    for (const emp of employees) {
      const s = emp.workingStatus || 'active';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q);
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchContract = selectedContract === 'all' || emp.contractType === selectedContract;
      const matchStatus = selectedStatus === 'all' || (emp.workingStatus || 'active') === selectedStatus;

      return matchSearch && matchDept && matchContract && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedContract, selectedStatus]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleApplyBatchDept = () => {
    if (selectedIds.size === 0 || !targetDept) return;
    onBatchUpdateDepartment(Array.from(selectedIds), targetDept);
    setShowBatchDept(false);
  };

  const handleApplyBatchRank = () => {
    if (selectedIds.size === 0 || !targetRank) return;
    onBatchUpdateRank(Array.from(selectedIds), targetRank);
    setShowBatchRank(false);
  };

  const handleApplyBatchStatus = () => {
    if (selectedIds.size === 0) return;
    onBatchUpdateWorkingStatus(Array.from(selectedIds), targetStatus);
    setShowBatchStatus(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `Xác nhận nghỉ việc (xóa) ${selectedIds.size} nhân viên đã chọn khỏi danh sách?`
      )
    ) {
      onDeleteBatch(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleStatusChange = (emp: Employee, nextVal: string) => {
    if (nextVal === '__delete__') {
      if (window.confirm(`Xác nhận nghỉ việc (xóa) nhân viên ${emp.fullName} (${emp.code}) khỏi danh sách?`)) {
        onDeleteEmployee(emp.id);
      }
      return;
    }

    const nextStatus = nextVal as WorkingStatus;
    onUpdateEmployee({
      ...emp,
      workingStatus: nextStatus,
      statusUpdatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const startInlineSalaryEdit = (emp: Employee) => {
    setEditingSalaryId(emp.id);
    setEditingSalaryVal(emp.baseSalary > 0 ? formatVNDNumber(emp.baseSalary) : '');
  };

  const commitInlineSalary = (emp: Employee) => {
    const num = Math.max(0, parseVND(editingSalaryVal));
    onUpdateEmployee({
      ...emp,
      baseSalary: num,
      insuranceSalary: emp.useCustomInsuranceSalary ? emp.insuranceSalary : num,
      lunchAllowance: emp.lunchAllowance === 0 && num > 0 ? 730000 : emp.lunchAllowance
    });
    setEditingSalaryId(null);
  };

  const contractLabel = (ct: Employee['contractType']) => {
    if (ct === 'probation') return 'Thử việc';
    if (ct === 'part_time') return 'Bán thời gian';
    return 'Chính thức';
  };

  return (
    <div className="space-y-4">
      {/* Header & Main buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            <span>Nhân viên ({employees.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ, cập nhật mức lương và theo dõi trạng thái làm việc / nghỉ việc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImport}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={onOpenBatchModal}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Clipboard className="w-4 h-4 text-slate-500" />
            <span>Dán nhanh</span>
          </button>
          <button
            onClick={onAddEmployee}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, mã NV, chức danh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tất cả hợp đồng</option>
              <option value="official_fixed">HĐ xác định thời hạn</option>
              <option value="official_indefinite">HĐ không thời hạn</option>
              <option value="probation">Thử việc</option>
              <option value="part_time">Bán thời gian</option>
            </select>

            <button
              type="button"
              onClick={() => setShowExtraCols((v) => !v)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap ${
                showExtraCols
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Bật/tắt các cột phụ (Cấp bậc, Vùng, NPT, BHXH)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>{showExtraCols ? 'Thu gọn cột' : 'Hiện thêm cột'}</span>
            </button>
          </div>
        </div>

        {/* Status Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({statusCounts.all})
          </button>
          {WORKING_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === opt.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label} ({statusCounts[opt.value] || 0})
            </button>
          ))}
        </div>

        {/* Batch Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-blue-900">
            <div className="font-semibold">
              Đã chọn {selectedIds.size} nhân viên
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Status */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBatchStatus(!showBatchStatus);
                    setShowBatchDept(false);
                    setShowBatchRank(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Đổi trạng thái</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showBatchStatus && (
                  <div className="absolute right-0 mt-1 w-64 bg-white shadow-lg border border-slate-200 rounded-lg p-3 z-20 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Cập nhật trạng thái hàng loạt:</div>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as WorkingStatus)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                    >
                      {WORKING_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowBatchStatus(false)}
                        className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={handleApplyBatchStatus}
                        className="px-3 py-1 text-xs bg-blue-700 text-white rounded font-medium hover:bg-blue-800"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Dept */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBatchDept(!showBatchDept);
                    setShowBatchStatus(false);
                    setShowBatchRank(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Gán phòng ban</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showBatchDept && (
                  <div className="absolute right-0 mt-1 w-64 bg-white shadow-lg border border-slate-200 rounded-lg p-3 z-20 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Chọn phòng ban:</div>
                    <select
                      value={targetDept}
                      onChange={(e) => setTargetDept(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowBatchDept(false)}
                        className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={handleApplyBatchDept}
                        className="px-3 py-1 text-xs bg-blue-700 text-white rounded font-medium hover:bg-blue-800"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Rank */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBatchRank(!showBatchRank);
                    setShowBatchStatus(false);
                    setShowBatchDept(false);
                  }}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Gán cấp bậc</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showBatchRank && (
                  <div className="absolute right-0 mt-1 w-64 bg-white shadow-lg border border-slate-200 rounded-lg p-3 z-20 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Chọn cấp bậc:</div>
                    <select
                      value={targetRank}
                      onChange={(e) => setTargetRank(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white"
                    >
                      {ranks.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowBatchRank(false)}
                        className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={handleApplyBatchRank}
                        className="px-3 py-1 text-xs bg-blue-700 text-white rounded font-medium hover:bg-blue-800"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Delete / Resign */}
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Nghỉ việc / Xóa ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-10 px-4 text-center text-slate-500">
          {employees.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Chưa có nhân viên nào.</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={onOpenImport}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                >
                  Import danh sách từ Excel
                </button>
                <button
                  onClick={onAddEmployee}
                  className="px-3.5 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Thêm nhân viên thủ công
                </button>
              </div>
            </div>
          ) : (
            'Không tìm thấy nhân viên nào phù hợp với bộ lọc.'
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card List (md:hidden) */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs text-slate-600">
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5 font-medium">
                {selectedIds.size > 0 && selectedIds.size === filteredEmployees.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Chọn tất cả ({filteredEmployees.length})</span>
              </button>
            </div>

            {filteredEmployees.map((emp) => {
              const isSelected = selectedIds.has(emp.id);
              const statusMeta = getWorkingStatusMeta(emp.workingStatus);

              return (
                <div
                  key={emp.id}
                  className={`bg-white rounded-xl border p-3.5 space-y-2.5 ${
                    isSelected ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleSelectOne(emp.id)}
                        className="mt-0.5 text-slate-400 hover:text-slate-700 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{emp.fullName}</div>
                        <div className="text-xs text-slate-500 truncate">
                          <span className="font-mono font-semibold text-slate-700">{emp.code}</span>
                          {' · '}
                          <span>{emp.department}</span>
                          {' · '}
                          <span>{contractLabel(emp.contractType)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        title="Sửa hồ sơ"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Xác nhận nghỉ việc (xóa) nhân viên ${emp.fullName} (${emp.code})?`)) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Nghỉ việc (Xóa)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Trạng thái & Lương */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <select
                      value={emp.workingStatus || 'active'}
                      onChange={(e) => handleStatusChange(emp, e.target.value)}
                      className={`px-2 py-1 text-xs font-semibold border rounded-lg ${statusMeta.bgClass} ${statusMeta.textClass}`}
                    >
                      {WORKING_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                          {opt.label}
                        </option>
                      ))}
                      <option value="__delete__" className="bg-white text-rose-700 font-bold">
                        Nghỉ việc (Xóa khỏi DS)
                      </option>
                    </select>

                    {editingSalaryId === emp.id ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        value={editingSalaryVal}
                        onChange={(e) => setEditingSalaryVal(formatLiveVNDInput(e.target.value))}
                        onBlur={() => commitInlineSalary(emp)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitInlineSalary(emp);
                          if (e.key === 'Escape') setEditingSalaryId(null);
                        }}
                        placeholder="8.000.000"
                        className="w-36 px-2.5 py-1.5 text-right text-sm font-bold border border-blue-500 rounded-lg bg-white tabular-nums focus:outline-hidden"
                      />
                    ) : emp.baseSalary === 0 ? (
                      <button
                        onClick={() => startInlineSalaryEdit(emp)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100"
                      >
                        + Nhập lương
                      </button>
                    ) : (
                      <button
                        onClick={() => startInlineSalaryEdit(emp)}
                        className="text-sm font-bold text-slate-900 hover:text-blue-700 tabular-nums"
                      >
                        {formatVND(emp.baseSalary)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Compact Table (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800">
                        {selectedIds.size > 0 && selectedIds.size === filteredEmployees.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">Mã NV</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Phòng ban / Chức danh</th>
                    <th className="py-3 px-3">Trạng thái làm việc</th>
                    <th className="py-3 px-3">Hợp đồng</th>
                    <th className="py-3 px-3 text-right">Lương thỏa thuận</th>
                    {showExtraCols && (
                      <>
                        <th className="py-3 px-3">Cấp bậc</th>
                        <th className="py-3 px-3 text-center">Vùng</th>
                        <th className="py-3 px-3 text-center">NPT</th>
                        <th className="py-3 px-3 text-center">BHXH</th>
                      </>
                    )}
                    <th className="py-3 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.has(emp.id);
                    const statusMeta = getWorkingStatusMeta(emp.workingStatus);

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleSelectOne(emp.id)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                          {emp.code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {emp.fullName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{emp.department}</div>
                          <div className="text-xs text-slate-500">{emp.position}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={emp.workingStatus || 'active'}
                            onChange={(e) => handleStatusChange(emp, e.target.value)}
                            className={`px-2.5 py-1 text-xs font-semibold border rounded-lg cursor-pointer focus:outline-hidden ${statusMeta.bgClass} ${statusMeta.textClass}`}
                          >
                            {WORKING_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                                {opt.label}
                              </option>
                            ))}
                            <option value="__delete__" className="bg-white text-rose-700 font-bold">
                              Nghỉ việc (Xóa khỏi danh sách)
                            </option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                          <span className={emp.contractType === 'probation' ? 'text-amber-700 font-medium' : 'text-slate-700'}>
                            {contractLabel(emp.contractType)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {editingSalaryId === emp.id ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              autoFocus
                              value={editingSalaryVal}
                              onChange={(e) => setEditingSalaryVal(formatLiveVNDInput(e.target.value))}
                              onBlur={() => commitInlineSalary(emp)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitInlineSalary(emp);
                                if (e.key === 'Escape') setEditingSalaryId(null);
                              }}
                              placeholder="8.000.000"
                              className="w-32 px-2 py-1 text-right text-sm font-bold border border-blue-500 rounded bg-white tabular-nums focus:outline-hidden"
                            />
                          ) : emp.baseSalary === 0 ? (
                            <button
                              onClick={() => startInlineSalaryEdit(emp)}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors"
                              title="Bấm để nhập nhanh mức lương"
                            >
                              + Nhập lương
                            </button>
                          ) : (
                            <button
                              onClick={() => startInlineSalaryEdit(emp)}
                              className="group text-right"
                              title="Bấm để sửa nhanh mức lương"
                            >
                              <span className="font-bold text-slate-900 group-hover:text-blue-700 group-hover:underline tabular-nums">
                                {formatVND(emp.baseSalary)}
                              </span>
                              <span className="ml-1.5 text-[11px] font-medium text-slate-400 uppercase">
                                {emp.salaryType}
                              </span>
                            </button>
                          )}
                        </td>
                        {showExtraCols && (
                          <>
                            <td className="py-3 px-3 text-xs text-slate-600">{emp.rank}</td>
                            <td className="py-3 px-3 text-center font-medium text-slate-700 whitespace-nowrap">
                              Vùng {emp.region}
                            </td>
                            <td className="py-3 px-3 text-center text-slate-700 tabular-nums">
                              {emp.dependentsCount}
                            </td>
                            <td className="py-3 px-3 text-center text-xs font-medium">
                              {emp.hasSocialInsurance ? (
                                <span className="text-emerald-700">Có</span>
                              ) : (
                                <span className="text-slate-400">Không</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditEmployee(emp)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title="Sửa hồ sơ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDuplicateEmployee(emp)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                              title="Nhân bản hồ sơ"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xác nhận nghỉ việc (xóa) nhân viên ${emp.fullName} (${emp.code})?`)) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Nghỉ việc (Xóa)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
