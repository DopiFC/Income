export interface MonthlyAttendance {
  employeeId: string;
  month: string; // YYYY-MM
  standardWorkDays: number; // Mặc định 22, 24 hoặc 26 ngày
  standardWorkHoursPerDay: number; // Thường 8 giờ
  actualWorkDays: number; // Ngày công thực tế đi làm
  
  // Các loại nghỉ
  paidAnnualLeaveDays: number; // Nghỉ phép năm hưởng nguyên lương
  paidHolidayDays: number; // Nghỉ lễ, tết hưởng nguyên lương
  paidSpecialLeaveDays: number; // Nghỉ việc riêng có lương (kết hôn, tang chế...)
  unpaidLeaveDays: number; // Nghỉ không hưởng lương
  sickLeaveDays: number; // Nghỉ ốm đau (do BHXH chi trả chế độ, DN không trả lương công)
  maternityLeaveDays: number; // Nghỉ thai sản (do BHXH chi trả)
  compensatoryLeaveDays: number; // Nghỉ bù hưởng lương
  
  // Tăng ca (giờ)
  normalDayOvertimeHours: number; // Tăng ca ngày thường (150%)
  weekendOvertimeHours: number; // Tăng ca ngày nghỉ hằng tuần (200%)
  holidayOvertimeHours: number; // Tăng ca ngày lễ tết (300%)
  nightWorkHours: number; // Làm việc ban đêm phụ trội (+30%)
  nightOvertimeHours: number; // Tăng ca ban đêm (+20% của đơn giá ngày tương ứng)
  
  notes?: string;
}

export interface Adjustments {
  employeeId: string;
  bonusKpi: number; // Thưởng hiệu suất/KPI
  bonusSales: number; // Thưởng doanh số
  bonusTet: number; // Thưởng lễ, Tết
  commission: number; // Hoa hồng
  retroactivePay: number; // Truy lĩnh lương kỳ trước
  taxExemptReimbursement: number; // Hoàn trả chi phí hợp lệ (công tác phí hóa đơn...)
  
  advancePayment: number; // Tạm ứng lương
  advanceRepayment: number; // Hoàn trả tạm ứng
  damageCompensation: number; // Bồi thường thiệt hại có căn cứ biên bản
  otherDeductions: number; // Khấu trừ hợp pháp khác
  deductionNotes?: string;
  warningDisciplinaryPenalty?: string; // Cảnh báo nếu nhập phạt không đúng luật
}
