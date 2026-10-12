'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function EditCondoPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slug, setSlug] = useState('');

  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Record<string, string | boolean | number>>({
    name: '', slug: '', category_id: '', description: '', address: '',
    district: '', province: '', price_min: '', price_max: '',
    price_type: 'rent', bedrooms: '', bathrooms: '', area_min: '', area_max: '',
    floor_total: '', unit_total: '', year_built: '', facilities: '', image_url: '',
    image_alt: '', image_credit: '', image_is_illustrative: false,
    is_featured: false,
  });

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      Promise.all([
        fetch(`/api/condos/${p.slug}`).then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([condoData, catData]) => {
        if (condoData.condo) {
          const c = condoData.condo;
          setForm({
            name: c.name || '', slug: c.slug || '', category_id: c.category_id || '',
            description: c.description || '', address: c.address || '', district: c.district || '',
            province: c.province || 'กรุงเทพมหานคร', price_min: c.price_min || '',
            price_max: c.price_max || '', price_type: c.price_type || 'rent',
            bedrooms: c.bedrooms || '', bathrooms: c.bathrooms || '', area_min: c.area_min || '',
            area_max: c.area_max || '', floor_total: c.floor_total || '',
            unit_total: c.unit_total || '', year_built: c.year_built || '',
            facilities: c.facilities || '', image_url: c.image_url || '',
            image_alt: c.image_alt || '', image_credit: c.image_credit || '',
            image_is_illustrative: Boolean(c.image_is_illustrative),
            is_featured: Boolean(c.is_featured),
          });
        }
        setCategories(catData.categories || []);
        setFetching(false);
      });
    });
  }, [params]);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('slug', slug);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json();
      if (json.url) {
        set('image_url', json.url);
        setSuccess('อัปโหลดไฟล์รูปภาพเข้าสู่โปรเจกต์เรียบร้อย!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.error || 'อัปโหลดรูปไม่สำเร็จ');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        price_min: Number(form.price_min),
        price_max: Number(form.price_max),
        image_is_illustrative: form.image_is_illustrative ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
      };
      const res = await fetch(`/api/condos/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'เกิดข้อผิดพลาด'); }
      else { setSuccess('บันทึกสำเร็จ!'); setTimeout(() => router.push('/admin/condos'), 1500); }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally { setLoading(false); }
  };

  if (fetching) return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳ กำลังโหลด...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/condos" className="btn btn-secondary btn-sm">← กลับ</Link>
        <h1 style={{ fontSize: '1.6rem' }}>✏️ แก้ไขคอนโด: {form.name as string}</h1>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>📋 ข้อมูลทั่วไป</h3>
              <div className="form-group"><label className="form-label">ชื่อคอนโด</label><input className="form-control" value={form.name as string} onChange={e => set('name', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">หมวดหมู่</label>
                <select className="form-control" value={form.category_id as string} onChange={e => set('category_id', e.target.value)} required>
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">รายละเอียด</label><textarea className="form-control" value={form.description as string} onChange={e => set('description', e.target.value)} rows={4} /></div>
            </div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>📍 ที่ตั้ง</h3>
              <div className="form-group"><label className="form-label">ที่อยู่</label><input className="form-control" value={form.address as string} onChange={e => set('address', e.target.value)} /></div>
              <div className="grid grid-2">
                <div className="form-group"><label className="form-label">เขต</label><input className="form-control" value={form.district as string} onChange={e => set('district', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">จังหวัด</label><input className="form-control" value={form.province as string} onChange={e => set('province', e.target.value)} /></div>
              </div>
            </div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>🏗️ ข้อมูลโครงการ</h3>
              <div className="grid grid-2">
                <div className="form-group"><label className="form-label">ห้องนอน</label><input className="form-control" value={form.bedrooms as string} onChange={e => set('bedrooms', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">ห้องน้ำ</label><input className="form-control" value={form.bathrooms as string} onChange={e => set('bathrooms', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">พื้นที่ต่ำสุด</label><input className="form-control" type="number" value={form.area_min as string} onChange={e => set('area_min', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">พื้นที่สูงสุด</label><input className="form-control" type="number" value={form.area_max as string} onChange={e => set('area_max', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">สิ่งอำนวยความสะดวก</label><input className="form-control" value={form.facilities as string} onChange={e => set('facilities', e.target.value)} /></div>
            </div>
          </div>
          <div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>💰 ราคา</h3>
              <div className="form-group"><label className="form-label">ราคาต่ำสุด (บาท)</label><input className="form-control" type="number" value={form.price_min as string} onChange={e => set('price_min', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">ราคาสูงสุด (บาท)</label><input className="form-control" type="number" value={form.price_max as string} onChange={e => set('price_max', e.target.value)} /></div>
            </div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>🖼️ รูปถ่ายโครงการ</h3>

              <div className="form-group">
                <label className="form-label">อัปโหลดไฟล์รูปถ่าย (บันทึกเข้า /public/images/condos/[slug].jpg)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="form-control"
                  disabled={uploading}
                />
                {uploading && <div style={{ fontSize: '0.8rem', color: 'var(--sand-gold)', marginTop: '0.35rem' }}>⏳ กำลังอัปโหลดไฟล์...</div>}
              </div>

              <div className="form-group">
                <label className="form-label">URL / Path รูปในระบบ</label>
                <input
                  className="form-control"
                  placeholder={`/images/condos/${slug}.jpg`}
                  value={(form.image_url as string) || ''}
                  onChange={e => set('image_url', e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
                  ไฟล์ในเครื่อง: /images/condos/[slug].jpg (ห้ามลิงก์เว็บภายนอก)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alt text อธิบายภาพจริง</label>
                <input
                  className="form-control"
                  placeholder="เช่น ตึกคอนโด The Bangkok Sathorn มองจากถนนสาทร"
                  value={(form.image_alt as string) || ''}
                  onChange={e => set('image_alt', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">เครดิตภาพ (imageCredit - ไม่บังคับ)</label>
                <input
                  className="form-control"
                  placeholder="เช่น CondoGuide Editorial / ช่างภาพ"
                  value={(form.image_credit as string) || ''}
                  onChange={e => set('image_credit', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="flex items-center gap-3" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.image_is_illustrative)}
                    onChange={e => set('image_is_illustrative', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--sand-gold)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>ภาพประกอบ (แสดงป้าย &quot;ภาพประกอบ&quot; บนรูป)</span>
                </label>
              </div>

              {form.image_url && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>ตัวอย่างรูป:</div>
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 140, border: '1px solid var(--border-line)', position: 'relative' }}>
                    <img
                      src={form.image_url as string}
                      alt={(form.image_alt as string) || 'preview'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="card card-body mb-4">
              <h3 style={{ marginBottom: '1rem' }}>⚙️ ตั้งค่า</h3>
              <label className="flex items-center gap-3" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={Boolean(form.is_featured)} onChange={e => set('is_featured', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                <span>⭐ คอนโดแนะนำ</span>
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? '⏳ กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
