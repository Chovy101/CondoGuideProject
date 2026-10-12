'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Eye,
  Layers,
  Star,
  Banknote,
  MessageSquare,
  TrendingUp,
  Table as TableIcon,
  BarChart2,
  Calendar,
  Info,
} from 'lucide-react';

export interface CondoViewItem {
  name: string;
  slug: string;
  view_count: number;
}

export interface CategoryDistItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RatingDistItem {
  star: string;
  rating: number;
  count: number;
  percentage: number;
}

export interface PriceRangeItem {
  name: string;
  slug: string;
  price_min: number;
  price_max: number;
  price_diff: number;
}

export interface DateCountItem {
  date: string;
  dateLabel: string;
  count: number;
}

export interface DailyViewTrendItem {
  date: string;
  dateLabel: string;
  views: number;
}

interface AdminDashboardChartsProps {
  viewsByCondo: CondoViewItem[];
  categoryDistribution: CategoryDistItem[];
  ratingDistribution: RatingDistItem[];
  priceRanges: PriceRangeItem[];
  reviewsTrend: DateCountItem[];
  dailyViewsTrend: DailyViewTrendItem[];
  selectedRange: string;
}

const PALETTE = {
  navy: '#2C3E50',
  navyDark: '#1E293B',
  slate: '#475569',
  slateLight: '#94A3B8',
  gold: '#C8963E',
  goldLight: '#E5B869',
  blue: '#3B82F6',
  pieColors: ['#C8963E', '#2C3E50', '#3B82F6', '#526E88', '#8A5C16', '#1E293B'],
};

function formatThaiNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

function formatThaiBaht(num: number): string {
  return `฿${new Intl.NumberFormat('th-TH').format(num)}`;
}

