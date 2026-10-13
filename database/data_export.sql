-- =====================================================================
-- CondoGuide Database Data Export (TiDB Cloud / MySQL Dump)
-- บันทึกข้อมูลจริงทั้งหมดจากระบบ สำหรับนำไปใช้รายงานโครงงาน หรือนำเข้าฐานข้อมูล
-- =====================================================================

CREATE DATABASE IF NOT EXISTS condoguide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE condoguide;

-- ---------------------------------------------------------------------
-- 1. ตาราง users (ข้อมูลผู้ใช้งานและสิทธิ์)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (id, name, email, password, role, avatar, created_at) VALUES
(1, 'Admin', 'admin@condoguide.com', '$2b$10$m3ZS41rPWrtt6tr9PzjI7uH/EaIdBeVLXPYeshuo.oShLyvfdA/86', 'admin', NULL, '2024-01-01 10:00:00'),
(2, 'วรากร', 'warakorn@gmail.com', '$2b$10$zDSnAlG6DaphTnh3fSvi..VJdFpWTy/RwBAEfDG.qfh5QAayyUMS2', 'admin', NULL, '2026-10-12 17:19:09'),
(3, 'วาริส มินเจ', 'varizz@gmail.com', '$2b$10$ihO.kevEwHvyNYC/grQVFOqddOAXNU4/.p84.VSxzEjL.r3AN2ZJm', 'user', NULL, '2026-10-12 17:19:35')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role);

-- ---------------------------------------------------------------------
-- 2. ตาราง categories (หมวดหมู่คอนโดมิเนียม)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) DEFAULT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT '🏢',
  description TEXT,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name, name_th, slug, icon, description, color, created_at) VALUES
(1, 'Luxury', 'หรูหรา', 'luxury', '👑', 'คอนโดหรูระดับพรีเมียม ดีไซน์ระดับโลก', '#f59e0b', '2024-01-01 00:00:00'),
(2, 'Budget', 'ราคาประหยัด', 'budget', '💰', 'คอนโดราคาประหยัด คุ้มค่า เดินทางสะดวก', '#10b981', '2024-01-01 00:00:00'),
(3, 'Studio', 'สตูดิโอ', 'studio', '🏠', 'ห้อง Studio กะทัดรัด สำหรับคนทำงานรุ่นใหม่', '#6366f1', '2024-01-01 00:00:00'),
(4, 'Family', 'ครอบครัว', 'family', '👨‍👩‍👧‍👦', 'คอนโดห้องใหญ่ สิ่งอำนวยความสะดวกครบสำหรับครอบครัว', '#ec4899', '2024-01-01 00:00:00'),
(5, 'Pet Friendly', 'เลี้ยงสัตว์ได้', 'pet-friendly', '🐾', 'คอนโดที่อนุญาตให้เลี้ยงสัตว์เลี้ยงได้', '#f97316', '2024-01-01 00:00:00'),
(6, 'Near BTS/MRT', 'ใกล้รถไฟฟ้า', 'near-bts-mrt', '🚆', 'คอนโดติดรถไฟฟ้า เดินทางเข้าเมืองได้ในไม่กี่นาที', '#3b82f6', '2024-01-01 00:00:00')
ON DUPLICATE KEY UPDATE name=VALUES(name), name_th=VALUES(name_th), color=VALUES(color);

-- ---------------------------------------------------------------------
-- 3. ตาราง condos (ข้อมูลโครงการคอนโดมิเนียม)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  category_id INT NOT NULL,
  description TEXT,
  address TEXT,
  district VARCHAR(100),
  province VARCHAR(100) DEFAULT 'กรุงเทพมหานคร',
  price_min DECIMAL(12,2),
  price_max DECIMAL(12,2),
  price_type ENUM('rent', 'sale', 'both') DEFAULT 'both',
  bedrooms VARCHAR(50),
  bathrooms VARCHAR(50),
  area_min DECIMAL(8,2),
  area_max DECIMAL(8,2),
  floor_total INT,
  unit_total INT,
  year_built YEAR,
  facilities TEXT,
  image_url VARCHAR(500),
  image_alt VARCHAR(500),
  image_credit VARCHAR(255),
  image_is_illustrative BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO condos (id, name, slug, category_id, description, address, district, province, price_min, price_max, price_type, bedrooms, bathrooms, area_min, area_max, floor_total, unit_total, year_built, facilities, image_url, image_alt, rating, review_count, is_featured, is_active, view_count, created_by, created_at) VALUES
