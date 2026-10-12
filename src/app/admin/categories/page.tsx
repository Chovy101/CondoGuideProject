'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Building2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Coins,
  Home,
  Users,
  PawPrint,
  TrainFront,
  Building,
} from 'lucide-react';
import { getCategoryThaiName, renderCategoryIcon } from '@/lib/categories';

interface Category {
  id: number;
  name: string;
  name_th?: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  condo_count?: number;
  count?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    name_th: '',
    slug: '',
    icon: '🏢',
    description: '',
    color: '#C8963E',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      name_th: '',
      slug: '',
      icon: '🏢',
      description: '',
      color: '#C8963E',
    });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (cat: Category) => {
    setEditingId(cat.id);
    const thaiName = cat.name_th || getCategoryThaiName(cat.slug || cat.name);
    setForm({
      name: cat.name,
      name_th: thaiName,
      slug: cat.slug,
      icon: cat.icon || '🏢',
      description: cat.description || '',
      color: cat.color || '#C8963E',
    });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const url = '/api/categories';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } else {
        setMsg(editingId ? 'แก้ไขหมวดหมู่สำเร็จ!' : 'เพิ่มหมวดหมู่สำเร็จ!');
        setShowForm(false);
        setEditingId(null);
        setForm({
          name: '',
          name_th: '',
          slug: '',
          icon: '🏢',
          description: '',
          color: '#C8963E',
        });
        fetchCategories();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingCat) return;
    const catCondoCount = Number(deletingCat.condo_count ?? deletingCat.count ?? 0);
    if (catCondoCount > 0) {
      setError(
        `ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีโครงการที่ใช้งานอยู่ ${catCondoCount} รายการ กรุณาย้ายโครงการไปหมวดอื่นก่อน`
      );
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/categories?id=${deletingCat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMsg(`ลบหมวดหมู่ "${deletingCat.name_th || deletingCat.name}" สำเร็จ`);
        setDeletingCat(null);
        fetchCategories();
        setTimeout(() => setMsg(''), 4000);
      } else {
        setError(data.error || 'ไม่สามารถลบหมวดหมู่นี้ได้');
        setDeletingCat(null);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setDeletingCat(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEF9EE',
                color: '#A06E25',
              }}
            >
              <FolderTree size={20} />
            </span>
            จัดการหมวดหมู่ที่อยู่อาศัย
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            รายการและสถิติหมวดหมู่ที่อยู่อาศัย ทั้งหมด {categories.length} หมวดหมู่
          </p>
        </div>

        <button
          onClick={showForm ? () => setShowForm(false) : openAddForm}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#0F172A')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1E293B')}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'ปิดฟอร์ม' : 'เพิ่มหมวดหมู่'}
        </button>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{msg}</span>
          </div>
          <button
            onClick={() => setMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="ปิดการแจ้งเตือน"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="ปิดข้อความแจ้งเตือน"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Form Card (Add/Edit) */}
      {showForm && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              {editingId ? 'แก้ไขหมวดหมู่ที่อยู่อาศัย' : 'เพิ่มหมวดหมู่ที่อยู่อาศัยใหม่'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              aria-label="ปิดฟอร์ม"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Thai Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  ชื่อภาษาไทย *
                </label>
                <input
                  type="text"
                  placeholder="เช่น หรูหรา, ราคาประหยัด"
                  value={form.name_th}
                  onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                  }}
                />
              </div>

              {/* English Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  ชื่อภาษาอังกฤษ *
                </label>
                <input
                  type="text"
                  placeholder="เช่น Luxury, Budget"
                  value={form.name}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({
                      ...f,
                      name: val,
                      slug: editingId ? f.slug : val.toLowerCase().replace(/[\s_]+/g, '-'),
                    }));
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                  }}
                />
              </div>

              {/* Slug (URL) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น luxury"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[\s_]+/g, '-') }))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#F8FAFC',
                  }}
                />
              </div>

              {/* Category Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  สีประจำหมวดหมู่
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{
                      width: '44px',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                      padding: '2px',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#F8FAFC',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                คำอธิบายหมวดหมู่
              </label>
              <textarea
                placeholder="บรรยายลักษณะหรือจุดเด่นของหมวดหมู่นี้..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#F8FAFC',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#C48B37',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={e => !submitting && (e.currentTarget.style.backgroundColor = '#A06E25')}
                onMouseOut={e => !submitting && (e.currentTarget.style.backgroundColor = '#C48B37')}
              >
                {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {loading ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '24px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    height: '52px',
                    width: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F5F9',
                    margin: '0 auto 16px',
                  }}
                />
                <div
                  style={{
                    height: '20px',
                    width: '50%',
                    backgroundColor: '#F1F5F9',
                    margin: '0 auto 10px',
                    borderRadius: '4px',
                  }}
                />
                <div
                  style={{
                    height: '14px',
                    width: '80%',
                    backgroundColor: '#F1F5F9',
                    margin: '0 auto 16px',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))
        ) : (
          categories.map(cat => {
            const thaiName = cat.name_th || getCategoryThaiName(cat.slug || cat.name);
            const condoCount = Number(cat.condo_count ?? cat.count ?? 0);

            return (
              <div
                key={cat.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '24px 20px',
                  border: '1px solid #E2E8F0',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                {/* Single Web-Palette Circle Icon (Lucide React, no rainbow) */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    margin: '0 auto 14px',
                    backgroundColor: '#FEF9EE',
                    border: '1px solid #F6E2BC',
                    color: '#A06E25',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderCategoryIcon(cat.slug, 22)}
                </div>

                {/* Thai Category Name (Standard site font) */}
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1E293B',
                    marginBottom: '2px',
                    lineHeight: 1.3,
                  }}
                >
                  {thaiName}
                </div>

                {/* Slug & English Name as Subtle Gray Text (Not a loud badge) */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    marginBottom: '12px',
                  }}
                >
                  {cat.name} · <span style={{ fontFamily: 'monospace' }}>/{cat.slug}</span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748B',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    minHeight: '38px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {cat.description || 'ไม่มีคำอธิบาย'}
                </div>

                {/* Real Condo Count Badge */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      color: '#475569',
                    }}
                  >
                    <Building2 size={13} style={{ color: '#A06E25' }} />
                    <span>
                      โครงการในหมวดนี้:{' '}
                      <strong style={{ color: '#1E293B' }}>{condoCount}</strong> โครงการ
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Edit and Delete */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    paddingTop: '16px',
                    borderTop: '1px solid #F1F5F9',
                    width: '100%',
                  }}
                >
                  {/* Edit button in warm web palette */}
                  <button
                    type="button"
                    onClick={() => openEditForm(cat)}
                    title={`แก้ไขหมวดหมู่ ${thaiName}`}
                    aria-label={`แก้ไขหมวดหมู่ ${thaiName}`}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF9EE',
                      color: '#8A5816',
                      border: '1px solid #F6E2BC',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = '#FDEECC';
                      e.currentTarget.style.color = '#633B05';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = '#FEF9EE';
                      e.currentTarget.style.color = '#8A5816';
                    }}
                  >
                    <Pencil size={13} />
                    แก้ไข
                  </button>

                  {/* Delete button: bold, clear, readable red */}
                  <button
                    type="button"
                    onClick={() => setDeletingCat(cat)}
                    title={`ลบหมวดหมู่ ${thaiName}`}
                    aria-label={`ลบหมวดหมู่ ${thaiName}`}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                      e.currentTarget.style.color = '#B91C1C';
                      e.currentTarget.style.borderColor = '#FCA5A5';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                      e.currentTarget.style.color = '#DC2626';
                      e.currentTarget.style.borderColor = '#FECACA';
                    }}
                  >
                    <Trash2 size={13} />
                    ลบ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cat-delete-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Modal Icon */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor:
                  Number(deletingCat.condo_count ?? deletingCat.count ?? 0) > 0 ? '#FFFBEB' : '#FEF2F2',
                color:
                  Number(deletingCat.condo_count ?? deletingCat.count ?? 0) > 0 ? '#D97706' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              {Number(deletingCat.condo_count ?? deletingCat.count ?? 0) > 0 ? (
                <AlertTriangle size={22} />
              ) : (
                <Trash2 size={22} />
              )}
            </div>

            <h3
              id="modal-cat-delete-title"
              style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: '0 0 8px 0' }}
            >
              ยืนยันการลบหมวดหมู่
            </h3>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              หมวดหมู่:{' '}
              <strong style={{ color: '#1E293B' }}>
                {deletingCat.name_th || getCategoryThaiName(deletingCat.slug || deletingCat.name)} (
                {deletingCat.name})
              </strong>
            </p>

            {/* Check if condos are still using this category */}
            {Number(deletingCat.condo_count ?? deletingCat.count ?? 0) > 0 ? (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#991B1B',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>
                      ไม่สามารถลบหมวดหมู่นี้ได้
                    </strong>
                    ยังมีโครงการที่ใช้งานหมวดหมู่นี้อยู่{' '}
                    <strong>{Number(deletingCat.condo_count ?? deletingCat.count ?? 0)}</strong> รายการ
                    กรุณาย้ายโครงการ{' '}
                    <strong>{Number(deletingCat.condo_count ?? deletingCat.count ?? 0)}</strong>{' '}
                    รายการไปหมวดหมู่อื่นก่อนทำการลบ
                  </div>
                </div>
              </div>
            ) : (
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '20px',
                }}
              >
                ไม่มีโครงการใดใช้งานหมวดหมู่นี้อยู่ คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {Number(deletingCat.condo_count ?? deletingCat.count ?? 0) > 0 ? 'รับทราบ' : 'ยกเลิก'}
              </button>

              {Number(deletingCat.condo_count ?? deletingCat.count ?? 0) === 0 && (
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={deleting}
                  aria-label={`ยืนยันลบหมวดหมู่ ${deletingCat.name_th || deletingCat.name}`}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                  }}
                >
                  {deleting ? 'กำลังลบ...' : 'ลบหมวดหมู่'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
