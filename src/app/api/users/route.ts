import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const users = await query(
    `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  );
  const total = await query<Array<{ total: number }>>('SELECT COUNT(*) as total FROM users');
  return NextResponse.json({ users, total: total[0]?.total || 0 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
  }

  const existing = await query<Array<{ id: number }>>('SELECT id FROM users WHERE email = ?', [email]);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = await query<{ insertId: number }>(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name.trim(), email.trim(), hashed, role || 'user']
  );
  return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, email, role, password } = body;

  if (!id || !name || !email) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
  }

  // Check email uniqueness across other users
  const existing = await query<Array<{ id: number }>>(
    'SELECT id FROM users WHERE email = ? AND id != ?',
    [email.trim(), id]
  );
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว' }, { status: 409 });
  }

  if (password && String(password).trim().length > 0) {
    if (String(password).trim().length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(String(password).trim(), 10);
    await query(
      'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
      [name.trim(), email.trim(), role || 'user', hashed, id]
    );
  } else {
    await query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name.trim(), email.trim(), role || 'user', id]
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ไม่ระบุ ID ผู้ใช้งาน' }, { status: 400 });
  }
  if (Number(id) === session.id) {
    return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 });
  }
  await query('DELETE FROM users WHERE id = ?', [Number(id)]);
  return NextResponse.json({ success: true });
}
