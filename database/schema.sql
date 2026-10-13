-- CondoGuide Database Schema
CREATE DATABASE IF NOT EXISTS condoguide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE condoguide;

-- Users table (Authentication)
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

-- Categories table (e.g. Luxury, Budget, Studio, etc.)
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

-- Condos table
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
  image_gallery TEXT,
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

-- Reviews table
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_condo_review (user_id, condo_id)
);

-- Daily views table (Aggregated view count per condo per day for trend analytics)
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

-- Seed categories
INSERT IGNORE INTO categories (name, name_th, slug, icon, description, color) VALUES
('Luxury', 'หรูหรา', 'luxury', '👑', 'คอนโดหรูระดับพรีเมียม ดีไซน์ระดับโลก', '#C8963E'),
('Budget', 'ราคาประหยัด', 'budget', '💰', 'คอนโดราคาประหยัด คุ้มค่า เดินทางสะดวก', '#245842'),
('Studio', 'สตูดิโอ', 'studio', '🏠', 'ห้อง Studio กะทัดรัด สำหรับคนทำงานรุ่นใหม่', '#4A5B73'),
('Family', 'ครอบครัว', 'family', '👨‍👩‍👧‍👦', 'คอนโดห้องใหญ่ สิ่งอำนวยความสะดวกครบสำหรับครอบครัว', '#8F5E36'),
('Pet Friendly', 'เลี้ยงสัตว์ได้', 'pet-friendly', '🐾', 'คอนโดที่อนุญาตให้เลี้ยงสัตว์เลี้ยงได้', '#A46343'),
('Near BTS/MRT', 'ใกล้รถไฟฟ้า', 'near-bts-mrt', '🚆', 'คอนโดติดรถไฟฟ้า เดินทางเข้าเมืองได้ในไม่กี่นาที', '#1E5E45');

