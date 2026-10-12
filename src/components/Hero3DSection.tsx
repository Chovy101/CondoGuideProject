'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrainFront,
  Building2,
  MessageSquareQuote,
  BarChart3,
  Search,
} from 'lucide-react';
import CityScene3D from './CityScene3D';
import { getCategoryThaiName } from '@/lib/categories';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Hero3DSectionProps {
  categories: Category[];
  totalCondos: number;
  totalReviews: number;
}

export default function Hero3DSection({
  categories,
}: Hero3DSectionProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(undefined);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-3d-grid">
          {/* Left Column: Real HTML Typography, Search Console & Filters */}
          <div className="hero-content-col">
            <div className="hero-tagline">
              ข้อมูลโครงการและผังเมืองจำลอง 3 มิติ · กรุงเทพมหานคร
            </div>

            <h1 className="hero-title">
              สำรวจคอนโดมิเนียมกรุงเทพฯ<br />
              จากผัง 3D และข้อมูลผู้อยู่อาศัยจริง
            </h1>

            <p className="hero-subtitle">
              ผสานแบบจำลอง 3 มิติเชิงสถาปัตยกรรม เข้ากับฐานข้อมูลโครงการและบทวิเคราะห์จากผู้พักอาศัยจริง เพื่อให้คุณประเมินระยะเดินทาง ทำเล และบรรยากาศก่อนตัดสินใจ
            </p>

            {/* Structured 2-Row Search & Filter Console */}
            <div className="hero-panel mb-4">
              {/* Structured 2-Tier Search & Filter Console */}
              <form action="/condos" method="GET" className="hero-search-form">
                {/* Tier 1: Search Input (Full generous width, zero truncation) + Action Button */}
                <div className="hero-search-main-row">
                  <div className="search-bar hero-input-field hero-search-input-wrap">
                    <Search size={18} strokeWidth={1.8} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                    <input
                      type="text"
                      name="search"
                      placeholder="ค้นหาโครงการ เขต หรือย่าน"
                      aria-label="ค้นหาคอนโด"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary hero-submit-btn">
                    ค้นหาโครงการ
                  </button>
                </div>

                {/* Tier 2: Category & Budget Dropdowns (Equal balanced widths) */}
                <div className="hero-search-filter-row">
                  <select
                    name="category"
                    className="form-control hero-input-field"
                    aria-label="เลือกประเภทคอนโด"
                    defaultValue=""
                  >
                    <option value="">ทุกประเภทที่อยู่อาศัย</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {getCategoryThaiName(cat.slug || cat.name)}
                      </option>
                    ))}
                  </select>

                  <select
                    name="priceMax"
                    className="form-control hero-input-field"
                    aria-label="งบประมาณค่าเช่าสูงสุด"
                    defaultValue=""
                  >
                    <option value="">งบประมาณทั้งหมด</option>
                    <option value="15000">ไม่เกิน ฿15,000</option>
                    <option value="30000">ไม่เกิน ฿30,000</option>
                    <option value="50000">ไม่เกิน ฿50,000</option>
                    <option value="100000">ไม่เกิน ฿100,000</option>
                  </select>
                </div>
              </form>

              {/* Row 2: Lifestyle Filter Chips (Equal 36px height, pure Thai taxonomy) */}
              <div className="hero-chips-row">
                <span className="hero-chips-label">
                  เลือกตามไลฟ์สไตล์:
                </span>
                <div className="hero-chips-wrap">
                  <Link href="/condos?category=near-bts-mrt" className="lifestyle-chip">
                    ใกล้รถไฟฟ้า
                  </Link>
                  <Link href="/condos?category=budget" className="lifestyle-chip">
                    ราคาประหยัด
                  </Link>
                  <Link href="/condos?category=pet-friendly" className="lifestyle-chip">
                    เลี้ยงสัตว์ได้
                  </Link>
                  <Link href="/condos?category=luxury" className="lifestyle-chip">
                    หรูหราพรีเมียม
                  </Link>
                  <Link href="/condos?category=family" className="lifestyle-chip">
                    สำหรับครอบครัว
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real 3D Interactive WebGL Scene */}
          <div className="hero-3d-canvas-wrap">
            <CityScene3D
              onSelectCondo={(slug) => setSelectedSlug(slug)}
              selectedSlug={selectedSlug}
            />
          </div>
        </div>

        {/* Feature & Value Proposition Strip (Uniform Lucide line icons, zero emojis) */}
        <div className="value-strip">
          <div className="value-item">
            <div className="value-icon">
              <TrainFront size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="value-title">โครงข่ายคมนาคม</div>
              <div className="value-desc">วัดระยะเดินจริงถึงสถานีรถไฟฟ้า BTS & MRT ทุกสาย</div>
            </div>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <Building2 size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="value-title">ทัศนียภาพ 3 มิติ</div>
              <div className="value-desc">สำรวจผังความสูง ทิศทางแดด และสิ่งปลูกสร้างโดยรอบ</div>
            </div>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <MessageSquareQuote size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="value-title">รีวิวผู้อยู่อาศัยจริง</div>
              <div className="value-desc">เจาะลึกนิติบุคคล ค่าส่วนกลาง ที่จอดรถ และสภาพแวดล้อม</div>
            </div>
          </div>
          <div className="value-item">
            <div className="value-icon">
              <BarChart3 size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="value-title">ฐานข้อมูลโปร่งใส</div>
              <div className="value-desc">เทียบช่วงราคาค่าเช่าต่อตารางเมตรตามราคาตลาดปัจจุบัน</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
