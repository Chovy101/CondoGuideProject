import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว | CondoGuide BKK',
  description: 'นโยบายความเป็นส่วนตัวของ CondoGuide BKK',
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        marginTop: '64px',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--bg-ground)',
        padding: '3rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.85rem',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            ← กลับหน้าแรก
          </Link>
        </div>

        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}
        >
          นโยบายความเป็นส่วนตัว
        </h1>

        <div
          className="card card-body"
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-line)',
            color: 'var(--ink-secondary)',
            lineHeight: 1.7,
          }}
        >
          <p style={{ color: 'var(--ink-muted)', fontStyle: 'italic', margin: 0 }}>
            [ข้อความ placeholder: รอการระบุเนื้อหานโยบายความเป็นส่วนตัว]
          </p>
        </div>
      </div>
    </main>
  );
}
