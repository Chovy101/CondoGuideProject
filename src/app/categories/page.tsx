import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { query } from '@/lib/db';
import { getCategoryThaiName, renderCategoryIcon } from '@/lib/categories';

export const instant = false;

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  count?: number;
}

function CategoriesSkeleton() {
  return (
    <div className="page-wrap">
      <style>{`
        @keyframes catPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.8; }
        }
        .skeleton-box {
          background-color: var(--border-line);
          border-radius: var(--radius-sm);
          animation: catPulse 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div className="mb-4">
          <div className="skeleton-box" style={{ width: 180, height: 16, marginBottom: '0.65rem' }} />
          <div className="skeleton-box" style={{ width: 340, height: 38, marginBottom: '0.65rem' }} />
          <div className="skeleton-box" style={{ width: 'min(500px, 80%)', height: 18 }} />
        </div>

        <div className="grid grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card card-body" style={{ height: 210, display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="skeleton-box" style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)' }} />
                <div className="skeleton-box" style={{ width: 75, height: 24, borderRadius: 'var(--radius-xs)' }} />
              </div>
              <div className="skeleton-box" style={{ width: 140, height: 22, marginBottom: '0.75rem' }} />
              <div className="skeleton-box" style={{ width: '100%', height: 14, marginBottom: '0.5rem' }} />
              <div className="skeleton-box" style={{ width: '85%', height: 14, marginBottom: 'auto' }} />
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-line)' }}>
                <div className="skeleton-box" style={{ width: 110, height: 16 }} />
                <div className="skeleton-box" style={{ width: 45, height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function CategoriesContent() {
  await connection();
  const categories = await query<Category[]>(
    `SELECT cat.*, COUNT(c.id) as count
     FROM categories cat LEFT JOIN condos c ON cat.id = c.category_id AND c.is_active = 1
     GROUP BY cat.id ORDER BY count DESC`
  );

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
        <div className="mb-4">
          <div className="section-eyebrow">
            การจำแนกตามรูปแบบการอยู่อาศัย
          </div>
          <h1 style={{ fontSize: '2.2rem', marginTop: '0.2rem', marginBottom: '0.4rem' }}>
            ประเภทและรูปแบบการอยู่อาศัย
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            จัดกลุ่มตามไลฟ์สไตล์การใช้ชีวิตในเมือง ความสะดวกในการเดินทาง และขนาดพื้นที่
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
                  <span className="badge" style={{ backgroundColor: 'var(--bg-surface-muted)', color: 'var(--ink-secondary)' }}>
                    {cat.count || 0} โครงการ
                  </span>
                </div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--ink-primary)' }}>
                  {getCategoryThaiName(cat.slug || cat.name)}
                </h2>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
                  {cat.description}
                </p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-line)', fontSize: '0.85rem', color: 'var(--ink-primary)', fontWeight: 600 }}>
                  <span>ดูโครงการในหมวดนี้</span>
                  <span style={{ color: 'var(--sand-gold)' }}>สำรวจ</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </Suspense>
  );
}