// Custom Tooltip for Charts
function ChartTooltipWrapper({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: Record<string, unknown>; color?: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];

  return (
    <div
      style={{
        backgroundColor: '#171A21',
        color: '#F4F2ED',
        padding: '0.65rem 0.9rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
        fontSize: '0.82rem',
        fontFamily: 'var(--font-thai)',
        minWidth: 140,
        zIndex: 50,
      }}
    >
      {label && <div style={{ color: '#C8CFDC', fontWeight: 600, marginBottom: '0.35rem' }}>{label}</div>}
      {payload.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: idx > 0 ? '0.2rem' : 0 }}>
          <span style={{ color: '#94A3B8' }}>{item.name}:</span>
          <span style={{ fontWeight: 600, color: item.color || '#F4F2ED' }}>
            {typeof item.value === 'number' ? formatThaiNumber(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardCharts({
  viewsByCondo,
  categoryDistribution,
  ratingDistribution,
  priceRanges,
  reviewsTrend,
  dailyViewsTrend,
  selectedRange,
}: AdminDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Toggle table view for each chart (Accessibility requirement)
  const [showTable, setShowTable] = useState<Record<string, boolean>>({
    views: false,
    categories: false,
    ratings: false,
    prices: false,
    reviewsTrend: false,
    viewsTrend: false,
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const toggleTable = (key: string) => {
    setShowTable(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const anim = !prefersReducedMotion;
  const animDuration = 300;

  const rangeButtons = [
    { key: '7d', label: '7 วัน' },
    { key: '30d', label: '30 วัน' },
    { key: '90d', label: '90 วัน' },
    { key: 'all', label: 'ทั้งหมด' },
  ];

  return (
    <div style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
      {/* Analytics Section Header & Time Range Filter */}
      <div
        className="card card-body mb-6"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-line)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <BarChart2 size={22} style={{ color: 'var(--sand-gold)' }} />
            สถิติและข้อมูลวิเคราะห์ระบบ (System Analytics)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
            สรุปข้อมูลจริงจากฐานข้อมูล แสดงผลด้วยกราฟสถิติและการดูแบบตารางข้อมูล
          </p>
        </div>

        {/* Range Buttons (Saves to URL query ?range=...) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} />
            ช่วงเวลากราฟแนวโน้ม:
          </span>
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface-muted)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', border: '1px solid var(--border-line)' }}>
            {rangeButtons.map(r => {
              const active = selectedRange === r.key;
              return (
                <Link
                  key={r.key}
                  href={`/admin?range=${r.key}`}
                  scroll={false}
                  style={{
                    padding: '0.3rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: active ? 600 : 500,
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: active ? 'var(--ink-primary)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--ink-secondary)',
                    transition: 'all 0.15s ease',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of 6 Charts */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* CHART 1: Top Views by Condo (Horizontal Bar Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} style={{ color: 'var(--sand-gold)' }} />
                ยอดเข้าชมแต่ละโครงการ
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                แท่งแนวนอนเรียงจากยอดเข้าชมสะสมมากไปน้อย แสดงความสนใจของผู้ค้นหา
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('views')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.views ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.views ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {showTable.views ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem 0.25rem' }}>อันดับ</th>
                    <th style={{ padding: '0.5rem' }}>ชื่อโครงการ</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ยอดเข้าชม (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewsByCondo.map((item, idx) => (
                    <tr key={item.slug} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: idx === 0 ? 'var(--gold-text)' : 'var(--ink-muted)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>
                        <Link href={`/condos/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {item.name}
                        </Link>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600, color: idx === 0 ? 'var(--gold-text)' : 'var(--ink-primary)' }}>
                        {formatThaiNumber(item.view_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟแท่งแนวนอนยอดเข้าชมคอนโด ${viewsByCondo.length} โครงการ โครงการยอดนิยมสูงสุดคือ ${viewsByCondo[0]?.name || ''} เข้าชม ${viewsByCondo[0]?.view_count || 0} ครั้ง`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem' }}
            >
              {mounted && viewsByCondo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={viewsByCondo}
                    margin={{ top: 10, right: 24, left: 24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      type="number"
                      tickFormatter={val => formatThaiNumber(val)}
                      fontSize={11}
                      stroke="var(--ink-muted)"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={130}
                      fontSize={11}
                      stroke="var(--ink-secondary)"
                      tickFormatter={val => (val.length > 15 ? `${val.slice(0, 15)}...` : val)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as CondoViewItem;
                        return (
                          <ChartTooltipWrapper
                            active={active}
                            label={d.name}
                            payload={[{ name: 'ยอดเข้าชม', value: d.view_count, payload: {} }]}
                          />
                        );
                      }}
                    />
                    <Bar
                      dataKey="view_count"
                      name="ยอดเข้าชม"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={anim}
                      animationDuration={animDuration}
                    >
                      {viewsByCondo.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? PALETTE.gold : PALETTE.navy} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                  กำลังโหลดกราฟ...
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHART 2: Condo Category Distribution (Donut Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--sand-gold)' }} />
                สัดส่วนคอนโดตามหมวดหมู่
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                กราฟโดนัทแสดงจำนวนโครงการและสัดส่วนเปอร์เซ็นต์ในแต่ละประเภท
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('categories')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.categories ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.categories ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {showTable.categories ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>หมวดหมู่</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>จำนวน (โครงการ)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryDistribution.map(cat => (
                    <tr key={cat.name} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{cat.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{cat.count}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--ink-muted)' }}>{cat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟโดนัทแสดงสัดส่วนคอนโดตามหมวดหมู่ ทั้งหมด ${categoryDistribution.reduce((a, b) => a + b.count, 0)} โครงการ`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem', display: 'flex', alignItems: 'center' }}
            >
              {mounted && categoryDistribution.length > 0 ? (
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '55%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as CategoryDistItem;
                            return (
                              <ChartTooltipWrapper
                                active={active}
                                label={d.name}
                                payload={[
                                  { name: 'จำนวน', value: d.count, payload: {} },
                                  { name: 'สัดส่วน', value: Number(d.percentage), payload: {} },
                                ]}
                              />
                            );
                          }}
                        />
                        <Pie
                          data={categoryDistribution}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={3}
                          isAnimationActive={anim}
                          animationDuration={animDuration}
                        >
                          {categoryDistribution.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color || PALETTE.pieColors[idx % PALETTE.pieColors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend breakdown list */}
                  <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                    {categoryDistribution.map((entry, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                          <span
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              backgroundColor: entry.color || PALETTE.pieColors[idx % PALETTE.pieColors.length],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: 'var(--ink-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.name}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--ink-primary)', paddingLeft: 4 }}>
                          {entry.count} ({entry.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                  กำลังโหลดข้อมูลหมวดหมู่...
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHART 3: Review Rating Distribution (Vertical Bar Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={18} style={{ color: 'var(--sand-gold)' }} />
                การกระจายคะแนนรีวิว
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                แท่งแนวตั้ง 1–5 ดาว แสดงจำนวนรีวิวที่ได้รับอนุมัติจากผู้พักอาศัยจริง
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('ratings')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.ratings ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.ratings ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {showTable.ratings ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>ระดับคะแนน</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>จำนวนรีวิว (ฉบับ)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingDistribution.map(r => (
                    <tr key={r.rating} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{r.star}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{r.count}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--ink-muted)' }}>{r.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟแท่งแนวตั้งการกระจายคะแนนรีวิว 1 ถึง 5 ดาว รีวิวส่วนใหญ่อยู่ที่ ${ratingDistribution.reduce((prev, cur) => (cur.count > prev.count ? cur : prev), ratingDistribution[0])?.star || ''}`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem' }}
            >
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistribution} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="star" fontSize={11} stroke="var(--ink-secondary)" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="var(--ink-muted)" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as RatingDistItem;
                        return (
                          <ChartTooltipWrapper
                            active={active}
                            label={d.star}
                            payload={[
                              { name: 'จำนวนรีวิว', value: d.count, payload: {} },
                              { name: 'สัดส่วน', value: Number(d.percentage), payload: {} },
                            ]}
                          />
                        );
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="จำนวนรีวิว"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={anim}
                      animationDuration={animDuration}
                    >
                      {ratingDistribution.map(entry => (
                        <Cell key={entry.rating} fill={entry.rating === 5 ? PALETTE.gold : PALETTE.navy} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}
        </div>

        {/* CHART 4: Rental Price Ranges by Condo (Floating Bar Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Banknote size={18} style={{ color: 'var(--sand-gold)' }} />
                ช่วงราคาค่าเช่าของแต่ละโครงการ
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                แท่งช่วงราคา (ต่ำสุด–สูงสุดต่อเดือน) เรียงลำดับจากราคาเริ่มต้นต่ำไปสูง
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('prices')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.prices ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.prices ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {showTable.prices ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>โครงการ</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ราคาเริ่มต้น</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ราคาสูงสุด</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ส่วนต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRanges.map(p => (
                    <tr key={p.slug} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatThaiBaht(p.price_min)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatThaiBaht(p.price_max)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--ink-muted)' }}>{formatThaiBaht(p.price_diff)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟช่วงราคาค่าเช่าของ ${priceRanges.length} โครงการ เรียงจากราคาต่ำสุดไปสูงสุด`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem' }}
            >
              {mounted && priceRanges.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={priceRanges}
                    margin={{ top: 10, right: 24, left: 24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      type="number"
                      tickFormatter={val => `฿${(val / 1000).toFixed(0)}k`}
                      fontSize={11}
                      stroke="var(--ink-muted)"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={125}
                      fontSize={11}
                      stroke="var(--ink-secondary)"
                      tickFormatter={val => (val.length > 14 ? `${val.slice(0, 14)}...` : val)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as PriceRangeItem;
                        return (
                          <div
                            style={{
                              backgroundColor: '#171A21',
                              color: '#F4F2ED',
                              padding: '0.65rem 0.9rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-thai)',
                            }}
                          >
                            <div style={{ color: '#C8CFDC', fontWeight: 600, marginBottom: '0.35rem' }}>{d.name}</div>
                            <div>ช่วงราคา: <span style={{ color: PALETTE.goldLight, fontWeight: 600 }}>{formatThaiBaht(d.price_min)} – {formatThaiBaht(d.price_max)} / เดือน</span></div>
                            <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: 2 }}>ส่วนต่างช่วงราคา: {formatThaiBaht(d.price_diff)}</div>
                          </div>
                        );
                      }}
                    />
                    {/* Floating bar via transparent base + difference bar in same stack */}
                    <Bar dataKey="price_min" stackId="priceStack" fill="transparent" isAnimationActive={false} />
                    <Bar
                      dataKey="price_diff"
                      name="ช่วงราคา"
                      stackId="priceStack"
                      fill={PALETTE.navy}
                      radius={[4, 4, 4, 4]}
                      isAnimationActive={anim}
                      animationDuration={animDuration}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}
        </div>

        {/* CHART 5: New Reviews Trend (Line Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--sand-gold)' }} />
                จำนวนรีวิวใหม่ตามช่วงเวลา
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                กราฟเส้นวิเคราะห์จำนวนรีวิวใหม่ที่เข้ามาในระบบตามช่วงเวลาที่เลือก
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('reviewsTrend')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.reviewsTrend ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.reviewsTrend ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {reviewsTrend.length === 0 ? (
            /* Empty State as required by prompt */
            <div
              style={{
                height: 280,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-surface-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                textAlign: 'center',
                marginTop: '0.75rem',
                border: '1px dashed var(--border-strong)',
              }}
            >
              <Info size={28} style={{ color: 'var(--sand-gold)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>
                ยังไม่มีรีวิวใหม่ในช่วงเวลานี้
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.25rem', maxWidth: 360 }}>
                เลือกช่วงเวลา &quot;ทั้งหมด&quot; เพื่อดูข้อมูลรีวิวประวัติศาสตร์ หรือรอรับรีวิวใหม่จากผู้พักอาศัย
              </p>
            </div>
          ) : showTable.reviewsTrend ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>วันที่</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>จำนวนรีวิวใหม่</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsTrend.map(r => (
                    <tr key={r.date} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{r.dateLabel}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatThaiNumber(r.count)} ฉบับ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟเส้นจำนวนรีวิวใหม่ มีข้อมูลทั้งหมด ${reviewsTrend.length} ช่วงเวลา`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem' }}
            >
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reviewsTrend} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="dateLabel" fontSize={11} stroke="var(--ink-secondary)" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="var(--ink-muted)" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as DateCountItem;
                        return (
                          <ChartTooltipWrapper
                            active={active}
                            label={d.dateLabel}
                            payload={[{ name: 'รีวิวใหม่', value: d.count, color: PALETTE.gold, payload: {} }]}
                          />
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="รีวิวใหม่"
                      stroke={PALETTE.gold}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: PALETTE.gold }}
                      activeDot={{ r: 6, fill: PALETTE.goldLight }}
                      isAnimationActive={anim}
                      animationDuration={animDuration}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}
        </div>

        {/* CHART 6: Daily Page Views Trend (Area Chart) */}
        <div className="card card-body" style={{ minWidth: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--sand-gold)' }} />
                แนวโน้มยอดเข้าชมสะสมรายวัน
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                กราฟพื้นที่แสดงยอดเปิดดูหน้ารายละเอียดโครงการสะสมรายวันตามตาราง condo_daily_views
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleTable('viewsTrend')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              title="สลับโหมดตารางและกราฟ"
            >
              {showTable.viewsTrend ? <BarChart2 size={14} /> : <TableIcon size={14} />}
              {showTable.viewsTrend ? 'ดูกราฟ' : 'ดูเป็นตาราง'}
            </button>
          </div>

          {dailyViewsTrend.length === 0 ? (
            /* Empty State as required by prompt when table has no data yet */
            <div
              style={{
                height: 280,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-surface-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                textAlign: 'center',
                marginTop: '0.75rem',
                border: '1px dashed var(--border-strong)',
              }}
            >
              <TrendingUp size={28} style={{ color: 'var(--sand-gold)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>
                ยังไม่มีข้อมูลยอดเข้าชมสะสมรายวันในช่วงเวลานี้
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.35rem', maxWidth: 400, lineHeight: 1.6 }}>
                ระบบบันทึกยอดสะสมรายวันแบบรวมยอด (Aggregated) เมื่อมีผู้เข้าชมเปิดดูหน้ารายละเอียดโครงการ
                โดยไม่จัดเก็บข้อมูลส่วนตัวของผู้ใช้งาน
              </p>
            </div>
          ) : showTable.viewsTrend ? (
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-line)', textAlign: 'left', color: 'var(--ink-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>วันที่</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>ยอดเข้าชมรวม (ครั้ง)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyViewsTrend.map(v => (
                    <tr key={v.date} style={{ borderBottom: '1px solid var(--border-line)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{v.dateLabel}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatThaiNumber(v.views)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`กราฟพื้นที่ยอดเข้าชมรายวัน มีข้อมูลทั้งหมด ${dailyViewsTrend.length} วัน`}
              style={{ width: '100%', height: 280, marginTop: '0.75rem' }}
            >
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyViewsTrend} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="viewsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PALETTE.blue} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={PALETTE.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="dateLabel" fontSize={11} stroke="var(--ink-secondary)" />
                    <YAxis allowDecimals={false} fontSize={11} stroke="var(--ink-muted)" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as DailyViewTrendItem;
                        return (
                          <ChartTooltipWrapper
                            active={active}
                            label={d.dateLabel}
                            payload={[{ name: 'ยอดเข้าชม', value: d.views, color: PALETTE.blue, payload: {} }]}
                          />
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="ยอดเข้าชม"
                      stroke={PALETTE.blue}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#viewsAreaGradient)"
                      isAnimationActive={anim}
                      animationDuration={animDuration}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
