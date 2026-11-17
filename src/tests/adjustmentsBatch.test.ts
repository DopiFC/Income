import { describe, it, expect } from 'vitest';
import { applyBatchAdjustments } from '../engine/adjustmentsBatch';
import { calculateInsurance } from '../engine/insurance';
import { DEFAULT_LEGAL_CONFIG_2026 } from '../legal/rules';
import { Employee } from '../types/employee';
import { Adjustments } from '../types/attendance';

const sampleEmployee: Employee = {
  id: 'emp-bhxh',
  code: 'NV001',
  fullName: 'Nguyễn Văn Test',
  department: 'Kinh doanh',
  position: 'Nhân viên',
  rank: 'Cấp 2',
  joinDate: '2025-01-01',
  contractType: 'official_fixed',
  salaryType: 'gross',
  baseSalary: 10_000_000,
  insuranceSalary: 10_000_000,
  useCustomInsuranceSalary: false,
  region: 'I',
  dependentsCount: 0,
  residencyStatus: 'resident',
  hasSocialInsurance: true,
  hasHealthInsurance: true,
  hasUnemploymentInsurance: true,
  hasTradeUnion: false,
  lunchAllowance: 0,
  phoneAllowance: 0,
  transportAllowance: 0,
  housingAllowance: 0,
  positionAllowance: 0,
  otherAllowances: [],
  workingStatus: 'active'
};

describe('BHXH Vùng I calculation (10tr lương HĐ vs LTT Vùng I 5.310.000đ)', () => {
  it('computes 8% BHXH = 800.000đ and total 10.5% = 1.050.000đ on 10.000.000đ contract salary', () => {
    const breakdown = calculateInsurance(sampleEmployee, DEFAULT_LEGAL_CONFIG_2026);
    expect(breakdown.insuranceSalaryBase).toBe(10_000_000);
    expect(breakdown.employee.social).toBe(800_000);
    expect(breakdown.employee.health).toBe(150_000);
    expect(breakdown.employee.unemployment).toBe(100_000);
    expect(breakdown.employee.total).toBe(1_050_000);
    expect(breakdown.warnings).toHaveLength(0);
  });

  it('computes 8% BHXH = 424.800đ and total 10.5% = 557.550đ when opting into Vùng I minimum wage (5.310.000đ)', () => {
    const regionalMinEmp: Employee = {
      ...sampleEmployee,
      useCustomInsuranceSalary: true,
      insuranceSalary: DEFAULT_LEGAL_CONFIG_2026.regionalMinWage.I
    };
    const breakdown = calculateInsurance(regionalMinEmp, DEFAULT_LEGAL_CONFIG_2026);
    expect(breakdown.insuranceSalaryBase).toBe(5_310_000);
    expect(breakdown.employee.social).toBe(424_800);
    expect(breakdown.employee.health).toBe(79_650);
    expect(breakdown.employee.unemployment).toBe(53_100);
    expect(breakdown.employee.total).toBe(557_550);
    expect(breakdown.warnings).toHaveLength(0);
  });
});

describe('applyBatchAdjustments', () => {
  const initialMap: Record<string, Adjustments> = {
    e1: {
      employeeId: 'e1',
      bonusKpi: 500_000,
      bonusSales: 200_000,
      bonusTet: 0,
      commission: 0,
      retroactivePay: 0,
      taxExemptReimbursement: 0,
      advancePayment: 1_000_000,
      advanceRepayment: 0,
      damageCompensation: 0,
      otherDeductions: 100_000,
      deductionNotes: 'Cũ'
    }
  };

  it('adds patch amounts onto existing records and initializes missing employees in add mode', () => {
    const next = applyBatchAdjustments(
      initialMap,
      ['e1', 'e2'],
      { bonusKpi: 1_000_000, bonusTet: 300_000 },
      'add',
      'Thưởng đạt chỉ tiêu'
    );

    expect(next.e1.bonusKpi).toBe(1_500_000);
    expect(next.e1.bonusSales).toBe(200_000);
    expect(next.e1.bonusTet).toBe(300_000);
    expect(next.e1.deductionNotes).toBe('Cũ; Thưởng đạt chỉ tiêu');

    expect(next.e2).toBeDefined();
    expect(next.e2.employeeId).toBe('e2');
    expect(next.e2.bonusKpi).toBe(1_000_000);
    expect(next.e2.bonusTet).toBe(300_000);
    expect(next.e2.advancePayment).toBe(0);
    expect(next.e2.deductionNotes).toBe('Thưởng đạt chỉ tiêu');
  });

  it('overwrites only supplied fields while preserving untouched fields and allowing 0 reset', () => {
    const next = applyBatchAdjustments(
      initialMap,
      ['e1'],
      { advancePayment: 0, otherDeductions: 250_000 },
      'overwrite',
      'Cập nhật khấu trừ'
    );

    expect(next.e1.advancePayment).toBe(0);
    expect(next.e1.otherDeductions).toBe(250_000);
    expect(next.e1.bonusKpi).toBe(500_000);
    expect(next.e1.bonusSales).toBe(200_000);
    expect(next.e1.deductionNotes).toBe('Cập nhật khấu trừ');
  });
});
