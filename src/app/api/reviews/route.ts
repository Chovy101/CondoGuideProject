import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const condoId = searchParams.get('condo_id');
  const sql = condoId
    ? `SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.condo_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`
    : `SELECT r.*, u.name as user_name, c.name as condo_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN condos c ON r.condo_id = c.id ORDER BY r.created_at DESC LIMIT 50`;
  const params = condoId ? [condoId] : [];
  const reviews = await query(sql, params);
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  }
  const { condo_id, rating, title, content, pros, cons } = await request.json();
  if (!condo_id || !rating) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
  }

  const result = await query<{ insertId: number }>(
    'INSERT INTO reviews (condo_id, user_id, rating, title, content, pros, cons) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [condo_id, session.id, rating, title, content, pros, cons]
  );

  // Update rating on condo
  await query(
    `UPDATE condos SET 
     rating = (SELECT AVG(rating) FROM reviews WHERE condo_id = ? AND is_approved = 1),
     review_count = (SELECT COUNT(*) FROM reviews WHERE condo_id = ? AND is_approved = 1)
     WHERE id = ?`,
    [condo_id, condo_id, condo_id]
  );

  return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ไม่ระบุ ID รีวิว' }, { status: 400 });
  }

  // Find condo_id to update condo rating after review deletion
  const revs = await query<Array<{ condo_id: number }>>('SELECT condo_id FROM reviews WHERE id = ?', [Number(id)]);
  const condoId = revs[0]?.condo_id;

  await query('DELETE FROM reviews WHERE id = ?', [Number(id)]);

  if (condoId) {
    await query(
      `UPDATE condos SET 
       rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE condo_id = ? AND is_approved = 1), 0),
       review_count = (SELECT COUNT(*) FROM reviews WHERE condo_id = ? AND is_approved = 1)
       WHERE id = ?`,
      [condoId, condoId, condoId]
    );
  }

  return NextResponse.json({ success: true });
}
