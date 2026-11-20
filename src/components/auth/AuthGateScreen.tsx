import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { mapFirebaseAuthError, useFirebase } from '../../contexts/FirebaseContext';
import { DEFAULT_PURCHASE_URL } from '../../types/license';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthGateScreen: React.FC = () => {
  const {
    user,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    signInWithGoogle,
    resendVerificationEmail,
    refreshEmailVerification,
    signOutUser
  } = useFirebase();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Signed in via Email/Password, waiting for email verification
  if (user && !user.emailVerified) {
    const handleCheckVerified = async () => {
      setErrorMsg('');
      setSuccessMsg('');
      setIsSubmitting(true);
      try {
        const verified = await refreshEmailVerification();
        if (!verified) {
          setErrorMsg(
            'Email chưa được xác minh. Vui lòng mở hộp thư (kiểm tra cả mục Thư rác / Spam), bấm vào liên kết xác nhận rồi thử lại.'
          );
        }
      } catch (err) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleResend = async () => {
      setErrorMsg('');
      setSuccessMsg('');
      setIsSubmitting(true);
      try {
        await resendVerificationEmail();
        setSuccessMsg('Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư của bạn.');
      } catch (err) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
              DG
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Xác minh địa chỉ email</h1>
              <p className="text-xs text-slate-500">Bảo vệ tài khoản & dữ liệu bảng lương của bạn</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
            Hệ thống đã gửi liên kết xác minh tới email{' '}
            <strong className="text-slate-900">{user.email}</strong>. Hãy bấm vào liên kết trong
            hộp thư, sau đó nhấn nút bên dưới để tiếp tục nhập mã key bản quyền.
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckVerified}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Tôi đã xác minh email</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResend}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Gửi lại email xác minh
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void signOutUser()}
              className="w-full py-2 px-4 text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất & đổi tài khoản khác</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await sendPasswordReset(trimmedEmail);
        setSuccessMsg(
          `Đã gửi liên kết đặt lại mật khẩu tới ${trimmedEmail}. Vui lòng kiểm tra hộp thư (kể cả mục Spam/Thư rác).`
        );
      } catch (err) {
        setErrorMsg(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần có tối thiểu 6 ký tự.');
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMsg('Vui lòng nhập họ và tên hoặc tên doanh nghiệp.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu nhập lại không khớp.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(trimmedEmail, password);
      } else {
        await registerWithEmail(displayName, trimmedEmail, password);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal Top Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-sm text-white shrink-0">
              DG
            </div>
            <span className="font-bold text-base tracking-tight whitespace-nowrap">
              Dopi GRIncome
            </span>
          </div>

          <a
            href={DEFAULT_PURCHASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <span>Mua key tại EduTech-Hub</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </header>

      {/* Main 2-Column Auth Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Clear Product Context */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-semibold text-blue-400">
                Phần mềm quản trị & tính lương doanh nghiệp
              </div>
              <h1 className="text-2xl font-bold text-white leading-snug text-balance">
                Đăng nhập để đồng bộ bảng lương an toàn trên đám mây
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dữ liệu nhân sự, chấm công, BHXH, thuế TNCN và phiếu lương của doanh nghiệp được
                lưu riêng theo từng tài khoản trên Firebase.
              </p>

              <div className="pt-4 border-t border-slate-800 space-y-3 text-xs text-slate-300">
                <div>
                  <div className="font-semibold text-white">1. Tạo hoặc đăng nhập tài khoản</div>
                  <p className="text-slate-400 mt-0.5">
                    Hỗ trợ Email/Mật khẩu (kèm khôi phục mật khẩu) và đăng nhập nhanh bằng Google.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-white">2. Kích hoạt mã key EduTech-Hub</div>
                  <p className="text-slate-400 mt-0.5">
                    Mỗi key bản quyền gắn cố định 1 tài khoản để mở khóa toàn bộ tính năng tính lương.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-white">3. Chuyển dữ liệu cũ dễ dàng</div>
                  <p className="text-slate-400 mt-0.5">
                    Nếu máy bạn đã có dữ liệu trước đây, bạn có thể nhập lên tài khoản đám mây chỉ với 1 bấm.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <a
                href={DEFAULT_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Chưa có key? Mua bản quyền tại EduTech-Hub</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Right Panel: Interactive Auth Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-5">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đăng ký
              </button>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  mode === 'forgot'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quên mật khẩu
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'login' && 'Đăng nhập tài khoản'}
                {mode === 'register' && 'Tạo tài khoản mới'}
                {mode === 'forgot' && 'Khôi phục mật khẩu'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login' && 'Nhập email và mật khẩu để truy cập không gian làm việc của bạn.'}
                {mode === 'register' && 'Đăng ký miễn phí, sau đó nhập key từ EduTech-Hub để mở khóa tính năng.'}
                {mode === 'forgot' && 'Nhập email đã đăng ký, hệ thống sẽ gửi liên kết đặt lại mật khẩu.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên / Tên đơn vị
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      placeholder="VD: Nguyễn Văn A hoặc Công ty TNHH ABC"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="email@congty.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhập lại mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : mode === 'login'
                      ? 'Đăng nhập'
                      : mode === 'register'
                        ? 'Đăng ký tài khoản'
                        : 'Gửi email khôi phục mật khẩu'}
                </span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {mode !== 'forgot' && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="px-3 text-xs text-slate-400">hoặc</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Tiếp tục với Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
