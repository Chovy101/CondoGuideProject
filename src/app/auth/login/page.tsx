'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-ground)',
        padding: '2.5rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header with Consistent Site Brand Logo */}
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
            เข้าสู่ระบบ
          </h1>
          <p
            style={{
              color: 'var(--ink-secondary)',
              fontSize: '0.92rem',
              lineHeight: 1.5,
              maxWidth: '34ch',
              margin: '0 auto',
            }}
          >
            เข้าสู่ระบบเพื่อบันทึกโครงการที่สนใจและเขียนรีวิว
          </p>
        </div>

        {/* Login Card */}
        <div className="card card-body" style={{ padding: '2rem 1.75rem', backgroundColor: 'var(--bg-surface)' }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="email" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{
                  minHeight: '44px',
                  fontSize: '0.92rem',
                }}
              />
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" className="form-label" style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                รหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{
                    minHeight: '44px',
                    fontSize: '0.92rem',
                    paddingRight: '2.75rem',
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
            </div>

            {/* Error Message with aria-live */}
            {error && (
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
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-btn"
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
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Development Test Account Notice (Strictly shown only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--ink-muted)',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px dashed var(--border-line)',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--bg-surface-muted)',
                  color: 'var(--ink-secondary)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: 600,
                  marginRight: '0.4rem',
                  letterSpacing: '0.04em',
                }}
              >
                DEV ONLY
              </span>
              บัญชีทดสอบ: <strong style={{ color: 'var(--ink-primary)' }}>admin@condoguide.com</strong> /{' '}
              <strong style={{ color: 'var(--ink-primary)' }}>password</strong>
            </div>
          )}
        </div>

        {/* Link to Register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
          ยังไม่มีบัญชี?{' '}
          <Link href="/auth/register" style={{ color: 'var(--sand-gold)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
          กำลังโหลด...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
