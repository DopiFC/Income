import React, { useState, useEffect, useRef } from 'react';
import {
  Employee,
  ContractType,
  SalaryType,
  RegionType,
  ResidencyStatus,
  WorkingStatus,
  WORKING_STATUS_OPTIONS
} from '../../types/employee';
import { LegalConfig } from '../../types/legal';
import { DEFAULT_LEGAL_CONFIG_2026 } from '../../legal/rules';
import {
  X, Check, AlertCircle, ChevronDown, ChevronUp, Plus, Minus, UserX
} from 'lucide-react';
import { parseVND, formatVNDNumber, formatLiveVNDInput, formatVND } from '../../utils/currency';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  editingEmployee?: Employee | null;
  existingCodes: Set<string>;
  departments: string[];
  ranks: string[];
  legalConfig?: LegalConfig;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingEmployee,
  existingCodes,
  departments,
  ranks,
  legalConfig = DEFAULT_LEGAL_CONFIG_2026
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Thông tin chính
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Kinh doanh & Tiếp thị');
  const [position, setPosition] = useState('Chuyên viên');
  const [rank, setRank] = useState('Cấp 3 - Chuyên viên');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractType, setContractType] = useState<ContractType>('official_fixed');
  const [salaryType, setSalaryType] = useState<SalaryType>('gross');
  const [baseSalary, setBaseSalary] = useState('15.000.000');
  const [workingStatus, setWorkingStatus] = useState<WorkingStatus>('active');
  const [statusNote, setStatusNote] = useState('');

  // Nâng cao: Bảo hiểm & Thuế
  const [useCustomInsurance, setUseCustomInsurance] = useState(false);
  const [insuranceSalary, setInsuranceSalary] = useState('');
  const [insuranceBasisMode, setInsuranceBasisMode] = useState<'contract' | 'regional_min' | 'custom'>('contract');
  const [region, setRegion] = useState<RegionType>('I');
  const [dependentsCount, setDependentsCount] = useState(0);
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>('resident');
  const [hasSocialInsurance, setHasSocialInsurance] = useState(true);
  const [hasHealthInsurance, setHasHealthInsurance] = useState(true);
  const [hasUnemploymentInsurance, setHasUnemploymentInsurance] = useState(true);
  const [hasTradeUnion, setHasTradeUnion] = useState(true);

  // Nâng cao: Phụ cấp
  const [lunchAllowance, setLunchAllowance] = useState('730.000');
  const [phoneAllowance, setPhoneAllowance] = useState('0');
  const [transportAllowance, setTransportAllowance] = useState('0');
  const [housingAllowance, setHousingAllowance] = useState('0');
  const [positionAllowance, setPositionAllowance] = useState('0');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const formBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingEmployee) {
        const empRegion = editingEmployee.region || 'I';
        const regionalMin = legalConfig.regionalMinWage[empRegion];
        setCode(editingEmployee.code);
        setFullName(editingEmployee.fullName);
        setDepartment(editingEmployee.department || 'Chưa phân bổ');
        setPosition(editingEmployee.position || '');
        setRank(editingEmployee.rank || '');
        setJoinDate(editingEmployee.joinDate || new Date().toISOString().split('T')[0]);
        setContractType(editingEmployee.contractType);
        setSalaryType(editingEmployee.salaryType);
        setBaseSalary(editingEmployee.baseSalary > 0 ? formatVNDNumber(editingEmployee.baseSalary) : '');
        setWorkingStatus(editingEmployee.workingStatus || 'active');
        setStatusNote(editingEmployee.statusNote || '');
        setUseCustomInsurance(editingEmployee.useCustomInsuranceSalary);
        setInsuranceSalary(
          editingEmployee.insuranceSalary && editingEmployee.insuranceSalary > 0
            ? formatVNDNumber(editingEmployee.insuranceSalary)
            : ''
        );
        if (!editingEmployee.useCustomInsuranceSalary) {
          setInsuranceBasisMode('contract');
        } else if (editingEmployee.insuranceSalary === regionalMin) {
          setInsuranceBasisMode('regional_min');
        } else {
          setInsuranceBasisMode('custom');
        }
        setRegion(empRegion);
        setDependentsCount(editingEmployee.dependentsCount || 0);
        setResidencyStatus(editingEmployee.residencyStatus || 'resident');
        setHasSocialInsurance(editingEmployee.hasSocialInsurance);
        setHasHealthInsurance(editingEmployee.hasHealthInsurance);
        setHasUnemploymentInsurance(editingEmployee.hasUnemploymentInsurance);
        setHasTradeUnion(editingEmployee.hasTradeUnion);
        setLunchAllowance(editingEmployee.lunchAllowance ? formatVNDNumber(editingEmployee.lunchAllowance) : '0');
        setPhoneAllowance(editingEmployee.phoneAllowance ? formatVNDNumber(editingEmployee.phoneAllowance) : '0');
        setTransportAllowance(editingEmployee.transportAllowance ? formatVNDNumber(editingEmployee.transportAllowance) : '0');
        setHousingAllowance(editingEmployee.housingAllowance ? formatVNDNumber(editingEmployee.housingAllowance) : '0');
        setPositionAllowance(editingEmployee.positionAllowance ? formatVNDNumber(editingEmployee.positionAllowance) : '0');
      } else {
        let counter = existingCodes.size + 1;
        let nextCode = `NV${String(counter).padStart(3, '0')}`;
        while (existingCodes.has(nextCode.toLowerCase())) {
          counter += 1;
          nextCode = `NV${String(counter).padStart(3, '0')}`;
        }
        setCode(nextCode);
        setFullName('');
        setDepartment(departments[0] || 'Kinh doanh & Tiếp thị');
        setPosition('Chuyên viên');
        setRank(ranks[2] || ranks[0] || 'Cấp 3 - Chuyên viên');
        setJoinDate(new Date().toISOString().split('T')[0]);
        setContractType('official_fixed');
        setSalaryType('gross');
        setBaseSalary('10.000.000');
        setWorkingStatus('active');
        setStatusNote('');
        setUseCustomInsurance(false);
        setInsuranceSalary('');
        setInsuranceBasisMode('contract');
        setRegion('I');
        setDependentsCount(0);
        setResidencyStatus('resident');
        setHasSocialInsurance(true);
        setHasHealthInsurance(true);
        setHasUnemploymentInsurance(true);
        setHasTradeUnion(true);
        setLunchAllowance('730.000');
        setPhoneAllowance('0');
        setTransportAllowance('0');
        setHousingAllowance('0');
        setPositionAllowance('0');
      }
      setErrors({});
      setShowAdvanced(false);

      setTimeout(() => {
        fullNameInputRef.current?.focus();
        formBodyRef.current?.scrollTo({ top: 0 });
      }, 60);
    }
  }, [editingEmployee, isOpen, departments, ranks, existingCodes, legalConfig]);

  const handleContractTypeChange = (ct: ContractType) => {
    setContractType(ct);
    if (ct === 'probation') {
      setHasSocialInsurance(false);
      setHasHealthInsurance(false);
      setHasUnemploymentInsurance(false);
      setHasTradeUnion(false);
    } else {
      setHasSocialInsurance(true);
      setHasHealthInsurance(true);
      setHasUnemploymentInsurance(true);
      setHasTradeUnion(true);
    }
  };

  const applyInsuranceBasisMode = (mode: 'contract' | 'regional_min' | 'custom', targetRegion: RegionType = region) => {
    setInsuranceBasisMode(mode);
    if (mode === 'contract') {
      setUseCustomInsurance(false);
      setInsuranceSalary('');
    } else if (mode === 'regional_min') {
      const minWage = legalConfig.regionalMinWage[targetRegion];
      setUseCustomInsurance(true);
      setInsuranceSalary(formatVNDNumber(minWage));
    } else {
      setUseCustomInsurance(true);
      if (!insuranceSalary) {
        const minWage = legalConfig.regionalMinWage[targetRegion];
        setInsuranceSalary(formatVNDNumber(minWage));
      }
    }
  };

  const handleRegionChange = (nextRegion: RegionType) => {
    setRegion(nextRegion);
    if (insuranceBasisMode === 'regional_min') {
      setInsuranceSalary(formatVNDNumber(legalConfig.regionalMinWage[nextRegion]));
    }
  };

  const handleSalaryPreset = (amount: number) => {
    setBaseSalary(formatVNDNumber(amount));
    if (errors.baseSalary) {
      setErrors((prev) => ({ ...prev, baseSalary: '' }));
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, string> = {};

    const cleanName = fullName.trim();
    if (!cleanName) {
      newErrors.fullName = 'Vui lòng nhập họ và tên nhân viên';
      setTimeout(() => {
        fullNameInputRef.current?.focus();
        formBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 40);
    }

    const cleanCode = code.trim();
    if (!cleanCode) {
      newErrors.code = 'Mã nhân viên không được để trống';
    } else if (
      (!editingEmployee || cleanCode.toLowerCase() !== editingEmployee.code.toLowerCase()) &&
      existingCodes.has(cleanCode.toLowerCase())
    ) {
      newErrors.code = 'Mã nhân viên này đã tồn tại';
    }

    const parsedBaseSalary = baseSalary.trim() === '' ? 0 : parseVND(baseSalary);
    if (isNaN(parsedBaseSalary) || parsedBaseSalary < 0) {
      newErrors.baseSalary = 'Mức lương không hợp lệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const parsedInsSalary = useCustomInsurance ? parseVND(insuranceSalary) : parsedBaseSalary;

    const employeeToSave: Employee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      code: cleanCode,
      fullName: cleanName,
      department: department.trim() || 'Chưa phân bổ',
      position: position.trim() || 'Nhân viên',
      rank: rank.trim() || 'Bậc 1',
      joinDate,
      contractType,
      salaryType,
      baseSalary: parsedBaseSalary,
      insuranceSalary: parsedInsSalary,
      useCustomInsuranceSalary: useCustomInsurance,
      region,
      dependentsCount: Math.max(0, dependentsCount),
      residencyStatus,
      hasSocialInsurance,
      hasHealthInsurance,
      hasUnemploymentInsurance,
      hasTradeUnion,
      lunchAllowance: parseVND(lunchAllowance),
      phoneAllowance: parseVND(phoneAllowance),
      transportAllowance: parseVND(transportAllowance),
      housingAllowance: parseVND(housingAllowance),
      positionAllowance: parseVND(positionAllowance),
      otherAllowances: editingEmployee?.otherAllowances || [],
      workingStatus,
      statusUpdatedAt:
        editingEmployee?.workingStatus !== workingStatus
          ? new Date().toISOString().split('T')[0]
          : editingEmployee?.statusUpdatedAt,
      statusNote: statusNote.trim() || undefined,
      bankAccount: editingEmployee?.bankAccount,
      bankName: editingEmployee?.bankName
    };

    onSave(employeeToSave);
    onClose();
  };

  if (!isOpen) return null;

  const parsedBaseSalaryPreview = baseSalary.trim() === '' ? 0 : parseVND(baseSalary);
  const regionalMinWage = legalConfig.regionalMinWage[region];
  const parsedCustomInsPreview = parseVND(insuranceSalary);
  const effectiveInsBase =
    contractType === 'probation' && !hasSocialInsurance
      ? 0
      : useCustomInsurance && parsedCustomInsPreview > 0
      ? parsedCustomInsPreview
      : parsedBaseSalaryPreview;
  const previewBhxh = hasSocialInsurance ? Math.round(effectiveInsBase * legalConfig.employeeRates.socialInsurance) : 0;
  const previewBhyt = hasHealthInsurance ? Math.round(effectiveInsBase * legalConfig.employeeRates.healthInsurance) : 0;
  const previewBhtn = hasUnemploymentInsurance ? Math.round(effectiveInsBase * legalConfig.employeeRates.unemploymentInsurance) : 0;
  const previewTotal105 = previewBhxh + previewBhyt + previewBhtn;

  const totalQuickAllowances =
    parseVND(lunchAllowance) +
    parseVND(phoneAllowance) +
    parseVND(transportAllowance) +
    parseVND(housingAllowance) +
    parseVND(positionAllowance);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-950/50 p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <form
        onSubmit={handleSave}
        className="relative w-full sm:max-w-xl bg-white rounded-t-xl sm:rounded-xl border border-slate-200 shadow-lg flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 bg-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-base truncate">
              {editingEmployee ? `Cập nhật: ${editingEmployee.fullName}` : 'Thêm nhân viên mới'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingEmployee ? `Mã NV: ${editingEmployee.code}` : 'Nhập thông tin cơ bản và mức lương'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single-Page Scrollable Body */}
        <div
          ref={formBodyRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm overscroll-contain"
        >
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên <span className="text-rose-600">*</span>
            </label>
            <input
              ref={fullNameInputRef}
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              placeholder="VD: Nguyễn Văn An"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium ${
                errors.fullName ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.fullName && (
              <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Mức lương thỏa thuận + Gross/Net */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-800">
                Mức lương thỏa thuận (VNĐ/tháng)
              </label>

              {/* Segmented Gross / Net */}
              <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setSalaryType('gross')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    salaryType === 'gross'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gross
                </button>
                <button
                  type="button"
                  onClick={() => setSalaryType('net')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    salaryType === 'net'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Net
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={baseSalary}
                onChange={(e) => {
                  setBaseSalary(formatLiveVNDInput(e.target.value));
                  if (errors.baseSalary) setErrors((prev) => ({ ...prev, baseSalary: '' }));
                }}
                placeholder="VD: 8.000.000"
                className={`w-full pl-3.5 pr-16 py-2.5 text-base sm:text-lg border rounded-lg bg-white font-bold text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-blue-600 ${
                  errors.baseSalary ? 'border-rose-500' : 'border-slate-300'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                VNĐ
              </span>
            </div>

            {errors.baseSalary && <p className="text-rose-600 text-xs">{errors.baseSalary}</p>}

            {/* Gợi ý nhanh */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {[6_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSalaryPreset(amt)}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 text-xs font-medium text-slate-700 shrink-0 transition-colors tabular-nums"
                >
                  {amt / 1_000_000} triệu
                </button>
              ))}
            </div>

            {/* Căn cứ đóng BHXH chọn nhanh ngay trong form chính */}
            <div className="pt-2.5 border-t border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Căn cứ đóng BHXH (Vùng {region})
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyInsuranceBasisMode('contract')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                      insuranceBasisMode === 'contract'
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    100% lương HĐ
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInsuranceBasisMode('regional_min')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap tabular-nums ${
                      insuranceBasisMode === 'regional_min'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    LTT Vùng {region} ({formatVNDNumber(regionalMinWage)}đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInsuranceBasisMode('custom')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                      insuranceBasisMode === 'custom'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Mức khác
                  </button>
                </div>
              </div>

              {insuranceBasisMode === 'custom' && (
                <input
                  type="text"
                  inputMode="numeric"
                  value={insuranceSalary}
                  onChange={(e) => setInsuranceSalary(formatLiveVNDInput(e.target.value))}
                  placeholder={`Nhập lương đóng BH (VD: ${formatVNDNumber(regionalMinWage)})`}
                  className="w-full px-3 py-1.5 text-sm border border-blue-400 rounded-lg bg-white tabular-nums font-semibold"
                />
              )}

              <div className="text-[11px] text-slate-600 tabular-nums flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Đóng trên: <strong className="text-slate-900">{formatVND(effectiveInsBase)}</strong>
                </span>
                <span>·</span>
                <span>
                  BHXH (8%): <strong className="text-rose-700">{formatVND(previewBhxh)}</strong>
                </span>
                <span>·</span>
                <span>
                  Tổng 10,5%: <strong className="text-slate-900">{formatVND(previewTotal105)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Mã NV, Phòng ban, Chức danh, Hợp đồng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã nhân viên <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
                }}
                placeholder="NV001"
                className={`w-full px-3 py-2 text-sm border rounded-lg font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-600 ${
                  errors.code ? 'border-rose-500 bg-rose-50/40' : 'border-slate-300 bg-white'
                }`}
              />
              {errors.code && <p className="text-rose-600 text-xs mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại hợp đồng</label>
              <select
                value={contractType}
                onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="official_fixed">Chính thức (Xác định TH)</option>
                <option value="official_indefinite">Chính thức (Không TH)</option>
                <option value="probation">Thử việc</option>
                <option value="part_time">Bán thời gian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng ban</label>
              <input
                type="text"
                list="dept-list-modal"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Chọn hoặc nhập phòng ban"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <datalist id="dept-list-modal">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chức danh</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Chuyên viên"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái làm việc</label>
              <select
                value={workingStatus}
                onChange={(e) => setWorkingStatus(e.target.value as WorkingStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {WORKING_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú trạng thái / nghỉ việc</label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="VD: Nộp đơn ngày 15/03..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Mục nâng cao thu gọn */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-2 text-left transition-colors"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800">
                  Tùy chọn nâng cao: Bảo hiểm, Thuế & Phụ cấp
                </div>
                <div className="text-[11px] text-slate-500 truncate tabular-nums">
                  {hasSocialInsurance ? 'Có BHXH' : 'Không BHXH'} · Vùng {region} · {dependentsCount} NPT · Phụ cấp {formatVND(totalQuickAllowances)}
                </div>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-3.5 sm:p-4 space-y-4 border-t border-slate-200 bg-white text-xs">
                {/* Cấp bậc & Ngày vào làm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cấp bậc</label>
                    <input
                      type="text"
                      list="rank-list-modal"
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    />
                    <datalist id="rank-list-modal">
                      {ranks.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày vào làm</label>
                    <input
                      type="date"
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Vùng, NPT, Cư trú */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Vùng tối thiểu</label>
                    <select
                      value={region}
                      onChange={(e) => handleRegionChange(e.target.value as RegionType)}
                      className="w-full px-2.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="I">Vùng I ({formatVNDNumber(legalConfig.regionalMinWage.I)})</option>
                      <option value="II">Vùng II ({formatVNDNumber(legalConfig.regionalMinWage.II)})</option>
                      <option value="III">Vùng III ({formatVNDNumber(legalConfig.regionalMinWage.III)})</option>
                      <option value="IV">Vùng IV ({formatVNDNumber(legalConfig.regionalMinWage.IV)})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Người phụ thuộc</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDependentsCount((prev) => Math.max(0, prev - 1))}
                        className="w-9 h-9 rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700"
                        title="Giảm 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={dependentsCount}
                        onChange={(e) => setDependentsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full text-center py-1.5 text-sm font-bold border border-slate-300 rounded-lg tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setDependentsCount((prev) => prev + 1)}
                        className="w-9 h-9 rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700"
                        title="Tăng 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cư trú thuế</label>
                    <select
                      value={residencyStatus}
                      onChange={(e) => setResidencyStatus(e.target.value as ResidencyStatus)}
                      className="w-full px-2.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="resident">Cư trú (Lũy tiến)</option>
                      <option value="non_resident">Không cư trú (20%)</option>
                    </select>
                  </div>
                </div>

                {/* Bảo hiểm */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">Bảo hiểm tham gia</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyInsuranceBasisMode('regional_min')}
                        className="text-xs font-medium text-emerald-700 hover:underline tabular-nums"
                      >
                        Lấy LTT Vùng {region} ({formatVNDNumber(regionalMinWage)}đ)
                      </button>
                      <label className="flex items-center gap-1.5 text-blue-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomInsurance}
                          onChange={(e) =>
                            applyInsuranceBasisMode(e.target.checked ? 'custom' : 'contract')
                          }
                          className="rounded text-blue-600"
                        />
                        <span>Mức đóng BH khác lương HĐ</span>
                      </label>
                    </div>
                  </div>

                  {useCustomInsurance && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={insuranceSalary}
                      onChange={(e) => {
                        setInsuranceBasisMode('custom');
                        setInsuranceSalary(formatLiveVNDInput(e.target.value));
                      }}
                      placeholder={`Nhập lương đóng BHXH (VD: ${formatVNDNumber(regionalMinWage)})`}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg tabular-nums font-semibold"
                    />
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'BHXH (8%)', checked: hasSocialInsurance, toggle: setHasSocialInsurance },
                      { label: 'BHYT (1.5%)', checked: hasHealthInsurance, toggle: setHasHealthInsurance },
                      { label: 'BHTN (1%)', checked: hasUnemploymentInsurance, toggle: setHasUnemploymentInsurance },
                      { label: 'Công đoàn', checked: hasTradeUnion, toggle: setHasTradeUnion }
                    ].map((ins) => (
                      <label
                        key={ins.label}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={ins.checked}
                          onChange={(e) => ins.toggle(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="font-medium text-slate-700">{ins.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Phụ cấp */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-800">Phụ cấp hàng tháng (VNĐ)</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Ăn trưa (miễn thuế ≤730k)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={lunchAllowance}
                        onChange={(e) => setLunchAllowance(formatLiveVNDInput(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Đi lại / Xăng xe</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={transportAllowance}
                        onChange={(e) => setTransportAllowance(formatLiveVNDInput(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Điện thoại</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={phoneAllowance}
                        onChange={(e) => setPhoneAllowance(formatLiveVNDInput(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Nhà ở</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={housingAllowance}
                        onChange={(e) => setHousingAllowance(formatLiveVNDInput(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Chức vụ / Trách nhiệm</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={positionAllowance}
                        onChange={(e) => setPositionAllowance(formatLiveVNDInput(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2.5">
          <div>
            {editingEmployee && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xác nhận nghỉ việc (xóa) nhân viên ${editingEmployee.fullName} (${editingEmployee.code})?`)) {
                    onDelete(editingEmployee.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs sm:text-sm text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <UserX className="w-4 h-4" />
                <span>Nghỉ việc (Xóa)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors whitespace-nowrap"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>{editingEmployee ? 'Cập nhật hồ sơ' : 'Lưu nhân viên'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
