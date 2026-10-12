'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Condo {
  id: number;
  name: string;
  slug: string;
  district: string;
}

export default function WriteReviewPage() {
  const router = useRouter();
  const [condos, setCondos] = useState<Condo[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch condos for select dropdown
    fetch('/api/condos?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.condos) setCondos(data.condos);
        if (data.condos && data.condos.length > 0) {
          setSelectedCondoId(String(data.condos[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกรีวิว');
      } else {
        setSuccess('ขอบคุณสำหรับรีวิว! ความคิดเห็นของคุณถูกบันทึกเรียบร้อย');
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
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
          <h1 className="section-title mt-2">✍️ เขียนรีวิวคอนโด</h1>
          <p className="section-subtitle">แบ่งปันประสบการณ์การอยู่อาศัยของคุณ เพื่อช่วยให้ผู้อื่นตัดสินใจได้ดียิ่งขึ้น</p>
        </div>

        {error && <div className="alert alert-danger mb-4">⚠️ {error}</div>}
        {success && <div className="alert alert-success mb-4">🎉 {success}</div>}

        <div className="card card-body" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">เลือกคอนโดที่คุณต้องการรีวิว *</label>
              <select
                className="form-control"
                value={selectedCondoId}
                onChange={e => setSelectedCondoId(e.target.value)}
                required
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
                    style={{
                      fontSize: '1.8rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? 'var(--warning)' : '#4a4860',
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
              <label className="form-label">หัวข้อรีวิว *</label>
              <input
                type="text"
                className="form-control"
                placeholder="เช่น ทำเลดี เดินทางสะดวก นิติดูแลดีมาก"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายละเอียดความประทับใจ *</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="บอกเล่าประสบการณ์การพักอาศัย บรรยากาศ สิ่งอำนวยความสะดวก ฯลฯ"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
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
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ กำลังส่งรีวิว...' : '🚀 โพสต์รีวิว'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
