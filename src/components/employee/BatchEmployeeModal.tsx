import React, { useState } from 'react';
import { Employee } from '../../types/employee';
import { X, Check, Clipboard, AlertCircle } from 'lucide-react';
import { parseVND } from '../../utils/currency';

interface BatchEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployees: (newEmployees: Employee[]) => void;
  existingCodes: Set<string>;
}

export const BatchEmployeeModal: React.FC<BatchEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployees,
  existingCodes
}) => {
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  const handleProcess = () => {
    setParseError('');
    if (!pasteText.trim()) {
      setParseError('Vui lòng dán dữ liệu vào ô bên dưới');
      return;
    }

    const lines = pasteText.trim().split('\n');
    const created: Employee[] = [];
    const seenInBatch = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Hỗ trợ phân cách bằng Tab (khi copy từ Excel) hoặc dấu phẩy hoặc chấm phẩy
      const parts = line.includes('\t')
        ? line.split('\t')
        : line.includes(';')
        ? line.split(';')
        : line.includes(',')
        ? line.split(',')
        : [line];

      // Nhận diện nếu chỉ có 1 cột (Họ tên) hoặc 2 cột (STT + Họ tên) hoặc đầy đủ cột
      const firstCol = parts[0]?.trim() || '';
      const isFirstColStt = /^\d+$/.test(firstCol);

      let code = '';
      let fullName = '';
      let department = 'Chưa phân bổ';
      let position = 'Nhân viên';
      let baseSalary = 0;
      let dependentsCount = 0;

      if (parts.length === 1) {
        // Chỉ dán cột Họ và tên
        fullName = firstCol;
      } else if (parts.length === 2 && isFirstColStt) {
        // Dán 2 cột: STT + Họ và tên
        fullName = parts[1]?.trim() || '';
        code = `NV${String(parseInt(firstCol, 10)).padStart(3, '0')}`;
      } else if (isFirstColStt && parts.length > 2) {
        // STT + Họ tên + các cột khác
        code = `NV${String(parseInt(firstCol, 10)).padStart(3, '0')}`;
        fullName = parts[1]?.trim() || '';
        department = parts[2]?.trim() || 'Chưa phân bổ';
        position = parts[3]?.trim() || 'Nhân viên';
        baseSalary = parts[4] ? parseVND(parts[4]) : 0;
        dependentsCount = parseInt(parts[5]?.trim() || '0', 10) || 0;
      } else {
        // Dán dạng Mã_NV + Họ_tên + ...
        code = firstCol;
        fullName = parts[1]?.trim() || '';
        department = parts[2]?.trim() || 'Chưa phân bổ';
        position = parts[3]?.trim() || 'Nhân viên';
        baseSalary = parts[4] ? parseVND(parts[4]) : 0;
        dependentsCount = parseInt(parts[5]?.trim() || '0', 10) || 0;
      }

      if (!fullName) continue;

      // Tự sinh mã nếu chưa có hoặc bị trùng
      if (!code || existingCodes.has(code.toLowerCase()) || seenInBatch.has(code.toLowerCase())) {
        let counter = existingCodes.size + created.length + 1;
        let candidate = `NV${String(counter).padStart(3, '0')}`;
        while (existingCodes.has(candidate.toLowerCase()) || seenInBatch.has(candidate.toLowerCase())) {
          counter += 1;
          candidate = `NV${String(counter).padStart(3, '0')}`;
        }
        code = candidate;
      }
      seenInBatch.add(code.toLowerCase());

      created.push({
        id: `emp-batch-${Date.now()}-${i}`,
        code,
        fullName,
        department,
        position,
        rank: 'Cấp 4 - Nhân viên',
        joinDate: new Date().toISOString().split('T')[0],
        contractType: 'official_fixed',
        salaryType: 'gross',
        baseSalary: isNaN(baseSalary) || baseSalary < 0 ? 0 : baseSalary,
        insuranceSalary: isNaN(baseSalary) || baseSalary < 0 ? 0 : baseSalary,
        useCustomInsuranceSalary: false,
        region: 'I',
        dependentsCount,
        residencyStatus: 'resident',
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
        hasTradeUnion: true,
        lunchAllowance: baseSalary > 0 ? 730000 : 0,
        phoneAllowance: 0,
        transportAllowance: 0,
        housingAllowance: 0,
        positionAllowance: 0,
        otherAllowances: [],
        workingStatus: 'active'
      });
    }

    if (created.length === 0) {
      setParseError('Không tìm thấy họ tên nhân viên hợp lệ nào trong dữ liệu đã dán.');
      return;
    }

    onAddEmployees(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border border-slate-200">
        <div className="shrink-0 bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm sm:text-base">Dán danh sách nhân viên từ Excel</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm overscroll-contain">
          <p className="text-slate-600">
            Copy từ Excel và dán trực tiếp vào ô bên dưới. Bạn có thể dán chỉ <strong>Họ tên</strong>, hoặc <strong>STT + Họ tên</strong>, hoặc đầy đủ thông tin:
          </p>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-700 font-mono text-xs overflow-x-auto">
            1 [Tab] Nguyễn Văn An &nbsp;(hoặc chỉ cần mỗi dòng một Họ tên)
          </div>

          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`1\tNguyễn Văn An\n2\tTrần Thị Bình\n3\tLê Hoàng Minh`}
            className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          />

          {parseError && (
            <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        <div className="shrink-0 bg-slate-50 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs sm:text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleProcess}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-sm text-xs sm:text-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            Nhập danh sách
          </button>
        </div>
      </div>
    </div>
  );
};
