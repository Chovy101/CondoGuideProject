import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      background: 'var(--gradient-dark)',
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem', animation: 'bgPulse 3s ease-in-out infinite alternate' }}>🏢</div>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, fontFamily: 'Kanit', background: 'linear-gradient(135deg, #6c63ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ไม่พบหน้าที่คุณต้องการ</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: 400 }}>
        อาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง กรุณากลับไปหน้าหลัก
      </p>
      <Link href="/" className="btn btn-primary btn-lg">🏠 กลับหน้าหลัก</Link>
    </div>
  );
}
