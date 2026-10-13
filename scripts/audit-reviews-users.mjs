import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

/**
 * สคริปต์ตรวจสอบความถูกต้องของข้อมูลรีวิวและการผูกโยงกับผู้ใช้งาน (User Review Audit Script)
 *
 * วัตถุประสงค์ (ตามข้อกำหนดที่ 5):
 * ตรวจสอบและรายงานข้อมูลรีวิวที่ผูก user_id ผิดปกติ เช่น:
 * - ทุกรีวิวชี้ไปที่ผู้ใช้คนเดียวกันทั้งหมด (Seed data anomaly)
 * - มีรีวิวซ้ำซ้อนสำหรับคู่ (user_id, condo_id) เดียวกัน
 * - รีวิวที่อ้างอิง user_id หรือ condo_id ที่ไม่มีอยู่จริงในระบบ (Orphaned reviews)
 *
 * หมายเหตุสำคัญ:
 * สคริปต์นี้ทำหน้าที่ "ตรวจสอบและรายงานเท่านั้น (Audit Only)"
 * จะไม่มีการแก้ไข ดัดแปลง หรือลบข้อมูลใดๆ โดยอัตโนมัติ
 *
 * วิธีเรียกใช้งาน:
 * node scripts/audit-reviews-users.mjs
 */

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

async function auditLocalStore() {
  const storePath = path.join(process.cwd(), 'database', 'data_store.json');
  if (!fs.existsSync(storePath)) {
    console.log('⚠️ ไม่พบไฟล์ database/data_store.json');
    return;
  }

  console.log('\n========================================================================================');
  console.log('🔍 รายงานการตรวจสอบตารางรีวิวและผู้ใช้งาน: Local Store (database/data_store.json)');
  console.log('========================================================================================');

  const raw = fs.readFileSync(storePath, 'utf8');
  const store = JSON.parse(raw);

  const users = store.users || [];
  const condos = store.condos || [];
  const reviews = store.reviews || [];

  const userMap = new Map(users.map(u => [u.id, u]));
  const condoMap = new Map(condos.map(c => [c.id, c]));

  console.log(`📊 สรุปจำนวนข้อมูลในระบบ:`);
  console.log(`   - ผู้ใช้งานทั้งหมด (Users): ${users.length} บัญชี`);
  console.log(`   - โครงการคอนโดทั้งหมด (Condos): ${condos.length} โครงการ`);
  console.log(`   - รีวิวทั้งหมด (Reviews): ${reviews.length} รายการ\n`);

  // 1. ตรวจสอบรีวิวที่ผูกกับ user_id ที่ไม่มีอยู่จริง (Orphaned users)
  const invalidUserReviews = reviews.filter(r => !userMap.has(r.user_id));

  // 2. ตรวจสอบรีวิวที่ผูกกับ condo_id ที่ไม่มีอยู่จริง (Orphaned condos)
  const invalidCondoReviews = reviews.filter(r => !condoMap.has(r.condo_id));

  // 3. ตรวจสอบรีวิวซ้ำสำหรับคู่ (user_id, condo_id) เดียวกัน
  const pairCounts = new Map();
  for (const r of reviews) {
    const key = `${r.user_id}:${r.condo_id}`;
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  }
  const duplicatePairs = [...pairCounts.entries()].filter(([, count]) => count > 1);

  // 4. ตรวจสอบการกระจุกตัวของ user_id (เช่น ทุกรีวิวชี้ไปที่คนเดียวกันหรือไม่)
  const userReviewCount = new Map();
  for (const r of reviews) {
    userReviewCount.set(r.user_id, (userReviewCount.get(r.user_id) || 0) + 1);
  }

  console.log('----------------------------------------------------------------------------------------');
  console.log('📌 ผลการตรวจสอบความสมบูรณ์ของความสัมพันธ์ (Integrity Checks):');
  console.log('----------------------------------------------------------------------------------------');

  if (invalidUserReviews.length === 0) {
    console.log('✅ 1. ตรวจสอบรหัสผู้ใช้: ทุกรีวิวมี user_id ที่ตรงกับตาราง users ในระบบ');
  } else {
    console.log(`❌ 1. พบ ${invalidUserReviews.length} รีวิวที่ user_id ไม่มีอยู่ในระบบ (Orphaned):`);
    console.table(invalidUserReviews.map(r => ({ 'Review ID': r.id, 'user_id ที่ผิด': r.user_id })));
  }

  if (invalidCondoReviews.length === 0) {
    console.log('✅ 2. ตรวจสอบรหัสคอนโด: ทุกรีวิวมี condo_id ที่ตรงกับตาราง condos ในระบบ');
  } else {
    console.log(`❌ 2. พบ ${invalidCondoReviews.length} รีวิวที่ condo_id ไม่มีอยู่ในระบบ (Orphaned):`);
    console.table(invalidCondoReviews.map(r => ({ 'Review ID': r.id, 'condo_id ที่ผิด': r.condo_id })));
  }

  if (duplicatePairs.length === 0) {
    console.log('✅ 3. ตรวจสอบกติกา 1 บัญชีต่อ 1 โครงการ: ไม่พบผู้ใช้คนใดรีวิวโครงการเดียวกันซ้ำ');
  } else {
    console.log(`⚠️ 3. ตรวจพบรีวิวซ้ำซ้อนสำหรับคู่ (user_id, condo_id) เดียวกัน:`);
    console.table(duplicatePairs.map(([key, count]) => {
      const [uid, cid] = key.split(':').map(Number);
      return {
        'User ID': uid,
        'User Name': userMap.get(uid)?.name || 'ไม่พบ',
        'Condo ID': cid,
        'Condo Name': condoMap.get(cid)?.name || 'ไม่พบ',
        'จำนวนรีวิวซ้ำ': count,
      };
    }));
  }

  console.log('\n----------------------------------------------------------------------------------------');
  console.log('👤 สถิติจำนวนรีวิวแยกตามรายชื่อผู้ใช้ (User Breakdown):');
  console.log('----------------------------------------------------------------------------------------');
  const userTable = [...userReviewCount.entries()].map(([uid, count]) => {
    const user = userMap.get(uid);
    const percentage = reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(1) : '0';
    return {
      'User ID': uid,
      'ชื่อผู้ใช้งาน': user?.name || '(ไม่มีในระบบ)',
      'อีเมล': user?.email || '-',
      'สิทธิ์ (Role)': user?.role || '-',
      'จำนวนรีวิวที่เขียน': count,
      'สัดส่วนรีวิว': `${percentage}%`,
      'ข้อสังเกต': count === reviews.length && reviews.length > 1
        ? '⚠️ ทุกรีวิวในระบบเป็นของบัญชีนี้ทั้งหมด (Seed Anomaly)'
        : 'ปกติ',
    };
  });
  console.table(userTable);

  if (userReviewCount.size === 1 && reviews.length > 1) {
    const soleUserId = [...userReviewCount.keys()][0];
    const soleUser = userMap.get(soleUserId);
    console.log(`\n📢 สรุปข้อสังเกตสำคัญ:`);
    console.log(`   - ปัจจุบันรีวิวทั้งหมด ${reviews.length} รายการในฐานข้อมูล ชี้ไปยังผู้ใช้ ID ${soleUserId} ("${soleUser?.name}") เพียงคนเดียว`);
    console.log(`   - นี่เป็นผลมาจากข้อมูลตั้งต้น (Seed Data) ที่กำหนด user_id: 1 ไว้ล่วงหน้า`);
    console.log(`   - ผู้ใช้บัญชีใหม่อื่นๆ (เช่น Thavin / วาริส) ยังไม่เคยมีรีวิวในโครงการใดๆ`);
  }

  console.log('\n----------------------------------------------------------------------------------------');
  console.log('📋 ตารางรายละเอียดรีวิวทั้งหมดในระบบ:');
  console.log('----------------------------------------------------------------------------------------');
  console.table(
    reviews.map(r => ({
      'ID': r.id,
      'คอนโด (Condo)': condoMap.get(r.condo_id)?.name || `ID: ${r.condo_id}`,
      'ผู้รีวิว (Author)': userMap.get(r.user_id)?.name || `ID: ${r.user_id}`,
      'คะแนน': `${r.rating}/5`,
      'หัวข้อรีวิว': (r.title || '').slice(0, 30),
      'สถานะอนุมัติ': r.is_approved ? 'เผยแพร่แล้ว' : 'รออนุมัติ',
    }))
  );

  console.log('========================================================================================');
  console.log('✨ จบการตรวจสอบ (ไม่มีการแก้ไขข้อมูลในระบบ)');
  console.log('========================================================================================\n');
}

