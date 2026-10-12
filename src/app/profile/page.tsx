'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  condo_name: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newName, setNewName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/auth/login?redirect=/profile');
        } else {
          setUser(data.user);
          setNewName(data.user.name);
          fetchUserReviews();
        }
      })
      .catch(() => router.push('/auth/login?redirect=/profile'))
      .finally(() => setLoading(false));
  }, [router]);

  const fetchUserReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setUser({ ...user, name: newName });
    setIsEditing(false);
    setMsg('อัปเดตชื่อผู้ใช้เรียบร้อย');
    setTimeout(() => setMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-secondary)' }}>กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem', maxWidth: 900 }}>
        {msg && <div className="alert alert-success mb-4">✅ {msg}</div>}

        <div className="card card-body mb-6" style={{ padding: '2.25rem' }}>
          <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--ink-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 600, color: 'var(--ink-inverse)', flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: '1 1 240px' }}>
              <div className="flex items-center gap-2 mb-1">
                <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{user.name}</h1>
                <span className="badge" style={{
                  backgroundColor: user.role === 'admin' ? 'var(--bronze-soft)' : 'var(--bg-surface-muted)',
                  color: user.role === 'admin' ? 'var(--bronze)' : 'var(--ink-secondary)',
                  border: '1px solid var(--border-line)',
                }}>
                  {user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป'}
                </span>
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', margin: 0 }}>
                {user.email}
              </p>
            </div>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                แก้ไขชื่อที่แสดง
              </button>
              {user.role === 'admin' && (
                <Link href="/admin" className="btn btn-primary btn-sm">
                  แผงควบคุม Admin
                </Link>
              )}
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                ออกจากระบบ
              </button>
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleUpdateName} className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-line)' }}>
              <div className="form-group" style={{ maxWidth: 420 }}>
                <label className="form-label">ชื่อที่แสดงในระบบ</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm">บันทึก</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>ยกเลิก</button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Quick Navigation Panels */}
        <div className="grid grid-3 mb-6">
          <Link href="/condos">
            <div className="card card-body" style={{ height: '100%' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>🔍</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--ink-primary)' }}>สำรวจโครงการ</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: 0 }}>ค้นหาและกรองคอนโดตามทำเลจริง</p>
            </div>
          </Link>

          <Link href="/reviews/write">
            <div className="card card-body" style={{ height: '100%' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>✍️</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--ink-primary)' }}>เขียนรีวิวใหม่</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: 0 }}>แชร์ประสบการณ์จริงเพื่อผู้อื่น</p>
            </div>
          </Link>

          <Link href="/categories">
            <div className="card card-body" style={{ height: '100%' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>📂</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--ink-primary)' }}>ประเภทที่อยู่อาศัย</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: 0 }}>เลือกดูตามหมวดหมู่ไลฟ์สไตล์</p>
            </div>
          </Link>
        </div>

        {/* Review History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>ประวัติความคิดเห็นและรีวิว</h2>
            <Link href="/reviews/write" className="btn btn-secondary btn-sm">+ เขียนรีวิวโครงการอื่น</Link>
          </div>

          {reviews.length === 0 ? (
            <div className="card card-body text-center" style={{ padding: '3.5rem 1rem' }}>
              <p style={{ color: 'var(--ink-secondary)', marginBottom: '0.5rem' }}>คุณยังไม่มีประวัติการส่งความคิดเห็นหรือรีวิว</p>
              <Link href="/reviews/write" className="btn btn-primary btn-sm" style={{ display: 'inline-block' }}>
                เขียนรีวิวแรกของคุณ
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(rev => (
                <div key={rev.id} className="card card-body" style={{ padding: '1.25rem' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink-primary)' }}>
                      {rev.condo_name}
                    </span>
                    <span className="rating-stars" style={{ fontSize: '0.9rem' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4, color: 'var(--ink-primary)' }}>{rev.title}</div>
                  <p style={{ color: 'var(--ink-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{rev.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
