'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  user_name: string;
  created_at: string;
}

function ReviewCard({ review }: { review: Review }) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const date = new Date(review.created_at).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-line)',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
      marginBottom: '1rem',
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-surface-muted)',
            border: '1px solid var(--border-line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-primary)', flexShrink: 0
          }}>
            {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
              {review.user_name || 'ผู้พักอาศัย'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              รีวิวเมื่อ {date}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="rating-stars" style={{ fontSize: '1rem' }}>{stars}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginLeft: 4 }}>
            ({review.rating}/5)
          </span>
        </div>
      </div>

      {review.title && (
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--ink-primary)' }}>
          {review.title}
        </h4>
      )}

      {review.content && (
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          {review.content}
        </p>
      )}

      {(review.pros || review.cons) && (
        <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid var(--border-line)' }}>
          {review.pros && (
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--transit-green)', fontWeight: 600, marginRight: 6 }}>
                จุดเด่น / ข้อดี:
              </span>
              <span style={{ color: 'var(--ink-secondary)' }}>{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--clay-alert)', fontWeight: 600, marginRight: 6 }}>
                ข้อสังเกต:
              </span>
              <span style={{ color: 'var(--ink-secondary)' }}>{review.cons}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewSection({
  condoId,
  condoName,
  initialReviews = [],
  reviews: directReviews = [],
}: {
  condoId: number;
  condoName?: string;
  initialReviews?: Review[];
  reviews?: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(
    initialReviews.length > 0 ? initialReviews : directReviews
  );
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ condo_id: condoId, rating, title, content, pros, cons }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setError('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    } else {
      setMsg('บันทึกรีวิวของคุณเรียบร้อยแล้ว ขอบคุณสำหรับข้อมูล');
      setShowForm(false);
      setTitle('');
      setContent('');
      setPros('');
      setCons('');
      const rRes = await fetch(`/api/reviews?condo_id=${condoId}`);
      const rData = await rRes.json();
      setReviews(rData.reviews || []);
      router.refresh();
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
            รีวิวและประสบการณ์จากผู้พักจริง ({reviews.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>
            ความคิดเห็นตรงไปตรงมาเพื่อช่วยประเมินการอยู่อาศัยจริง
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'ปิดฟอร์มรีวิว' : '+ เขียนรีวิวโครงการนี้'}
        </button>
      </div>

      {msg && <div className="alert alert-success mb-4">✅ {msg}</div>}

      {showForm && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          marginBottom: '2rem',
        }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink-primary)' }}>
            แบ่งปันประสบการณ์การอยู่อาศัย
          </h4>
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">คะแนนความพึงพอใจโดยรวม</label>
              <div className="flex gap-2 items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '1.6rem',
                      color: star <= rating ? 'var(--sand-gold)' : 'var(--border-strong)',
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginLeft: 8 }}>
                  {rating} จาก 5 ดาว
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">หัวข้อรีวิว *</label>
              <input
                className="form-control"
                placeholder="เช่น บรรยากาศเงียบสงบ นิติบุคคลดูแลดีมาก"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายละเอียดความคิดเห็น *</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="บอกเล่าประสบการณ์พักอาศัย การเดินทาง สิ่งอำนวยความสะดวก และสภาพแวดล้อมจริง..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">ข้อดี / จุดเด่นที่ประทับใจ</label>
                <input
                  className="form-control"
                  placeholder="เช่น ใกล้ BTS, ที่จอดรถเพียงพอ"
                  value={pros}
                  onChange={e => setPros(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ข้อสังเกต / สิ่งที่ควรปรับปรุง</label>
                <input
                  className="form-control"
                  placeholder="เช่น ค่าส่วนกลางสูง, ซอยแคบช่วงเร่งด่วน"
                  value={cons}
                  onChange={e => setCons(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'กำลังส่งข้อมูล...' : 'เผยแพร่รีวิว'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-line)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: 'var(--ink-secondary)',
        }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>ยังไม่มีรีวิวสำหรับโครงการนี้</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.35rem' }}>
            หากคุณเคยพักอาศัยหรือเข้าชมโครงการนี้ สามารถเขียนรีวิวคนแรกได้เลย
          </p>
        </div>
      ) : (
        reviews.map(review => <ReviewCard key={review.id} review={review} />)
      )}
    </div>
  );
}
