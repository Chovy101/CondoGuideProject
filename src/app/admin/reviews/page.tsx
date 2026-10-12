'use client';
import { useState, useEffect } from 'react';

interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  user_name: string;
  condo_name: string;
  created_at: string;
  is_approved: boolean;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    const res = await fetch('/api/reviews');
    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('ลบรีวิวนี้?')) return;
    setDeleting(id);
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
    setMsg('ลบรีวิวสำเร็จ');
    fetchReviews();
    setDeleting(null);
    setTimeout(() => setMsg(''), 3000);
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>💬 จัดการรีวิว</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ทั้งหมด {reviews.length} รีวิว</p>
        </div>
      </div>

      {msg && <div className="alert alert-success mb-4">✅ {msg}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ผู้รีวิว</th>
              <th>คอนโด</th>
              <th>คะแนน</th>
              <th>หัวข้อ</th>
              <th>วันที่</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่มีรีวิว</td></tr>
            ) : (
              reviews.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{i + 1}</td>
                  <td style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.user_name || 'ผู้ใช้งาน'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.condo_name}</td>
                  <td>
                    <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>{stars(r.rating)}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 4 }}>({r.rating})</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                    >
                      {deleting === r.id ? '...' : '🗑️ ลบ'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