(1, 'The Ritz Residence Sukhumvit', 'ritz-residence-sukhumvit', 1, 'คอนโดหรูระดับเวิลด์คลาสใจกลางสุขุมวิท ออกแบบโดยสถาปนิกชั้นนำ ห้องพักทุกห้องมองเห็นวิวเมืองกรุงเทพแบบ 360 องศา พร้อมบริการคอนเซียร์จระดับ 5 ดาวตลอด 24 ชม.', '555 ถ.สุขุมวิท', 'วัฒนา', 'กรุงเทพมหานคร', 35000, 150000, 'both', '1-3', '1-3', 35.00, 120.00, 45, 380, 2021, 'Pool,Gym,Sauna,Sky Lounge,Concierge,Parking,Security', '/images/condos/ritz-residence-sukhumvit.jpg', 'ตึกคอนโด The Ritz Residence Sukhumvit สุขุมวิท กรุงเทพฯ', 5.00, 1, TRUE, TRUE, 1540, 1, '2024-01-10 00:00:00'),
(2, 'Lumpini Park Rama 9', 'lumpini-park-rama9', 2, 'คอนโดราคาประหยัด ทำเลศูนย์กลางธุรกิจพระราม 9 ใกล้เซ็นทรัลพระราม 9 และ MRT พระราม 9 พร้อมพื้นที่สีเขียวกว่า 2 ไร่', '102 ถ.พระราม 9', 'ห้วยขวาง', 'กรุงเทพมหานคร', 8500, 25000, 'both', '1-2', '1-2', 24.00, 68.00, 35, 1200, 2019, 'Pool,Gym,Co-Working Space,Parking,Security,Garden', '/images/condos/lumpini-park-rama9.jpg', 'ตึกคอนโด Lumpini Park Rama 9 ย่านพระราม 9 กรุงเทพฯ', 4.00, 1, TRUE, TRUE, 980, 1, '2024-01-12 00:00:00'),
(3, 'Ideo Mobi Sukhumvit 81', 'ideo-mobi-sukhumvit-81', 6, 'คอนโดใกล้ BTS อ่อนนุช เพียง 250 เมตร ก้าวเดียวถึงสิ่งอำนวยความสะดวกครบครัน สระว่ายน้ำระบบเกลือ ฟิตเนสลอยฟ้า', '81/1 ถ.สุขุมวิท', 'พระโขนง', 'กรุงเทพมหานคร', 12000, 40000, 'both', '1-2', '1-2', 28.00, 55.00, 28, 680, 2020, 'Pool,Gym,Sky Garden,Parking,Security', '/images/condos/ideo-mobi-sukhumvit-81.jpg', 'ตึกคอนโด Ideo Mobi Sukhumvit 81 ใกล้สถานีรถไฟฟ้า BTS อ่อนนุช', 5.00, 1, TRUE, TRUE, 1421, 1, '2024-01-15 00:00:00'),
(4, 'Noble State 39', 'noble-state-39', 3, 'Studio & 1-Bedroom สไตล์ Modern Minimalist ใจกลางพร้อมพงษ์ ใกล้ The EmQuartier และ Emporium ตอบโจทย์คนทำงานยุคใหม่', '39 ถ.สุขุมวิท', 'วัฒนา', 'กรุงเทพมหานคร', 18000, 35000, 'both', 'Studio, 1 Bed', '1', 30.00, 45.00, 32, 450, 2022, 'Pool,Gym,Library,Co-Kitchen,Parking', '/images/condos/noble-state-39.jpg', 'ตึกคอนโด Noble State 39 ซอยสุขุมวิท 39 พร้อมพงษ์', 0.00, 0, FALSE, TRUE, 650, 1, '2024-01-20 00:00:00'),
(5, 'The Residences at Mandarin Oriental', 'mandarin-oriental-residences', 1, 'ที่สุดแห่งความหรูหราริมแม่น้ำเจ้าพระยา มาตรฐานการบริการระดับ 5 ดาวจาก Mandarin Oriental ใกล้ ICONSIAM', '48 ถ.เจริญกรุง', 'บางรัก', 'กรุงเทพมหานคร', 120000, 500000, 'both', '2-4', '2-4', 80.00, 350.00, 52, 146, 2022, 'Pool,Spa,Gym,Private Beach,Butler Service,Concierge,Parking', '/images/condos/mandarin-oriental-residences.jpg', 'ตึกคอนโด The Residences at Mandarin Oriental ริมแม่น้ำเจ้าพระยา', 5.00, 1, TRUE, TRUE, 2102, 1, '2024-02-01 00:00:00'),
(6, 'Whizdom Essence Sukhumvit', 'whizdom-essence-sukhumvit', 5, 'คอนโด Pet-Friendly ที่แท้จริง มีสวนสำหรับสัตว์เลี้ยงและคลินิกรักษา ใกล้ BTS ปุณณวิถี และโครงการ True Digital Park', '101 ถ.สุขุมวิท', 'พระโขนง', 'กรุงเทพมหานคร', 15000, 42000, 'both', '1-2', '1-2', 33.00, 65.00, 50, 664, 2020, 'Pet Park,Pool,Gym,Sky Garden,Parking', '/images/condos/whizdom-essence-sukhumvit.jpg', 'ตึกคอนโด Whizdom Essence Sukhumvit ย่านปุณณวิถี', 0.00, 0, TRUE, TRUE, 820, 1, '2024-02-10 00:00:00'),
(7, 'Life Asoke Hype', 'life-asoke-hype', 6, 'คอนโดย่านอโศก-พระราม 9 เดินทางสะดวกทั้ง MRT พระราม 9 และ Airport Rail Link มักกะสัน เหมาะกับคนรุ่นใหม่ที่รักชีวิตเมือง', '228 ถ.อโศก-ดินแดง', 'ราชเทวี', 'กรุงเทพมหานคร', 14000, 38000, 'both', 'Studio, 1-2 Bed', '1-2', 25.50, 64.00, 40, 1253, 2021, 'Pool,Gym,Co-Working Space,Sky Lounge,Cinema Room,Parking', '/images/condos/life-asoke-hype.jpg', 'ตึกคอนโด Life Asoke Hype ถนนอโศก-ดินแดง พระราม 9', 0.00, 0, FALSE, TRUE, 1100, 1, '2024-02-15 00:00:00'),
(8, 'The Bangkok Sathorn', 'the-bangkok-sathorn', 4, 'คอนโดหรูติด BTS สุรศักดิ์ ห้องกว้างขวาง เหมาะสำหรับครอบครัว พร้อมลิฟต์ส่วนตัวทุกยูนิต สิ่งอำนวยความสะดวกสำหรับเด็กและผู้ใหญ่ครบครัน', '253 ถ.สาทรใต้', 'สาทร', 'กรุงเทพมหานคร', 55000, 200000, 'both', '2-3', '2-3', 106.00, 152.00, 50, 468, 2017, 'Private Lift,Pool,Gym,Kids Room,Garden,Concierge,Parking', '/images/condos/the-bangkok-sathorn.jpg', 'ตึกคอนโด The Bangkok Sathorn มองจากถนนสาทร', 5.00, 1, TRUE, TRUE, 742, 1, '2024-02-20 00:00:00')
ON DUPLICATE KEY UPDATE name=VALUES(name), view_count=VALUES(view_count), rating=VALUES(rating);

