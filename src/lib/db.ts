import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: mysql.Pool | null = null;
let mysqlAvailable: boolean | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`[DB Engine] ขาด Environment Variables สำหรับเชื่อมต่อฐานข้อมูล: ${missing.join(', ')}`);
    }

    const host = process.env.DB_HOST!;
    const isCloud = Boolean(
      host && host !== 'localhost' && host !== '127.0.0.1'
    );
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER!;
    const password = process.env.DB_PASSWORD!;
    const database = process.env.DB_NAME!;

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: isCloud ? 5 : 10,
      maxIdle: isCloud ? 2 : 5,
      idleTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      queueLimit: 0,
      charset: 'utf8mb4',
      connectTimeout: 10000,
      ssl: isCloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined,
    });

    const rawPool = (pool as unknown as { pool?: { on?: (event: string, cb: (err: unknown) => void) => void } }).pool;
    if (rawPool && typeof rawPool.on === 'function') {
      rawPool.on('error', (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[DB Engine] Pool idle connection error (handled):', msg);
      });
    }
  }
  return pool;
}

// -------------------------------------------------------------
// In-memory Database Fallback (Loaded with initial schema seeds)
// -------------------------------------------------------------

interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

interface MockCategory {
  id: number;
  name: string;
  name_th?: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  created_at: string;
}

