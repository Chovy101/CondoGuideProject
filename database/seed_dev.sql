-- =====================================================================
-- CondoGuide Development Seed Data (สำหรับทดสอบในเครื่องเท่านั้น - ห้ามรันบน Production)
-- =====================================================================

USE condoguide;

-- บัญชีทดสอบสำหรับ Development (รหัสผ่าน: password)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin (Dev)', 'admin@condoguide.com', '$2b$10$m3ZS41rPWrtt6tr9PzjI7uH/EaIdBeVLXPYeshuo.oShLyvfdA/86', 'admin'),
(2, 'Test User', 'user@condoguide.com', '$2b$10$m3ZS41rPWrtt6tr9PzjI7uH/EaIdBeVLXPYeshuo.oShLyvfdA/86', 'user');

-- รีวิวตัวอย่างสำหรับการพัฒนา
INSERT IGNORE INTO reviews (id, condo_id, user_id, rating, title, content, pros, cons, is_approved) VALUES
(1, 1, 2, 5, 'ห้องพักสวยมาก', 'อยู่ที่นี่มา 2 ปีแล้ว ชอบมากเลยค่ะ วิวสวย สิ่งอำนวยความสะดวกครบครัน', 'วิวสวย, ทำเลดี, บริการดีเยี่ยม', 'ค่าเช่าค่อนข้างสูง', TRUE),
(2, 2, 2, 4, 'ราคาดี ทำเลดี', 'สำหรับราคาถือว่าดีมาก ห้องสะอาด ทำเลใกล้ห้าง', 'ราคาประหยัด, ใกล้ห้างสรรพสินค้า', 'ห้องค่อนข้างเล็ก', TRUE),
(3, 3, 2, 5, 'เดินไป BTS ได้เลย', 'สะดวกมากไม่ต้องนั่งรถ ประหยัดค่าเดินทาง', 'ใกล้ BTS, ห้องสวย', 'ราคาเพิ่มขึ้นทุกปี', TRUE);
