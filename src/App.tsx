import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TabKey, Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { PrivacyBanner } from './components/layout/PrivacyBanner';
import { ResetSessionModal } from './components/layout/ResetSessionModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { EmployeeList } from './components/employee/EmployeeList';
import { EmployeeModal } from './components/employee/EmployeeModal';
import { BatchEmployeeModal } from './components/employee/BatchEmployeeModal';
import { ExcelImportModal } from './components/import/ExcelImportModal';
import { DepartmentRankManager } from './components/organization/DepartmentRankManager';
import { SalaryConfigView } from './components/payroll/SalaryConfigView';
import { AttendanceManager } from './components/attendance/AttendanceManager';
import { PayrollTable } from './components/payroll/PayrollTable';
import { PayslipModal } from './components/payslip/PayslipModal';
import { ReportsView } from './components/reports/ReportsView';
import { LegalRulesView } from './components/legal/LegalRulesView';
import { UserGuideView } from './components/guide/UserGuideView';
import { PayslipView } from './components/payslip/PayslipView';
import { SettingsView } from './components/settings/SettingsView';
import { CompanyProfileModal } from './components/organization/CompanyProfileModal';
import { StorageModal } from './components/storage/StorageModal';

import { Employee, SalaryType, WorkingStatus } from './types/employee';
import { MonthlyAttendance, Adjustments } from './types/attendance';
import { PayslipItem, PayrollSummary } from './types/payroll';
import { LegalConfig } from './types/legal';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from './types/organization';
import { StorageStatus, EncryptedVaultRecord, AppWorkspaceState } from './types/storage';

import { DEFAULT_LEGAL_CONFIG_2026, getLegalConfigForMonth } from './legal/rules';
import { calculateEmployeePayroll } from './engine/salaryCalculation';
import { solveGrossFromTargetNet } from './engine/grossToNet';
import { applyBatchAdjustments, BatchAdjustmentPatch } from './engine/adjustmentsBatch';
import { getCurrentMonthStr, createDefaultAttendance } from './utils/date';
import { SAMPLE_EMPLOYEES, getSampleAttendance, getSampleAdjustments } from './utils/sampleData';
import { exportPayrollWorkbook } from './services/excelExport';
import { encryptWorkspace, decryptWorkspace } from './services/crypto';
import { hasStoredProfile, getStoredProfile, saveEncryptedProfile, saveStandardWorkspace, deleteStoredProfile } from './services/db';

