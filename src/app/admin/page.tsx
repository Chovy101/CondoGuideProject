import { Suspense } from 'react';
import { query } from '@/lib/db';
import { connection } from 'next/server';
import Link from 'next/link';
import {
  Building2,
  Users,
  MessageSquare,
  Layers,
  Star,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react';
import AdminDashboardCharts, {
  CondoViewItem,
  CategoryDistItem,
  RatingDistItem,
  PriceRangeItem,
  DateCountItem,
  DailyViewTrendItem,
} from '@/components/admin/AdminDashboardCharts';

interface DashStats {
  condos: number;
  users: number;
  reviews: number;
  categories: number;
  featured: number;
}

interface CondoRow {
  name: string;
  slug: string;
  rating: number;
  view_count: number;
  price_min: number;
  category_name: string;
}

interface ReviewRow {
  rating: number;
  title: string;
  created_at: string;
  user_name: string;
  condo_name: string;
}

interface CategoryRawStat {
  name: string;
  icon: string;
  color: string;
  count: number;
}

interface RatingRawStat {
  rating: number;
  count: number;
}

interface ReviewDateRawStat {
  review_date: string;
  count: number;
}

interface DailyViewRawStat {
  view_date: string;
  total_views: number;
}

export const instant = false;

function formatThaiDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function AdminDashboardSkeleton() {
  return (
    <div>
      <style>{`
        @keyframes adminPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        .admin-skel-box {
          background-color: var(--border-line);
          border-radius: var(--radius-sm);
          animation: adminPulse 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="admin-skel-box" style={{ width: 180, height: 28, marginBottom: 8 }} />
          <div className="admin-skel-box" style={{ width: 300, height: 16 }} />
        </div>
      </div>
      <div className="grid grid-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card card-body" style={{ height: 100 }}>
            <div className="admin-skel-box" style={{ width: 90, height: 14, marginBottom: 12 }} />
            <div className="admin-skel-box" style={{ width: 60, height: 28 }} />
          </div>
        ))}
      </div>
      <div className="card card-body" style={{ height: 320, marginBottom: '2rem' }}>
        <div className="admin-skel-box" style={{ width: 180, height: 20, marginBottom: 16 }} />
        <div className="admin-skel-box" style={{ width: '100%', height: 240 }} />
      </div>
    </div>
  );
}

async function AdminDashboardContent({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  await connection();
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedRange = resolvedParams.range || '30d';

  // Compute cutoff date for time-series charts
  let cutoffDate: string | null = null;
  const now = Date.now();
  if (selectedRange === '7d') {
    cutoffDate = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
  } else if (selectedRange === '30d') {
    cutoffDate = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  } else if (selectedRange === '90d') {
    cutoffDate = new Date(now - 90 * 86400000).toISOString().slice(0, 10);
  }

  // 1. Core Summary Metrics
  const [condoCount, userCount, reviewCount, categoryCount, featuredCount] = await Promise.all([
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM condos WHERE is_active = 1'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM users'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM reviews WHERE is_approved = 1'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM categories'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM condos WHERE is_featured = 1 AND is_active = 1'),
  ]);

  const stats: DashStats = {
    condos: condoCount[0]?.total || 0,
    users: userCount[0]?.total || 0,
    reviews: reviewCount[0]?.total || 0,
    categories: categoryCount[0]?.total || 0,
    featured: featuredCount[0]?.total || 0,
  };

  // 2. Chart 1: Top Views by Condo (Horizontal Bar Chart)
  const condosByViews = await query<Array<{ name: string; slug: string; view_count: number }>>(
    `SELECT name, slug, view_count FROM condos WHERE is_active = 1 ORDER BY view_count DESC LIMIT 8`
  );
  const viewsByCondo: CondoViewItem[] = (condosByViews || []).map(c => ({
    name: c.name,
    slug: c.slug,
    view_count: Number(c.view_count) || 0,
  }));

  // 3. Chart 2: Category Distribution (Donut Chart)
  const categoryStats = await query<CategoryRawStat[]>(
    `SELECT cat.name, cat.icon, cat.color, COUNT(c.id) as count
     FROM categories cat LEFT JOIN condos c ON cat.id = c.category_id AND c.is_active = 1
     GROUP BY cat.id, cat.name, cat.color ORDER BY count DESC`
  );
  const totalCategoryCondos = categoryStats.reduce((sum, c) => sum + Number(c.count), 0) || 1;
  const categoryDistribution: CategoryDistItem[] = (categoryStats || []).map(cat => ({
    name: cat.name,
    count: Number(cat.count),
    percentage: Number(((Number(cat.count) / totalCategoryCondos) * 100).toFixed(1)),
    color: cat.color || '#C8963E',
  }));

  // 4. Chart 3: Review Rating Distribution (1–5 Stars)
  const ratingStats = await query<RatingRawStat[]>(
    `SELECT rating, COUNT(*) as count FROM reviews WHERE is_approved = 1 GROUP BY rating ORDER BY rating ASC`
  );
  const ratingMap = new Map<number, number>();
  (ratingStats || []).forEach(r => ratingMap.set(Number(r.rating), Number(r.count)));
  const totalApprovedReviews = Array.from(ratingMap.values()).reduce((a, b) => a + b, 0) || 1;
  const ratingDistribution: RatingDistItem[] = [1, 2, 3, 4, 5].map(starNum => {
    const count = ratingMap.get(starNum) || 0;
    return {
      star: `${starNum} ดาว`,
      rating: starNum,
      count,
      percentage: Number(((count / totalApprovedReviews) * 100).toFixed(1)),
    };
  });

  // 5. Chart 4: Price Ranges by Condo (Floating Bar Chart)
  const condosByPrice = await query<Array<{ name: string; slug: string; price_min: number; price_max: number }>>(
    `SELECT name, slug, price_min, price_max FROM condos WHERE is_active = 1 ORDER BY price_min ASC`
  );
  const priceRanges: PriceRangeItem[] = (condosByPrice || []).map(c => {
    const min = Number(c.price_min) || 0;
    const max = Number(c.price_max) || min;
    return {
      name: c.name,
      slug: c.slug,
      price_min: min,
      price_max: max,
      price_diff: Math.max(0, max - min),
    };
  });

  // 6. Chart 5: Reviews Trend by Time Range (Line Chart)
  let reviewsTrendSql = `
    SELECT DATE(created_at) as review_date, COUNT(*) as count
    FROM reviews
    WHERE is_approved = 1
  `;
  const reviewsTrendParams: unknown[] = [];
  if (cutoffDate) {
    reviewsTrendSql += ` AND created_at >= ?`;
    reviewsTrendParams.push(cutoffDate);
  }
  reviewsTrendSql += ` GROUP BY review_date ORDER BY review_date ASC`;

  const reviewsTrendData = await query<ReviewDateRawStat[]>(reviewsTrendSql, reviewsTrendParams);
  const reviewsTrend: DateCountItem[] = (reviewsTrendData || []).map(r => ({
    date: String(r.review_date),
    dateLabel: formatThaiDateLabel(String(r.review_date)),
    count: Number(r.count),
  }));

  // 7. Chart 6: Daily Views Trend from condo_daily_views (Area Chart)
  let dailyViewsSql = `
    SELECT view_date, SUM(view_count) as total_views
    FROM condo_daily_views
  `;
  const dailyViewsParams: unknown[] = [];
  if (cutoffDate) {
    dailyViewsSql += ` WHERE view_date >= ?`;
    dailyViewsParams.push(cutoffDate);
  }
  dailyViewsSql += ` GROUP BY view_date ORDER BY view_date ASC`;

  const dailyViewsData = await query<DailyViewRawStat[]>(dailyViewsSql, dailyViewsParams);
  const dailyViewsTrend: DailyViewTrendItem[] = (dailyViewsData || []).map(v => ({
    date: String(v.view_date),
    dateLabel: formatThaiDateLabel(String(v.view_date)),
    views: Number(v.total_views),
  }));

  // 8. Recent Activities
  const [recentCondos, recentReviews] = await Promise.all([
    query<CondoRow[]>(
      `SELECT c.name, c.slug, c.rating, c.view_count, c.price_min, cat.name as category_name
       FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.is_active = 1 ORDER BY c.created_at DESC LIMIT 5`
    ),
    query<ReviewRow[]>(
      `SELECT r.rating, r.title, r.created_at, u.name as user_name, c.name as condo_name
       FROM reviews r 
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN condos c ON r.condo_id = c.id
       ORDER BY r.created_at DESC LIMIT 5`
    ),
  ]);

  const statCards = [
    {
      icon: <Building2 size={20} strokeWidth={2} />,
      label: 'คอนโดทั้งหมด',
      value: stats.condos,
      color: '#1E293B',
      bg: 'rgba(30, 41, 59, 0.08)',
    },
    {
      icon: <Users size={20} strokeWidth={2} />,
      label: 'ผู้ใช้งานในระบบ',
      value: stats.users,
      color: '#245842',
      bg: 'rgba(36, 88, 66, 0.08)',
    },
    {
      icon: <MessageSquare size={20} strokeWidth={2} />,
      label: 'รีวิวที่อนุมัติแล้ว',
      value: stats.reviews,
      color: '#C8963E',
      bg: 'rgba(200, 150, 62, 0.1)',
    },
    {
      icon: <Layers size={20} strokeWidth={2} />,
      label: 'หมวดหมู่ที่อยู่อาศัย',
      value: stats.categories,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.08)',
    },
    {
      icon: <Star size={20} strokeWidth={2} />,
      label: 'คอนโดแนะนำ (Featured)',
      value: stats.featured,
      color: '#C8963E',
      bg: 'rgba(200, 150, 62, 0.1)',
    },
  ];

  return (
    <div>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart3 size={28} style={{ color: 'var(--sand-gold)' }} />
            แดชบอร์ดภาพรวมระบบ
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
            ภาพรวมสถิติ ข้อมูลวิเคราะห์เชิงลึก และกิจกรรมล่าสุดของ CondoGuide BKK
          </p>
        </div>
        <Link href="/admin/condos/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} />
          เพิ่มคอนโดใหม่
        </Link>
      </div>

      {/* Primary KPI Metric Cards (Clean Lucide Icons, No Emojis) */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {statCards.map(s => (
          <div
            key={s.label}
            className="card card-body"
            style={{
              padding: '1.25rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-line)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: s.bg,
                color: s.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-primary)', lineHeight: 1.2 }}>
                {s.value.toLocaleString('th-TH')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Statistical Charts Component (Client Component) */}
      <AdminDashboardCharts
        viewsByCondo={viewsByCondo}
        categoryDistribution={categoryDistribution}
        ratingDistribution={ratingDistribution}
        priceRanges={priceRanges}
        reviewsTrend={reviewsTrend}
        dailyViewsTrend={dailyViewsTrend}
        selectedRange={selectedRange}
      />

      {/* Recent Activities Section (Recent Condos & Recent Reviews) */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Condos */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-primary)' }}>
              <Building2 size={18} style={{ color: 'var(--sand-gold)' }} />
              คอนโดล่าสุดในระบบ
            </h3>
            <Link
              href="/admin/condos"
              style={{ fontSize: '0.82rem', color: 'var(--sand-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>
          {recentCondos.length > 0 ? (
            recentCondos.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{
                  padding: '0.65rem 0',
                  borderBottom: i < recentCondos.length - 1 ? '1px solid var(--border-line)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    <Link href={`/condos/${c.slug}`}>{c.name}</Link>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{c.category_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--sand-gold)', fontWeight: 600 }}>
                    ★ {(c.rating || 0).toFixed(1)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    👁 {c.view_count.toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem 0', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>ยังไม่มีคอนโดในระบบ</div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-primary)' }}>
              <MessageSquare size={18} style={{ color: 'var(--sand-gold)' }} />
              รีวิวล่าสุด
            </h3>
            <Link
              href="/admin/reviews"
              style={{ fontSize: '0.82rem', color: 'var(--sand-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>
          {recentReviews.length > 0 ? (
            recentReviews.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '0.65rem 0',
                  borderBottom: i < recentReviews.length - 1 ? '1px solid var(--border-line)' : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    {r.user_name}
                  </div>
                  <span style={{ color: 'var(--sand-gold)', fontSize: '0.8rem', letterSpacing: 2 }}>
                    {'★'.repeat(r.rating)}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{r.condo_name}</div>
                {r.title && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: 2, fontStyle: 'italic' }}>
                    &ldquo;{r.title}&rdquo;
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '1rem 0', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>ยังไม่มีรีวิวในระบบ</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
