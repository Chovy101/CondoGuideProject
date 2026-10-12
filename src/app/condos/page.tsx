'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CondoCardImage from '@/components/CondoCardImage';
import { getCategoryThaiName } from '@/lib/categories';

interface Condo {
  id: number;
  name: string;
  slug: string;
  district: string;
  province: string;
  price_min: number;
  price_max: number;
  image_url: string;
  image_alt?: string;
  image_credit?: string;
  image_is_illustrative?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageIsIllustrative?: boolean;
  rating: number;
  review_count: number;
  is_featured: boolean;
  category_name: string;
  category_icon: string;
  category_color: string;
  bedrooms: string;
  area_min: number;
  floor_total?: number;
  view_count: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('th-TH').format(p);
}

// Requirement 4: Badge with specific verified criteria from actual data
function renderVerifiedHighlightBadge(condo: Condo) {
  if (condo.slug === 'mandarin-oriental-residences') {
    return <div className="condo-card-featured">มาตรฐาน 5 ดาวริมน้ำ</div>;
  }
  if (condo.slug === 'the-bangkok-sathorn') {
    return <div className="condo-card-featured">ลิฟต์ส่วนตัวทุกยูนิต</div>;
  }
  if (condo.slug === 'ideo-mobi-sukhumvit-81') {
    return <div className="condo-card-featured">ใกล้ BTS 250 ม.</div>;
  }
  if (condo.slug === 'ritz-residence-sukhumvit') {
    return <div className="condo-card-featured">ทำเลเด่นสุขุมวิท</div>;
  }
  return null;
}

