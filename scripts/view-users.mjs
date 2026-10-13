import fs from 'fs';
import path from 'path';

// สคริปต์สำหรับดูข้อมูลตาราง users ในฐานข้อมูลจำลอง (Local Store)
const storePath = path.join(process.cwd(), 'database', 'data_store.json');

if (!fs.existsSync(storePath)) {
  console.error('❌ ไม่พบไฟล์ database/data_store.json');
  process.exit(1);
}

const raw = fs.readFileSync(storePath, 'utf8');
const data = JSON.parse(raw);
const users = data.users || [];

console.log('\n========================================================================================');
console.log('📋 ข้อมูลในตาราง users (Database View)');
console.log('========================================================================================');
console.table(
  users.map(u => ({
    ID: u.id,
    Name: u.name,
    Email: u.email,
    'Hashed Password (bcrypt)': u.password,
    Role: u.role,
  }))
);
console.log('========================================================================================\n');
