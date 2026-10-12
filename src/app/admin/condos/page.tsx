'use client';

import { useState, useEffect, useCallback, Suspense, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Star,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Coins,
  Home,
  Users,
  PawPrint,
  TrainFront,
  Building,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface Condo {
  id: number;
  name: string;
  slug: string;
  district: string;
  price_min: number;
  rating: number;
  review_count: number;
  view_count: number;
  is_featured: boolean;
  is_active: boolean;
  category_name?: string;
  category_slug?: string;
}

// Category Configuration with Thai names and Lucide icons
const CATEGORY_MAP: Record<
  string,
  { name: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }
> = {
  luxury: { name: 'หรูหรา', icon: Sparkles },
  budget: { name: 'ราคาประหยัด', icon: Coins },
  studio: { name: 'สตูดิโอ', icon: Home },
  family: { name: 'ครอบครัว', icon: Users },
  'pet-friendly': { name: 'เลี้ยงสัตว์ได้', icon: PawPrint },
  'near-bts-mrt': { name: 'ใกล้รถไฟฟ้า', icon: TrainFront },
};

function getCategoryDisplay(slugOrName?: string) {
  if (!slugOrName) return { name: 'คอนโดมิเนียม', Icon: Building };
  const s = slugOrName.toLowerCase().replace(/[\s_]+/g, '-');
  if (CATEGORY_MAP[s]) return { name: CATEGORY_MAP[s].name, Icon: CATEGORY_MAP[s].icon };
  if (s.includes('luxur') || s.includes('หรู')) return { name: 'หรูหรา', Icon: Sparkles };
  if (s.includes('budget') || s.includes('ประหยัด')) return { name: 'ราคาประหยัด', Icon: Coins };
  if (s.includes('studio') || s.includes('สตูดิโอ')) return { name: 'สตูดิโอ', Icon: Home };
  if (s.includes('fam') || s.includes('ครอบครัว')) return { name: 'ครอบครัว', Icon: Users };
  if (s.includes('pet') || s.includes('สัตว์')) return { name: 'เลี้ยงสัตว์ได้', Icon: PawPrint };
  if (s.includes('bts') || s.includes('mrt') || s.includes('รถไฟฟ้า')) return { name: 'ใกล้รถไฟฟ้า', Icon: TrainFront };
  return { name: slugOrName, Icon: Building };
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('th-TH').format(p);
}

function AdminCondosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read initial states from URL Query
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlStatus = searchParams.get('status') || 'all';
  const urlSortBy = searchParams.get('sortBy') || '';
  const urlSortOrder = searchParams.get('sortOrder') || 'desc';
  const urlPage = Number(searchParams.get('page')) || 1;

  // Local state
  const [condos, setCondos] = useState<Condo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Modals & Action states
  const [deletingCondo, setDeletingCondo] = useState<Condo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');

  // Keep search input synced when URL query changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Update URL Query Helper
  const updateQuery = useCallback(
    (newParams: Record<string, string | number | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === null || v === '' || (k === 'status' && v === 'all') || (k === 'page' && v === 1)) {
          current.delete(k);
        } else {
          current.set(k, String(v));
        }
      });
      const queryStr = current.toString();
      startTransition(() => {
        router.push(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch Condos from API
  const fetchCondos = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        limit: '10',
        page: String(urlPage),
      });
      if (urlSearch) q.set('search', urlSearch);
      if (urlCategory) q.set('category', urlCategory);
      if (urlStatus && urlStatus !== 'all') q.set('status', urlStatus);
      if (urlSortBy) {
        q.set('sortBy', urlSortBy);
        q.set('sortOrder', urlSortOrder);
      }

      const res = await fetch(`/api/condos?${q.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      setCondos(data.condos || []);
      setTotal(data.total || 0);
    } catch {
      // silently handle network error
    } finally {
      setLoading(false);
    }
  }, [urlPage, urlSearch, urlCategory, urlStatus, urlSortBy, urlSortOrder]);

  useEffect(() => {
    fetchCondos();
  }, [fetchCondos]);

  const showNotification = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput.trim(), page: 1 });
  };

  // Handle Column Header Sorting
  const handleSort = (field: 'price' | 'rating' | 'views') => {
    if (urlSortBy === field) {
      if (urlSortOrder === 'desc') {
        updateQuery({ sortBy: field, sortOrder: 'asc', page: 1 });
      } else {
        // Toggle back to default
        updateQuery({ sortBy: null, sortOrder: null, page: 1 });
      }
    } else {
      // Default order when selecting new column
      const defaultOrder = field === 'price' ? 'asc' : 'desc';
      updateQuery({ sortBy: field, sortOrder: defaultOrder, page: 1 });
    }
  };

  // Handle Category Filter Change
  const handleCategoryChange = (cat: string) => {
    updateQuery({ category: cat || null, page: 1 });
  };

  // Handle Status Filter Change
  const handleStatusChange = (status: string) => {
    updateQuery({ status: status === 'all' ? null : status, page: 1 });
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingCondo) return;
    setDeleting(true);
    const targetSlug = deletingCondo.slug;
    const targetName = deletingCondo.name;
    const targetId = deletingCondo.id;

    try {
      const res = await fetch(`/api/condos/${targetSlug}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification(`ลบโครงการ "${targetName}" เรียบร้อยแล้ว`);
        setDeletingCondo(null);
        // Optimistic state update
        setCondos(prev => prev.filter(c => c.id !== targetId));
        setTotal(prev => Math.max(0, prev - 1));
        fetchCondos();
      } else {
        alert('เกิดข้อผิดพลาดในการลบโครงการคอนโด');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / 10);
  const hasActiveFilters = Boolean(urlSearch || urlCategory || (urlStatus && urlStatus !== 'all') || urlSortBy);

  // Render Sort Icon
  const renderSortIcon = (field: 'price' | 'rating' | 'views') => {
    if (urlSortBy !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4, marginLeft: '0.35rem' }} />;
    }
    return urlSortOrder === 'asc' ? (
      <ArrowUp size={14} style={{ color: 'var(--sand-gold, #C8963E)', marginLeft: '0.35rem' }} />
    ) : (
      <ArrowDown size={14} style={{ color: 'var(--sand-gold, #C8963E)', marginLeft: '0.35rem' }} />
    );
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div
        className="flex items-center justify-between mb-6"
        style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-line, #E2E8F0)', paddingBottom: '1.25rem' }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: 'var(--ink-primary, #0F172A)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '0.2rem',
            }}
          >
            <Building2 size={26} style={{ color: 'var(--sand-gold, #C8963E)' }} />
            จัดการโครงการคอนโด
          </h1>
          <p style={{ color: 'var(--ink-secondary, #64748B)', fontSize: '0.9rem' }}>
            รายการและสถานะโครงการคอนโดมิเนียม ทั้งหมด {total} รายการ
          </p>
        </div>
        <Link
          href="/admin/condos/new"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.25rem',
            fontWeight: 600,
            borderRadius: '8px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          <Plus size={18} />
          เพิ่มโครงการคอนโด
        </Link>
      </div>

      {/* Toast Notification */}
      {msg && (
        <div
          className="alert mb-5"
          style={{
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#059669' }} />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter and Search Bar Section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-line, #E2E8F0)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          {/* 1. Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
            <label
              htmlFor="condo-search-input"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--ink-secondary, #475569)',
                marginBottom: '0.4rem',
              }}
            >
              ค้นหาโครงการ
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  color: 'var(--ink-secondary, #94A3B8)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="condo-search-input"
                type="text"
                placeholder="ชื่อคอนโด, เขต, ที่อยู่..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                }}
              />
            </div>
          </form>

          {/* 2. Category Filter */}
          <div>
            <label
              htmlFor="condo-category-select"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--ink-secondary, #475569)',
                marginBottom: '0.4rem',
              }}
            >
              หมวดหมู่ที่อยู่อาศัย
            </label>
            <select
              id="condo-category-select"
              value={urlCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: 'var(--ink-primary, #0F172A)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">ทุกหมวดหมู่ (All Categories)</option>
              <option value="luxury">👑 หรูหรา (Luxury)</option>
              <option value="budget">💰 ราคาประหยัด (Budget)</option>
              <option value="studio">🏠 สตูดิโอ (Studio)</option>
              <option value="family">👨‍👩‍👧‍👦 ครอบครัว (Family)</option>
              <option value="pet-friendly">🐾 เลี้ยงสัตว์ได้ (Pet Friendly)</option>
              <option value="near-bts-mrt">🚆 ใกล้รถไฟฟ้า (Near BTS/MRT)</option>
            </select>
          </div>

          {/* 3. Status Filter */}
          <div>
            <label
              htmlFor="condo-status-select"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--ink-secondary, #475569)',
                marginBottom: '0.4rem',
              }}
            >
              สถานะโครงการ
            </label>
            <select
              id="condo-status-select"
              value={urlStatus}
              onChange={e => handleStatusChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: 'var(--ink-primary, #0F172A)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">ทุกสถานะ (All Statuses)</option>
              <option value="featured">⭐ โครงการแนะนำ (Featured)</option>
              <option value="normal">โครงการปกติ (Standard)</option>
            </select>
          </div>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSearchSubmit}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                backgroundColor: '#C8963E',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <SlidersHorizontal size={15} />
              กรองข้อมูล
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="ล้างตัวกรองทั้งหมด"
                aria-label="ล้างตัวกรองทั้งหมด"
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <RotateCcw size={15} />
                ล้างค่า
              </button>
            )}
          </div>
        </div>

        {/* Active Sort & Filter Pills Status */}
        {hasActiveFilters && (
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary, #64748B)',
            }}
          >
            <span>กำลังแสดงตามตัวกรอง:</span>
            {urlSearch && (
              <span
                style={{
                  background: '#F1F5F9',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                }}
              >
                ค้นหา: &ldquo;{urlSearch}&rdquo;
              </span>
            )}
            {urlCategory && (
              <span
                style={{
                  background: '#F1F5F9',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                }}
              >
                หมวดหมู่: {getCategoryDisplay(urlCategory).name}
              </span>
            )}
            {urlStatus !== 'all' && (
              <span
                style={{
                  background: '#F1F5F9',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                }}
              >
                สถานะ: {urlStatus === 'featured' ? 'แนะนำ' : 'ปกติ'}
              </span>
            )}
            {urlSortBy && (
              <span
                style={{
                  background: '#FEF3C7',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #FDE68A',
                  color: '#8A5816',
                  fontWeight: 600,
                }}
              >
                เรียงตาม:{' '}
                {urlSortBy === 'price' ? 'ราคา' : urlSortBy === 'rating' ? 'คะแนนรีวิว' : 'ยอดดู'}{' '}
                ({urlSortOrder === 'asc' ? 'น้อย → มาก' : 'มาก → น้อย'})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Condos Table */}
      <div
        className="table-wrap"
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-line, #E2E8F0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                color: 'var(--ink-secondary, #475569)',
                fontSize: '0.85rem',
                textTransform: 'none',
                letterSpacing: 'normal',
              }}
            >
              <th style={{ padding: '0.9rem 1rem', width: '50px' }}>#</th>
              <th style={{ padding: '0.9rem 1rem', minWidth: '220px' }}>ชื่อโครงการคอนโด</th>
              <th style={{ padding: '0.9rem 1rem', minWidth: '150px' }}>หมวดหมู่</th>
              <th style={{ padding: '0.9rem 1rem' }}>เขต</th>

              {/* Clickable Sort: Price */}
              <th style={{ padding: '0.9rem 1rem', minWidth: '160px' }}>
                <button
                  type="button"
                  onClick={() => handleSort('price')}
                  title="คลิกเพื่อเรียงลำดับราคา"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    font: 'inherit',
                    color: urlSortBy === 'price' ? 'var(--sand-gold, #C8963E)' : 'inherit',
                    fontWeight: urlSortBy === 'price' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ราคา (บาท/เดือน)
                  {renderSortIcon('price')}
                </button>
              </th>

              {/* Clickable Sort: Rating */}
              <th style={{ padding: '0.9rem 1rem', minWidth: '130px' }}>
                <button
                  type="button"
                  onClick={() => handleSort('rating')}
                  title="คลิกเพื่อเรียงลำดับคะแนนเฉลี่ย"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    font: 'inherit',
                    color: urlSortBy === 'rating' ? 'var(--sand-gold, #C8963E)' : 'inherit',
                    fontWeight: urlSortBy === 'rating' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  คะแนนเฉลี่ย
                  {renderSortIcon('rating')}
                </button>
              </th>

              {/* Clickable Sort: Views */}
              <th style={{ padding: '0.9rem 1rem', minWidth: '110px' }}>
                <button
                  type="button"
                  onClick={() => handleSort('views')}
                  title="คลิกเพื่อเรียงลำดับยอดดู"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    font: 'inherit',
                    color: urlSortBy === 'views' ? 'var(--sand-gold, #C8963E)' : 'inherit',
                    fontWeight: urlSortBy === 'views' ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ยอดดู
                  {renderSortIcon('views')}
                </button>
              </th>

              <th style={{ padding: '0.9rem 1rem' }}>สถานะ</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'center', minWidth: '140px' }}>
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} style={{ padding: '1rem' }}>
                      <div className="skeleton" style={{ height: 18, borderRadius: 4, width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : condos.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94A3B8' }}>
                  <Building2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#64748B' }}>ไม่พบคอนโดมิเนียมที่ตรงกับเงื่อนไข</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองด้านบน</p>
                </td>
              </tr>
            ) : (
              condos.map((c, i) => {
                const categoryInfo = getCategoryDisplay(c.category_slug || c.category_name);
                const CategoryIcon = categoryInfo.Icon;
                const roundedRating = Number((c.rating || 0).toFixed(1));

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Index */}
                    <td style={{ padding: '0.9rem 1rem', color: '#94A3B8', fontSize: '0.84rem' }}>
                      {(urlPage - 1) * 10 + i + 1}
                    </td>

                    {/* Condo Name */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <Link
                        href={`/condos/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: 'var(--ink-primary, #0F172A)',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        {c.name}
                      </Link>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        {c.slug}
                      </div>
                    </td>

                    {/* Category Column: Thai Name + Lucide Icon (NO EMOJI) */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#334155',
                          fontSize: '0.84rem',
                          fontWeight: 500,
                        }}
                      >
                        <CategoryIcon size={14} style={{ color: '#C8963E', flexShrink: 0 }} />
                        <span>{categoryInfo.name}</span>
                      </div>
                    </td>

                    {/* District */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.88rem', color: '#475569' }}>
                      {c.district}
                    </td>

                    {/* Price */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                      ฿{formatPrice(c.price_min)}
                    </td>

                    {/* Rating and Reviews (Computed from real reviews table) */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Star
                          size={15}
                          style={{
                            fill: roundedRating > 0 ? '#F59E0B' : 'transparent',
                            color: roundedRating > 0 ? '#F59E0B' : '#CBD5E1',
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>
                          {roundedRating > 0 ? roundedRating.toFixed(1) : '0.0'}
                        </span>
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>
                          ({c.review_count})
                        </span>
                      </div>
                    </td>

                    {/* Views */}
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.88rem', color: '#475569' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Eye size={14} style={{ color: '#94A3B8' }} />
                        {new Intl.NumberFormat('th-TH').format(c.view_count || 0)}
                      </span>
                    </td>

                    {/* Status Badge: High-contrast Dark Gold passing WCAG AA (>= 4.5:1) */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {c.is_featured ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: '#FEF3C7',
                            border: '1px solid #FCD34D',
                            color: '#8A5816', // Dark Gold contrasting 6.8:1 against Amber-100 (Passes WCAG AA)
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <Star size={12} style={{ fill: '#8A5816', color: '#8A5816' }} />
                          แนะนำ
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                          }}
                        >
                          ปกติ
                        </span>
                      )}
                    </td>

                    {/* Actions Column: Tooltip + Accessible aria-label with Project Name */}
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        {/* 1. View Public Page */}
                        <Link
                          href={`/condos/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`ดูหน้าเว็บโครงการ ${c.name}`}
                          aria-label={`ดูหน้าเว็บโครงการ ${c.name}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '7px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#475569',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#0F172A';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#0F172A';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.color = '#475569';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                          }}
                        >
                          <ExternalLink size={15} />
                        </Link>

                        {/* 2. Edit Project (Website Palette: Sand Gold / Warm Tone) */}
                        <Link
                          href={`/admin/condos/${c.slug}/edit`}
                          title={`แก้ไขโครงการ ${c.name}`}
                          aria-label={`แก้ไขโครงการ ${c.name}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '7px',
                            backgroundColor: '#FEF9EE',
                            border: '1px solid #E5C384',
                            color: '#8A5816',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#C8963E';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#C8963E';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#FEF9EE';
                            e.currentTarget.style.color = '#8A5816';
                            e.currentTarget.style.borderColor = '#E5C384';
                          }}
                        >
                          <Pencil size={15} />
                        </Link>

                        {/* 3. Delete Project (Clear, Bold, Clickable Red) */}
                        <button
                          type="button"
                          onClick={() => setDeletingCondo(c)}
                          title={`ลบโครงการ ${c.name}`}
                          aria-label={`ลบโครงการ ${c.name}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '7px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#DC2626';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#DC2626';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                            e.currentTarget.style.color = '#DC2626';
                            e.currentTarget.style.borderColor = '#FECACA';
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ color: '#64748B', fontSize: '0.86rem' }}>
            แสดงหน้า {urlPage} จาก {totalPages} หน้า (ทั้งหมด {total} รายการ)
          </div>

          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
            <button
              type="button"
              disabled={urlPage <= 1}
              onClick={() => updateQuery({ page: urlPage - 1 })}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: urlPage <= 1 ? '#CBD5E1' : '#1E293B',
                cursor: urlPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              ← ก่อนหน้า
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => updateQuery({ page: p })}
                style={{
                  minWidth: '34px',
                  padding: '0.45rem 0.7rem',
                  borderRadius: '6px',
                  border: p === urlPage ? '1px solid #1E293B' : '1px solid #CBD5E1',
                  backgroundColor: p === urlPage ? '#1E293B' : '#FFFFFF',
                  color: p === urlPage ? '#FFFFFF' : '#334155',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: p === urlPage ? 700 : 500,
                }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={urlPage >= totalPages}
              onClick={() => updateQuery({ page: urlPage + 1 })}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: urlPage >= totalPages ? '#CBD5E1' : '#1E293B',
                cursor: urlPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCondo && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setDeletingCondo(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
              title="ปิดหน้าต่าง"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  ยืนยันการลบโครงการ
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                  การกระทำนี้จะเปลี่ยนสถานะโครงการเป็นยกเลิกใช้งาน
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.9rem 1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.95rem' }}>
                {deletingCondo.name}
              </div>
              <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                รหัสโครงการ: {deletingCondo.slug} (เขต{deletingCondo.district})
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingCondo(null)}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCondosPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
          <div className="skeleton" style={{ height: 40, width: 240, margin: '0 auto 1.5rem' }} />
          <div className="skeleton" style={{ height: 350, width: '100%', borderRadius: 12 }} />
        </div>
      }
    >
      <AdminCondosContent />
    </Suspense>
  );
}
