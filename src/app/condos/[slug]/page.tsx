import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { MapPin, Eye, Building, BedDouble, Bath, Maximize, Layers, KeyRound, Calendar } from 'lucide-react';
import { query, recordCondoDailyView } from '@/lib/db';
import ReviewSection from '@/components/ReviewSection';
import CondoCardImage from '@/components/CondoCardImage';
import { getCategoryThaiName } from '@/lib/categories';

interface Condo {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  description: string;
  address: string;
  district: string;
  province: string;
  price_min: number;
  price_max: number;
  price_type: string;
  bedrooms: string;
  bathrooms: string;
  area_min: number;
  area_max: number;
  floor_total: number;
  unit_total: number;
  year_built: number;
  facilities: string;
  image_url: string;
  image_alt?: string;
  image_credit?: string;
  image_is_illustrative?: boolean | number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  view_count: number;
}

interface Review {
  id: number;
  condo_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  created_at: string;
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('th-TH').format(p);
}

/**
 * Architectural Loading Skeleton for Condo Detail Page
 * Faithfully mirrors real page hierarchy with zero layout shift and supports prefers-reduced-motion.
 */
function CondoDetailSkeleton() {
  return (
    <div
      className="page-wrap condo-detail-skeleton"
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูลโครงการคอนโดมิเนียม"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <style>{`
        @keyframes condoPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.95; }
        }
        .condo-detail-skeleton .skeleton-pulse {
          background-color: var(--bg-surface-muted);
          border-radius: var(--radius-sm);
          animation: condoPulse 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .condo-detail-skeleton .skeleton-pulse {
            animation: none !important;
            opacity: 0.75 !important;
          }
        }
      `}</style>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Breadcrumb Skeleton */}
        <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1.25rem' }}>
          <div className="skeleton-pulse" style={{ width: 44, height: 14 }} />
          <span className="breadcrumb-sep" style={{ opacity: 0.4 }}>/</span>
          <div className="skeleton-pulse" style={{ width: 75, height: 14 }} />
          <span className="breadcrumb-sep" style={{ opacity: 0.4 }}>/</span>
          <div className="skeleton-pulse" style={{ width: 140, height: 14 }} />
        </div>

        {/* Badges Skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <div className="skeleton-pulse" style={{ width: 100, height: 26, borderRadius: 'var(--radius-xs)' }} />
          <div className="skeleton-pulse" style={{ width: 125, height: 26, borderRadius: 'var(--radius-xs)' }} />
        </div>

        {/* Title Skeleton */}
        <div
          className="skeleton-pulse"
          style={{ width: 'min(460px, 75%)', height: 38, marginBottom: '0.85rem', borderRadius: 'var(--radius-sm)' }}
        />

        {/* Location & Metadata Bar Skeleton */}
        <div className="flex items-center gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
          <div className="skeleton-pulse" style={{ width: 220, height: 18 }} />
          <div className="skeleton-pulse" style={{ width: 160, height: 18 }} />
          <div className="skeleton-pulse" style={{ width: 110, height: 18 }} />
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Left Column */}
          <div>
            {/* 16:10 Image Thumbnail Skeleton */}
            <div
              className="skeleton-pulse"
              style={{
                width: '100%',
                aspectRatio: '16 / 10',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-line)',
                marginBottom: '1.5rem',
              }}
            />

            {/* Description Card Skeleton */}
            <div className="card card-body mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="skeleton-pulse" style={{ width: 150, height: 20, marginBottom: '1rem' }} />
              <div className="skeleton-pulse" style={{ width: '100%', height: 15, marginBottom: '0.65rem' }} />
              <div className="skeleton-pulse" style={{ width: '92%', height: 15, marginBottom: '0.65rem' }} />
              <div className="skeleton-pulse" style={{ width: '70%', height: 15 }} />
            </div>

            {/* Architectural Specs Card Skeleton */}
            <div className="card card-body mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="skeleton-pulse" style={{ width: 200, height: 20, marginBottom: '1.1rem' }} />
              <div className="grid grid-2" style={{ gap: '0.85rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div className="skeleton-pulse" style={{ width: 24, height: 24, borderRadius: 'var(--radius-xs)' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-pulse" style={{ width: 60, height: 11, marginBottom: '0.4rem' }} />
                      <div className="skeleton-pulse" style={{ width: 90, height: 15 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities Card Skeleton */}
            <div className="card card-body mb-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="skeleton-pulse" style={{ width: 190, height: 20, marginBottom: '1rem' }} />
              <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                {[80, 110, 95, 120, 85].map((w, idx) => (
                  <div
                    key={idx}
                    className="skeleton-pulse"
                    style={{ width: w, height: 30, borderRadius: 'var(--radius-xs)' }}
                  />
                ))}
              </div>
            </div>

            {/* Reviews Card Skeleton */}
            <div className="card card-body" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="skeleton-pulse" style={{ width: 160, height: 20, marginBottom: '1rem' }} />
              <div className="skeleton-pulse" style={{ width: '100%', height: 75, borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>

          {/* Right Column (Sticky Pricing & Action Sidebar Skeleton) */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card card-body" style={{ backgroundColor: 'var(--bg-surface)', marginBottom: '1rem' }}>
              <div className="skeleton-pulse" style={{ width: 130, height: 13, marginBottom: '0.75rem' }} />
              <div className="skeleton-pulse" style={{ width: 190, height: 34, marginBottom: '1.25rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div className="skeleton-pulse" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-pulse" style={{ width: '100%', height: 44, borderRadius: 'var(--radius-sm)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Async Subcomponent: Performs request-time connection, dynamic param resolution, and data queries.
 */
async function CondoDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;

  const condos = await query<Condo[]>(
    `SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.color as category_color
     FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id
     WHERE c.slug = ? AND c.is_active = 1`,
    [slug]
  );

  if (!condos || condos.length === 0) notFound();
  const condo = condos[0];

  // Update view count and record aggregated daily view
  await query('UPDATE condos SET view_count = view_count + 1 WHERE slug = ?', [slug]);
  await recordCondoDailyView(condo.id);

  const reviews = await query<Review[]>(
    `SELECT r.*, u.name as user_name FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.condo_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`,
    [condo.id]
  );

  const realReviewCount = reviews.length;
  const realRating = realReviewCount > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / realReviewCount).toFixed(1))
    : 0;

  const facilities = condo.facilities ? condo.facilities.split(',').map(f => f.trim()) : [];

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">หน้าแรก</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href="/condos">สำรวจคอนโด</Link>
          <span className="breadcrumb-sep">/</span>
          <span style={{ color: 'var(--ink-secondary)' }}>{condo.name}</span>
        </div>

        {/* Header Badges */}
        <div className="flex items-center gap-3 mb-3" style={{ flexWrap: 'wrap' }}>
          <span className="badge" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--ink-primary)', border: '1px solid var(--border-line)' }}>
            {getCategoryThaiName(condo.category_name || '')}
          </span>
          {condo.slug === 'mandarin-oriental-residences' && (
            <span className="condo-card-featured" style={{ position: 'static' }}>
              มาตรฐาน 5 ดาวริมน้ำ
            </span>
          )}
          {condo.slug === 'the-bangkok-sathorn' && (
            <span className="condo-card-featured" style={{ position: 'static' }}>
              ลิฟต์ส่วนตัวทุกยูนิต
            </span>
          )}
          {condo.slug === 'ideo-mobi-sukhumvit-81' && (
            <span className="condo-card-featured" style={{ position: 'static' }}>
              ใกล้ BTS 250 ม.
            </span>
          )}
          {condo.slug === 'ritz-residence-sukhumvit' && (
            <span className="condo-card-featured" style={{ position: 'static' }}>
              คะแนนรีวิว 5.0★
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom: '0.6rem', color: 'var(--ink-primary)' }}>
          {condo.name}
        </h1>

        <div className="flex items-center gap-4 mb-6" style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
          <span className="flex items-center gap-1">
            <MapPin size={16} strokeWidth={1.8} style={{ color: 'var(--sand-gold)' }} />
            {condo.address}, เขต{condo.district}, {condo.province}
          </span>

          {realReviewCount > 0 ? (
            <span className="rating-stars">
              ★ {realRating.toFixed(1)}
              <span style={{ color: 'var(--ink-muted)', marginLeft: 4, fontWeight: 400 }}>
                ({realReviewCount} รีวิวจากผู้พักจริง)
              </span>
            </span>
          ) : (
            <span style={{ color: 'var(--ink-muted)' }}>
              ยังไม่มีรีวิว
            </span>
          )}

          <span className="flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
            <Eye size={15} strokeWidth={1.8} />
            เข้าชม {condo.view_count || 1} ครั้ง
          </span>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Left Column */}
          <div>
            {/* Main Architectural Thumbnail with Real Photography and Fallback */}
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: condo.image_credit ? '0.75rem' : '1.5rem', width: '100%', aspectRatio: '16 / 10', border: '1px solid var(--border-line)' }}>
              <CondoCardImage
                slug={condo.slug}
                name={condo.name}
                district={condo.district}
                floorTotal={condo.floor_total}
                imageUrl={condo.image_url}
                imageAlt={condo.image_alt}
                imageCredit={condo.image_credit}
                imageIsIllustrative={Boolean(condo.image_is_illustrative)}
                priority={true}
              />
            </div>
            {condo.image_credit && (
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginBottom: '1.25rem', textAlign: 'right', fontFamily: 'var(--font-thai)' }}>
                ภาพถ่าย: {condo.image_credit} {condo.image_is_illustrative ? '(ภาพประกอบ)' : ''}
              </div>
            )}

            {/* Description */}
            <div className="card card-body mb-4">
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', color: 'var(--ink-primary)' }}>
                รายละเอียดโครงการ
              </h2>
              <p style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>{condo.description}</p>
            </div>

            {/* Specs with Clean Lucide Icons */}
            <div className="card card-body mb-4">
              <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--ink-primary)' }}>
                ข้อมูลจำเพาะทางสถาปัตยกรรม
              </h2>
              <div className="grid grid-2" style={{ gap: '0.85rem' }}>
                {[
                  { label: 'รูปแบบห้องพัก', value: condo.bedrooms ? `${condo.bedrooms} นอน` : '-', Icon: BedDouble },
                  { label: 'ห้องน้ำ', value: condo.bathrooms ? `${condo.bathrooms} ห้องน้ำ` : '-', Icon: Bath },
                  { label: 'พื้นที่ใช้สอย', value: condo.area_min ? `${condo.area_min} - ${condo.area_max} ตร.ม.` : '-', Icon: Maximize },
                  { label: 'ความสูงอาคาร', value: condo.floor_total ? `${condo.floor_total} ชั้น` : '-', Icon: Layers },
                  { label: 'จำนวนยูนิตรวม', value: condo.unit_total ? `${condo.unit_total} ยูนิต` : '-', Icon: KeyRound },
                  { label: 'ปีที่ก่อสร้างแล้วเสร็จ', value: condo.year_built ? `พ.ศ. ${condo.year_built + 543} (${condo.year_built})` : '-', Icon: Calendar },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ color: 'var(--sand-gold)' }}>
                      <item.Icon size={20} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{item.label}</div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="card card-body mb-4">
                <h2 style={{ fontSize: '1.15rem', marginBottom: '0.85rem', color: 'var(--ink-primary)' }}>
                  สิ่งอำนวยความสะดวกในโครงการ
                </h2>
                <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  {facilities.map((f) => (
                    <span
                      key={f}
                      className="badge"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--ink-primary)',
                        border: '1px solid var(--border-line)',
                        fontSize: '0.82rem',
                        padding: '6px 12px',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <ReviewSection condoId={condo.id} condoName={condo.name} initialReviews={reviews} />
          </div>

          {/* Right Sidebar */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card card-body" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 4 }}>
                ประมาณการค่าเช่า / เดือน
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink-primary)', marginBottom: '1.25rem' }}>
                ฿{formatPrice(condo.price_min)}
                {condo.price_max > condo.price_min && (
                  <span style={{ fontSize: '1rem', color: 'var(--ink-secondary)', fontWeight: 400 }}> – {formatPrice(condo.price_max)}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                <Link
                  href={`/reviews/write?condo=${condo.id}&name=${encodeURIComponent(condo.name)}`}
                  className="btn btn-primary w-full"
                >
                  เขียนรีวิวโครงการนี้
                </Link>
                <Link href="/condos" className="btn btn-secondary w-full">
                  กลับสู่รายการทั้งหมด
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Root Page Component: Renders immediately with a Suspense boundary and Skeleton fallback,
 * enabling Next.js 16 Partial Prerendering and streaming without blocking routes.
 */
export default function CondoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<CondoDetailSkeleton />}>
      <CondoDetailContent params={params} />
    </Suspense>
  );
}
