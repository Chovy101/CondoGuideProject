'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Condo {
  id: number;
  name: string;
  slug: string;
  district: string;
}

interface ExistingReview {
  id: number;
  user_id: number;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
}

function WriteReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCondoId = searchParams.get('condo') || '';

  const [condos, setCondos] = useState<Condo[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState(preselectedCondoId);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch current user session
    fetch('/api/auth/session')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    // Fetch condos for select dropdown
    fetch('/api/condos?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.condos) {
          setCondos(data.condos);
          if (!preselectedCondoId && data.condos.length > 0) {
            setSelectedCondoId(String(data.condos[0].id));
          } else if (preselectedCondoId) {
            setSelectedCondoId(preselectedCondoId);
          }
        }
      })
      .catch(() => {});
  }, [preselectedCondoId]);

  // When selectedCondoId or currentUser changes, check if user already reviewed this condo
  useEffect(() => {
    if (!selectedCondoId || !currentUser) {
      setIsEditing(false);
      setEditingReviewId(null);
      return;
    }

    fetch(`/api/reviews?condo_id=${selectedCondoId}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        const reviews: ExistingReview[] = data?.reviews || [];
        const existing = reviews.find(r => r.user_id === currentUser.id);
        if (existing) {
          setIsEditing(true);
          setEditingReviewId(existing.id);
          setRating(existing.rating);
          setTitle(existing.title || '');
          setContent(existing.content || '');
          setPros(existing.pros || '');
          setCons(existing.cons || '');
        } else {
          setIsEditing(false);
          setEditingReviewId(null);
          setRating(5);
          setTitle('');
          setContent('');
          setPros('');
          setCons('');
        }
      })
      .catch(() => {});
  }, [selectedCondoId, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
      return;
    }

    if (title.trim().length < 3) {
      setError('หัวข้อรีวิวต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (content.trim().length < 10) {
      setError('รายละเอียดความประทับใจต้องมีความยาวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setLoading(true);

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
          setSuccess('แก้ไขรีวิวของคุณเรียบร้อยแล้ว! กำลังนำคุณไปยังหน้าโครงการ...');
          const targetCondo = condos.find(c => String(c.id) === selectedCondoId);
          setTimeout(() => {
            if (targetCondo?.slug) {
              router.push(`/condos/${targetCondo.slug}#reviews`);
            } else {
              router.push('/condos');
            }
            router.refresh();
          }, 1000);
        }
      } else {
        // Create new review
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            condo_id: Number(selectedCondoId),
            rating,
            title,
            content,
            pros,
            cons,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            setError('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
          } else {
            setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกรีวิว');
          }
        } else {
          setSuccess('ขอบคุณสำหรับรีวิว! ความคิดเห็นของคุณถูกบันทึกเรียบร้อย กำลังนำคุณไปยังหน้าโครงการ...');
          const targetCondo = condos.find(c => String(c.id) === selectedCondoId);
          setTimeout(() => {
            if (targetCondo?.slug) {
              router.push(`/condos/${targetCondo.slug}#reviews`);
            } else {
              router.push('/condos');
            }
            router.refresh();
          }, 1000);
        }
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: 720 }}>
        <div className="mb-4">
          <Link href="/condos" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ← กลับไปดูคอนโด
          </Link>
          <h1 className="section-title mt-2">
            {isEditing ? '✏️ แก้ไขรีวิวคอนโด' : '✍️ เขียนรีวิวคอนโด'}
          </h1>
          <p className="section-subtitle">
            {isEditing
              ? 'คุณเคยเขียนรีวิวโครงการนี้แล้ว สามารถปรับปรุงความคิดเห็นของคุณได้ที่นี่'
              : 'แบ่งปันประสบการณ์การอยู่อาศัยของคุณ เพื่อช่วยให้ผู้อื่นตัดสินใจได้ดียิ่งขึ้น'}
          </p>
        </div>

        {isEditing && (
          <div
            className="alert alert-info mb-4"
            role="status"
            aria-live="polite"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <span>ℹ️ คุณมีรีวิวสำหรับโครงการนี้อยู่แล้ว ระบบเปลี่ยนเข้าสู่โหมด <strong>แก้ไขรีวิว</strong> อัตโนมัติ</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-4" role="alert" aria-live="assertive">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4" role="status" aria-live="polite">
            🎉 {success}
          </div>
        )}

        {!currentUser && (
          <div className="alert alert-info mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span>คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว</span>
            <Link href="/auth/login" className="btn btn-sm btn-primary">
              เข้าสู่ระบบ
            </Link>
          </div>
        )}

        <div className="card card-body" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">เลือกคอนโดที่คุณต้องการรีวิว *</label>
              <select
                className="form-control"
                value={selectedCondoId}
                onChange={e => setSelectedCondoId(e.target.value)}
                required
                disabled={loading}
              >
                {condos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">คะแนนความพึงพอใจ *</label>
              <div className="flex gap-2 items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={loading}
                    style={{
                      fontSize: '1.8rem',
                      background: 'none',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: star <= rating ? 'var(--warning, #f59e0b)' : '#4a4860',
                      transition: 'transform 0.15s ease',
                      transform: star === rating ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    ★
                  </button>
                ))}
                <span style={{ marginLeft: 8, fontWeight: 700, color: 'var(--primary-light)' }}>
                  {rating} / 5 คะแนน
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">หัวข้อรีวิว * (อย่างน้อย 3 ตัวอักษร)</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น ทำเลดี เดินทางสะดวก นิติดูแลดีมาก"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายละเอียดความประทับใจ * (อย่างน้อย 10 ตัวอักษร)</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="บอกเล่าประสบการณ์การพักอาศัย บรรยากาศ สิ่งอำนวยความสะดวก ฯลฯ"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">👍 ข้อดี (Pros)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น สระว่ายน้ำใหญ่, ใกล้ BTS"
                  value={pros}
                  onChange={e => setPros(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">👎 ข้อสังเกต / ข้อเสีย (Cons)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ที่จอดรถน้อย, ค่าส่วนกลางสูง"
                  value={cons}
                  onChange={e => setCons(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                aria-busy={loading}
              >
                {loading
                  ? isEditing
                    ? '⏳ กำลังบันทึกการแก้ไข...'
                    : '⏳ กำลังส่งรีวิว...'
                  : isEditing
                  ? '✏️ บันทึกการแก้ไขรีวิว'
                  : '🚀 โพสต์รีวิว'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>กำลังโหลดแบบฟอร์ม...</div></div>}>
      <WriteReviewContent />
    </Suspense>
  );
}