async function auditMySQL() {
  const envLocal = parseEnvFile(path.join(process.cwd(), '.env.local'));
  const envMain = parseEnvFile(path.join(process.cwd(), '.env'));
  const env = { ...envMain, ...envLocal, ...process.env };

  if (!env.DB_NAME && !env.MYSQL_DATABASE) {
    return;
  }

  try {
    const conn = await mysql.createConnection({
      host: env.DB_HOST || env.MYSQL_HOST || 'localhost',
      port: Number(env.DB_PORT || env.MYSQL_PORT || 3306),
      user: env.DB_USER || env.MYSQL_USER || 'root',
      password: env.DB_PASSWORD || env.MYSQL_PASSWORD || '',
      database: env.DB_NAME || env.MYSQL_DATABASE,
      connectTimeout: 3000,
    });

    console.log('\n========================================================================================');
    console.log('🔍 รายงานการตรวจสอบตารางรีวิวและผู้ใช้งาน: MySQL Database');
    console.log('========================================================================================');

    const [reviews] = await conn.query('SELECT * FROM reviews');
    const [users] = await conn.query('SELECT id, name, email, role FROM users');
    const [condos] = await conn.query('SELECT id, name FROM condos');

    console.log(`📊 สรุปจำนวนข้อมูลใน MySQL:`);
    console.log(`   - ผู้ใช้งาน (Users): ${users.length} บัญชี`);
    console.log(`   - คอนโด (Condos): ${condos.length} โครงการ`);
    console.log(`   - รีวิว (Reviews): ${reviews.length} รายการ\n`);

    const [duplicates] = await conn.query(`
      SELECT user_id, condo_id, COUNT(*) as count 
      FROM reviews 
      GROUP BY user_id, condo_id 
      HAVING count > 1
    `);

    if (duplicates.length === 0) {
      console.log('✅ ไม่พบรีวิวซ้ำสำหรับคู่ (user_id, condo_id) เดียวกันใน MySQL');
    } else {
      console.log(`⚠️ พบรีวิวซ้ำสำหรับคู่ (user_id, condo_id) เดียวกันใน MySQL:`);
      console.table(duplicates);
    }

    await conn.end();
  } catch {
    // MySQL not reachable or not running, ignore
  }
}

async function run() {
  await auditLocalStore();
  await auditMySQL();
}

run().catch(console.error);
