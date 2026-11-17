import { Adjustments } from '../types/attendance';

export type AdjustmentNumericField =
  | 'bonusKpi'
  | 'bonusSales'
  | 'bonusTet'
  | 'commission'
  | 'retroactivePay'
  | 'taxExemptReimbursement'
  | 'advancePayment'
  | 'advanceRepayment'
  | 'damageCompensation'
  | 'otherDeductions';

export type BatchAdjustmentPatch = Partial<Record<AdjustmentNumericField, number>>;

export function createEmptyAdjustment(employeeId: string): Adjustments {
  return {
    employeeId,
    bonusKpi: 0,
    bonusSales: 0,
    bonusTet: 0,
    commission: 0,
    retroactivePay: 0,
    taxExemptReimbursement: 0,
    advancePayment: 0,
    advanceRepayment: 0,
    damageCompensation: 0,
    otherDeductions: 0
  };
}

export function applyBatchAdjustments(
  existingMap: Record<string, Adjustments>,
  employeeIds: string[],
  patch: BatchAdjustmentPatch,
  mode: 'add' | 'overwrite',
  notes?: string
): Record<string, Adjustments> {
  if (employeeIds.length === 0) return existingMap;

  const next: Record<string, Adjustments> = { ...existingMap };
  const patchEntries = Object.entries(patch) as [AdjustmentNumericField, number | undefined][];
  const trimmedNote = notes?.trim();

  for (const empId of employeeIds) {
    const current = existingMap[empId]
      ? { ...existingMap[empId] }
      : createEmptyAdjustment(empId);

    for (const [field, val] of patchEntries) {
      if (val === undefined || Number.isNaN(val)) continue;
      const safeVal = Math.max(0, val);
      if (mode === 'add') {
        current[field] = Math.max(0, (current[field] || 0) + safeVal);
      } else {
        current[field] = safeVal;
      }
    }

    if (trimmedNote) {
      if (mode === 'add' && current.deductionNotes) {
        current.deductionNotes = current.deductionNotes.includes(trimmedNote)
          ? current.deductionNotes
          : `${current.deductionNotes}; ${trimmedNote}`;
      } else {
        current.deductionNotes = trimmedNote;
      }
    }

    next[empId] = current;
  }

  return next;
}
