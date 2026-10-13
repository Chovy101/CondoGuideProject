import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

/**
 * สคริปต์สำหรับตรวจสอบและซ่อมแซมคะแนนเฉลี่ย (rating) และจำนวนรีวิว (review_count)
 * ของทุกโครงการคอนโดมิเนียม ให้ตรงกับข้อมูลจริงในตารางรีวิว (reviews table)
 *
 * วิธีใช้งาน:
 * node scripts/sync-condo-ratings.mjs
 */

async function syncLocalStore() {
  const storePath = path.join(process.cwd(), 'database', 'data_store.json');
  if (!fs.existsSync(storePath)) return false;

  console.log('🔄 ตรวจสอบและซ่อมแซมไฟล์ Local Store (database/data_store.json)...');
  const raw = fs.readFileSync(storePath, 'utf8');
  const store = JSON.parse(raw);

  const report = [];
  let updatedAny = false;

  store.condos = store.condos || [];
  store.reviews = store.reviews || [];

  for (const c of store.condos) {
    const cReviews = store.reviews.filter(r => r.condo_id === c.id && r.is_approved);
    const expectedCount = cReviews.length;
    const expectedRating = expectedCount > 0
      ? Number((cReviews.reduce((sum, r) => sum + r.rating, 0) / expectedCount).toFixed(1))
      : 0;

    const oldCount = c.review_count || 0;
    const oldRating = Number(c.rating || 0);

    const isMatch = oldCount === expectedCount && Math.abs(oldRating - expectedRating) < 0.05;

    if (!isMatch) {
      c.review_count = expectedCount;
      c.rating = expectedRating;
      updatedAny = true;
    }

    report.push({
      ID: c.id,
      Condo: c.name,
      'Old Rating': oldRating.toFixed(1),
      'New Rating': expectedRating.toFixed(1),
      'Old Count': oldCount,
      'New Count': expectedCount,
      Status: isMatch ? '✅ ตรงกัน' : '🔧 แก้ไขแล้ว',
    });
  }

  if (updatedAny) {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('💾 บันทึกการแก้ไขลง database/data_store.json สำเร็จ\n');
  } else {
    console.log('✨ ข้อมูลใน database/data_store.json ถูกต้องตรงกันทั้งหมดอยู่แล้ว\n');
  }

  console.table(report);
  return true;
}

async function syncMySQL() {
  // อ่านค่าจาก .env.local หากมี
  let host = process.env.DB_HOST;
  let port = Number(process.env.DB_PORT) || 3306;
  let user = process.env.DB_USER;
  let password = process.env.DB_PASSWORD;
  let database = process.env.DB_NAME;

  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (key === 'DB_HOST' && !host) host = val;
        if (key === 'DB_PORT') port = Number(val) || 3306;
        if (key === 'DB_USER' && !user) user = val;
        if (key === 'DB_PASSWORD' && password === undefined) password = val;
        if (key === 'DB_NAME' && !database) database = val;
      }
    });
  }

  if (!host || !user || !database) {
    console.log('ℹ️ ไม่พบการตั้งค่า MySQL/TiDB ใน Environment Variables ข้ามการซ่อมแซม MySQL');
    return;
  }

  const isCloud = Boolean(host && host !== 'localhost' && host !== '127.0.0.1');

  console.log(`\n🔌 เชื่อมต่อไปยัง MySQL/TiDB Database (${host}:${port}/${database})...`);
  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password: password || '',
      database,
      ssl: isCloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined,
    });

    console.log('⚡ รันคำสั่ง SQL คำนวณ rating และ review_count จากตาราง reviews...');
    const [result] = await conn.query(`
      UPDATE condos c
      LEFT JOIN (
        SELECT condo_id, COUNT(*) as actual_count, ROUND(AVG(rating), 1) as actual_avg
        FROM reviews
        WHERE is_approved = 1
        GROUP BY condo_id
      ) r ON c.id = r.condo_id
      SET c.rating = COALESCE(r.actual_avg, 0),
          c.review_count = COALESCE(r.actual_count, 0)
    `);

    console.log(`✅ ซ่อมแซมฐานข้อมูล MySQL สำเร็จ (Affected rows: ${result.affectedRows || 0})`);

    const [rows] = await conn.query(`
      SELECT id, name, rating, review_count FROM condos ORDER BY id ASC
    `);

    console.table(
      rows.map(r => ({
        ID: r.id,
        Condo: r.name,
        Rating: Number(r.rating).toFixed(1),
        'Review Count': r.review_count,
      }))
    );

    await conn.end();
  } catch (err) {
    console.warn('⚠️ ไม่สามารถเชื่อมต่อ MySQL ได้:', err.message);
  }
}

async function main() {
  console.log('===============================================================');
  console.log('🛠️ CondoGuide BKK - Condo Ratings & Reviews Sync Tool');
  console.log('===============================================================\n');

  await syncLocalStore();
  await syncMySQL();

  console.log('\n===============================================================');
  console.log('🎉 เสร็จสิ้นการตรวจสอบและซิงค์ข้อมูลรีวิวเรียบร้อย');
  console.log('===============================================================\n');
}

main().catch(console.error);
