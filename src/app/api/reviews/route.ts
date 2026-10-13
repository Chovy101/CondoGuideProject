import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Sanitize string to prevent XSS (strip HTML tags, limit length)
function sanitizeText(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const condoId = searchParams.get('condo_id');
  const sql = condoId
    ? `SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.condo_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC`
    : `SELECT r.*, u.name as user_name, c.name as condo_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN condos c ON r.condo_id = c.id ORDER BY r.created_at DESC LIMIT 50`;
  const params = condoId ? [condoId] : [];
  const reviews = await query(sql, params);

  return NextResponse.json(
    { reviews },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.id) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนเขียนรีวิว' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`review:${session.id || ip}`, 5, 10 * 60 * 1000); // 5 reviews per 10 minutes
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `คุณส่งรีวิวบ่อยเกินไป กรุณารอ ${rateLimit.resetInSeconds} วินาทีแล้วลองใหม่` },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
      }
    );
  }

  const body = await request.json();
  const { condo_id, rating, title, content, pros, cons } = body;
  const numericCondoId = Number(condo_id);
  const numericRating = Math.round(Number(rating));

  if (!numericCondoId || isNaN(numericCondoId)) {
    return NextResponse.json({ error: 'ไม่พบรหัสโครงการคอนโดที่ต้องการรีวิว' }, { status: 400 });
  }

  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return NextResponse.json({ error: 'กรุณาเลือกคะแนนความพึงพอใจ 1 - 5 ดาว' }, { status: 400 });
  }

  // XSS sanitization and length limits
  const cleanTitle = sanitizeText(title, 200);
  const cleanContent = sanitizeText(content, 2000);
  const cleanPros = sanitizeText(pros, 500);
  const cleanCons = sanitizeText(cons, 500);

  if (cleanTitle.length < 3) {
    return NextResponse.json({ error: 'หัวข้อรีวิวต้องมีความยาวอย่างน้อย 3 ตัวอักษร' }, { status: 400 });
  }

  if (cleanContent.length < 10) {
    return NextResponse.json({ error: 'รายละเอียดความคิดเห็นต้องมีความยาวอย่างน้อย 10 ตัวอักษร' }, { status: 400 });
  }

  // Check if condo exists
  const condoRows = await query<Array<{ id: number; slug: string }>>(
    'SELECT id, slug FROM condos WHERE id = ? AND is_active = 1',
    [numericCondoId]
  );
  if (!condoRows || condoRows.length === 0) {
    return NextResponse.json({ error: 'ไม่พบโครงการคอนโดนี้ในระบบ' }, { status: 404 });
  }
  const condoSlug = condoRows[0].slug;

  // Rule: 1 review per user per condo to prevent review spam
  const existingReview = await query<Array<{ id: number }>>(
    'SELECT id FROM reviews WHERE condo_id = ? AND user_id = ?',
    [numericCondoId, session.id]
  );
  if (existingReview && existingReview.length > 0) {
    return NextResponse.json(
      { error: 'คุณเคยเขียนรีวิวโครงการนี้แล้ว (จำกัด 1 รีวิวต่อ 1 โครงการ)' },
      { status: 409 }
    );
  }

  // Explicitly set is_approved = 1 so review displays publicly immediately
  const result = await query<{ insertId: number }>(
    'INSERT INTO reviews (condo_id, user_id, rating, title, content, pros, cons, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [numericCondoId, session.id, numericRating, cleanTitle, cleanContent, cleanPros, cleanCons]
  );

  // Recalculate and update rating & review_count on condo table
  await query(
    `UPDATE condos SET 
     rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE condo_id = ? AND is_approved = 1), 0),
     review_count = (SELECT COUNT(*) FROM reviews WHERE condo_id = ? AND is_approved = 1)
     WHERE id = ?`,
    [numericCondoId, numericCondoId, numericCondoId]
  );

  // Invalidate Next.js cache so the updated reviews and rating are fresh on the next visit
  try {
    if (condoSlug) {
      revalidatePath(`/condos/${condoSlug}`);
    }
    revalidatePath('/condos');
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/reviews');
  } catch (err) {
    console.warn('[Review Cache] revalidatePath notice:', err);
  }

  const newReview = {
    id: result.insertId,
    condo_id: numericCondoId,
    user_id: session.id,
    user_name: session.name || 'ผู้พักอาศัย',
    rating: numericRating,
    title: cleanTitle,
    content: cleanContent,
    pros: cleanPros,
    cons: cleanCons,
    is_approved: true,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json(
    {
      success: true,
      id: result.insertId,
      review: newReview,
      message: 'บันทึกรีวิวของคุณเรียบร้อยแล้ว ขอบคุณสำหรับข้อมูล',
    },
    { status: 201 }
  );
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

  // Find condo_id and condo slug to update condo rating and revalidate path after review deletion
  const revs = await query<Array<{ condo_id: number }>>('SELECT condo_id FROM reviews WHERE id = ?', [Number(id)]);
  const condoId = revs[0]?.condo_id;

  let condoSlug = '';
  if (condoId) {
    const cRows = await query<Array<{ slug: string }>>('SELECT slug FROM condos WHERE id = ?', [condoId]);
    condoSlug = cRows[0]?.slug || '';
  }

  await query('DELETE FROM reviews WHERE id = ?', [Number(id)]);

  if (condoId) {
    await query(
      `UPDATE condos SET 
       rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE condo_id = ? AND is_approved = 1), 0),
       review_count = (SELECT COUNT(*) FROM reviews WHERE condo_id = ? AND is_approved = 1)
       WHERE id = ?`,
      [condoId, condoId, condoId]
    );

    try {
      if (condoSlug) {
        revalidatePath(`/condos/${condoSlug}`);
      }
      revalidatePath('/condos');
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/admin/reviews');
    } catch (err) {
      console.warn('[Review Delete Cache] revalidatePath notice:', err);
    }
  }

  return NextResponse.json({ success: true });
}
