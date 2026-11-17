import React, { useState } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, Check, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  downloadRawListExcelTemplate,
  downloadSampleExcelTemplate,
  readExcelFile,
  autoMapColumns,
  validateAndParseImport,
  SYSTEM_FIELDS
} from '../../services/excelImport';
import { Employee } from '../../types/employee';

interface ExcelImportModalProps {
  onImportSuccess: (importedEmployees: Employee[], mode: 'append' | 'replace') => void;
  onClose: () => void;
  existingCodes: Set<string>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onImportSuccess,
  onClose,
  existingCodes
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateAndParseImport> | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const basicFields = SYSTEM_FIELDS.filter((f) => f.basic);
  const advancedFields = SYSTEM_FIELDS.filter((f) => !f.basic);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const { headers: fileHeaders, rows } = await readExcelFile(file);
      setHeaders(fileHeaders);
      setRawRows(rows);

      const autoMap = autoMapColumns(fileHeaders);
      setColumnMapping(autoMap);
      setStep(2);
    } catch (err) {
      alert('Không thể đọc file Excel. Vui lòng chọn file .xlsx, .xls hoặc .csv hợp lệ.');
      console.error(err);
    }
  };

  const handleRunValidation = () => {
    const codesToCheck = importMode === 'replace' ? new Set<string>() : existingCodes;
    const result = validateAndParseImport(rawRows, columnMapping, codesToCheck);
    setValidationResult(result);
    setStep(3);
  };

  const handleConfirmImport = () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    onImportSuccess(validationResult.validRows, importMode);
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Simple Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
          <div>
            <h2 className="font-bold text-base text-slate-900">Nhập danh sách nhân viên từ Excel</h2>
            <p className="text-xs text-slate-500">
              Chỉ cần có cột Họ và tên (và STT nếu có), các thông tin lương có thể tự cập nhật sau trên web
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Quay lại danh sách
        </button>
      </div>

      {/* Simple Step Indicator */}
      <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex items-center gap-3 text-xs font-medium text-slate-600">
        <span className={step === 1 ? 'text-blue-700 font-bold' : ''}>1. Chọn file Excel</span>
        <span className="text-slate-300">/</span>
        <span className={step === 2 ? 'text-blue-700 font-bold' : ''}>2. Chọn cột dữ liệu</span>
        <span className="text-slate-300">/</span>
        <span className={step === 3 ? 'text-blue-700 font-bold' : ''}>3. Xác nhận nhập</span>
      </div>

      <div className="p-5 sm:p-6">
        {/* Step 1: Upload File */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2.5" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Bấm để chọn file Excel (.xlsx, .xls, .csv)
              </h3>
              <p className="text-xs text-slate-500">
                Hỗ trợ file danh sách thô chỉ có STT & Họ tên, hoặc file đã có sẵn mức lương
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-3">
              <div className="font-semibold text-slate-800">Tải file Excel mẫu (nếu cần):</div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={downloadRawListExcelTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Mẫu đơn giản (STT & Họ tên)</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Mẫu đầy đủ (kèm cột lương)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping & Preview */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  File: <span className="text-blue-700">{fileName}</span> ({rawRows.length} dòng)
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống chỉ bắt buộc cột Họ và tên. Các cột khác nếu bỏ trống sẽ tự động tạo hoặc để 0 đ để bạn sửa trên web.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chọn file khác</span>
              </button>
            </div>

            {/* Preview First 3 rows */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Xem trước dữ liệu trong file:</span>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      {headers.slice(0, 8).map((h, i) => (
                        <th key={i} className="p-2 border-b border-slate-200 truncate max-w-[160px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawRows.slice(0, 3).map((r, ri) => (
                      <tr key={ri}>
                        {headers.slice(0, 8).map((h, ci) => (
                          <td key={ci} className="p-2 truncate max-w-[160px] text-slate-600">{String(r[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Basic Mapping Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Ghép cột thông tin cơ bản:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {basicFields.map((sf) => (
                  <div key={sf.field} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">
                      {sf.label} {sf.required && <span className="text-rose-600">*</span>}
                    </label>
                    <select
                      value={columnMapping[sf.field] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [sf.field]: e.target.value })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded-md bg-white text-xs"
                    >
                      <option value="">-- Không có / Bỏ qua --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Collapsible Advanced Mapping */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                {showAdvancedFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>
                  {showAdvancedFields
                    ? 'Ẩn các cột mở rộng (phụ cấp, bảo hiểm, ngân hàng)'
                    : 'Mở rộng thêm cột phụ cấp, bảo hiểm, ngân hàng (nếu file có)'}
                </span>
              </button>

              {showAdvancedFields && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2.5">
                  {advancedFields.map((sf) => (
                    <div key={sf.field} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <label className="block font-semibold text-slate-700 mb-1">{sf.label}</label>
                      <select
                        value={columnMapping[sf.field] || ''}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [sf.field]: e.target.value })
                        }
                        className="w-full p-1.5 border border-slate-300 rounded-md bg-white text-xs"
                      >
                        <option value="">-- Không có / Bỏ qua --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Option to Append or Replace */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800">Cách nhập vào danh sách hiện tại:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  <span>Thêm tiếp vào danh sách</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  <span>Thay thế danh sách cũ</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <button
                onClick={handleRunValidation}
                disabled={!columnMapping['fullName']}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Result & Confirm */}
        {step === 3 && validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <div className="text-xl font-bold text-emerald-700">{validationResult.validRows.length}</div>
                <div className="text-xs text-emerald-800">Hợp lệ</div>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <div className="text-xl font-bold text-rose-700">{validationResult.invalidRows.length}</div>
                <div className="text-xs text-rose-800">Lỗi / bỏ qua</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <div className="text-xl font-bold text-slate-800">{validationResult.totalRows}</div>
                <div className="text-xs text-slate-600">Tổng số dòng</div>
              </div>
            </div>

            {validationResult.invalidRows.length > 0 && (
              <div className="max-h-36 overflow-y-auto border border-rose-200 rounded-lg bg-rose-50/40 p-2.5 text-xs space-y-1.5">
                <div className="font-bold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Các dòng bị bỏ qua:</span>
                </div>
                {validationResult.invalidRows.map((inv, idx) => (
                  <div key={idx} className="flex justify-between gap-2 bg-white p-1.5 rounded border border-rose-100">
                    <span>Dòng {inv.rowIndex}: {String(inv.raw[columnMapping['fullName']] || '(trống)')}</span>
                    <span className="text-rose-600">{inv.errors.join('; ')}</span>
                  </div>
                ))}
              </div>
            )}

            {validationResult.validRows.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Xem trước {Math.min(8, validationResult.validRows.length)} nhân viên đầu tiên:
                </span>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Mã NV</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2">Phòng ban</th>
                        <th className="p-2 text-right">Lương thỏa thuận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationResult.validRows.slice(0, 8).map((e) => (
                        <tr key={e.id}>
                          <td className="p-2 font-mono font-semibold text-blue-700">{e.code}</td>
                          <td className="p-2 font-medium text-slate-900">{e.fullName}</td>
                          <td className="p-2 text-slate-600">{e.department}</td>
                          <td className="p-2 text-right">
                            {e.baseSalary > 0 ? (
                              <span className="font-semibold text-slate-900">{e.baseSalary.toLocaleString('vi-VN')} đ</span>
                            ) : (
                              <span className="text-amber-700 italic">Cập nhật sau trên web</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validationResult.validRows.length === 0}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Nhập {validationResult.validRows.length} nhân viên</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
