'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  FolderTree,
  MessageSquare,
  Users,
  Globe,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'แดชบอร์ด', href: '/admin', Icon: LayoutDashboard, exact: true },
  { label: 'โครงการคอนโด', href: '/admin/condos', Icon: Building },
  { label: 'หมวดหมู่ที่อยู่อาศัย', href: '/admin/categories', Icon: FolderTree },
  { label: 'ความคิดเห็นและรีวิว', href: '/admin/reviews', Icon: MessageSquare },
  { label: 'จัดการผู้ใช้งาน', href: '/admin/users', Icon: Users },
];

function AdminSidebarContent({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && href !== '/admin';

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink-primary)' }}>
          CondoGuide <span className="navbar-brand-mark">BKK</span>
        </Link>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>ระบบบริหารจัดการสารสนเทศ</div>
      </div>

      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-line)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-xs)', background: 'var(--ink-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-primary)' }}>{userName}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--sand-gold)', fontWeight: 600 }}>ผู้ดูแลระบบ (Administrator)</div>
      </div>

      <div className="sidebar-section">เมนูหลัก</div>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`sidebar-item ${isActive(item.href, item.exact) ? 'active' : ''}`}
        >
          <item.Icon size={18} strokeWidth={1.8} style={{ color: isActive(item.href, item.exact) ? 'var(--sand-gold)' : 'var(--ink-muted)' }} />
          <span>{item.label}</span>
        </Link>
      ))}

      <div className="sidebar-section" style={{ marginTop: '1.5rem' }}>ทางลัดอื่นๆ</div>
      <Link href="/" className="sidebar-item">
        <Globe size={18} strokeWidth={1.8} style={{ color: 'var(--ink-muted)' }} />
        <span>ดูหน้าเว็บไซต์หลัก</span>
      </Link>
      <button className="sidebar-item w-full" style={{ color: 'var(--clay-alert)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={handleLogout}>
        <LogOut size={18} strokeWidth={1.8} style={{ color: 'var(--clay-alert)' }} />
        <span>ออกจากระบบ</span>
      </button>
    </aside>
  );
}

export default function AdminSidebar({ userName }: { userName: string }) {
  return (
    <Suspense fallback={<aside className="admin-sidebar" />}>
      <AdminSidebarContent userName={userName} />
    </Suspense>
  );
}
