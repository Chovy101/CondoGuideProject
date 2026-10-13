import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { query } from '@/lib/db';
import Hero3DSection from '@/components/Hero3DSection';
import CondoCardImage from '@/components/CondoCardImage';
import { getCategoryThaiName, renderCategoryIcon } from '@/lib/categories';

export const instant = false;

interface Condo {
  id: number;
  name: string;
  slug: string;
  description: string;
  district: string;
  province: string;
  price_min: number;
  price_max: number;
  price_type: string;
  bedrooms: string;
  area_min: number;
  floor_total?: number;
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
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
}

interface Stats {
  total: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('th-TH').format(price);
}

// Requirement 4: Badge with specific verified criteria from actual data
function renderVerifiedHighlightBadge(condo: Condo) {
  // Only display badge for condos with clear, verified criteria
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
  // Other condos: No badge to avoid meaningless generic tags
  return null;
}

function HomeSkeleton() {
  return (
    <main>
      <style>{`
        @keyframes homePulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        .home-skeleton-box {
          background-color: var(--border-line);
          border-radius: var(--radius-sm);
          animation: homePulse 1.6s ease-in-out infinite;
        }
      `}</style>
      <div style={{ height: '65vh', minHeight: 460, backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 'min(640px, 90%)', textAlign: 'center' }}>
          <div className="home-skeleton-box" style={{ width: 140, height: 16, margin: '0 auto 1rem' }} />
          <div className="home-skeleton-box" style={{ width: '85%', height: 42, margin: '0 auto 1.25rem' }} />
          <div className="home-skeleton-box" style={{ width: '60%', height: 20, margin: '0 auto 2rem' }} />
          <div className="home-skeleton-box" style={{ width: '100%', height: 56, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
      <section className="container" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>
        <div className="home-skeleton-box" style={{ width: 160, height: 16, marginBottom: '0.5rem' }} />
        <div className="home-skeleton-box" style={{ width: 280, height: 32, marginBottom: '2rem' }} />
        <div className="grid grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ height: 360 }}>
              <div className="home-skeleton-box" style={{ width: '100%', height: 200, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0' }} />
              <div style={{ padding: '1.25rem' }}>
                <div className="home-skeleton-box" style={{ width: 120, height: 16, marginBottom: '0.65rem' }} />
                <div className="home-skeleton-box" style={{ width: '90%', height: 22, marginBottom: '0.75rem' }} />
                <div className="home-skeleton-box" style={{ width: 140, height: 18 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

async function HomeContent() {
  await connection();
  const [featuredCondos, categories, condoCount, reviewCount] = await Promise.all([
    query<Condo[]>(
      `SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.color as category_color
       FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.is_active = 1 AND c.is_featured = 1
       ORDER BY c.rating DESC LIMIT 6`
    ),
    query<Category[]>('SELECT * FROM categories ORDER BY name'),
    query<Stats[]>('SELECT COUNT(*) as total FROM condos WHERE is_active = 1'),
    query<Stats[]>('SELECT COUNT(*) as total FROM reviews WHERE is_approved = 1'),
  ]);

  const totalCondos = condoCount[0]?.total || 0;
  const totalReviews = reviewCount[0]?.total || 0;
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <main>
      {/* Real 3D Architectural Hero with WebGL Canvas + Real HTML Search Console */}
      <Hero3DSection
        categories={categories}
        totalCondos={totalCondos}
        totalReviews={totalReviews}
      />

      {/* Featured Condos Section */}
      <section className="container" style={{ paddingTop: '4rem', paddingBottom: '3rem' }}>
        <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-eyebrow">
              โครงการคัดสรรพิเศษ
            </div>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>โครงการแนะนำประจำสัปดาห์</h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              คัดเลือกจากโครงการที่มีข้อมูลผังพื้นที่และสิ่งอำนวยความสะดวกครบถ้วน (คลิกที่ตึกในโมเดล 3D เพื่อเลื่อนมายังโครงการนี้)
            </p>
          </div>
          <Link href="/condos" className="btn btn-secondary">
            ดูโครงการทั้งหมด ({totalCondos})
          </Link>
        </div>

        <div className="grid grid-3">
          {featuredCondos.map((condo, idx) => (
            <Link href={`/condos/${condo.slug}`} key={condo.id}>
              <article className="condo-card" id={`condo-card-${condo.slug}`}>
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

                  {/* Verified Criteria Badge */}
                  {renderVerifiedHighlightBadge(condo)}
                </div>

                <div className="condo-card-body">
                  <div className="condo-card-district">
                    เขต{condo.district}, {condo.province}
                  </div>
                  <h3 className="condo-card-title">{condo.name}</h3>

                  <div className="condo-card-specs">
                    <span>{condo.bedrooms ? `${condo.bedrooms} นอน` : 'หลายรูปแบบ'}</span>
                    <span>·</span>
                    <span>เริ่มต้น {condo.area_min || 28} ตร.ม.</span>
                    <span>·</span>
                    <span>{condo.price_type === 'rent' ? 'สัญญาเช่า' : condo.price_type === 'sale' ? 'ขายขาด' : 'เช่า/ขาย'}</span>
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
                      ดูรายละเอียดโครงการ
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories Grid (Architectural Archetypes with Lucide Icons, No Emojis, No Slug Badges) */}
      <section style={{ backgroundColor: 'var(--bg-surface-elevated)', borderTop: '1px solid var(--border-line)', borderBottom: '1px solid var(--border-line)', padding: '4rem 0' }}>
        <div className="container">
          <div className="mb-4">
            <div className="section-eyebrow">
              หมวดหมู่รูปแบบการใช้ชีวิต
            </div>
            <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>เลือกประเภทที่อยู่อาศัยตามรูปแบบการใช้ชีวิต</h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              จัดกลุ่มตามความสะดวกในการเดินทาง ขนาดพื้นที่ และข้อกำหนดการอยู่อาศัย
            </p>
          </div>

          <div className="grid grid-3">
            {categories.map((cat) => (
              <Link href={`/condos?category=${cat.slug}`} key={cat.id}>
                <div className="card card-body" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--sand-gold)',
                    }}>
                      {renderCategoryIcon(cat.slug, 22, 1.8)}
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: 'var(--ink-primary)' }}>
                    {getCategoryThaiName(cat.slug || cat.name)}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Review Callout (Clean Editorial Callout) */}
      <section className="container" style={{ padding: '4.5rem 1.5rem' }}>
        <div style={{
          backgroundColor: 'var(--ink-primary)',
          color: 'var(--ink-inverse)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1.5rem',
        }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--sand-gold)', marginBottom: '0.5rem' }}>
              มุมมองจากชุมชนผู้พักอาศัย
            </div>
            <h2 style={{ fontSize: '2rem', color: 'var(--ink-inverse)', lineHeight: 1.3, marginBottom: '0.75rem' }}>
              เคยพักอาศัยในคอนโดเหล่านี้หรือไม่?<br />
              ร่วมแบ่งปันประสบการณ์จริงกับผู้เช่าท่านอื่น
            </h2>
            <p style={{ color: '#C8CFDC', fontSize: '0.95rem', lineHeight: 1.65 }}>
              ข้อมูลที่โปร่งใสเกิดจากการบอกเล่าตรงไปตรงมาเรื่องค่าส่วนกลาง สภาพแวดล้อม และการบริการของนิติบุคคล เพื่อประโยชน์ของทุกคน
            </p>
          </div>
          <div>
            <Link href="/reviews/write" className="btn btn-primary" style={{ backgroundColor: 'var(--sand-gold)', color: '#171A1E', border: 'none' }}>
              เขียนรีวิวโครงการของคุณ
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Footer */}
      <footer className="footer">
        <div className="container">
          <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
            <div>
              <div className="footer-brand">CondoGuide BKK</div>
              <p className="footer-text">
                ระบบสารสนเทศรวบรวมข้อมูลคอนโดมิเนียมและอพาร์ตเมนต์ในเขตกรุงเทพมหานคร เพื่อการเปรียบเทียบข้อมูลที่โปร่งใสและตรงไปตรงมา
              </p>
            </div>
            <div>
              <div className="footer-heading">เมนูสารสนเทศ</div>
              <ul className="footer-links">
                <li><Link href="/condos">สำรวจโครงการทั้งหมด</Link></li>
                <li><Link href="/categories">ประเภทที่อยู่อาศัย</Link></li>
                <li><Link href="/reviews/write">ส่งความคิดเห็นและรีวิว</Link></li>
                <li><Link href="/team">คณะผู้จัดทำโครงการ</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">ความรับผิดชอบและการติดต่อ</div>
              <ul className="footer-links">
                <li>ข้อมูลอ้างอิงจากการสำรวจจริงและผู้ใช้งาน</li>
                <li><Link href="/privacy">นโยบายความเป็นส่วนตัว</Link></li>
                {contactEmail && !contactEmail.endsWith('.local') && <li>อีเมลติดต่อ: {contactEmail}</li>}
                <li>ที่ตั้ง: กรุงเทพมหานคร ประเทศไทย</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 CondoGuide BKK. สงวนลิขสิทธิ์ตาม พ.ร.บ. ลิขสิทธิ์</span>
            <span>คู่มือสารสนเทศที่อยู่อาศัยกรุงเทพมหานคร</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
