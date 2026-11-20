import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isPermissionError: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error?.message || 'Đã xảy ra lỗi không mong muốn.';
    let isPermissionError = false;

    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        isPermissionError =
          parsed.error.toLowerCase().includes('permission') ||
          parsed.error.toLowerCase().includes('insufficient');
        if (isPermissionError) {
          message =
            'Tài khoản chưa đủ quyền truy cập dữ liệu đám mây (có thể bản quyền đã hết hạn, bị thu hồi hoặc email chưa xác minh).';
        } else {
          message = parsed.error;
        }
      }
    } catch {
      isPermissionError = message.toLowerCase().includes('permission');
    }

    return {
      hasError: true,
      message,
      isPermissionError
    };
  }

  componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary caught:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleSignOut = async () => {
    try {
      await signOut(auth);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900">
                  {this.state.isPermissionError
                    ? 'Không thể truy cập dữ liệu Firebase'
                    : 'Đã xảy ra sự cố hệ thống'}
                </h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {this.state.message}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={this.handleSignOut}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
