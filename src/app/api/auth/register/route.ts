import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000); // 3 registrations per hour
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `คุณสร้างบัญชีบ่อยเกินไป กรุณารอ ${rateLimit.resetInSeconds} วินาทีแล้วลองใหม่` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
        }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    // Sanitize name (strip HTML tags, limit length)
    const sanitizedName = String(name).replace(/[<>]/g, '').trim().slice(0, 100);
    const sanitizedEmail = String(email).trim().toLowerCase();

    if (!sanitizedName) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้ไม่ถูกต้อง' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }

    const existing = await query<UserRow[]>('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query<{ insertId: number }>(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [sanitizedName, sanitizedEmail, hashedPassword, 'user']
    );

    const newUser = { id: result.insertId, name: sanitizedName, email: sanitizedEmail, role: 'user' as const };
    await setSession(newUser);

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
