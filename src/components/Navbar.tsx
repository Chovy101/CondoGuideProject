'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function NavbarContent() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => { });
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUser(null);
    setDropOpen(false);
    router.push('/');
    router.refresh();
  };

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path)) ? 'active' : '';

  return (
    <nav className="navbar" aria-label="แถบนำทางหลัก">
      <div className="flex items-center gap-4">
        <Link href="/" className="navbar-brand">
          CondoGuide
          <span className="navbar-brand-mark">BKK</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-nav" style={{ display: 'flex' }}>
          <li><Link href="/" className={`nav-link ${isActive('/')}`}>หน้าแรก</Link></li>
          <li><Link href="/condos" className={`nav-link ${isActive('/condos')}`}>สำรวจคอนโด</Link></li>
          <li><Link href="/categories" className={`nav-link ${isActive('/categories')}`}>ประเภทที่อยู่อาศัย</Link></li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              id="user-menu-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => setDropOpen(!dropOpen)}
              aria-expanded={dropOpen}
              aria-haspopup="true"
            >
              <span style={{
                width: 24, height: 24, borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--ink-primary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-inverse)'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span>{user.name.split(' ')[0]}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--ink-muted)' }}>▼</span>
            </button>

            {dropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200,
                backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)', padding: '0.5rem', zIndex: 1000,
                boxShadow: 'var(--shadow-elevated)',
              }}>
                <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border-line)', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{user.email}</div>
                </div>
                <Link href="/profile" className="sidebar-item" onClick={() => setDropOpen(false)}>
                  โปรไฟล์และประวัติรีวิว
                </Link>
                <Link href="/reviews/write" className="sidebar-item" onClick={() => setDropOpen(false)}>
                  เขียนรีวิวคอนโด
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="sidebar-item" onClick={() => setDropOpen(false)}>
                    แผงควบคุม Admin
                  </Link>
                )}
                <button
                  id="logout-btn"
                  className="sidebar-item w-full"
                  style={{ color: 'var(--clay-alert)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={handleLogout}
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        ) : !pathname.startsWith('/auth') ? (
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn btn-secondary btn-sm">เข้าสู่ระบบ</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">สมัครสมาชิก</Link>
          </div>
        ) : null}

        {/* Mobile menu trigger */}
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }}
          id="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="เปิดเมนูนำทาง"
        >
          เมนู
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0,
          backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-strong)',
          padding: '1.25rem', zIndex: 998, display: 'flex', flexDirection: 'column', gap: '0.5rem',
          boxShadow: 'var(--shadow-elevated)'
        }}>
          <Link href="/" className={`nav-link ${isActive('/')}`} onClick={() => setMenuOpen(false)}>หน้าแรก</Link>
          <Link href="/condos" className={`nav-link ${isActive('/condos')}`} onClick={() => setMenuOpen(false)}>สำรวจคอนโด</Link>
          <Link href="/categories" className={`nav-link ${isActive('/categories')}`} onClick={() => setMenuOpen(false)}>ประเภทที่อยู่อาศัย</Link>
          <Link href="/team" className={`nav-link ${isActive('/team')}`} onClick={() => setMenuOpen(false)}>คณะผู้จัดทำ</Link>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="navbar" aria-label="แถบนำทางหลัก">
          <div className="flex items-center gap-4">
            <Link href="/" className="navbar-brand">
              CondoGuide
              <span className="navbar-brand-mark">BKK</span>
            </Link>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
