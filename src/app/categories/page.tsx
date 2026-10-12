import Link from 'next/link';
import { query } from '@/lib/db';
import { getCategoryThaiName, renderCategoryIcon } from '@/lib/categories';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  count?: number;
}

export default async function CategoriesPage() {
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
