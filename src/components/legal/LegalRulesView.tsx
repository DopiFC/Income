import React, { useState } from 'react';
import { LegalConfig } from '../../types/legal';
import { OFFICIAL_LEGAL_SOURCES } from '../../legal/legalSources';
import { DEFAULT_LEGAL_CONFIG_2026 } from '../../legal/rules';
import { Scale, ExternalLink, ShieldCheck, AlertTriangle, BookOpen, RotateCcw, Check } from 'lucide-react';
import { formatVND } from '../../utils/currency';

interface LegalRulesViewProps {
  legalConfig: LegalConfig;
  onUpdateLegalConfig: (config: LegalConfig) => void;
  onResetDefaultConfig: () => void;
}

export const LegalRulesView: React.FC<LegalRulesViewProps> = ({
  legalConfig,
  onUpdateLegalConfig,
  onResetDefaultConfig
}) => {
  const [personalDeduction, setPersonalDeduction] = useState(legalConfig.personalDeduction);
  const [dependentDeduction, setDependentDeduction] = useState(legalConfig.dependentDeduction);
  const [refBaseSalary, setRefBaseSalary] = useState(legalConfig.referenceBaseSalary);
  const [minWageI, setMinWageI] = useState(legalConfig.regionalMinWage.I);
  const [minWageII, setMinWageII] = useState(legalConfig.regionalMinWage.II);
  const [minWageIII, setMinWageIII] = useState(legalConfig.regionalMinWage.III);
  const [minWageIV, setMinWageIV] = useState(legalConfig.regionalMinWage.IV);

  const [hasCustomChanges, setHasCustomChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LegalConfig = {
      ...legalConfig,
      personalDeduction,
      dependentDeduction,
      referenceBaseSalary: refBaseSalary,
      regionalMinWage: {
        I: minWageI,
        II: minWageII,
        III: minWageIII,
        IV: minWageIV
      }
    };
    onUpdateLegalConfig(updated);
    setHasCustomChanges(true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    onResetDefaultConfig();
    setPersonalDeduction(DEFAULT_LEGAL_CONFIG_2026.personalDeduction);
    setDependentDeduction(DEFAULT_LEGAL_CONFIG_2026.dependentDeduction);
    setRefBaseSalary(DEFAULT_LEGAL_CONFIG_2026.referenceBaseSalary);
    setMinWageI(DEFAULT_LEGAL_CONFIG_2026.regionalMinWage.I);
    setMinWageII(DEFAULT_LEGAL_CONFIG_2026.regionalMinWage.II);
    setMinWageIII(DEFAULT_LEGAL_CONFIG_2026.regionalMinWage.III);
    setMinWageIV(DEFAULT_LEGAL_CONFIG_2026.regionalMinWage.IV);
    setHasCustomChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            <span>Quy tắc pháp luật & Tham số tính lương 2026</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Căn cứ Bộ luật Lao động 45/2019/QH14, Luật BHXH 41/2024/QH15, Luật Việc làm 74/2025/QH15 và NĐ 293/2025/NĐ-CP.
          </p>
        </div>

        {hasCustomChanges && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục chuẩn mặc định 2026</span>
          </button>
        )}
      </div>

      {hasCustomChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Lưu ý:</strong> Bạn đang áp dụng cấu hình tham số tùy chỉnh do doanh nghiệp tự thiết lập. Kết quả tính toán sẽ phụ thuộc vào các giá trị này.
          </span>
        </div>
      )}

      {/* Grid: 2026 Tax Brackets & Minimum Wages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu thuế TNCN 2026 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Biểu thuế TNCN lũy tiến từng phần (Kỳ tính thuế 2026)</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              5 Bậc lũy tiến
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Áp dụng đối với thu nhập từ tiền lương, tiền công của cá nhân cư trú theo luật Thuế TNCN sửa đổi.
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2 text-center w-12">Bậc</th>
                  <th className="p-2">Thu nhập tính thuế / tháng</th>
                  <th className="p-2 text-center">Thuế suất</th>
                  <th className="p-2 text-right">Mức khấu trừ nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {legalConfig.pitBrackets.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-bold text-blue-600">{idx + 1}</td>
                    <td className="p-2 font-medium">
                      {b.to !== null
                        ? `Đến ${(b.to / 1_000_000).toFixed(0)} triệu đồng`
                        : `Trên ${(b.from / 1_000_000).toFixed(0)} triệu đồng`}
                    </td>
                    <td className="p-2 text-center font-bold text-slate-900">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {b.quickDeduction > 0 ? formatVND(b.quickDeduction) : '0 ₫'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Giảm trừ gia cảnh */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Giảm trừ bản thân:</span>
              <span className="text-base font-bold text-blue-900">{formatVND(legalConfig.personalDeduction)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">186 triệu đồng / năm</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Mỗi người phụ thuộc:</span>
              <span className="text-base font-bold text-blue-900">{formatVND(legalConfig.dependentDeduction)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">74.4 triệu đồng / người / năm</span>
            </div>
          </div>
        </div>

        {/* Lương tối thiểu vùng & Bảo hiểm */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Lương tối thiểu vùng (Nghị định 293/2025/NĐ-CP)</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              Từ 01/01/2026
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2">Vùng</th>
                  <th className="p-2 text-right">Mức lương tối thiểu tháng</th>
                  <th className="p-2 text-right">Trần đóng BHTN (x20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2 font-bold text-slate-800">Vùng I (Đô thị đặc biệt/lớn)</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{formatVND(legalConfig.regionalMinWage.I)}</td>
                  <td className="p-2 text-right text-slate-600">{formatVND(legalConfig.regionalMinWage.I * 20)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-800">Vùng II (Đô thị loại 2)</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{formatVND(legalConfig.regionalMinWage.II)}</td>
                  <td className="p-2 text-right text-slate-600">{formatVND(legalConfig.regionalMinWage.II * 20)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-800">Vùng III (Huyện, thị xã)</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{formatVND(legalConfig.regionalMinWage.III)}</td>
                  <td className="p-2 text-right text-slate-600">{formatVND(legalConfig.regionalMinWage.III * 20)}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-800">Vùng IV (Vùng nông thôn còn lại)</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{formatVND(legalConfig.regionalMinWage.IV)}</td>
                  <td className="p-2 text-right text-slate-600">{formatVND(legalConfig.regionalMinWage.IV * 20)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tỷ lệ bảo hiểm bắt buộc */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-800 mb-1.5">Tỷ lệ trích đóng bảo hiểm bắt buộc</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-blue-900 block">Người lao động (10.5%):</span>
                <div className="text-slate-600">BHXH: <strong>8%</strong></div>
                <div className="text-slate-600">BHYT: <strong>1.5%</strong></div>
                <div className="text-slate-600">BHTN: <strong>1%</strong></div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-purple-900 block">Doanh nghiệp (23.5%):</span>
                <div className="text-slate-600">BHXH: <strong>17.5%</strong></div>
                <div className="text-slate-600">BHYT: <strong>3%</strong></div>
                <div className="text-slate-600">BHTN: <strong>1%</strong> | CĐ: <strong>2%</strong></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Trần BHXH & BHYT tối đa 20 lần mức tham chiếu: <strong>{formatVND(legalConfig.referenceBaseSalary * 20)}</strong> (theo Luật BHXH 41/2024/QH15).
            </p>
          </div>
        </div>
      </div>

      {/* Official Legal Sources Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Văn bản pháp luật nguồn từ Cổng thông tin Chính phủ</span>
        </h3>
        <p className="text-xs text-slate-500">
          Người dùng có thể tra cứu trực tiếp toàn văn các văn bản quy phạm pháp luật làm căn cứ cho công thức tính toán.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Văn bản</th>
                <th className="p-2.5">Số hiệu</th>
                <th className="p-2.5">Nội dung cốt lõi áp dụng</th>
                <th className="p-2.5 text-center">Liên kết tra cứu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OFFICIAL_LEGAL_SOURCES.map((src) => (
                <tr key={src.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{src.lawName}</td>
                  <td className="p-2.5 font-mono text-slate-600">{src.docNumber}</td>
                  <td className="p-2.5 text-slate-600 max-w-md">{src.summary}</td>
                  <td className="p-2.5 text-center">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      <span>Toàn văn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
