import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const district = searchParams.get('district') || '';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const featured = searchParams.get('featured') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || '';
  const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const limit = Number(searchParams.get('limit')) || 20;
  const page = Number(searchParams.get('page')) || 1;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT c.*, cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon, cat.color as category_color
    FROM condos c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.is_active = 1
  `;
  const params: unknown[] = [];

  if (search) {
    sql += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.address LIKE ? OR c.district LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ' AND cat.slug = ?';
    params.push(category);
  }
  if (district) {
    sql += ' AND c.district LIKE ?';
    params.push(`%${district}%`);
  }
  if (priceMin) {
    sql += ' AND c.price_min >= ?';
    params.push(Number(priceMin));
  }
  if (priceMax) {
    sql += ' AND c.price_max <= ?';
    params.push(Number(priceMax));
  }
  if (status === 'featured' || featured === 'true') {
    sql += ' AND c.is_featured = 1';
  } else if (status === 'normal' || featured === 'false') {
    sql += ' AND c.is_featured = 0';
  }

  // Dynamic sorting
  if (sortBy === 'price') {
    sql += ` ORDER BY c.price_min ${sortOrder}, c.id DESC`;
  } else if (sortBy === 'rating') {
    sql += ` ORDER BY c.rating ${sortOrder}, c.review_count ${sortOrder}, c.id DESC`;
  } else if (sortBy === 'views') {
    sql += ` ORDER BY c.view_count ${sortOrder}, c.id DESC`;
  } else {
    sql += ' ORDER BY c.is_featured DESC, c.rating DESC, c.created_at DESC';
  }

  sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const condos = await query(sql, params);

  // Count total
  let countSql = `SELECT COUNT(*) as total FROM condos c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.is_active = 1`;
  const countParams: unknown[] = [];
  if (search) {
    countSql += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.address LIKE ? OR c.district LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    countSql += ' AND cat.slug = ?';
    countParams.push(category);
  }
  if (district) {
    countSql += ' AND c.district LIKE ?';
    countParams.push(`%${district}%`);
  }
  if (status === 'featured' || featured === 'true') {
    countSql += ' AND c.is_featured = 1';
  } else if (status === 'normal' || featured === 'false') {
    countSql += ' AND c.is_featured = 0';
  }

  const countResult = await query<Array<{ total: number }>>(countSql, countParams);
  const total = countResult[0]?.total || 0;

  return NextResponse.json({ condos, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized (เฉพาะผู้ดูแลระบบเท่านั้น)' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      name, slug, category_id, description, address, district, province,
      price_min, price_max, price_type, bedrooms, bathrooms,
      area_min, area_max, floor_total, unit_total, year_built,
      facilities, image_url, image_alt, image_credit, image_is_illustrative, is_featured, created_by
    } = data;

    const result = await query<{ insertId: number }>(
      `INSERT INTO condos (name, slug, category_id, description, address, district, province,
        price_min, price_max, price_type, bedrooms, bathrooms, area_min, area_max,
        floor_total, unit_total, year_built, facilities, image_url, image_alt, image_credit, image_is_illustrative, is_featured, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, category_id, description, address, district, province,
        price_min, price_max, price_type, bedrooms, bathrooms, area_min, area_max,
        floor_total, unit_total, year_built, facilities, image_url, image_alt || null, image_credit || null, image_is_illustrative ? 1 : 0, is_featured ? 1 : 0, created_by]
    );

    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('Create condo error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
 