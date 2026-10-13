import { NextRequest, NextResponse } from 'next/server';
import { query, recordCondoDailyView } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ALLOWED_UPDATE_FIELDS = new Set([
  'name',
  'category_id',
  'description',
  'address',
  'district',
  'province',
  'price_min',
  'price_max',
  'price_type',
  'bedrooms',
  'bathrooms',
  'area_min',
  'area_max',
  'floor_total',
  'unit_total',
  'year_built',
  'facilities',
  'image_url',
  'image_alt',
  'image_credit',
  'image_is_illustrative',
  'is_featured',
  'is_active',
]);

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/condos/[slug]'>) {
  const { slug } = await ctx.params;
  const condos = await query(
    `SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
     u.name as author_name
     FROM condos c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.slug = ? AND c.is_active = 1`,
    [slug]
  ) as unknown[];

  if (!condos || (condos as unknown[]).length === 0) {
    return NextResponse.json({ error: 'ไม่พบคอนโด' }, { status: 404 });
  }

  // Update view count and record daily view
  await query('UPDATE condos SET view_count = view_count + 1 WHERE slug = ?', [slug]);
  await recordCondoDailyView((condos[0] as { id: number }).id);

  // Get reviews
  const reviews = await query(
    `SELECT r.*, u.name as user_name, u.avatar as user_avatar
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.condo_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 10`,
    [(condos[0] as { id: number }).id]
  );

  return NextResponse.json({ condo: condos[0], reviews });
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/condos/[slug]'>) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 401 });
  }

  const { slug } = await ctx.params;
  try {
    const data = await request.json();
    const validEntries = Object.entries(data).filter(([key]) => ALLOWED_UPDATE_FIELDS.has(key));
    if (validEntries.length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่ได้รับอนุญาตให้อัปเดต' }, { status: 400 });
    }

    const fields = validEntries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...validEntries.map(([, v]) => v), slug];
    await query(`UPDATE condos SET ${fields} WHERE slug = ?`, values);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/condos/[slug]'>) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 401 });
  }

  const { slug } = await ctx.params;
  await query('UPDATE condos SET is_active = 0 WHERE slug = ?', [slug]);
  return NextResponse.json({ success: true });
}
