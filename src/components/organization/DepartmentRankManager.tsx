import React, { useState } from 'react';
import { Employee } from '../../types/employee';
import { Building2, Award, Plus, Users, DollarSign, Check, Trash2 } from 'lucide-react';
import { formatVND } from '../../utils/currency';

interface DepartmentRankManagerProps {
  employees: Employee[];
  departments: string[];
  ranks: string[];
  onAddDepartment: (name: string) => void;
  onAddRank: (name: string) => void;
  onBatchUpdateDepartment: (ids: string[], dept: string) => void;
  onBatchUpdateRank: (ids: string[], rank: string) => void;
}

export const DepartmentRankManager: React.FC<DepartmentRankManagerProps> = ({
  employees,
  departments,
  ranks,
  onAddDepartment,
  onAddRank,
  onBatchUpdateDepartment,
  onBatchUpdateRank
}) => {
  const [newDeptName, setNewDeptName] = useState('');
  const [newRankName, setNewRankName] = useState('');
  const [activeTab, setActiveTab] = useState<'departments' | 'ranks'>('departments');

  // Thống kê phòng ban
  const deptData = React.useMemo(() => {
    return departments.map((d) => {
      const members = employees.filter((e) => e.department === d);
      const totalGross = members.reduce((sum, e) => sum + e.baseSalary, 0);
      return {
        name: d,
        count: members.length,
        totalGross,
        members
      };
    });
  }, [departments, employees]);

  // Thống kê cấp bậc
  const rankData = React.useMemo(() => {
    return ranks.map((r) => {
      const members = employees.filter((e) => e.rank === r);
      const totalGross = members.reduce((sum, e) => sum + e.baseSalary, 0);
      return {
        name: r,
        count: members.length,
        totalGross,
        members
      };
    });
  }, [ranks, employees]);

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    onAddDepartment(newDeptName.trim());
    setNewDeptName('');
  };

  const handleCreateRank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRankName.trim()) return;
    onAddRank(newRankName.trim());
    setNewRankName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Cơ cấu nhân sự & Phân cấp lương</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tổ chức các phòng ban, chức danh và cấp bậc lương theo mô hình doanh nghiệp.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-200 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'departments' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phòng ban ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('ranks')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ranks' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cấp bậc / Nhóm lương ({ranks.length})
          </button>
        </div>
      </div>

      {activeTab === 'departments' ? (
        <div className="space-y-6">
          {/* Add dept input */}
          <form onSubmit={handleCreateDept} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <input
              type="text"
              placeholder="Tên phòng ban mới (ví dụ: Marketing, R&D, Kho vận...)"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Thêm phòng ban
            </button>
          </form>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptData.map((d) => (
              <div key={d.name} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{d.name}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {d.count} nhân sự
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quỹ lương cơ bản: <strong>{formatVND(d.totalGross)}</strong></span>
                  </div>

                  {/* Member snippet */}
                  <div className="border-t border-slate-100 pt-2 text-xs text-slate-600 space-y-1">
                    {d.members.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 truncate">{m.fullName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{m.code}</span>
                      </div>
                    ))}
                    {d.members.length > 3 && (
                      <div className="text-[11px] text-slate-400 italic">
                        + {d.members.length - 3} nhân viên khác...
                      </div>
                    )}
                    {d.members.length === 0 && (
                      <div className="text-slate-400 italic text-[11px]">Chưa có nhân viên nào</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add rank input */}
          <form onSubmit={handleCreateRank} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <input
              type="text"
              placeholder="Tên cấp bậc mới (ví dụ: Cấp 1 - Giám đốc, Cấp 2 - Trưởng phòng, Cấp 3 - Chuyên viên...)"
              value={newRankName}
              onChange={(e) => setNewRankName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Thêm cấp bậc
            </button>
          </form>

          {/* Rank Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankData.map((r) => (
              <div key={r.name} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{r.name}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                      {r.count} nhân sự
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Lương TB: <strong>{formatVND(r.count > 0 ? r.totalGross / r.count : 0)}</strong>
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2 text-xs text-slate-600 space-y-1">
                    {r.members.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 truncate">{m.fullName}</span>
                        <span className="text-slate-500">{formatVND(m.baseSalary)}</span>
                      </div>
                    ))}
                    {r.members.length > 3 && (
                      <div className="text-[11px] text-slate-400 italic">
                        + {r.members.length - 3} nhân viên khác...
                      </div>
                    )}
                    {r.members.length === 0 && (
                      <div className="text-slate-400 italic text-[11px]">Chưa có nhân viên nào</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
