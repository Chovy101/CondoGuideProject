import bcrypt from 'bcryptjs';

/**
 * Script สำหรับสร้าง Hash รหัสผ่านสำหรับ Admin บัญชีจริง
 * วิธีใช้:
 * node scripts/create-admin.mjs "my_admin@email.com" "MyStrongPassword123!"
 */

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log('วิธีใช้งาน:');
  console.log('node scripts/create-admin.mjs <admin_email> <admin_password>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ ข้อผิดพลาด: รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n======================================================');
console.log('✅ สร้างรหัสผ่าน Admin สำหรับ Production สำเร็จ');
console.log('======================================================');
console.log(`Email : ${email}`);
console.log(`Hash  : ${hash}`);
console.log('\nคำสั่ง SQL สำหรับนำไปรันบน TiDB Cloud / MySQL:');
console.log('------------------------------------------------------');
console.log(`INSERT INTO users (name, email, password, role) VALUES ('System Administrator', '${email}', '${hash}', 'admin') ON DUPLICATE KEY UPDATE password='${hash}', role='admin';`);
console.log('======================================================\n');
