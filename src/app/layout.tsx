import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CondoGuide — คู่มือสำรวจและเปรียบเทียบข้อมูลคอนโดมิเนียมกรุงเทพฯ',
  description: 'รวบรวมข้อมูลค่าเช่าจริง ผังพื้นที่ และรีวิวตรงไปตรงมาจากผู้พักอาศัย เพื่อการตัดสินใจอยู่อาศัยในเมืองอย่างมั่นใจ',
  keywords: 'คอนโด, ข้อมูลคอนโด, เช่าคอนโด กรุงเทพ, รถไฟฟ้า BTS MRT, รีวิวคอนโด',
  openGraph: {
    title: 'CondoGuide — ข้อมูลคอนโดมิเนียมและรีวิวจริง',
    description: 'คู่มือสำรวจข้อมูลคอนโดมิเนียมในกรุงเทพฯ พร้อมข้อมูลค่าเช่าจริงและรีวิวผู้อยู่อาศัย',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Suspense fallback={<nav className="navbar" aria-label="แถบนำทางหลัก" />}>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