interface MockCondo {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  description: string;
  address: string;
  district: string;
  province: string;
  price_min: number;
  price_max: number;
  price_type: 'rent' | 'sale' | 'both';
  bedrooms: string;
  bathrooms: string;
  area_min: number;
  area_max: number;
  floor_total: number;
  unit_total: number;
  year_built: number;
  facilities: string;
  image_url: string;
  image_alt?: string;
  image_credit?: string;
  image_is_illustrative?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageIsIllustrative?: boolean;
  image_gallery?: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface MockReview {
  id: number;
  condo_id: number;
  user_id: number;
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockDailyView {
  id: number;
  condo_id: number;
  view_date: string; // 'YYYY-MM-DD'
  view_count: number;
}

// Global in-memory tables (shared across hot-reloads)
const globalStore = globalThis as unknown as {
  __condoStore?: {
    users: MockUser[];
    categories: MockCategory[];
    condos: MockCondo[];
    reviews: MockReview[];
    dailyViews: MockDailyView[];
  };
};

const defaultSeedReviews: MockReview[] = [
  {
    id: 1,
    condo_id: 1,
    user_id: 1, // Admin (persistent, cannot be deleted)
    rating: 5,
    title: 'คุ้มค่ามาก ส่วนกลางอลังการ วิวเมืองสวยสุดๆ',
    content: 'พักที่นี่มา 1 ปีแล้ว ประทับใจการบริการของนิติบุคคลและสิ่งอำนวยความสะดวกมาก สระว่ายน้ำวิวสวย ฟิตเนสอุปกรณ์ครบถ้วน การเดินทางสะดวกสบาย',
    pros: 'นิติดูแลดีมาก, ฟิตเนสชั้นนำ, เงียบสงบ, วิวเมืองสวย',
    cons: 'ค่าส่วนกลางค่อนข้างสูง, รถติดช่วงเย็นแถวปากซอย',
    is_approved: true,
    created_at: '2024-03-01 14:20:00',
    updated_at: '2024-03-01 14:20:00',
  },
  {
    id: 2,
    condo_id: 2,
    user_id: 1,
    rating: 4,
    title: 'ทำเลดี ราคาคุ้มค่ามาก เดินทางไปทำงานสะดวก',
    content: 'ใกล้เซ็นทรัลพระราม 9 หาของกินง่ายมาก มี 7-11 ใต้ตึก ค่าเช่าสมเหตุสมผลสำหรับทำเลใจกลางเมือง',
    pros: 'ใกล้ห้าง, เดินทางสะดวก, ของกินเยอะ, คุ้มราคา',
    cons: 'คนค่อนข้างเยอะช่วงเช้าต้องรอลิฟต์นานนิดหน่อย',
    is_approved: true,
    created_at: '2024-03-05 09:15:00',
    updated_at: '2024-03-05 09:15:00',
  },
  {
    id: 3,
    condo_id: 3,
    user_id: 1,
    rating: 5,
    title: 'ใกล้ BTS มาก เดินไม่ถึง 3 นาที',
    content: 'ชอบมากเรื่องความสะดวกในการเดินทาง รถไฟฟ้าอยู่หน้าปากซอย ห้องเก็บเสียงได้ดี นิติตอบไว',
    pros: 'ใกล้ BTS อ่อนนุช, ใกล้โลตัสและเซ็นจูรี่, ห้องเงียบ',
    cons: 'ที่จอดรถค่อนข้างแน่นช่วงวันหยุด',
    is_approved: true,
    created_at: '2024-03-10 16:45:00',
    updated_at: '2024-03-10 16:45:00',
  },
  {
    id: 4,
    condo_id: 8,
    user_id: 1,
    rating: 5,
    title: 'ลิฟต์ส่วนตัวสะดวกมาก พื้นที่กว้างเหมาะกับครอบครัว',
    content: 'ติด BTS สุรศักดิ์แบบเดินเชื่อมได้เลย มีลิฟต์ส่งตรงถึงโถงหน้าห้อง บรรยากาศเงียบสงบ ส่วนกลางชั้นบนมองเห็นวิวแม่น้ำเจ้าพระยาและสะพานตากสิน',
    pros: 'ลิฟต์ส่วนตัว, เดินทางง่ายมาก, ส่วนกลางชั้น 32 วิวสวย',
    cons: 'ค่าส่วนกลางสูงตามมาตรฐานระดับลักชัวรี',
    is_approved: true,
    created_at: '2024-03-15 11:30:00',
    updated_at: '2024-03-15 11:30:00',
  },
  {
    id: 5,
    condo_id: 5,
    user_id: 1,
    rating: 5,
    title: 'บริการระดับ 5 ดาวริมแม่น้ำเจ้าพระยา',
    content: 'การบริการของพนักงานสมบูรณ์แบบ วิวแม่น้ำพาโนรามาทุกยูนิต มีเรือข้ามฟากส่วนตัวและใกล้ ICONSIAM ความปลอดภัยและความเป็นส่วนตัวสูงสุด',
    pros: 'บริการระดับโรงแรม 5 ดาว, วิวแม่น้ำเจ้าพระยา, ท่าเรือส่วนตัว',
    cons: 'ราคาค่าส่วนกลางและที่จอดรถสมน้ำสมเนื้อกับระดับโครงการ',
    is_approved: true,
    created_at: '2024-03-20 17:00:00',
    updated_at: '2024-03-20 17:00:00',
  },
];

export function syncCondoRatings(store: { condos: MockCondo[]; reviews: MockReview[] }) {
  store.condos.forEach(c => {
    const cReviews = store.reviews.filter(r => r.condo_id === c.id && r.is_approved);
    c.review_count = cReviews.length;
    c.rating = cReviews.length > 0
      ? Number((cReviews.reduce((sum, r) => sum + r.rating, 0) / cReviews.length).toFixed(1))
      : 0;
  });
}

function getDataFilePath(): string {
  return path.join(process.cwd(), 'database', 'data_store.json');
}

export function persistStore(store: {
  users: MockUser[];
  categories: MockCategory[];
  condos: MockCondo[];
  reviews: MockReview[];
  dailyViews: MockDailyView[];
}) {
  try {
    const dataDir = path.join(process.cwd(), 'database');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(getDataFilePath(), JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in serverless environments, ignore
  }
}

function initStore() {
  if (globalStore.__condoStore && globalStore.__condoStore.condos[0]?.image_url?.startsWith('/images/condos/')) {
    globalStore.__condoStore.dailyViews = globalStore.__condoStore.dailyViews || [];
    // Self-healing: restore default reviews if deleted/missing
    defaultSeedReviews.forEach(defRev => {
      const exists = globalStore.__condoStore!.reviews.some(
        r => r.id === defRev.id || (r.condo_id === defRev.condo_id && r.title === defRev.title)
      );
      if (!exists) {
        globalStore.__condoStore!.reviews.push({ ...defRev });
      }
    });
    globalStore.__condoStore.categories.forEach(cat => {
      if (!cat.name_th) {
        const thaiMap: Record<string, string> = {
          luxury: 'หรูหรา',
          budget: 'ราคาประหยัด',
          studio: 'สตูดิโอ',
          family: 'ครอบครัว',
          'pet-friendly': 'เลี้ยงสัตว์ได้',
          'near-bts-mrt': 'ใกล้รถไฟฟ้า',
        };
        cat.name_th = thaiMap[cat.slug] || cat.name;
      }
    });
    syncCondoRatings(globalStore.__condoStore);
    if (!fs.existsSync(getDataFilePath())) {
      persistStore(globalStore.__condoStore);
    }
    return globalStore.__condoStore;
  }

  // 1. Try loading persistent file from disk
  try {
    const dataPath = getDataFilePath();
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && Array.isArray(parsed.condos) && Array.isArray(parsed.categories)) {
        globalStore.__condoStore = {
          users: parsed.users,
          categories: parsed.categories,
          condos: parsed.condos,
          reviews: parsed.reviews || defaultSeedReviews.map(r => ({ ...r })),
          dailyViews: parsed.dailyViews || [],
        };
        syncCondoRatings(globalStore.__condoStore);
        return globalStore.__condoStore;
      }
    }
  } catch {
    // fallback to initial seed
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@condoguide.com';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ||
    '$2b$10$m3ZS41rPWrtt6tr9PzjI7uH/EaIdBeVLXPYeshuo.oShLyvfdA/86';

  const users: MockUser[] = [
    {
      id: 1,
      name: 'Admin',
      email: adminEmail,
      password: adminPasswordHash,
      role: 'admin',
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-01 10:00:00',
    },
    {
      id: 2,
      name: 'วรากร',
      email: 'warakorn@gmail.com',
      password: '$2b$10$zDSnAlG6DaphTnh3fSvi..VJdFpWTy/RwBAEfDG.qfh5QAayyUMS2',
      role: 'admin',
      created_at: '2026-10-12 17:19:09',
      updated_at: '2026-10-12 17:19:09',
    },
    {
      id: 3,
      name: 'วาริส มินเจ',
      email: 'varizz@gmail.com',
      password: '$2b$10$ihO.kevEwHvyNYC/grQVFOqddOAXNU4/.p84.VSxzEjL.r3AN2ZJm',
      role: 'user',
      created_at: '2026-10-12 17:19:35',
      updated_at: '2026-10-12 17:19:35',
    },
  ];

  const categories: MockCategory[] = [
    { id: 1, name: 'Luxury', name_th: 'หรูหรา', slug: 'luxury', icon: '👑', description: 'คอนโดหรูระดับพรีเมียม ดีไซน์ระดับโลก', color: '#f59e0b', created_at: '2024-01-01' },
    { id: 2, name: 'Budget', name_th: 'ราคาประหยัด', slug: 'budget', icon: '💰', description: 'คอนโดราคาประหยัด คุ้มค่า เดินทางสะดวก', color: '#10b981', created_at: '2024-01-01' },
    { id: 3, name: 'Studio', name_th: 'สตูดิโอ', slug: 'studio', icon: '🏠', description: 'ห้อง Studio กะทัดรัด สำหรับคนทำงานรุ่นใหม่', color: '#6366f1', created_at: '2024-01-01' },
    { id: 4, name: 'Family', name_th: 'ครอบครัว', slug: 'family', icon: '👨‍👩‍👧‍👦', description: 'คอนโดห้องใหญ่ สิ่งอำนวยความสะดวกครบสำหรับครอบครัว', color: '#ec4899', created_at: '2024-01-01' },
    { id: 5, name: 'Pet Friendly', name_th: 'เลี้ยงสัตว์ได้', slug: 'pet-friendly', icon: '🐾', description: 'คอนโดที่อนุญาตให้เลี้ยงสัตว์เลี้ยงได้', color: '#f97316', created_at: '2024-01-01' },
    { id: 6, name: 'Near BTS/MRT', name_th: 'ใกล้รถไฟฟ้า', slug: 'near-bts-mrt', icon: '🚆', description: 'คอนโดติดรถไฟฟ้า เดินทางเข้าเมืองได้ในไม่กี่นาที', color: '#3b82f6', created_at: '2024-01-01' },
  ];

  const condos: MockCondo[] = [
    {
      id: 1,
      name: 'The Ritz Residence Sukhumvit',
      slug: 'ritz-residence-sukhumvit',
      category_id: 1,
      description: 'คอนโดหรูระดับเวิลด์คลาสใจกลางสุขุมวิท ออกแบบโดยสถาปนิกชั้นนำ ห้องพักทุกห้องมองเห็นวิวเมืองกรุงเทพแบบ 360 องศา พร้อมบริการคอนเซียร์จระดับ 5 ดาวตลอด 24 ชม.',
      address: '555 ถ.สุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      price_min: 35000,
      price_max: 150000,
      price_type: 'both',
      bedrooms: '1-3',
      bathrooms: '1-3',
      area_min: 35.0,
      area_max: 120.0,
      floor_total: 45,
      unit_total: 380,
      year_built: 2021,
      facilities: 'Pool,Gym,Sauna,Sky Lounge,Concierge,Parking,Security',
      image_url: '/images/condos/ritz-residence-sukhumvit.jpg',
      image_alt: 'ตึกคอนโด The Ritz Residence Sukhumvit สุขุมวิท กรุงเทพฯ',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/ritz-residence-sukhumvit.jpg',
      imageAlt: 'ตึกคอนโด The Ritz Residence Sukhumvit สุขุมวิท กรุงเทพฯ',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.8,
      review_count: 124,
      is_featured: true,
      is_active: true,
      view_count: 1540,
      created_by: 1,
      created_at: '2024-01-10',
      updated_at: '2024-01-10',
    },
    {
      id: 2,
      name: 'Lumpini Park Rama 9',
      slug: 'lumpini-park-rama9',
      category_id: 2,
      description: 'คอนโดราคาประหยัด ทำเลศูนย์กลางธุรกิจพระราม 9 ใกล้เซ็นทรัลพระราม 9 และ MRT พระราม 9 พร้อมพื้นที่สีเขียวกว่า 2 ไร่',
      address: '102 ถ.พระราม 9',
      district: 'ห้วยขวาง',
      province: 'กรุงเทพมหานคร',
      price_min: 8500,
      price_max: 25000,
      price_type: 'both',
      bedrooms: '1-2',
      bathrooms: '1-2',
      area_min: 24.0,
      area_max: 68.0,
      floor_total: 35,
      unit_total: 1200,
      year_built: 2019,
      facilities: 'Pool,Gym,Co-Working Space,Parking,Security,Garden',
      image_url: '/images/condos/lumpini-park-rama9.jpg',
      image_alt: 'ตึกคอนโด Lumpini Park Rama 9 ย่านพระราม 9 กรุงเทพฯ',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/lumpini-park-rama9.jpg',
      imageAlt: 'ตึกคอนโด Lumpini Park Rama 9 ย่านพระราม 9 กรุงเทพฯ',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.2,
      review_count: 89,
      is_featured: true,
      is_active: true,
      view_count: 980,
      created_by: 1,
      created_at: '2024-01-12',
      updated_at: '2024-01-12',
    },
    {
      id: 3,
      name: 'Ideo Mobi Sukhumvit 81',
      slug: 'ideo-mobi-sukhumvit-81',
      category_id: 6,
      description: 'คอนโดใกล้ BTS อ่อนนุช เพียง 250 เมตร ก้าวเดียวถึงสิ่งอำนวยความสะดวกครบครัน สระว่ายน้ำระบบเกลือ ฟิตเนสลอยฟ้า',
      address: '81/1 ถ.สุขุมวิท',
      district: 'พระโขนง',
      province: 'กรุงเทพมหานคร',
      price_min: 12000,
      price_max: 40000,
      price_type: 'both',
      bedrooms: '1-2',
      bathrooms: '1-2',
      area_min: 28.0,
      area_max: 55.0,
      floor_total: 28,
      unit_total: 680,
      year_built: 2020,
      facilities: 'Pool,Gym,Sky Garden,Parking,Security',
      image_url: '/images/condos/ideo-mobi-sukhumvit-81.jpg',
      image_alt: 'ตึกคอนโด Ideo Mobi Sukhumvit 81 ใกล้สถานีรถไฟฟ้า BTS อ่อนนุช',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/ideo-mobi-sukhumvit-81.jpg',
      imageAlt: 'ตึกคอนโด Ideo Mobi Sukhumvit 81 ใกล้สถานีรถไฟฟ้า BTS อ่อนนุช',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.5,
      review_count: 156,
      is_featured: true,
      is_active: true,
      view_count: 1420,
      created_by: 1,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: 4,
      name: 'Noble State 39',
      slug: 'noble-state-39',
      category_id: 3,
      description: 'Studio & 1-Bedroom สไตล์ Modern Minimalist ใจกลางพร้อมพงษ์ ใกล้ The EmQuartier และ Emporium ตอบโจทย์คนทำงานยุคใหม่',
      address: '39 ถ.สุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      price_min: 18000,
      price_max: 35000,
      price_type: 'both',
      bedrooms: 'Studio, 1 Bed',
      bathrooms: '1',
      area_min: 30.0,
      area_max: 45.0,
      floor_total: 32,
      unit_total: 450,
      year_built: 2022,
      facilities: 'Pool,Gym,Library,Co-Kitchen,Parking',
      image_url: '/images/condos/noble-state-39.jpg',
      image_alt: 'ตึกคอนโด Noble State 39 ซอยสุขุมวิท 39 พร้อมพงษ์',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/noble-state-39.jpg',
      imageAlt: 'ตึกคอนโด Noble State 39 ซอยสุขุมวิท 39 พร้อมพงษ์',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.3,
      review_count: 72,
      is_featured: false,
      is_active: true,
      view_count: 650,
      created_by: 1,
      created_at: '2024-01-20',
      updated_at: '2024-01-20',
    },
    {
      id: 5,
      name: 'The Residences at Mandarin Oriental',
      slug: 'mandarin-oriental-residences',
      category_id: 1,
      description: 'ที่สุดแห่งความหรูหราริมแม่น้ำเจ้าพระยา มาตรฐานการบริการระดับ 5 ดาวจาก Mandarin Oriental ใกล้ ICONSIAM',
      address: '48 ถ.เจริญกรุง',
      district: 'บางรัก',
      province: 'กรุงเทพมหานคร',
      price_min: 120000,
      price_max: 500000,
      price_type: 'both',
      bedrooms: '2-4',
      bathrooms: '2-4',
      area_min: 80.0,
      area_max: 350.0,
      floor_total: 52,
      unit_total: 146,
      year_built: 2022,
      facilities: 'Pool,Spa,Gym,Private Beach,Butler Service,Concierge,Parking',
      image_url: '/images/condos/mandarin-oriental-residences.jpg',
      image_alt: 'ตึกคอนโด The Residences at Mandarin Oriental ริมแม่น้ำเจ้าพระยา',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/mandarin-oriental-residences.jpg',
      imageAlt: 'ตึกคอนโด The Residences at Mandarin Oriental ริมแม่น้ำเจ้าพระยา',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.9,
      review_count: 45,
      is_featured: true,
      is_active: true,
      view_count: 2100,
      created_by: 1,
      created_at: '2024-02-01',
      updated_at: '2024-02-01',
    },
    {
      id: 6,
      name: 'Whizdom Essence Sukhumvit',
      slug: 'whizdom-essence-sukhumvit',
      category_id: 5,
      description: 'คอนโด Pet-Friendly ที่แท้จริง มีสวนสำหรับสัตว์เลี้ยงและคลินิกรักษา ใกล้ BTS ปุณณวิถี และโครงการ True Digital Park',
      address: '101 ถ.สุขุมวิท',
      district: 'พระโขนง',
      province: 'กรุงเทพมหานคร',
      price_min: 15000,
      price_max: 42000,
      price_type: 'both',
      bedrooms: '1-2',
      bathrooms: '1-2',
      area_min: 33.0,
      area_max: 65.0,
      floor_total: 50,
      unit_total: 664,
      year_built: 2020,
      facilities: 'Pet Park,Pool,Gym,Sky Garden,Parking',
      image_url: '/images/condos/whizdom-essence-sukhumvit.jpg',
      image_alt: 'ตึกคอนโด Whizdom Essence Sukhumvit ย่านปุณณวิถี',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/whizdom-essence-sukhumvit.jpg',
      imageAlt: 'ตึกคอนโด Whizdom Essence Sukhumvit ย่านปุณณวิถี',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.6,
      review_count: 67,
      is_featured: true,
      is_active: true,
      view_count: 820,
      created_by: 1,
      created_at: '2024-02-10',
      updated_at: '2024-02-10',
    },
    {
      id: 7,
      name: 'Life Asoke Hype',
      slug: 'life-asoke-hype',
      category_id: 6,
      description: 'คอนโดย่านอโศก-พระราม 9 เดินทางสะดวกทั้ง MRT พระราม 9 และ Airport Rail Link มักกะสัน เหมาะกับคนรุ่นใหม่ที่รักชีวิตเมือง',
      address: '228 ถ.อโศก-ดินแดง',
      district: 'ราชเทวี',
      province: 'กรุงเทพมหานคร',
      price_min: 14000,
      price_max: 38000,
      price_type: 'both',
      bedrooms: 'Studio, 1-2 Bed',
      bathrooms: '1-2',
      area_min: 25.5,
      area_max: 64.0,
      floor_total: 40,
      unit_total: 1253,
      year_built: 2021,
      facilities: 'Pool,Gym,Co-Working Space,Sky Lounge,Cinema Room,Parking',
      image_url: '/images/condos/life-asoke-hype.jpg',
      image_alt: 'ตึกคอนโด Life Asoke Hype ถนนอโศก-ดินแดง พระราม 9',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/life-asoke-hype.jpg',
      imageAlt: 'ตึกคอนโด Life Asoke Hype ถนนอโศก-ดินแดง พระราม 9',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.4,
      review_count: 94,
      is_featured: false,
      is_active: true,
      view_count: 1100,
      created_by: 1,
      created_at: '2024-02-15',
      updated_at: '2024-02-15',
    },
    {
      id: 8,
      name: 'The Bangkok Sathorn',
      slug: 'the-bangkok-sathorn',
      category_id: 4,
      description: 'คอนโดหรูติด BTS สุรศักดิ์ ห้องกว้างขวาง เหมาะสำหรับครอบครัว พร้อมลิฟต์ส่วนตัวทุกยูนิต สิ่งอำนวยความสะดวกสำหรับเด็กและผู้ใหญ่ครบครัน',
      address: '253 ถ.สาทรใต้',
      district: 'สาทร',
      province: 'กรุงเทพมหานคร',
      price_min: 55000,
      price_max: 200000,
      price_type: 'both',
      bedrooms: '2-3',
      bathrooms: '2-3',
      area_min: 106.0,
      area_max: 152.0,
      floor_total: 50,
      unit_total: 468,
      year_built: 2017,
      facilities: 'Private Lift,Pool,Gym,Kids Room,Garden,Concierge,Parking',
      image_url: '/images/condos/the-bangkok-sathorn.jpg',
      image_alt: 'ตึกคอนโด The Bangkok Sathorn มองจากถนนสาทร',
      image_credit: '',
      image_is_illustrative: false,
      imageUrl: '/images/condos/the-bangkok-sathorn.jpg',
      imageAlt: 'ตึกคอนโด The Bangkok Sathorn มองจากถนนสาทร',
      imageCredit: '',
      imageIsIllustrative: false,
      rating: 4.7,
      review_count: 53,
      is_featured: true,
      is_active: true,
      view_count: 730,
      created_by: 1,
      created_at: '2024-02-20',
      updated_at: '2024-02-20',
    },
  ];

  const reviews: MockReview[] = defaultSeedReviews.map(r => ({ ...r }));
  const dailyViews: MockDailyView[] = [];
  globalStore.__condoStore = { users, categories, condos, reviews, dailyViews };
  syncCondoRatings(globalStore.__condoStore);
  persistStore(globalStore.__condoStore);
  return globalStore.__condoStore;
}

// -------------------------------------------------------------
// In-Memory Query Runner
// -------------------------------------------------------------

function runMockQuery<T>(sql: string, params: unknown[] = []): T {
  const store = initStore();
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  const lower = cleanSql.toLowerCase();

  // 1. SELECT COUNT queries
  if (lower.startsWith('select count(') || lower.includes('count(*)')) {
    if (lower.includes('from condos') && lower.includes('category_id = ?')) {
      const catId = Number(params[0]);
      const total = store.condos.filter(c => c.category_id === catId && c.is_active).length;
      return [{ total, count: total }] as unknown as T;
    }
    if (lower.includes('from condos') && lower.includes('is_featured = 1')) {
      const total = store.condos.filter(c => c.is_active && c.is_featured).length;
      return [{ total, count: total }] as unknown as T;
    }
    if (lower.includes('from condos') && lower.includes('is_featured = 0')) {
      const total = store.condos.filter(c => c.is_active && !c.is_featured).length;
      return [{ total, count: total }] as unknown as T;
    }
    if (lower.includes('from condos')) {
      let filtered = store.condos.filter(c => c.is_active);
      let pIdx = 0;
      if (lower.includes('name like ?')) {
        const term = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.address.toLowerCase().includes(term) ||
          c.district.toLowerCase().includes(term)
        );
        pIdx += 4;
      }
      if (lower.includes('cat.slug = ?')) {
        const catSlug = String(params[pIdx] || '');
        const cat = store.categories.find(k => k.slug === catSlug);
        filtered = filtered.filter(c => c.category_id === cat?.id);
        pIdx++;
      }
      if (lower.includes('category_id = ?')) {
        const catId = Number(params[pIdx] || params[0]);
        filtered = filtered.filter(c => c.category_id === catId);
        pIdx++;
      }
      if (lower.includes('district like ?')) {
        const dist = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(c => c.district.toLowerCase().includes(dist));
      }
      if (lower.includes('is_featured = 1')) {
        filtered = filtered.filter(c => c.is_featured);
      } else if (lower.includes('is_featured = 0')) {
        filtered = filtered.filter(c => !c.is_featured);
      }
      return [{ total: filtered.length, count: filtered.length }] as unknown as T;
    }
    if (lower.includes('from users')) {
      return [{ total: store.users.length, count: store.users.length }] as unknown as T;
    }
    if (lower.includes('from reviews')) {
      return [{ total: store.reviews.filter(r => r.is_approved).length, count: store.reviews.filter(r => r.is_approved).length }] as unknown as T;
    }
    if (lower.includes('from categories')) {
      return [{ total: store.categories.length, count: store.categories.length }] as unknown as T;
    }
    return [{ total: 0, count: 0 }] as unknown as T;
  }

  // 2. Categories with count (SELECT cat.*, COUNT(c.id) as count)
  if (lower.includes('from categories cat left join condos c') || lower.includes('select cat.name, cat.icon')) {
    const list = store.categories.map(cat => {
      const cCount = store.condos.filter(c => c.category_id === cat.id && c.is_active).length;
      return {
        ...cat,
        name_th: cat.name_th || cat.name,
        count: cCount,
        condo_count: cCount,
      };
    }).sort((a, b) => (lower.includes('order by cat.id') ? a.id - b.id : b.count - a.count));
    return list as unknown as T;
  }

  // 3. Simple categories select
  if (lower.startsWith('select * from categories') || lower.startsWith('select id, name, slug from categories')) {
    const list = store.categories.map(cat => {
      const cCount = store.condos.filter(c => c.category_id === cat.id && c.is_active).length;
      return {
        ...cat,
        name_th: cat.name_th || cat.name,
        count: cCount,
        condo_count: cCount,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
    return list as unknown as T;
  }

  // 4. Users query
  if (lower.startsWith('select') && lower.includes('from users')) {
    if (lower.includes('id != ?')) {
      const email = String(params[0] || '').toLowerCase();
      const excludeId = Number(params[1]);
      const user = store.users.find(u => u.email.toLowerCase() === email && u.id !== excludeId);
      return (user ? [{ id: user.id }] : []) as unknown as T;
    }
    if (lower.includes('where email = ?')) {
      const email = String(params[0] || '').toLowerCase();
      const user = store.users.find(u => u.email.toLowerCase() === email);
      return (user ? [user] : []) as unknown as T;
    }
    if (lower.includes('select id from users where email = ?')) {
      const email = String(params[0] || '').toLowerCase();
      const user = store.users.find(u => u.email.toLowerCase() === email);
      return (user ? [{ id: user.id }] : []) as unknown as T;
    }
    if (lower.includes('where id = ?')) {
      const id = Number(params[0]);
      const user = store.users.find(u => u.id === id);
      return (user ? [user] : []) as unknown as T;
    }
    // all users with pagination if any
    const limitMatch = lower.match(/limit\s+(\d+)/);
    const offsetMatch = lower.match(/offset\s+(\d+)/);
    const offset = offsetMatch ? Number(offsetMatch[1]) : 0;
    const limit = limitMatch ? Number(limitMatch[1]) : store.users.length;

    let users = store.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || null,
      created_at: u.created_at,
    }));
    if (lower.includes('order by created_at desc')) {
      users = [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return users.slice(offset, offset + limit) as unknown as T;
  }

  // 5. Reviews query
  if (lower.startsWith('select') && lower.includes('from reviews')) {
    if (lower.includes('group by rating')) {
      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      store.reviews.filter(r => r.is_approved).forEach(r => {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
      });
      const res = [1, 2, 3, 4, 5].map(r => ({
        rating: r,
        count: counts[r] || 0,
      }));
      return res as unknown as T;
    }

    if (lower.includes('group by review_date') || lower.includes('group by date')) {
      let revs = store.reviews.filter(r => r.is_approved);
      if (params.length > 0 && params[0]) {
        const cutoff = new Date(String(params[0])).getTime();
        revs = revs.filter(r => new Date(r.created_at).getTime() >= cutoff);
      }
      const map = new Map<string, number>();
      revs.forEach(r => {
        const d = r.created_at.slice(0, 10);
        map.set(d, (map.get(d) || 0) + 1);
      });
      const res = Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([review_date, count]) => ({
          review_date,
          count,
        }));
      return res as unknown as T;
    }

    let revs = [...store.reviews];
    if (lower.includes('r.condo_id = ?')) {
      const condoId = Number(params[0]);
      revs = revs.filter(r => r.condo_id === condoId && r.is_approved);
    } else if (lower.includes('where is_approved = 1') || lower.includes('where r.is_approved = 1')) {
      revs = revs.filter(r => r.is_approved);
    }
    const withDetails = revs.map(r => {
      const user = store.users.find(u => u.id === r.user_id);
      const condo = store.condos.find(c => c.id === r.condo_id);
      return {
        ...r,
        user_name: user?.name || 'ผู้ใช้งาน',
        user_avatar: user?.avatar || null,
        condo_name: condo?.name || 'คอนโด',
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (lower.includes('limit 5')) return withDetails.slice(0, 5) as unknown as T;
    if (lower.includes('limit 10')) return withDetails.slice(0, 10) as unknown as T;
    return withDetails as unknown as T;
  }

  // 5.5 Daily views query
  if (lower.startsWith('select') && lower.includes('from condo_daily_views')) {
    store.dailyViews = store.dailyViews || [];
    let views = [...store.dailyViews];
    if (params.length > 0 && params[0]) {
      const cutoff = String(params[0]);
      views = views.filter(v => v.view_date >= cutoff);
    }
    const map = new Map<string, number>();
    views.forEach(v => {
      map.set(v.view_date, (map.get(v.view_date) || 0) + v.view_count);
    });
    const result = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([view_date, total_views]) => ({
        view_date,
        total_views,
      }));
    return result as unknown as T;
  }

  // 6. Condos query
  if (lower.startsWith('select') && lower.includes('from condos')) {
    let list = store.condos.filter(c => c.is_active);

    // Specific slug
    if (lower.includes('c.slug = ?') || lower.includes('where slug = ?')) {
      const slug = String(params[0] || '');
      const item = store.condos.find(c => c.slug === slug);
      if (!item) return [] as unknown as T;
      const cat = store.categories.find(k => k.id === item.category_id);
      const user = store.users.find(u => u.id === item.created_by);
      const condoReviews = store.reviews.filter(r => r.condo_id === item.id && r.is_approved);
      const realCount = condoReviews.length;
      const realRating = realCount > 0
        ? Number((condoReviews.reduce((sum, r) => sum + r.rating, 0) / realCount).toFixed(1))
        : 0;

      return [{
        ...item,
        rating: realRating,
        review_count: realCount,
        category_name: cat?.name || '',
        category_icon: cat?.icon || '🏢',
        category_color: cat?.color || '#6366f1',
        author_name: user?.name || 'Admin',
      }] as unknown as T;
    }

    // Filters
    let pIdx = 0;
    if (lower.includes('name like ?')) {
      const term = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term) ||
        c.district.toLowerCase().includes(term)
      );
      pIdx += 4;
    }
    if (lower.includes('cat.slug = ?')) {
      const catSlug = String(params[pIdx] || '');
      const cat = store.categories.find(k => k.slug === catSlug);
      list = list.filter(c => c.category_id === cat?.id);
      pIdx++;
    }
    if (lower.includes('c.district like ?')) {
      const dist = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(c => c.district.toLowerCase().includes(dist));
      pIdx++;
    }
    if (lower.includes('c.price_min >=')) {
      const pMin = Number(params[pIdx]);
      list = list.filter(c => c.price_min >= pMin);
      pIdx++;
    }
    if (lower.includes('c.price_max <=')) {
      const pMax = Number(params[pIdx]);
      list = list.filter(c => c.price_max <= pMax);
      pIdx++;
    }
    if (lower.includes('c.is_featured = 1')) {
      list = list.filter(c => c.is_featured);
    } else if (lower.includes('c.is_featured = 0')) {
      list = list.filter(c => !c.is_featured);
    }

    const getCondoRating = (c: MockCondo) => {
      const revs = store.reviews.filter(r => r.condo_id === c.id && r.is_approved);
      return revs.length > 0
        ? Number((revs.reduce((sum, r) => sum + r.rating, 0) / revs.length).toFixed(1))
        : 0;
    };
    const getCondoReviewCount = (c: MockCondo) => {
      return store.reviews.filter(r => r.condo_id === c.id && r.is_approved).length;
    };

    // Sorting
    if (lower.includes('view_count asc')) {
      list = [...list].sort((a, b) => a.view_count - b.view_count);
    } else if (lower.includes('view_count desc')) {
      list = [...list].sort((a, b) => b.view_count - a.view_count);
    } else if (lower.includes('price_min asc')) {
      list = [...list].sort((a, b) => a.price_min - b.price_min);
    } else if (lower.includes('price_min desc')) {
      list = [...list].sort((a, b) => b.price_min - a.price_min);
    } else if (lower.includes('rating asc')) {
      list = [...list].sort((a, b) => getCondoRating(a) - getCondoRating(b) || getCondoReviewCount(a) - getCondoReviewCount(b));
    } else if (lower.includes('rating desc')) {
      list = [...list].sort((a, b) => getCondoRating(b) - getCondoRating(a) || getCondoReviewCount(b) - getCondoReviewCount(a));
    } else if (lower.includes('created_at desc')) {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list = [...list].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || getCondoRating(b) - getCondoRating(a));
    }

    // Limit / Offset
    const limitMatch = lower.match(/limit\s+(\d+)/);
    const offsetMatch = lower.match(/offset\s+(\d+)/);
    const offset = offsetMatch ? Number(offsetMatch[1]) : 0;
    const limit = limitMatch ? Number(limitMatch[1]) : list.length;

    const sliced = list.slice(offset, offset + limit).map(c => {
      const cat = store.categories.find(k => k.id === c.category_id);
      const condoReviews = store.reviews.filter(r => r.condo_id === c.id && r.is_approved);
      const realCount = condoReviews.length;
      const realRating = realCount > 0
        ? Number((condoReviews.reduce((sum, r) => sum + r.rating, 0) / realCount).toFixed(1))
        : 0;

      return {
        ...c,
        rating: realRating,
        review_count: realCount,
        category_name: cat?.name || '',
        category_slug: cat?.slug || '',
        category_icon: cat?.icon || '🏢',
        category_color: cat?.color || '#6366f1',
      };
    });

    return sliced as unknown as T;
  }

  // 7. INSERT INTO users
  if (lower.startsWith('insert into users')) {
    const [name, email, password, role] = params as [string, string, string, 'admin' | 'user'];
    const newId = store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
    store.users.push({
      id: newId,
      name,
      email,
      password,
      role: role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    persistStore(store);
    return { insertId: newId, affectedRows: 1 } as unknown as T;
  }

  // 8. INSERT INTO categories
  if (lower.startsWith('insert into categories')) {
    let name = '';
    let name_th = '';
    let catSlug = '';
    let icon = '🏢';
    let description = '';
    let color = '#C8963E';

    if (lower.includes('name_th')) {
      [name, name_th, catSlug, icon, description, color] = params as [string, string, string, string, string, string];
    } else {
      [name, catSlug, icon, description, color] = params as [string, string, string, string, string];
      name_th = name;
    }

    const newId = store.categories.length > 0 ? Math.max(...store.categories.map(c => c.id)) + 1 : 1;
    store.categories.push({
      id: newId,
      name,
      name_th: name_th || name,
      slug: catSlug,
      icon: icon || '🏢',
      description: description || '',
      color: color || '#C8963E',
      created_at: new Date().toISOString(),
    });
    persistStore(store);
    return { insertId: newId, affectedRows: 1 } as unknown as T;
  }

  // 9. UPDATE categories
  if (lower.startsWith('update categories')) {
    const id = Number(params[params.length - 1]);
    const cat = store.categories.find(c => c.id === id);
    if (cat) {
      if (lower.includes('name_th = ?')) {
        cat.name = String(params[0]);
        cat.name_th = String(params[1]);
        cat.slug = String(params[2]);
        cat.icon = String(params[3]);
        cat.description = String(params[4]);
        cat.color = String(params[5]);
      } else if (params.length >= 5) {
        cat.name = String(params[0]);
        cat.slug = String(params[1]);
        cat.icon = String(params[2]);
        cat.description = String(params[3]);
        cat.color = String(params[4]);
      }
      persistStore(store);
    }
    return { affectedRows: cat ? 1 : 0 } as unknown as T;
  }

  // 10. DELETE FROM categories
  if (lower.startsWith('delete from categories')) {
    const id = Number(params[0]);
    store.categories = store.categories.filter(c => c.id !== id);
    persistStore(store);
    return { affectedRows: 1 } as unknown as T;
  }

  // 11. INSERT INTO condos
  if (lower.startsWith('insert into condos')) {
    const [
      name, slug, category_id, description, address, district, province,
      price_min, price_max, price_type, bedrooms, bathrooms, area_min, area_max,
      floor_total, unit_total, year_built, facilities, image_url, is_featured, created_by
    ] = params as [
      string, string, number, string, string, string, string,
      number, number, 'rent' | 'sale' | 'both', string, string, number, number,
      number, number, number, string, string, boolean | number, number
    ];
    const newId = store.condos.length > 0 ? Math.max(...store.condos.map(c => c.id)) + 1 : 1;
    store.condos.push({
      id: newId,
      name,
      slug,
      category_id: Number(category_id),
      description: description || '',
      address: address || '',
      district: district || '',
      province: province || 'กรุงเทพมหานคร',
      price_min: Number(price_min) || 0,
      price_max: Number(price_max) || 0,
      price_type: price_type || 'both',
      bedrooms: bedrooms || '1',
      bathrooms: bathrooms || '1',
      area_min: Number(area_min) || 0,
      area_max: Number(area_max) || 0,
      floor_total: Number(floor_total) || 1,
      unit_total: Number(unit_total) || 1,
      year_built: Number(year_built) || 2024,
      facilities: facilities || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      rating: 5.0,
      review_count: 0,
      is_featured: Boolean(is_featured),
      is_active: true,
      view_count: 0,
      created_by: created_by || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    persistStore(store);
    return { insertId: newId, affectedRows: 1 } as unknown as T;
  }

  // 11.5 INSERT INTO condo_daily_views
  if (lower.startsWith('insert into condo_daily_views')) {
    const condoId = Number(params[0]);
    const today = params[1] ? String(params[1]) : '2026-10-12';
    store.dailyViews = store.dailyViews || [];
    const existing = store.dailyViews.find(v => v.condo_id === condoId && v.view_date === today);
    if (existing) {
      existing.view_count += 1;
    } else {
      store.dailyViews.push({
        id: store.dailyViews.length + 1,
        condo_id: condoId,
        view_date: today,
        view_count: 1,
      });
    }
    persistStore(store);
    return { affectedRows: 1 } as unknown as T;
  }

  // 12. UPDATE condos
  if (lower.startsWith('update condos')) {
    if (lower.includes('rating =') && lower.includes('review_count =')) {
      const condoId = Number(params[params.length - 1]);
      const condo = store.condos.find(c => c.id === condoId || c.slug === String(condoId));
      if (condo) {
        const cReviews = store.reviews.filter(r => r.condo_id === condo.id && r.is_approved);
        condo.review_count = cReviews.length;
        condo.rating = cReviews.length > 0
          ? Number((cReviews.reduce((sum, r) => sum + r.rating, 0) / cReviews.length).toFixed(1))
          : 0;
        persistStore(store);
      }
      return { affectedRows: 1 } as unknown as T;
    }
    if (lower.includes('view_count = view_count + 1')) {
      const slug = String(params[0]);
      const condo = store.condos.find(c => c.slug === slug);
      if (condo) {
        condo.view_count += 1;
        persistStore(store);
      }
      return { affectedRows: 1 } as unknown as T;
    }
    if (lower.includes('is_active = 0')) {
      const slug = String(params[0]);
      const condo = store.condos.find(c => c.slug === slug);
      if (condo) {
        condo.is_active = false;
        persistStore(store);
      }
      return { affectedRows: 1 } as unknown as T;
    }
    const slugOrId = params[params.length - 1];
    const condo = store.condos.find(c => c.slug === String(slugOrId) || c.id === Number(slugOrId));
    if (condo && params.length > 1) {
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
      if (setMatch) {
        const fieldNames = setMatch[1].split(',').map(f => f.trim().split('=')[0].trim());
        fieldNames.forEach((field, i) => {
          (condo as unknown as Record<string, unknown>)[field] = params[i];
          if (field === 'image_url') condo.imageUrl = String(params[i]);
          if (field === 'image_alt') condo.imageAlt = String(params[i]);
          if (field === 'image_credit') condo.imageCredit = String(params[i]);
          if (field === 'image_is_illustrative') condo.imageIsIllustrative = Boolean(params[i]);
        });
      }
      condo.updated_at = new Date().toISOString();
      persistStore(store);
    }
    return { affectedRows: 1 } as unknown as T;
  }

  // 13. DELETE FROM condos
  if (lower.startsWith('delete from condos')) {
    const slugOrId = params[0];
    store.condos = store.condos.filter(c => c.slug !== slugOrId && c.id !== Number(slugOrId));
    persistStore(store);
    return { affectedRows: 1 } as unknown as T;
  }

  // 14. INSERT INTO reviews
  if (lower.startsWith('insert into reviews')) {
    const [condo_id, user_id, rating, title, content, pros, cons] = params as [
      number, number, number, string, string, string, string
    ];
    const newId = store.reviews.length > 0 ? Math.max(...store.reviews.map(r => r.id)) + 1 : 1;
    store.reviews.push({
      id: newId,
      condo_id: Number(condo_id),
      user_id: Number(user_id),
      rating: Number(rating),
      title: title || '',
      content: content || '',
      pros: pros || '',
      cons: cons || '',
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    // Recalculate condo rating and review_count
    const cReviews = store.reviews.filter(r => r.condo_id === Number(condo_id) && r.is_approved);
    const targetCondo = store.condos.find(c => c.id === Number(condo_id));
    if (targetCondo) {
      targetCondo.review_count = cReviews.length;
      targetCondo.rating = Number((cReviews.reduce((sum, r) => sum + r.rating, 0) / cReviews.length).toFixed(1));
    }
    persistStore(store);
    return { insertId: newId, affectedRows: 1 } as unknown as T;
  }

  // 15. DELETE FROM reviews
  if (lower.startsWith('delete from reviews')) {
    const id = Number(params[0]);
    store.reviews = store.reviews.filter(r => r.id !== id);
    syncCondoRatings(store);
    persistStore(store);
    return { affectedRows: 1 } as unknown as T;
  }

  // 16. DELETE FROM users
  if (lower.startsWith('delete from users')) {
    let id = params.length > 0 ? Number(params[0]) : NaN;
    if (isNaN(id)) {
      const match = lower.match(/where\s+id\s*=\s*(\d+)/);
      if (match) id = Number(match[1]);
    }
    const beforeLen = store.users.length;
    store.users = store.users.filter(u => u.id !== id);
    store.reviews = store.reviews.filter(r => r.user_id !== id);
    syncCondoRatings(store);
    const affected = beforeLen - store.users.length;
    persistStore(store);
    return { affectedRows: affected } as unknown as T;
  }

  // 17. UPDATE users
  if (lower.startsWith('update users')) {
    if (lower.includes('password = ?')) {
      const [name, email, role, password, id] = params as [string, string, 'admin' | 'user', string, number];
      const target = store.users.find(u => u.id === Number(id));
      if (target) {
        target.name = name;
        target.email = email;
        target.role = role || target.role;
        target.password = password;
        target.updated_at = new Date().toISOString();
        persistStore(store);
        return { affectedRows: 1 } as unknown as T;
      }
    } else {
      const [name, email, role, id] = params as [string, string, 'admin' | 'user', number];
      const target = store.users.find(u => u.id === Number(id));
      if (target) {
        target.name = name;
        target.email = email;
        target.role = role || target.role;
        target.updated_at = new Date().toISOString();
        persistStore(store);
        return { affectedRows: 1 } as unknown as T;
      }
    }
    return { affectedRows: 0 } as unknown as T;
  }

  return [] as unknown as T;
}

export default getPool;

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
  // Try MySQL if not determined unavailable
  if (mysqlAvailable !== false) {
    try {
      const p = getPool();
      const res = await p.query(
        sql,
        (params || []) as (string | number | boolean | null | Date | Buffer)[]
      );
      if (Array.isArray(res)) {
        mysqlAvailable = true;
        return res[0] as T;
      }
      return res as unknown as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err.message || err.name) : String(err);
      console.warn(`[DB Engine] MySQL query failed (${msg}), using persistent file-backed database store`);
      mysqlAvailable = false;
    }
  }

  // Fallback to persistent file-backed store
  return runMockQuery<T>(sql, params || []);
}

export async function recordCondoDailyView(condoId: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await query(
      `INSERT INTO condo_daily_views (condo_id, view_date, view_count)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
      [condoId, today]
    );
  } catch (err) {
    console.error('Failed to record condo daily view:', err);
  }
}
