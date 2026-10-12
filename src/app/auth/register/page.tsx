'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-specific error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const router = useRouter();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('กรุณากรอกอีเมล');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
      isValid = false;
    }

    // Check password length (min 8 chars)
    if (password.length < 8) {
      setPasswordError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      isValid = false;
    }

    // Check password confirmation
    if (password !== confirm) {
      setConfirmError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.error?.includes('อีเมลนี้ถูกใช้งานแล้ว')) {
          setEmailError('อีเมลนี้ถูกใช้งานแล้ว');
        } else if (data.error?.includes('รูปแบบอีเมล')) {
          setEmailError(data.error);
        } else if (data.error?.includes('รหัสผ่าน')) {
          setPasswordError(data.error);
        } else {
          setGeneralError(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        }
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setGeneralError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        marginTop: '64px',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-ground)',
        padding: '2.5rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header with Consistent Site Brand Logo Link */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link
            href="/"
            className="navbar-brand"
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              fontSize: '1.45rem',
              marginBottom: '1.25rem',
              color: 'var(--ink-primary)',
              textDecoration: 'none',
            }}
            aria-label="กลับสู่หน้าแรก CondoGuide BKK"
          >
            CondoGuide
            <span className="navbar-brand-mark">BKK</span>
          </Link>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '0.45rem',
            }}
          >
            สมัครสมาชิก
          </h1>
          <p
            style={{
              color: 'var(--ink-secondary)',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              maxWidth: '36ch',
              margin: '0 auto',
              textWrap: 'balance',
            }}
          >
            สร้างบัญชีผู้ใช้งานเพื่อบันทึกโครงการโปรดและร่วมเขียนรีวิว
          </p>
        </div>

        {/* Register Card */}
        <div className="card card-body" style={{ padding: '2rem 1.75rem', backgroundColor: 'var(--bg-surface)' }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Name Field */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reg-name" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                ชื่อ-นามสกุล
              </label>
              <input
                id="reg-name"
                type="text"
                className="form-control"
                placeholder="กรอกชื่อและนามสกุลของคุณ"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
                style={{
                  minHeight: '44px',
                  fontSize: '0.92rem',
                }}
              />
            </div>

            {/* Email Field with Under-field Error Message */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reg-email" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                อีเมล
              </label>
              <input
                id="reg-email"
                type="email"
                className="form-control"
                placeholder="your@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                autoComplete="email"
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'reg-email-error' : undefined}
                style={{
                  minHeight: '44px',
                  fontSize: '0.92rem',
                  borderColor: emailError ? 'var(--clay-alert)' : undefined,
                }}
              />
              {emailError && (
                <div
                  id="reg-email-error"
                  role="alert"
                  aria-live="polite"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--clay-alert)',
                    marginTop: '0.35rem',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Password Field with Helper Text & Under-field Error Message */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="reg-password" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                รหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="กรอกรหัสผ่านที่ต้องการ"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'reg-password-error reg-password-help' : 'reg-password-help'}
                  style={{
                    minHeight: '44px',
                    fontSize: '0.92rem',
                    paddingRight: '2.75rem',
                    borderColor: passwordError ? 'var(--clay-alert)' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.35rem',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Helper Text */}
              <div
                id="reg-password-help"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--ink-muted)',
                  marginTop: '0.35rem',
                }}
              >
                อย่างน้อย 8 ตัวอักษร
              </div>

              {/* Password Length / Validity Error */}
              {passwordError && (
                <div
                  id="reg-password-error"
                  role="alert"
                  aria-live="polite"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--clay-alert)',
                    marginTop: '0.35rem',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field with Under-field Error Message */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="reg-confirm" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                ยืนยันรหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="กรอกรหัสผ่านอีกครั้งเพื่อยืนยัน"
                  value={confirm}
                  onChange={e => {
                    setConfirm(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!confirmError}
                  aria-describedby={confirmError ? 'reg-confirm-error' : undefined}
                  style={{
                    minHeight: '44px',
                    fontSize: '0.92rem',
                    paddingRight: '2.75rem',
                    borderColor: confirmError ? 'var(--clay-alert)' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'ซ่อนรหัสผ่านยืนยัน' : 'แสดงรหัสผ่านยืนยัน'}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.35rem',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password Match Error */}
              {confirmError && (
                <div
                  id="reg-confirm-error"
                  role="alert"
                  aria-live="polite"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--clay-alert)',
                    marginTop: '0.35rem',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{confirmError}</span>
                </div>
              )}
            </div>

            {/* General Error Banner (Fallback for network/server errors) */}
            {generalError && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  backgroundColor: 'rgba(184, 58, 36, 0.08)',
                  border: '1px solid rgba(184, 58, 36, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.9rem',
                  color: 'var(--clay-alert)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  lineHeight: 1.45,
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>{generalError}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="register-btn"
              type="submit"
              className="btn btn-primary w-full"
              style={{
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังสร้างบัญชี...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>สมัครสมาชิก</span>
                </>
              )}
            </button>

            {/* Privacy Policy Notice */}
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--ink-muted)',
                textAlign: 'center',
                marginTop: '1rem',
                lineHeight: 1.5,
              }}
            >
              การสมัครถือว่าคุณยอมรับ
              <Link
                href="/privacy"
                style={{
                  color: 'var(--gold-text)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  marginLeft: '0.25rem',
                }}
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </form>
        </div>

        {/* Link to Login */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
          มีบัญชีอยู่แล้ว?{' '}
          <Link
            href="/auth/login"
            style={{
              color: 'var(--gold-text)',
              fontWeight: 600,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </main>
  );
}
