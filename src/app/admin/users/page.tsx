'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  User,
  Check,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSessionUser, setCurrentSessionUser] = useState<CurrentUser | null>(null);

  // Modals & Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [msg, setMsg] = useState('');

  // Fetch current session user
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.user) setCurrentSessionUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showNotification = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  // Open Edit Form
  const handleOpenEdit = (u: UserItem) => {
    setFormError('');
    setShowAddForm(false);
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close Forms
  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormError('');
    setFormData({ name: '', email: '', password: '', role: 'user' });
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setFormError('');
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setShowAddForm(prev => !prev);
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      return setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
    }

    if (formData.password.length < 8) {
      return setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
      } else {
        showNotification('เพิ่มผู้ใช้งานใหม่สำเร็จ');
        handleCloseForm();
        fetchUsers();
      }
    } catch {
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      return setFormError('กรุณากรอกชื่อและอีเมล');
    }

    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 8) {
      return setFormError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          password: formData.password.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      } else {
        showNotification(`แก้ไขข้อมูลผู้ใช้งาน "${formData.name}" เรียบร้อย`);
        handleCloseForm();
        fetchUsers();
      }
    } catch {
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const targetId = deletingUser.id;
    setDeletingId(targetId);

    try {
      const res = await fetch(`/api/users?id=${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
      } else {
        const deletedName = deletingUser.name;
        setUsers(prev => prev.filter(u => u.id !== targetId));
        setTotal(prev => Math.max(0, prev - 1));
        setDeletingUser(null);
        showNotification(`ลบผู้ใช้งาน "${deletedName}" เรียบร้อยแล้ว`);
        fetchUsers();
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Top Page Header */}
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={26} style={{ color: 'var(--sand-gold)' }} />
            จัดการผู้ใช้งาน
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            ระบบดูแลบัญชีผู้ใช้งาน ทั้งหมด {total} คน
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', minHeight: '40px' }}
        >
          {showAddForm ? <X size={18} /> : <UserPlus size={18} />}
          {showAddForm ? 'ปิดแบบฟอร์ม' : '+ เพิ่มผู้ใช้งาน'}
        </button>
      </div>

      {/* Global Toast / Success Message */}
      {msg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'rgba(36, 88, 66, 0.08)',
            border: '1px solid rgba(36, 88, 66, 0.25)',
            color: 'var(--transit-green)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 500,
          }}
        >
          <Check size={18} />
          {msg}
        </div>
      )}

      {/* Edit User Form Card */}
      {editingUser && (
        <div
          className="card card-body mb-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--sand-gold)',
            boxShadow: 'var(--shadow-elevated)',
            padding: '1.75rem',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pencil size={20} style={{ color: 'var(--sand-gold)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                แก้ไขข้อมูลผู้ใช้งาน: {editingUser.name}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCloseForm}
              style={{ padding: '0.3rem 0.6rem' }}
            >
              ✕ ยกเลิก
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(184, 58, 36, 0.08)',
                border: '1px solid rgba(184, 58, 36, 0.25)',
                color: 'var(--clay-alert)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={18} />
              {formError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} noValidate>
            <div className="grid grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>อีเมล *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  required
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>บทบาท (Role)</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={e => setFormData(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                  style={{ minHeight: '44px' }}
                >
                  <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  รหัสผ่านใหม่ <span style={{ fontWeight: 400, color: 'var(--ink-muted)', fontSize: '0.82rem' }}>(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  minLength={8}
                  style={{ minHeight: '44px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minHeight: '42px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseForm}
                style={{ minHeight: '42px' }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add User Form Card */}
      {showAddForm && !editingUser && (
        <div
          className="card card-body mb-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            padding: '1.75rem',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={20} style={{ color: 'var(--sand-gold)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                เพิ่มผู้ใช้งานใหม่
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCloseForm}
              style={{ padding: '0.3rem 0.6rem' }}
            >
              ✕ ปิด
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              style={{
                backgroundColor: 'rgba(184, 58, 36, 0.08)',
                border: '1px solid rgba(184, 58, 36, 0.25)',
                color: 'var(--clay-alert)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={18} />
              {formError}
            </div>
          )}

          <form onSubmit={handleAddSubmit} noValidate>
            <div className="grid grid-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="กรอกชื่อและนามสกุล"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>อีเมล *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  required
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="กำหนดรหัสผ่าน"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>บทบาท (Role)</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={e => setFormData(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                  style={{ minHeight: '44px' }}
                >
                  <option value="user">User (ผู้ใช้งานทั่วไป)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ minHeight: '42px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {submitting ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้งาน'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseForm}
                style={{ minHeight: '42px' }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>Role</th>
              <th>วันที่สมัคร</th>
              <th style={{ width: 170, textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
                  ไม่พบข้อมูลผู้ใช้งาน
                </td>
              </tr>
            ) : (
              users.map((u, i) => {
                const isCurrentUser = currentSessionUser?.id === u.id;

                return (
                  <tr key={u.id} style={{ backgroundColor: isCurrentUser ? 'rgba(200, 150, 62, 0.03)' : undefined }}>
                    <td style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: u.role === 'admin' ? 'var(--bg-dark-accent)' : 'var(--bg-surface-muted)',
                            color: u.role === 'admin' ? '#FFFFFF' : 'var(--ink-primary)',
                            border: '1px solid var(--border-line)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                            {u.name}
                            {isCurrentUser && (
                              <span
                                style={{
                                  marginLeft: '0.45rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: 'rgba(200, 150, 62, 0.12)',
                                  color: 'var(--gold-text)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-xs)',
                                }}
                              >
                                (คุณ)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>{u.email}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: u.role === 'admin' ? 'var(--bg-dark-accent)' : 'var(--bg-surface-muted)',
                          color: u.role === 'admin' ? '#FFFFFF' : 'var(--ink-primary)',
                          border: '1px solid var(--border-line)',
                          gap: '0.3rem',
                        }}
                      >
                        {u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEdit(u)}
                          title="แก้ไขข้อมูลผู้ใช้"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Pencil size={13} />
                          แก้ไข
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeletingUser(u)}
                          disabled={isCurrentUser || deletingId === u.id}
                          title={isCurrentUser ? 'ไม่สามารถลบบัญชีของตนเองได้' : 'ลบผู้ใช้งาน'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.82rem',
                            opacity: isCurrentUser ? 0.4 : 1,
                            cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                          ลบ
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

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 23, 29, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card card-body"
            style={{
              backgroundColor: 'var(--bg-surface)',
              maxWidth: 440,
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(184, 58, 36, 0.1)',
                  color: 'var(--clay-alert)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                ยืนยันการลบผู้ใช้งาน
              </h3>
            </div>

            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน <strong style={{ color: 'var(--ink-primary)' }}>{deletingUser.name}</strong> ({deletingUser.email})? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingUser(null)}
                disabled={deletingId !== null}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                {deletingId !== null ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingId !== null ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
