# 🏢 CondoGuide (แพลตฟอร์มค้นหาและรีวิวคอนโดมิเนียม)

เว็บไซต์ระบบสารสนเทศ (Information Platform) รวบรวมข้อมูลคอนโดมิเนียม อพาร์ทเม้นต์ พร้อมระบบรีวิวและการจัดการข้อมูลแบบ Full-stack พัฒนาด้วย **Next.js 16 (App Router)**, **TypeScript**, **MySQL** และ **Vanilla CSS Design System**

---

*(สามารถแก้ไขข้อมูลสมาชิกเพิ่มเติมได้ที่ไฟล์ `src/app/team/page.tsx` หรือดูได้ที่หน้าเว็บ `/team`)*

---

## 🎯 คุณสมบัติของระบบตามข้อกำหนด
- [x] **Information Website:** เว็บไซต์แนะนำคอนโดมิเนียม แสดงรูปภาพ ราคา ทำเล สิ่งอำนวยความสะดวก และรีวิวจริง
- [x] **Frontend & Backend ในตัวเดียว:** ใช้ Next.js App Router เชื่อมต่อ RESTful API Routes ภายในโปรเจกต์
- [x] **Next.js + MySQL Database:** รองรับการเชื่อมต่อ MySQL พร้อมระบบ Resilient In-Memory Fallback 
- [x] **CRUD อย่างน้อย 2 ตาราง (มีความสัมพันธ์กัน):**
  - **ตารางที่ 1 `condos`:** Create (`/admin/condos/new`), Read (`/condos`, `/condos/[slug]`), Update (`/admin/condos/[slug]/edit`), Delete (`/admin/condos`)
  - **ตารางที่ 2 `categories`:** Create (`/admin/categories`), Read (`/categories`), Update (`/admin/categories`), Delete (`/admin/categories`)
  - *ตารางเสริม:* `reviews` (รีวิวคอนโด) และ `users` (จัดการผู้ใช้งาน)
  - *ความสัมพันธ์:* `condos.category_id` เชื่อมโยงกับ `categories.id` (1:N Relation)
- [x] **Authentication:** ระบบสมัครสมาชิกและเข้าสู่ระบบด้วย JWT Token (jose) + HttpOnly Cookies + Bcrypt Hash
- [x] **Admin Dashboard:** หน้าสรุปข้อมูลสถิติสำคัญ (`/admin`) ยอดผู้ใช้, ยอดคอนโด, ยอดรีวิว, คอนโดยอดนิยม, สัดส่วนหมวดหมู่
- [x] **Responsive UI:** รองรับการแสดงผลทุกหน้าจอบน Desktop, Tablet และ Mobile สไตล์ Modern Dark Glassmorphism

---

## 🔑 บัญชีทดสอบ (Test Accounts)

| สิทธิ์ (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@condoguide.com` | `password` | เข้าใช้งานได้ทุกหน้า รวมทั้งแผงควบคุม `/admin` |
| **User** | `user@condoguide.com` | `password` | ค้นหาคอนโด, เขียนรีวิว, จัดการโปรไฟล์ |

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าฐานข้อมูล (MySQL)
ไฟล์ Schema และข้อมูลจำลอง (Seed Data) อยู่ที่ `database/schema.sql`
สามารถนำไป Import เข้า MySQL ผ่าน phpMyAdmin, MySQL Workbench หรือ CLI:

```sql
-- สร้างฐานข้อมูลและนำเข้าข้อมูล
mysql -u root -p < database/schema.sql
```

การตั้งค่าการเชื่อมต่อในไฟล์ `.env.local`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=condoguide
JWT_SECRET=condoguide_super_secret_jwt_key_2024
```
> **หมายเหตุ:** หากยังไม่ได้เปิด MySQL Service หรืออยู่ในขั้นตอนตรวจงาน ระบบจะสลับไปใช้ **In-Memory Seed Data Engine** โดยอัตโนมัติ ทำให้เว็บไซต์และระบบ CRUD/Login/Dashboard สามารถทดสอบได้ทันที 100% โดยไม่เกิดข้อผิดพลาด

### 3. รัน Development Server
```bash
npm run dev
```

เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🗺️ เส้นทางหน้าเว็บหลัก (Sitemap)

### ฝั่งผู้ใช้งานทั่วไป (Frontend)
- `/` — หน้าแรก (Hero, สถิติ, หมวดหมู่แนะนำ, คอนโดแนะนำ)
- `/condos` — หน้ารวมคอนโดทั้งหมด (ค้นหา, ตัวกรองราคา, กรองตามหมวดหมู่)
- `/condos/[slug]` — หน้ารายละเอียดคอนโด (แกลเลอรี, สิ่งอำนวยความสะดวก, แผนที่, อ่านและเขียนรีวิว)
- `/categories` — หน้าแสดงหมวดหมู่คอนโดทั้งหมด
- `/team` — หน้าคณะผู้จัดทำโครงการ (สมาชิกกลุ่ม 3 คน)
- `/auth/login` — หน้าเข้าสู่ระบบ
- `/auth/register` — หน้าสมัครสมาชิก
- `/profile` — หน้าโปรไฟล์ผู้ใช้และประวัติการเขียนรีวิว
- `/reviews/write` — หน้าเขียนรีวิวคอนโดใหม่

### ฝั่งผู้ดูแลระบบ (Admin / Backend)
- `/admin` — หน้า Dashboard สรุปสถิติสำคัญและกิจกรรมล่าสุด
- `/admin/condos` — จัดการคอนโด (CRUD: ดูรายการ, ค้นหา, ลบ, แก้ไข)
- `/admin/condos/new` — ฟอร์มเพิ่มคอนโดใหม่
- `/admin/condos/[slug]/edit` — ฟอร์มแก้ไขข้อมูลคอนโด
- `/admin/categories` — จัดการหมวดหมู่ (CRUD: เพิ่ม, แก้ไข, ลบ)
- `/admin/reviews` — จัดการและลบรีวิว
- `/admin/users` — จัดการผู้ใช้งาน (เพิ่มแอดมิน, ลบผู้ใช้)