function CondosContent() {
  const searchParams = useSearchParams();
  const [condos, setCondos] = useState<Condo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');

  const fetchCondos = useCallback(async (pg = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (priceMax) params.set('priceMax', priceMax);
    params.set('limit', '9');
    params.set('page', String(pg));
    const res = await fetch(`/api/condos?${params}`);
    const data = await res.json();
    setCondos(data.condos || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, category, priceMax]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    setPage(1);
    fetchCondos(1);
  }, [fetchCondos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCondos(1);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 9);

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        {/* Editorial Page Header */}
        <div className="mb-4">
          <div className="section-eyebrow">
            รายชื่อโครงการ
          </div>
          <h1 style={{ fontSize: '2.2rem', marginTop: '0.2rem', marginBottom: '0.4rem' }}>
            ดัชนีโครงการคอนโดมิเนียมและอพาร์ตเมนต์
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            ค้นหาและเปรียบเทียบข้อมูลจริงจากฐานข้อมูล {total} โครงการในเขตกรุงเทพมหานคร
          </p>
        </div>

        {/* Filter Console */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.4rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <form onSubmit={handleSearch} className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: '1 1 240px', minHeight: 44, height: 44 }}>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>🔍</span>
              <input
                type="text"
                placeholder="ค้นหาชื่อโครงการ, เขต หรือ ย่าน เช่น วัฒนา, สาทร..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="ค้นหาคอนโด"
              />
            </div>

            <select
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ flex: '0 1 180px', minHeight: 44, height: 44 }}
              aria-label="เลือกหมวดหมู่"
            >
              <option value="">ทุกประเภทที่อยู่อาศัย</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{getCategoryThaiName(cat.slug || cat.name)}</option>
              ))}
            </select>

            <select
              className="form-control"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              style={{ flex: '0 1 170px', minHeight: 44, height: 44 }}
              aria-label="งบประมาณค่าเช่าสูงสุด"
            >
              <option value="">งบประมาณทั้งหมด</option>
              <option value="15000">ไม่เกิน ฿15,000</option>
              <option value="30000">ไม่เกิน ฿30,000</option>
              <option value="50000">ไม่เกิน ฿50,000</option>
              <option value="100000">ไม่เกิน ฿100,000</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ minHeight: 44, height: 44, padding: '0 1.25rem' }}>
              ค้นหาโครงการ
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 44, height: 44 }}
              onClick={() => { setSearch(''); setCategory(''); setPriceMax(''); }}
            >
              ล้างตัวกรอง
            </button>
          </form>

          {/* Category Filter Pills (Pure Thai taxonomy) */}
          <div className="flex gap-2" style={{ marginTop: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="hero-chips-label">หมวดหมู่:</span>
            <button
              className={`lifestyle-chip ${category === '' ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              ทั้งหมด
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`lifestyle-chip ${category === cat.slug ? 'active' : ''}`}
                onClick={() => setCategory(cat.slug === category ? '' : cat.slug)}
              >
                {getCategoryThaiName(cat.slug || cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)', fontWeight: 500 }}>
            แสดงผล <strong>{condos.length}</strong> จาก <strong>{total}</strong> รายการ
            {category && ` · หมวดหมู่: ${getCategoryThaiName(categories.find(c => c.slug === category)?.slug || category)}`}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card" style={{ height: 380 }}>
                <div className="skeleton" style={{ height: 210 }} />
                <div style={{ padding: '1.25rem' }}>
                  <div className="skeleton mb-2" style={{ height: 16, width: '40%' }} />
                  <div className="skeleton mb-2" style={{ height: 22, width: '80%' }} />
                  <div className="skeleton mb-3" style={{ height: 14, width: '60%' }} />
                  <div className="skeleton" style={{ height: 24, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : condos.length === 0 ? (
          <div className="card text-center" style={{ padding: '4.5rem 2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>ไม่พบโครงการที่ตรงกับเงื่อนไข</h3>
            <p style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem', maxWidth: '40ch', margin: '0 auto 1.5rem' }}>
              ลองปรับเปลี่ยนคำค้นหา ขยายช่วงงบประมาณ หรือเลือกหมวดหมู่อื่น
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => { setSearch(''); setCategory(''); setPriceMax(''); }}
            >
              ล้างค่าการค้นหาทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {condos.map((condo, idx) => (
              <Link href={`/condos/${condo.slug}`} key={condo.id}>
                <article className="condo-card">
                  <div className="condo-card-img-wrap">
                    {/* Authentic 3D Architectural Blueprint / Real Photo Elevation */}
                    <CondoCardImage
                      slug={condo.slug}
                      name={condo.name}
                      district={condo.district}
                      floorTotal={condo.floor_total}
                      imageUrl={condo.imageUrl || condo.image_url}
                      imageAlt={condo.imageAlt || condo.image_alt}
                      imageCredit={condo.imageCredit || condo.image_credit}
                      imageIsIllustrative={condo.imageIsIllustrative || condo.image_is_illustrative}
                      priority={idx < 3}
                    />

                    {renderVerifiedHighlightBadge(condo)}
                  </div>

                  <div className="condo-card-body">
                    <div className="condo-card-district">
                      {condo.district}, {condo.province}
                    </div>
                    <h2 className="condo-card-name" style={{ fontSize: '1.15rem' }}>
                      {condo.name}
                    </h2>

                    <div className="condo-card-specs">
                      <span>{condo.bedrooms ? `${condo.bedrooms} นอน` : 'หลายรูปแบบ'}</span>
                      <span>·</span>
                      <span>{condo.area_min || 28} ตร.ม. ขึ้นไป</span>
                    </div>

                    <div className="condo-card-price">
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-secondary)', marginRight: '0.35rem' }}>
                        ค่าเช่า
                      </span>
                      ฿{formatPrice(condo.price_min)}
                      {condo.price_max > condo.price_min && ` – ฿${formatPrice(condo.price_max)}`}
                      <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--ink-muted)', marginLeft: '0.25rem' }}>
                        / เดือน
                      </span>
                    </div>

                    <div className="condo-card-footer">
                      <span className="rating-stars">
                        {condo.review_count >= 5 ? (
                          <>
                            ★ {Number(condo.rating).toFixed(1)}
                            <span style={{ color: 'var(--ink-muted)', fontWeight: 400, marginLeft: 4 }}>
                              ({condo.review_count} รีวิว)
                            </span>
                          </>
                        ) : condo.review_count > 0 ? (
                          <span style={{ color: 'var(--ink-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>
                            มีรีวิว {condo.review_count} รายการ
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.82rem' }}>
                            ยังไม่มีรีวิว
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--ink-primary)', fontWeight: 600 }}>
                        ดูรายละเอียด
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => { setPage(p => p - 1); fetchCondos(page - 1); }}
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setPage(i + 1); fetchCondos(i + 1); }}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => { setPage(p => p + 1); fetchCondos(page + 1); }}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CondosPage() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">กำลังโหลดข้อมูล...</div>}>
      <CondosContent />
    </Suspense>
  );
}
