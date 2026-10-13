import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 401 });
  }
  const [condoCount, userCount, reviewCount, categoryCount, featuredCount] = await Promise.all([
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM condos WHERE is_active = 1'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM users'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM reviews WHERE is_approved = 1'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM categories'),
    query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM condos WHERE is_featured = 1 AND is_active = 1'),
  ]);

  const recentCondos = await query(
    `SELECT c.name, c.slug, c.rating, c.view_count, c.price_min, cat.name as category_name
     FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id
     WHERE c.is_active = 1 ORDER BY c.created_at DESC LIMIT 5`
  );

  const recentReviews = await query(
    `SELECT r.rating, r.title, r.created_at, u.name as user_name, c.name as condo_name
     FROM reviews r 
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN condos c ON r.condo_id = c.id
     WHERE r.is_approved = 1 ORDER BY r.created_at DESC LIMIT 5`
  );

  const topCondos = await query(
    `SELECT c.name, c.slug, c.rating, c.review_count, c.view_count, cat.icon as category_icon
     FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id
     WHERE c.is_active = 1 ORDER BY c.rating DESC, c.review_count DESC LIMIT 5`
  );

  const categoryStats = await query(
    `SELECT cat.name, cat.icon, cat.color, COUNT(c.id) as count
     FROM categories cat LEFT JOIN condos c ON cat.id = c.category_id AND c.is_active = 1
     GROUP BY cat.id ORDER BY count DESC`
  );

  const viewStats = await query(
    `SELECT c.name, c.view_count FROM condos c WHERE c.is_active = 1 ORDER BY c.view_count DESC LIMIT 5`
  );

  return NextResponse.json({
    stats: {
      condos: condoCount[0]?.total || 0,
      users: userCount[0]?.total || 0,
      reviews: reviewCount[0]?.total || 0,
      categories: categoryCount[0]?.total || 0,
      featured: featuredCount[0]?.total || 0,
    },
    recentCondos,
    recentReviews,
    topCondos,
    categoryStats,
    viewStats,
  });
}