-- Seed condos
INSERT IGNORE INTO condos (name, slug, category_id, description, address, district, province, price_min, price_max, price_type, bedrooms, bathrooms, area_min, area_max, floor_total, unit_total, year_built, facilities, image_url, image_alt, image_credit, image_is_illustrative, rating, review_count, is_featured, created_by) VALUES
('The Ritz Residence Sukhumvit', 'ritz-residence-sukhumvit', 1, 'คอนโดหรูใจกลางสุขุมวิท ออกแบบโดยสถาปนิกชั้นนำ ห้องพักทุกห้องมีวิวเมืองที่สวยงาม', '555 ถ.สุขุมวิท', 'วัฒนา', 'กรุงเทพมหานคร', 35000, 150000, 'rent', '1-3', '1-3', 35.00, 120.00, 45, 380, 2020, 'Pool,Gym,Sauna,Sky Lounge,Concierge,Parking', '/images/condos/ritz-residence-sukhumvit.jpg', 'ตึกคอนโด The Ritz Residence Sukhumvit สุขุมวิท กรุงเทพฯ', NULL, FALSE, 4.80, 124, TRUE, 1),
('Lumpini Park Rama 9', 'lumpini-park-rama9', 2, 'คอนโดราคาประหยัด ทำเลดีย่านพระราม 9 ใกล้ห้างเซ็นทรัล', '102 ถ.พระราม 9', 'ห้วยขวาง', 'กรุงเทพมหานคร', 8000, 25000, 'rent', '1-2', '1-2', 24.00, 68.00, 35, 1200, 2018, 'Pool,Gym,Co-Working Space,Parking', '/images/condos/lumpini-park-rama9.jpg', 'ตึกคอนโด Lumpini Park Rama 9 ย่านพระราม 9 กรุงเทพฯ', NULL, FALSE, 4.20, 89, TRUE, 1),
('Ideo Mobi Sukhumvit 81', 'ideo-mobi-sukhumvit-81', 6, 'คอนโดใกล้ BTS อ่อนนุช เดินได้ 5 นาที ทำเลดีในราคาจับต้องได้', '81/1 ถ.สุขุมวิท', 'พระโขนง', 'กรุงเทพมหานคร', 12000, 40000, 'rent', '1-2', '1-2', 28.00, 55.00, 28, 680, 2019, 'Pool,Gym,Sky Garden,Parking', '/images/condos/ideo-mobi-sukhumvit-81.jpg', 'ตึกคอนโด Ideo Mobi Sukhumvit 81 ใกล้สถานีรถไฟฟ้า BTS อ่อนนุช', NULL, FALSE, 4.50, 156, TRUE, 1),
('Noble State 39', 'noble-state-39', 3, 'Studio สไตล์ modern สำหรับคนทำงานรุ่นใหม่ ใจกลางเมืองทองธานี', '39 ถ.สุขุมวิท', 'วัฒนา', 'กรุงเทพมหานคร', 18000, 35000, 'rent', '1', '1', 30.00, 45.00, 32, 450, 2021, 'Pool,Gym,Library,Parking', '/images/condos/noble-state-39.jpg', 'ตึกคอนโด Noble State 39 ซอยสุขุมวิท 39 พร้อมพงษ์', NULL, FALSE, 4.30, 72, FALSE, 1),
('The Residences at Mandarin Oriental', 'mandarin-oriental-residences', 1, 'ที่พักระดับ Ultra-luxury ริมแม่น้ำเจ้าพระยา บริการ 5 ดาวโดยโรงแรม Mandarin Oriental', '48 ถ.เจริญกรุง', 'บางรัก', 'กรุงเทพมหานคร', 120000, 500000, 'rent', '2-4', '2-4', 80.00, 350.00, 52, 146, 2022, 'Pool,Spa,Gym,Private Beach,Butler Service,Concierge', '/images/condos/mandarin-oriental-residences.jpg', 'ตึกคอนโด The Residences at Mandarin Oriental ริมแม่น้ำเจ้าพระยา', NULL, FALSE, 4.90, 45, TRUE, 1),
('Centric Ratchayothin', 'centric-ratchayothin', 4, 'คอนโดครอบครัว ใกล้ MRT รัชโยธิน พื้นที่กว้างขวาง มีสนามเด็กเล่น', '100 ถ.รัชโยธิน', 'ลาดพร้าว', 'กรุงเทพมหานคร', 20000, 60000, 'rent', '2-3', '2-3', 65.00, 150.00, 30, 320, 2020, 'Pool,Gym,Kids Club,BBQ Area,Parking', '/images/condos/centric-ratchayothin.jpg', 'ตึกคอนโด Centric Ratchayothin ลาดพร้าว', NULL, FALSE, 4.40, 98, FALSE, 1),
('Knightsbridge Bearing', 'knightsbridge-bearing', 5, 'คอนโด Pet Friendly ใกล้ BTS แบริ่ง มีพื้นที่สัตว์เลี้ยงและสวนสาธารณะ', '123 ถ.สุขุมวิท 107', 'บางนา', 'กรุงเทพมหานคร', 10000, 28000, 'rent', '1-2', '1-2', 30.00, 65.00, 25, 540, 2021, 'Pool,Gym,Pet Park,Pet Wash,Parking', '/images/condos/knightsbridge-bearing.jpg', 'ตึกคอนโด Knightsbridge Bearing บางนา', NULL, FALSE, 4.60, 63, TRUE, 1),
('Aspire Ladprao 48', 'aspire-ladprao-48', 2, 'คอนโดราคาคุ้มค่า ย่านลาดพร้าว ใกล้รถไฟฟ้าสายสีเหลือง', '48 ถ.ลาดพร้าว', 'ลาดพร้าว', 'กรุงเทพมหานคร', 7000, 18000, 'rent', '1', '1', 22.00, 45.00, 27, 960, 2019, 'Pool,Gym,Parking', '/images/condos/aspire-ladprao-48.jpg', 'ตึกคอนโด Aspire Ladprao 48 ลาดพร้าว', NULL, FALSE, 4.10, 201, FALSE, 1);
