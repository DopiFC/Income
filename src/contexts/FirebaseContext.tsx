import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import {
  DEFAULT_LICENSE_SETTINGS,
  LicenseEvaluation,
  LicenseSettingsDoc,
  UserProfileDoc
} from '../types/license';
import {
  ensureUserProfile,
  evaluateLicenseStatus,
  getLicenseSettings
} from '../services/licenseService';

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký tài khoản. Vui lòng chuyển sang tab Đăng nhập hoặc Quên mật khẩu.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng sử dụng tối thiểu 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.';
    case 'auth/popup-closed-by-user':
      return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép popup để đăng nhập Google.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền Internet.';
    case 'auth/operation-not-allowed':
      return 'Phương thức Đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console (Authentication → Sign-in method → Email/Password). Bạn có thể bật trong Firebase Console hoặc dùng nút Tiếp tục với Google.';
    case 'auth/unauthorized-domain':
      return 'Tên miền hiện tại chưa được cấp phép trong Firebase Authentication (Authorized domains).';
    default:
      return error instanceof Error
        ? error.message
        : 'Không thể thực hiện xác thực. Vui lòng thử lại.';
  }
}

interface FirebaseContextValue {
  user: User | null;
  profile: UserProfileDoc | null;
  licenseEval: LicenseEvaluation;
  licenseSettings: LicenseSettingsDoc;
  isAuthReady: boolean;
  isProfileLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (displayName: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  refreshLicenseSettings: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [licenseSettings, setLicenseSettings] = useState<LicenseSettingsDoc>(DEFAULT_LICENSE_SETTINGS);
  const [verificationTick, setVerificationTick] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setIsProfileLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshLicenseSettings = useCallback(async () => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    try {
      const cfg = await getLicenseSettings();
      setLicenseSettings(cfg);
    } catch {
      setLicenseSettings(DEFAULT_LICENSE_SETTINGS);
    }
  }, []);

  // Only attach Firestore listeners after auth is ready AND email is verified
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeProfile: (() => void) | null = null;
    setIsProfileLoading(true);

    const bootstrap = async () => {
      try {
        await ensureUserProfile(user);
        if (cancelled) return;

        void refreshLicenseSettings();

        const userPath = `users/${user.uid}`;
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfileDoc);
            } else {
              setProfile(null);
            }
            setIsProfileLoading(false);
          },
          (error) => {
            setIsProfileLoading(false);
            handleFirestoreError(error, OperationType.GET, userPath);
          }
        );
      } catch (err) {
        if (!cancelled) {
          setIsProfileLoading(false);
          console.error('Failed to initialize user profile:', err);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user, user?.emailVerified, verificationTick, refreshLicenseSettings]);

  const licenseEval = useMemo(() => evaluateLicenseStatus(profile), [profile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const registerWithEmail = useCallback(
    async (displayName: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = displayName.trim().slice(0, 120);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      await sendEmailVerification(cred.user);
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('Phiên đăng nhập không tồn tại.');
    }
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshEmailVerification = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);
    setUser(auth.currentUser);
    setVerificationTick((t) => t + 1);
    return verified;
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const value = useMemo<FirebaseContextValue>(
    () => ({
      user,
      profile,
      licenseEval,
      licenseSettings,
      isAuthReady,
      isProfileLoading,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      signInWithGoogle,
      resendVerificationEmail,
      refreshEmailVerification,
      signOutUser,
      refreshLicenseSettings
    }),
    [
      user,
      profile,
      licenseEval,
      licenseSettings,
      isAuthReady,
      isProfileLoading,
      signInWithEmail,
      registerWithEmail,
      sendPasswordReset,
      signInWithGoogle,
      resendVerificationEmail,
      refreshEmailVerification,
      signOutUser,
      refreshLicenseSettings
    ]
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
