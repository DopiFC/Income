import React from 'react';
import {
  HelpCircle, ShieldCheck, FileSpreadsheet, Calculator,
  Clock, AlertTriangle, Download, CheckCircle2, ChevronRight
} from 'lucide-react';

export const UserGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <span>Hướng dẫn sử dụng & Quy định nghiệp vụ Dopi GRIncome</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tài liệu chuẩn hóa quy trình tính lương, công thức pháp luật và cơ chế lưu trữ mã hóa cục bộ AES-256.
        </p>
      </div>

      {/* Security Architecture Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
          <ShieldCheck className="w-5 h-5" />
          <span>Bảo mật dữ liệu trên thiết bị: Không gửi máy chủ & Mã hóa AES-256</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Ứng dụng được thiết kế theo nguyên lý <strong>Privacy by Design</strong>. Toàn bộ thông tin nhân sự, mức lương và thông tin tài chính chỉ xử lý trên thiết bị của bạn.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-300">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-semibold text-emerald-400 block mb-1">🔒 TỰ LƯU MÃ HÓA (INDEXEDDB):</span>
            Khi bạn đặt mật khẩu hồ sơ, dữ liệu được mã hóa bằng thuật toán <strong>AES-256-GCM</strong> trước khi lưu vào IndexedDB. Lần sau mở lại trang, chỉ cần nhập mật khẩu để tiếp tục làm việc.
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-semibold text-amber-400 block mb-1">📁 SAO LƯU AN TOÀN (.dopigr):</span>
            Bạn có thể tải file sao lưu mã hóa <code>.dopigr</code> để chuyển dữ liệu sang máy tính khác hoặc lưu trữ dài hạn mà không lo rò rỉ dữ liệu bảng lương.
          </div>
        </div>
      </div>

      {/* Step by Step workflow */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Quy trình 4 bước tính lương chuẩn doanh nghiệp</h2>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Nạp danh sách nhân viên</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Bạn có thể nạp nhân viên bằng cách: bấm <strong>"Import Excel"</strong> (có file mẫu tải về), hoặc <strong>"Dán từ Excel"</strong>, hoặc thêm từng nhân viên bằng tay. Kiểm tra mã nhân viên, phòng ban, lương thỏa thuận và vùng lương tối thiểu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Cấu hình lương & Phụ cấp</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Chọn hình thức tính theo <strong>Lương Gross</strong> (khấu trừ thuế và BH) hoặc <strong>Lương Net</strong> (hệ thống tự giải ngược mức Gross cần ký). Thiết lập các khoản phụ cấp ăn trưa (miễn thuế đến 730k), điện thoại, xăng xe, chức vụ.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Chấm công, ngày nghỉ & giờ tăng ca</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Nhập số ngày công thực tế đi làm, ngày phép năm có lương, ngày nghỉ không lương, nghỉ ốm/thai sản (BHXH chi trả). Nhập giờ tăng ca ngày thường (150%), cuối tuần (200%), ngày lễ (300%). Hệ thống tự động cảnh báo nếu làm thêm quá 40h/tháng theo Điều 107 BLLĐ.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
              4
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Xem bảng lương & Xuất báo cáo</h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Kiểm tra kết quả tại <strong>Bảng tính lương</strong>. Bấm vào bất kỳ nhân viên nào để mở <strong>Phiếu lương cá nhân</strong> và tải ảnh PNG độ nét cao. Bấm <strong>Xuất Excel</strong> để nhận workbook 5 sheet hoàn chỉnh.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Formulas & Legal Compliance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Các công thức và quy định trọng yếu cần lưu ý</h2>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-blue-900 block">1. Công thức phân bổ phần tăng ca miễn thuế TNCN:</span>
            <p>
              Theo Điểm i Khoản 1 Điều 3 Thông tư 111/2013/TT-BTC: Chỉ phần tiền lương tăng ca cao hơn mức lương ngày làm việc bình thường (phần phụ trội &gt;100%) mới được <strong>miễn thuế TNCN</strong>. Phần 100% cơ bản vẫn tính vào thu nhập chịu thuế bình thường.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-blue-900 block">2. Quy định khấu trừ tiền phạt (Chống trừ lương sai luật):</span>
            <p>
              Theo Điều 102 và Điều 127 Bộ luật Lao động 2019: <strong>Nghiêm cấm người sử dụng lao động dùng hình thức phạt tiền, cắt lương thay việc xử lý kỷ luật lao động</strong>. Hệ thống sẽ hiển thị cảnh báo đỏ và không cho phép tự động trừ tiền nếu người dùng nhập lý do "phạt vi phạm".
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-blue-900 block">3. Quy đổi Net sang Gross:</span>
            <p>
              Hệ thống áp dụng thuật toán tìm kiếm nhị phân (Binary Search) chính xác từng đồng, giải hệ phương trình phi tuyến gồm các bậc thuế lũy tiến từng phần và trần đóng bảo hiểm xã hội.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
