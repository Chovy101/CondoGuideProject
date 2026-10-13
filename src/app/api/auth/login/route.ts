import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 15, 15 * 60 * 1000); // 15 attempts per 15 minutes
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${rateLimit.resetInSeconds} วินาทีแล้วลองใหม่` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let users = await query<User[]>('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    let user = users && users[0];

    // Self-healing: If MySQL/TiDB database is freshly initialized and has no admin record yet
    if (!user && (normalizedEmail === 'admin@condoguide.com' || normalizedEmail === 'warakorn@gmail.com')) {
      const defaultHash = normalizedEmail === 'admin@condoguide.com'
        ? '$2b$10$m3ZS41rPWrtt6tr9PzjI7uH/EaIdBeVLXPYeshuo.oShLyvfdA/86' // password
        : '$2b$10$zDSnAlG6DaphTnh3fSvi..VJdFpWTy/RwBAEfDG.qfh5QAayyUMS2'; // 12345678
      const name = normalizedEmail === 'admin@condoguide.com' ? 'Admin' : 'วรากร';
      try {
        await query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, normalizedEmail, defaultHash, 'admin']
        );
        users = await query<User[]>('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
        user = users && users[0];
      } catch (seedErr) {
        console.warn('[Login Auth] Auto-seed admin user in database:', seedErr);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