export default function App() {
  // Navigation & Month
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');

  // Company / Organization Profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // In-memory workspace session state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, MonthlyAttendance>>({});
  const [adjustmentsMap, setAdjustmentsMap] = useState<Record<string, Adjustments>>({});

  // Dynamic Departments & Ranks
  const [departments, setDepartments] = useState<string[]>([
    'Ban Giám Đốc',
    'Kỹ thuật - Công nghệ',
    'Kinh doanh & Tiếp thị',
    'Kế toán - Tài chính',
    'Hành chính - Nhân sự',
    'Vận hành & Hậu cần'
  ]);

  const [ranks, setRanks] = useState<string[]>([
    'Cấp 1 - Quản lý Cấp cao',
    'Cấp 2 - Trưởng nhóm',
    'Cấp 3 - Chuyên viên',
    'Cấp 4 - Nhân viên',
    'Cấp 5 - Thử việc'
  ]);

  // Legal rules configuration
  const [customLegalConfig, setCustomLegalConfig] = useState<LegalConfig | null>(null);
  const legalConfig = useMemo(() => {
    return getLegalConfigForMonth(selectedMonth, customLegalConfig || undefined);
  }, [selectedMonth, customLegalConfig]);

  // Encrypted Storage state (AES-256-GCM + IndexedDB)
  const [storageStatus, setStorageStatus] = useState<StorageStatus>('saved');
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [hasStoredProfileState, setHasStoredProfileState] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [currentVaultRecord, setCurrentVaultRecord] = useState<EncryptedVaultRecord | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [activePayslipItem, setActivePayslipItem] = useState<PayslipItem | null>(null);

  // Set of existing employee codes for deduplication
  const existingCodes = useMemo(() => {
    return new Set(employees.map((e) => e.code.toLowerCase()));
  }, [employees]);

  // 1. Check IndexedDB on mount - Restore either encrypted vault or standard workspace
  useEffect(() => {
    async function checkVault() {
      try {
        const record: any = await getStoredProfile();
        if (record) {
          if (record.ciphertextHex && record.isEncrypted !== false) {
            // Profile is protected by master password
            setHasStoredProfileState(true);
            setStorageStatus('locked');
            setCurrentVaultRecord(record);
            setLastSavedAt(record.updatedAt);
            setIsStorageModalOpen(true);
          } else if (record.plainWorkspace) {
            // Profile was saved directly in unencrypted local workspace
            const state = record.plainWorkspace as AppWorkspaceState;
            if (state.companyProfile) setCompanyProfile(state.companyProfile);
            if (state.employees) setEmployees(state.employees);
            if (state.attendanceMap) setAttendanceMap(state.attendanceMap);
            if (state.adjustmentsMap) setAdjustmentsMap(state.adjustmentsMap);
            if (state.departments) setDepartments(state.departments);
            if (state.ranks) setRanks(state.ranks);
            if (state.customLegalConfig !== undefined) setCustomLegalConfig(state.customLegalConfig);
            if (state.selectedMonth) setSelectedMonth(state.selectedMonth);

            setHasStoredProfileState(false);
            setStorageStatus('saved');
            setLastSavedAt(record.updatedAt || new Date().toISOString());
          }
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra IndexedDB:', err);
      }
    }
    checkVault();
  }, []);

  // 2. Auto-save with debouncing when changes happen
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If vault is locked awaiting password, do NOT overwrite it
    if (storageStatus === 'locked') return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setStorageStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const workspace: AppWorkspaceState = {
          version: '1.0',
          savedAt: new Date().toISOString(),
          selectedMonth,
          companyProfile,
          employees,
          attendanceMap,
          adjustmentsMap,
          departments,
          ranks,
          customLegalConfig
        };

        if (masterPassword && (storageStatus === 'unlocked' || storageStatus === 'saved' || storageStatus === 'saving')) {
          // Encrypted mode
          const encryptedRecord = await encryptWorkspace(
            workspace,
            masterPassword,
            companyProfile.companyName
          );

          await saveEncryptedProfile(encryptedRecord);
          setCurrentVaultRecord(encryptedRecord);
          setLastSavedAt(encryptedRecord.updatedAt);
          setHasStoredProfileState(true);
          setStorageStatus('saved');
        } else {
          // Standard persistent local workspace (IndexedDB)
          await saveStandardWorkspace(workspace);
          setLastSavedAt(workspace.savedAt);
          setStorageStatus('saved');
        }
      } catch (err) {
        console.error('Lỗi tự động lưu vào IndexedDB:', err);
        setStorageStatus('error');
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    employees,
    attendanceMap,
    adjustmentsMap,
    companyProfile,
    departments,
    ranks,
    customLegalConfig,
    selectedMonth,
    masterPassword
  ]);


  // Unified Payroll Calculation Engine (memoized over all employee records)
  const payrollItems: PayslipItem[] = useMemo(() => {
    return employees.map((emp) => {
      const att = attendanceMap[emp.id] || createDefaultAttendance(emp.id, selectedMonth, 22);
      const adj = adjustmentsMap[emp.id] || {
        employeeId: emp.id,
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

      if (emp.salaryType === 'net') {
        // Mode B: Target Net -> Solve for Gross
        const solution = solveGrossFromTargetNet(emp.baseSalary, emp, att, adj, legalConfig);
        return solution.payslip;
      } else {
        // Mode A: Standard Gross -> Net
        return calculateEmployeePayroll(emp, att, adj, legalConfig);
      }
    });
  }, [employees, attendanceMap, adjustmentsMap, selectedMonth, legalConfig]);

  // Summary Metrics
  const summary: PayrollSummary = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalPIT = 0;
    let totalEmpIns = 0;
    let totalCompIns = 0;
    let totalCost = 0;
    let warningCount = 0;

    for (const item of payrollItems) {
      totalGross += item.grossIncome;
      totalNet += item.netSalary;
      totalPIT += item.personalIncomeTax;
      totalEmpIns += item.totalEmployeeInsurance;
      totalCompIns += item.totalEmployerInsurance;
      totalCost += item.totalCompanyCost;
      if (item.warnings.length > 0) {
        warningCount += 1;
      }
    }

    return {
      month: selectedMonth,
      totalEmployees: employees.length,
      totalGrossSalary: totalGross,
      totalNetSalary: totalNet,
      totalPersonalIncomeTax: totalPIT,
      totalEmployeeInsurance: totalEmpIns,
      totalEmployerInsurance: totalCompIns,
      totalCompanyCost: totalCost,
      warningCount
    };
  }, [payrollItems, selectedMonth, employees.length]);

  // Load realistic sample data
  const handleLoadSampleData = useCallback(() => {
    setEmployees(SAMPLE_EMPLOYEES);
    setAttendanceMap(getSampleAttendance(selectedMonth));
    setAdjustmentsMap(getSampleAdjustments());
    setCompanyProfile({
      companyName: 'CÔNG TY TNHH CÔNG NGHỆ & THƯƠNG MẠI DOPI',
      taxCode: '0109876543',
      address: 'Tầng 12, Tòa nhà Dopi Tower, Q. Cầu Giấy, TP. Hà Nội',
      phoneNumber: '024.3888.9999',
      email: 'hr@dopi.vn',
      payrollPreparer: 'Đỗ Hải Yến (Chuyên viên C&B)',
      approver: 'Nguyễn Văn An (Tổng Giám Đốc)'
    });
  }, [selectedMonth]);

  // Complete Zero-Storage Reset / Wipe
  const handleClearSession = useCallback(async () => {
    setEmployees([]);
    setAttendanceMap({});
    setAdjustmentsMap({});
    setEditingEmployee(null);
    setActivePayslipItem(null);
  }, []);

  // Encrypted Storage Handlers
  const handleEnableStorage = useCallback(async (password: string): Promise<boolean> => {
    const workspace: AppWorkspaceState = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      selectedMonth,
      companyProfile,
      employees,
      attendanceMap,
      adjustmentsMap,
      departments,
      ranks,
      customLegalConfig
    };

    const record = await encryptWorkspace(workspace, password, companyProfile.companyName);
    await saveEncryptedProfile(record);
    setCurrentVaultRecord(record);
    setLastSavedAt(record.updatedAt);
    setMasterPassword(password);
    setHasStoredProfileState(true);
    setStorageStatus('saved');
    return true;
  }, [selectedMonth, companyProfile, employees, attendanceMap, adjustmentsMap, departments, ranks, customLegalConfig]);

  const handleUnlockStorage = useCallback(async (password: string): Promise<boolean> => {
    const record = (currentVaultRecord || await getStoredProfile()) as EncryptedVaultRecord | null;
    if (!record) return false;

    try {
      const state = await decryptWorkspace(record, password);
      // Restore workspace into React state
      if (state.companyProfile) setCompanyProfile(state.companyProfile);
      if (state.employees) setEmployees(state.employees);
      if (state.attendanceMap) setAttendanceMap(state.attendanceMap);
      if (state.adjustmentsMap) setAdjustmentsMap(state.adjustmentsMap);
      if (state.departments) setDepartments(state.departments);
      if (state.ranks) setRanks(state.ranks);
      if (state.customLegalConfig !== undefined) setCustomLegalConfig(state.customLegalConfig);
      if (state.selectedMonth) setSelectedMonth(state.selectedMonth);

      setMasterPassword(password);
      setCurrentVaultRecord(record);
      setLastSavedAt(record.updatedAt);
      setStorageStatus('unlocked');
      return true;
    } catch {
      return false;
    }
  }, [currentVaultRecord]);

  const handleChangePassword = useCallback(async (oldPass: string, newPass: string): Promise<boolean> => {
    const record = (currentVaultRecord || await getStoredProfile()) as EncryptedVaultRecord | null;
    if (!record) return false;

    try {
      // Verify old password
      const state = await decryptWorkspace(record, oldPass);
      // Re-encrypt with new password
      const newRecord = await encryptWorkspace(state, newPass, companyProfile.companyName);
      await saveEncryptedProfile(newRecord);

      setMasterPassword(newPass);
      setCurrentVaultRecord(newRecord);
      setLastSavedAt(newRecord.updatedAt);
      return true;
    } catch {
      return false;
    }
  }, [currentVaultRecord, companyProfile.companyName]);


  const handleLockStorage = useCallback(() => {
    setMasterPassword('');
    setStorageStatus('locked');
  }, []);

  const handleDeleteStorageProfile = useCallback(async () => {
    await deleteStoredProfile();
    setHasStoredProfileState(false);
    setStorageStatus('unconfigured');
    setMasterPassword('');
    setCurrentVaultRecord(null);
    setLastSavedAt(null);
  }, []);

  const handleRestoreBackup = useCallback(async (state: AppWorkspaceState, password: string) => {
    if (state.companyProfile) setCompanyProfile(state.companyProfile);
    if (state.employees) setEmployees(state.employees);
    if (state.attendanceMap) setAttendanceMap(state.attendanceMap);
    if (state.adjustmentsMap) setAdjustmentsMap(state.adjustmentsMap);
    if (state.departments) setDepartments(state.departments);
    if (state.ranks) setRanks(state.ranks);
    if (state.customLegalConfig !== undefined) setCustomLegalConfig(state.customLegalConfig);
    if (state.selectedMonth) setSelectedMonth(state.selectedMonth);

    const record = await encryptWorkspace(state, password, state.companyProfile?.companyName || 'Hồ sơ');
    await saveEncryptedProfile(record);

    setMasterPassword(password);
    setCurrentVaultRecord(record);
    setLastSavedAt(record.updatedAt);
    setHasStoredProfileState(true);
    setStorageStatus('saved');
  }, []);

  // Employee CRUD handlers
  const handleSaveEmployee = useCallback((emp: Employee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [...prev, emp];
    });

    if (emp.department && !departments.includes(emp.department)) {
      setDepartments((prev) => [...prev, emp.department]);
    }
    if (emp.rank && !ranks.includes(emp.rank)) {
      setRanks((prev) => [...prev, emp.rank]);
    }
  }, [departments, ranks]);

  const handleDuplicateEmployee = useCallback((emp: Employee) => {
    const nextCode = `NV${String(employees.length + 1).padStart(3, '0')}`;
    const duplicate: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      code: nextCode,
      fullName: `${emp.fullName} (Bản sao)`
    };
    handleSaveEmployee(duplicate);
  }, [employees.length, handleSaveEmployee]);

  const handleDeleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setAttendanceMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setAdjustmentsMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const handleDeleteBatch = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setEmployees((prev) => prev.filter((e) => !idSet.has(e.id)));
    setAttendanceMap((prev) => {
      const copy = { ...prev };
      for (const id of ids) delete copy[id];
      return copy;
    });
    setAdjustmentsMap((prev) => {
      const copy = { ...prev };
      for (const id of ids) delete copy[id];
      return copy;
    });
  }, []);

  const handleBatchUpdateDepartment = useCallback((ids: string[], dept: string) => {
    const idSet = new Set(ids);
    setEmployees((prev) =>
      prev.map((e) => (idSet.has(e.id) ? { ...e, department: dept } : e))
    );
  }, []);

  const handleBatchUpdateRank = useCallback((ids: string[], rank: string) => {
    const idSet = new Set(ids);
    setEmployees((prev) =>
      prev.map((e) => (idSet.has(e.id) ? { ...e, rank } : e))
    );
  }, []);

  const handleBatchUpdateWorkingStatus = useCallback((ids: string[], workingStatus: WorkingStatus) => {
    const idSet = new Set(ids);
    const updatedAt = new Date().toISOString().split('T')[0];
    setEmployees((prev) =>
      prev.map((e) =>
        idSet.has(e.id)
          ? { ...e, workingStatus, statusUpdatedAt: updatedAt }
          : e
      )
    );
  }, []);

  const handleBatchApplySalaryType = useCallback((salaryType: SalaryType) => {
    setEmployees((prev) => prev.map((e) => ({ ...e, salaryType })));
  }, []);

  const handleBatchApplyInsuranceMode = useCallback(
    (mode: 'regional_min' | 'contract_salary') => {
      setEmployees((prev) =>
        prev.map((emp) => {
          if (mode === 'regional_min') {
            const minWage = legalConfig.regionalMinWage[emp.region || 'I'];
            return {
              ...emp,
              useCustomInsuranceSalary: true,
              insuranceSalary: minWage
            };
          }
          return {
            ...emp,
            useCustomInsuranceSalary: false,
            insuranceSalary: emp.baseSalary
          };
        })
      );
    },
    [legalConfig]
  );

  // Attendance & Payroll Adjustment handlers
  const handleUpdateAttendance = useCallback((att: MonthlyAttendance) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [att.employeeId]: att
    }));
  }, []);

  const handleUpdateAdjustment = useCallback((adj: Adjustments) => {
    setAdjustmentsMap((prev) => ({
      ...prev,
      [adj.employeeId]: adj
    }));
  }, []);

  const handleBatchUpdateAdjustments = useCallback(
    (
      employeeIds: string[],
      patch: BatchAdjustmentPatch,
      mode: 'add' | 'overwrite',
      notes?: string
    ) => {
      setAdjustmentsMap((prev) =>
        applyBatchAdjustments(prev, employeeIds, patch, mode, notes)
      );
    },
    []
  );

  const handleBatchSetFullWorkDays = useCallback((standardDays: number) => {
    setAttendanceMap((prev) => {
      const next: Record<string, MonthlyAttendance> = { ...prev };
      for (const emp of employees) {
        const existing = next[emp.id] || createDefaultAttendance(emp.id, selectedMonth, standardDays);
        next[emp.id] = {
          ...existing,
          standardWorkDays: standardDays,
          actualWorkDays: standardDays
        };
      }
      return next;
    });
  }, [employees, selectedMonth]);

  // Import handler
  const handleImportSuccess = useCallback((imported: Employee[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setEmployees(imported);
      const newAtt: Record<string, MonthlyAttendance> = {};
      for (const emp of imported) {
        newAtt[emp.id] = createDefaultAttendance(emp.id, selectedMonth, 22);
      }
      setAttendanceMap(newAtt);
      setAdjustmentsMap({});
    } else {
      setEmployees((prev) => [...prev, ...imported]);
      setAttendanceMap((prev) => {
        const next = { ...prev };
        for (const emp of imported) {
          if (!next[emp.id]) {
            next[emp.id] = createDefaultAttendance(emp.id, selectedMonth, 22);
          }
        }
        return next;
      });
    }
    setActiveTab('employees');
  }, [selectedMonth]);

  // Excel full export
  const handleExportExcel = useCallback(() => {
    exportPayrollWorkbook(payrollItems, summary, legalConfig, companyProfile.companyName);
  }, [payrollItems, summary, legalConfig, companyProfile.companyName]);

  // Handle Tab Navigation (if user selects 'company', open CompanyProfileModal)
  const handleSelectTab = useCallback((tab: TabKey) => {
    if (tab === 'company') {
      setIsCompanyModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Privacy & Storage Status Banner */}
      <PrivacyBanner />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        employeeCount={employees.length}
        onLoadSampleData={handleLoadSampleData}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        storageStatus={storageStatus}
        hasStoredProfile={hasStoredProfileState}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
      />

      {/* Mobile / Hamburger Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        employeeCount={employees.length}
        onLoadSampleData={handleLoadSampleData}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        storageStatus={storageStatus}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            employees={employees}
            payrollItems={payrollItems}
            summary={summary}
            companyProfile={companyProfile}
            legalConfig={legalConfig}
            onNavigate={setActiveTab}
            onLoadSampleData={handleLoadSampleData}
            departments={departments}
            ranks={ranks}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeList
            employees={employees}
            onAddEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenImport={() => setActiveTab('import')}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDuplicateEmployee={handleDuplicateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onDeleteBatch={handleDeleteBatch}
            onBatchUpdateDepartment={handleBatchUpdateDepartment}
            onBatchUpdateRank={handleBatchUpdateRank}
            onBatchUpdateWorkingStatus={handleBatchUpdateWorkingStatus}
            onUpdateEmployee={handleSaveEmployee}
            departments={departments}
            ranks={ranks}
          />
        )}

        {activeTab === 'import' && (
          <ExcelImportModal
            onImportSuccess={handleImportSuccess}
            onClose={() => setActiveTab('employees')}
            existingCodes={existingCodes}
          />
        )}

        {activeTab === 'organization' && (
          <DepartmentRankManager
            employees={employees}
            departments={departments}
            ranks={ranks}
            onAddDepartment={(name) => setDepartments((prev) => [...prev, name])}
            onAddRank={(name) => setRanks((prev) => [...prev, name])}
            onBatchUpdateDepartment={handleBatchUpdateDepartment}
            onBatchUpdateRank={handleBatchUpdateRank}
          />
        )}

        {activeTab === 'salary-config' && (
          <SalaryConfigView
            employees={employees}
            onUpdateEmployee={handleSaveEmployee}
            onBatchApplySalaryType={handleBatchApplySalaryType}
            onBatchApplyInsuranceMode={handleBatchApplyInsuranceMode}
            legalConfig={legalConfig}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManager
            employees={employees}
            attendanceMap={attendanceMap}
            onUpdateAttendance={handleUpdateAttendance}
            onBatchSetFullWorkDays={handleBatchSetFullWorkDays}
            selectedMonth={selectedMonth}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollTable
            payrollItems={payrollItems}
            summary={summary}
            onOpenPayslip={(item) => setActivePayslipItem(item)}
            onExportExcel={handleExportExcel}
            departments={departments}
            companyProfile={companyProfile}
            legalConfig={legalConfig}
            selectedMonth={selectedMonth}
            onUpdateAdjustment={handleUpdateAdjustment}
            onUpdateAttendance={handleUpdateAttendance}
            onBatchUpdateAdjustments={handleBatchUpdateAdjustments}
          />
        )}

        {activeTab === 'payslip' && (
          <PayslipView
            payrollItems={payrollItems}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            companyProfile={companyProfile}
            legalConfig={legalConfig}
            onGoToAttendance={() => setActiveTab('attendance')}
            onGoToEmployees={() => setActiveTab('employees')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            payrollItems={payrollItems}
            summary={summary}
            legalConfig={legalConfig}
            onOpenPayslip={(item) => setActivePayslipItem(item)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            employees={employees}
            companyProfile={companyProfile}
            onSaveCompanyProfile={(p) => setCompanyProfile(p)}
            legalConfig={legalConfig}
            onUpdateLegalConfig={setCustomLegalConfig}
            onResetDefaultConfig={() => setCustomLegalConfig(null)}
            departments={departments}
            ranks={ranks}
            onAddDepartment={(name) => setDepartments((prev) => [...prev, name])}
            onAddRank={(name) => setRanks((prev) => [...prev, name])}
            onBatchUpdateDepartment={handleBatchUpdateDepartment}
            onBatchUpdateRank={handleBatchUpdateRank}
            storageStatus={storageStatus}
            hasStoredProfile={hasStoredProfileState}
            lastSavedAt={lastSavedAt}
            currentVaultRecord={currentVaultRecord}
            onEnableStorage={handleEnableStorage}
            onUnlockStorage={handleUnlockStorage}
            onChangePassword={handleChangePassword}
            onLockStorage={handleLockStorage}
            onDeleteStorageProfile={handleDeleteStorageProfile}
            onRestoreBackup={handleRestoreBackup}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        )}

        {activeTab === 'legal' && (
          <LegalRulesView
            legalConfig={legalConfig}
            onUpdateLegalConfig={setCustomLegalConfig}
            onResetDefaultConfig={() => setCustomLegalConfig(null)}
          />
        )}

        {activeTab === 'guide' && <UserGuideView />}
      </main>


      {/* Company / Organization Profile Modal */}
      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        profile={companyProfile}
        onSaveProfile={(p) => setCompanyProfile(p)}
      />

      {/* Storage and Encryption Management Modal */}
      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        storageStatus={storageStatus}
        hasStoredProfile={hasStoredProfileState}
        lastSavedAt={lastSavedAt}
        currentVaultRecord={currentVaultRecord}
        onEnableStorage={handleEnableStorage}
        onUnlockStorage={handleUnlockStorage}
        onChangePassword={handleChangePassword}
        onLockStorage={handleLockStorage}
        onDeleteStorageProfile={handleDeleteStorageProfile}
        onRestoreBackup={handleRestoreBackup}
      />

      {/* Employee Add/Edit Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        onDelete={handleDeleteEmployee}
        editingEmployee={editingEmployee}
        existingCodes={existingCodes}
        departments={departments}
        ranks={ranks}
        legalConfig={legalConfig}
      />

      {/* Batch Paste Employee Modal */}
      <BatchEmployeeModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onAddEmployees={(newEmps) => {
          setEmployees((prev) => [...prev, ...newEmps]);
        }}
        existingCodes={existingCodes}
      />

      {/* Detailed Payslip Preview & PNG Download Modal */}
      <PayslipModal
        item={activePayslipItem}
        onClose={() => setActivePayslipItem(null)}
        legalConfig={legalConfig}
        companyProfile={companyProfile}
      />

      {/* Complete Session Reset Modal */}
      <ResetSessionModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleClearSession}
        employeeCount={employees.length}
      />

      {/* Footer with Dopi GRIncome and Status */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-200">
              Dopi GRIncome – Hệ thống tính lương & Quản trị nhân sự chuẩn Việt Nam
            </div>
            <div className="text-[11px] text-slate-500">
              Mã hóa cục bộ AES-256-GCM trên thiết bị, xuất báo cáo Excel 5 sheet, chạy 100% trên trình duyệt.
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsCompanyModalOpen(true)} className="hover:text-blue-400">
              Thông tin tổ chức
            </button>
            <button onClick={() => setIsStorageModalOpen(true)} className="hover:text-blue-400">
              Lưu trữ mã hóa
            </button>
            <button onClick={() => setActiveTab('legal')} className="hover:text-blue-400">
              Căn cứ pháp lý
            </button>
            <button onClick={() => setActiveTab('guide')} className="hover:text-blue-400">
              Hướng dẫn
            </button>
            <button onClick={() => setIsResetModalOpen(true)} className="hover:text-rose-400">
              Xóa phiên
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
