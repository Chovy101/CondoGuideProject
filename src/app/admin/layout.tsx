import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - CondoGuide',
};

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/auth/login?redirect=/admin');
  }

  return (
    <div className="admin-layout">
      <AdminSidebar userName={session.name} />
      <main className="admin-content">{children}</main>
    </div>
  );
}
