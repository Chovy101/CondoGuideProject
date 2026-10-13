'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

interface Review {
  id: number;
  condo_id?: number;
  user_id?: number;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  user_name: string;
  created_at: string;
  updated_at?: string;
}

function ReviewCard({
  review,
  isOwnReview = false,
  onEdit,
}: {
  review: Review;
  isOwnReview?: boolean;
  onEdit?: () => void;
}) {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const date = new Date(review.created_at).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: isOwnReview ? '1.5px solid var(--accent-teal, #245842)' : '1px solid var(--border-line)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-surface-muted)',
              border: '1px solid var(--border-line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--ink-primary)',
              flexShrink: 0,
            }}
          >
            {review.user_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{review.user_name || 'ผู้พักอาศัย'}</span>
              {isOwnReview && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: 'var(--accent-teal, #245842)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.5rem',
                  }}
                >
                  รีวิวของคุณ
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              รีวิวเมื่อ {date}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <span className="rating-stars" style={{ fontSize: '1rem' }}>{stars}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginLeft: 4 }}>
              ({review.rating}/5)
            </span>
          </div>
          {isOwnReview && onEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onEdit}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
            >
              ✏️ แก้ไข
            </button>
          )}
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
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Keep reviews in sync if initialReviews prop updates from server
  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  // Check login state
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Find if current logged-in user already wrote a review for this condo
  const myReview = currentUser ? reviews.find(r => r.user_id === currentUser.id) : null;

  const handleStartEdit = (rev: Review) => {
    setIsEditing(true);
    setShowForm(false);
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setTitle(rev.title || '');
    setContent(rev.content || '');
    setPros(rev.pros || '');
    setCons(rev.cons || '');
    setError('');
    setMsg('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowForm(false);
    setEditingReviewId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนส่งรีวิว');
      return;
    }

    if (title.trim().length < 3) {
      setError('หัวข้อรีวิวต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (content.trim().length < 10) {
      setError('รายละเอียดความคิดเห็นต้องมีความยาวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && editingReviewId) {
        // Edit existing review
        const res = await fetch('/api/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingReviewId,
            rating,
            title,
            content,
            pros,
            cons,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'เกิดข้อผิดพลาดในการแก้ไขรีวิว');
        } else {
          setMsg(data.message || 'แก้ไขรีวิวของคุณเรียบร้อยแล้ว');
          setIsEditing(false);
          setEditingReviewId(null);

          if (data.review) {
            setReviews(prev =>
              prev.map(r => (r.id === data.review.id ? { ...r, ...data.review } : r))
            );
          }
          router.refresh();
        }
      } else {
        // Create new review
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
            setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกรีวิว');
          }
        } else {
          setMsg(data.message || 'บันทึกรีวิวของคุณเรียบร้อยแล้ว ขอบคุณสำหรับข้อมูล');
          setShowForm(false);
          setTitle('');
          setContent('');
          setPros('');
          setCons('');

          // Optimistically prepend the new review immediately
          if (data.review) {
            setReviews(prev => [data.review, ...prev.filter(r => r.id !== data.review.id)]);
          }

          router.refresh();
        }
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
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

        {myReview ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (isEditing) {
                handleCancel();
              } else {
                handleStartEdit(myReview);
              }
            }}
          >
            {isEditing ? 'ปิดฟอร์มแก้ไข' : '✏️ แก้ไขรีวิวของคุณ'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowForm(!showForm);
              setError('');
            }}
          >
            {showForm ? 'ปิดฟอร์มรีวิว' : '+ เขียนรีวิวโครงการนี้'}
          </button>
        )}
      </div>

      {/* Global Success Notification */}
      {msg && (
        <div
          className="alert alert-success mb-4"
          role="status"
          aria-live="polite"
        >
          ✅ {msg}
        </div>
      )}

      {/* If user already reviewed and is not editing: Display user's existing review with Edit button */}
      {myReview && !isEditing && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1.5px solid var(--accent-teal, #245842)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
          }}
        >
          <div className="flex items-center justify-between mb-2" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="flex items-center gap-2">
              <span
                className="badge"
                style={{
                  backgroundColor: 'var(--accent-teal, #245842)',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              >
                ✓ คุณเคยเขียนรีวิวโครงการนี้แล้ว (จำกัด 1 รีวิวต่อ 1 โครงการ)
              </span>
              <span className="rating-stars" style={{ fontSize: '0.95rem' }}>
                {'★'.repeat(myReview.rating) + '☆'.repeat(5 - myReview.rating)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                ({myReview.rating}/5)
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleStartEdit(myReview)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              ✏️ แก้ไขรีวิว
            </button>
          </div>

          {myReview.title && (
            <h4 style={{ fontSize: '1.02rem', fontWeight: 600, margin: '0.35rem 0 0.5rem', color: 'var(--ink-primary)' }}>
              {myReview.title}
            </h4>
          )}

          {myReview.content && (
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.6 }}>
              {myReview.content}
            </p>
          )}

          {(myReview.pros || myReview.cons) && (
            <div
              className="flex flex-col gap-1 pt-2 mt-2"
              style={{ borderTop: '1px solid var(--border-line)', fontSize: '0.82rem' }}
            >
              {myReview.pros && (
                <div>
                  <span style={{ color: 'var(--transit-green)', fontWeight: 600, marginRight: 6 }}>จุดเด่น:</span>
                  <span style={{ color: 'var(--ink-secondary)' }}>{myReview.pros}</span>
                </div>
              )}
              {myReview.cons && (
                <div>
                  <span style={{ color: 'var(--clay-alert)', fontWeight: 600, marginRight: 6 }}>ข้อสังเกต:</span>
                  <span style={{ color: 'var(--ink-secondary)' }}>{myReview.cons}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form Section: Rendered when creating a new review (when no existing review) OR editing */}
      {(showForm || isEditing) && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            marginBottom: '2rem',
          }}
        >
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink-primary)' }}>
            {isEditing
              ? `✏️ แก้ไขรีวิวของคุณ ${condoName ? `(${condoName})` : ''}`
              : `แบ่งปันประสบการณ์การอยู่อาศัย ${condoName ? `(${condoName})` : ''}`}
          </h4>

          {/* Form Error Banner */}
          {error && (
            <div
              className="alert alert-danger mb-3"
              role="alert"
              aria-live="assertive"
            >
              ⚠️ {error}
            </div>
          )}

          {!currentUser && (
            <div
              className="alert alert-info mb-4"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
            >
              <span>คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว</span>
              <Link
                href="/auth/login"
                className="btn btn-sm btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <LogIn size={14} /> เข้าสู่ระบบ
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">คะแนนความพึงพอใจโดยรวม *</label>
              <div className="flex gap-2 items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={submitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: submitting ? 'not-allowed' : 'pointer',
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
              <label className="form-label">หัวข้อรีวิว * (อย่างน้อย 3 ตัวอักษร)</label>
              <input
                className="form-control"
                placeholder="เช่น บรรยากาศเงียบสงบ นิติบุคคลดูแลดีมาก"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายละเอียดความคิดเห็น * (อย่างน้อย 10 ตัวอักษร)</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="บอกเล่าประสบการณ์พักอาศัย การเดินทาง สิ่งอำนวยความสะดวก และสภาพแวดล้อมจริง..."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ข้อสังเกต / สิ่งที่ควรปรับปรุง</label>
                <input
                  className="form-control"
                  placeholder="เช่น ค่าส่วนกลางสูง, ซอยแคบช่วงเร่งด่วน"
                  value={cons}
                  onChange={e => setCons(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting
                  ? isEditing
                    ? 'กำลังบันทึกการแก้ไข...'
                    : 'กำลังบันทึกรีวิว...'
                  : isEditing
                  ? 'บันทึกการแก้ไขรีวิว'
                  : 'เผยแพร่รีวิว'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-line)',
            borderRadius: 'var(--radius-md)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--ink-secondary)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.95rem' }}>ยังไม่มีรีวิวสำหรับโครงการนี้</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.35rem' }}>
            หากคุณเคยพักอาศัยหรือเข้าชมโครงการนี้ สามารถเขียนรีวิวคนแรกได้เลย
          </p>
        </div>
      ) : (
        reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            isOwnReview={currentUser ? review.user_id === currentUser.id : false}
            onEdit={() => handleStartEdit(review)}
          />
        ))
      )}
    </div>
  );
}
