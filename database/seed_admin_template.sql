-- =====================================================================
-- CondoGuide Production Admin Template (SQL สำหรับสร้างแอดมินบนฐานข้อมูลจริง)
-- =====================================================================
-- ข้อกำหนด: รหัสผ่านต้องถูก Hash ด้วย bcrypt ก่อนนำมาใส่ในคำสั่งนี้ ห้ามใส่ plain text เด็ดขาด
-- ตัวอย่างการสร้าง Hash ใน terminal:
-- node -e "console.log(require('bcryptjs').hashSync('YourStrongAdminPassword123!', 10))"
-- =====================================================================

USE condoguide;

-- แทนที่ YOUR_ADMIN_EMAIL และ YOUR_HASHED_PASSWORD ด้วยข้อมูลจริงของคุณ
INSERT INTO users (name, email, password, role) VALUES
(
  'System Administrator',
  'YOUR_ADMIN_EMAIL@example.com',
  'YOUR_HASHED_PASSWORD_FROM_BCRYPT',
  'admin'
)
ON DUPLICATE KEY UPDATE 
  role = 'admin',
  password = VALUES(password);