-- ---------------------------------------------------------------------
-- 4. ตาราง reviews (ความคิดเห็นและรีวิว)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  condo_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  content TEXT,
  pros TEXT,
  cons TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO reviews (id, condo_id, user_id, rating, title, content, pros, cons, is_approved, created_at) VALUES
(1, 1, 1, 5, 'คุ้มค่ามาก ส่วนกลางอลังการ วิวเมืองสวยสุดๆ', 'พักที่นี่มา 1 ปีแล้ว ประทับใจการบริการของนิติบุคคลและสิ่งอำนวยความสะดวกมาก สระว่ายน้ำวิวสวย ฟิตเนสอุปกรณ์ครบถ้วน การเดินทางสะดวกสบาย', 'นิติดูแลดีมาก, ฟิตเนสชั้นนำ, เงียบสงบ, วิวเมืองสวย', 'ค่าส่วนกลางค่อนข้างสูง, รถติดช่วงเย็นแถวปากซอย', TRUE, '2024-03-01 14:20:00'),
(2, 2, 1, 4, 'ทำเลดี ราคาคุ้มค่ามาก เดินทางไปทำงานสะดวก', 'ใกล้เซ็นทรัลพระราม 9 หาของกินง่ายมาก มี 7-11 ใต้ตึก ค่าเช่าสมเหตุสมผลสำหรับทำเลใจกลางเมือง', 'ใกล้ห้าง, เดินทางสะดวก, ของกินเยอะ, คุ้มราคา', 'คนค่อนข้างเยอะช่วงเช้าต้องรอลิฟต์นานนิดหน่อย', TRUE, '2024-03-05 09:15:00'),
(3, 3, 1, 5, 'ใกล้ BTS มาก เดินไม่ถึง 3 นาที', 'ชอบมากเรื่องความสะดวกในการเดินทาง รถไฟฟ้าอยู่หน้าปากซอย ห้องเก็บเสียงได้ดี นิติตอบไว', 'ใกล้ BTS อ่อนนุช, ใกล้โลตัสและเซ็นจูรี่, ห้องเงียบ', 'ที่จอดรถค่อนข้างแน่นช่วงวันหยุด', TRUE, '2024-03-10 16:45:00'),
(4, 8, 1, 5, 'ลิฟต์ส่วนตัวสะดวกมาก พื้นที่กว้างเหมาะกับครอบครัว', 'ติด BTS สุรศักดิ์แบบเดินเชื่อมได้เลย มีลิฟต์ส่งตรงถึงโถงหน้าห้อง บรรยากาศเงียบสงบ ส่วนกลางชั้นบนมองเห็นวิวแม่น้ำเจ้าพระยาและสะพานตากสิน', 'ลิฟต์ส่วนตัว, เดินทางง่ายมาก, ส่วนกลางชั้น 32 วิวสวย', 'ค่าส่วนกลางสูงตามมาตรฐานระดับลักชัวรี', TRUE, '2024-03-15 11:30:00'),
(5, 5, 1, 5, 'บริการระดับ 5 ดาวริมแม่น้ำเจ้าพระยา', 'การบริการของพนักงานสมบูรณ์แบบ วิวแม่น้ำพาโนรามาทุกยูนิต มีเรือข้ามฟากส่วนตัวและใกล้ ICONSIAM ความปลอดภัยและความเป็นส่วนตัวสูงสุด', 'บริการระดับโรงแรม 5 ดาว, วิวแม่น้ำเจ้าพระยา, ท่าเรือส่วนตัว', 'ราคาค่าส่วนกลางและที่จอดรถสมน้ำสมเนื้อกับระดับโครงการ', TRUE, '2024-03-20 17:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title), rating=VALUES(rating);

-- ---------------------------------------------------------------------
-- 5. ตาราง condo_daily_views (ยอดผู้เข้าชมรายวัน)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condo_daily_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  condo_id INT NOT NULL,
  view_date DATE NOT NULL,
  view_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_condo_date (condo_id, view_date),
  FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE
);

INSERT INTO condo_daily_views (id, condo_id, view_date, view_count, created_at) VALUES
(1, 8, '2026-10-12', 11, '2026-10-12 00:00:00'),
(2, 3, '2026-10-12', 1, '2026-10-12 00:00:00')
ON DUPLICATE KEY UPDATE view_count=VALUES(view_count);
