import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getCategoryThaiName } from '@/lib/categories';

export async function GET() {
  const categories = await query<Array<Record<string, unknown>>>(
    `SELECT cat.*, COUNT(c.id) AS condo_count, COUNT(c.id) AS count
     FROM categories cat
     LEFT JOIN condos c ON cat.id = c.category_id AND c.is_active = 1
     GROUP BY cat.id
     ORDER BY cat.id ASC`
  );

  const formatted = (categories || []).map((cat) => ({
    ...cat,
    name_th:
      (cat.name_th as string) ||
      getCategoryThaiName((cat.slug as string) || (cat.name as string)),
    condo_count: Number(cat.condo_count ?? cat.count ?? 0),
    count: Number(cat.condo_count ?? cat.count ?? 0),
  }));

  return NextResponse.json({ categories: formatted });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json(
      { error: 'ไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ดูแลระบบ)' },
      { status: 403 }
    );
  }
  const { name, name_th, slug, icon, description, color } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อและ Slug' }, { status: 400 });
  }

  const finalThai = name_th || getCategoryThaiName(slug || name);

  try {
    const result = await query<{ insertId: number }>(
      'INSERT INTO categories (name, name_th, slug, icon, description, color) VALUES (?, ?, ?, ?, ?, ?)',
      [name, finalThai, slug, icon || '🏢', description || '', color || '#C8963E']
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch {
    const result = await query<{ insertId: number }>(
      'INSERT INTO categories (name, slug, icon, description, color) VALUES (?, ?, ?, ?, ?)',
      [name, slug, icon || '🏢', description || '', color || '#C8963E']
    );
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json(
      { error: 'ไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ดูแลระบบ)' },
      { status: 403 }
    );
  }
  const { id, name, name_th, slug, icon, description, color } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'ไม่ระบุรหัสหมวดหมู่ (ID is required)' }, { status: 400 });
  }

  const finalThai = name_th || getCategoryThaiName(slug || name);

  try {
    await query(
      'UPDATE categories SET name = ?, name_th = ?, slug = ?, icon = ?, description = ?, color = ? WHERE id = ?',
      [name, finalThai, slug, icon || '🏢', description || '', color || '#C8963E', Number(id)]
    );
  } catch {
    await query(
      'UPDATE categories SET name = ?, slug = ?, icon = ?, description = ?, color = ? WHERE id = ?',
      [name, slug, icon || '🏢', description || '', color || '#C8963E', Number(id)]
    );
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json(
      { error: 'ไม่มีสิทธิ์ดำเนินการ (เฉพาะผู้ดูแลระบบ)' },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ไม่ระบุรหัสหมวดหมู่ (ID is required)' }, { status: 400 });
  }

  // Server-side guard: count active condos referencing this category
  const countResult = await query<Array<{ total: number; count: number }>>(
    'SELECT COUNT(*) as total FROM condos WHERE category_id = ? AND is_active = 1',
    [Number(id)]
  );
  const condoCount = Number(countResult[0]?.total ?? countResult[0]?.count ?? 0);
  if (condoCount > 0) {
    return NextResponse.json(
      {
        error: `ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีโครงการที่ใช้งานอยู่ ${condoCount} รายการ กรุณาย้ายโครงการ ${condoCount} รายการไปหมวดอื่นก่อนทำการลบ`,
        condoCount,
      },
      { status: 400 }
    );
  }

  await query('DELETE FROM categories WHERE id = ?', [Number(id)]);
  return NextResponse.json({ success: true });
}
