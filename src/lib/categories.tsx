import React from 'react';
import {
  Sparkles,
  Coins,
  Home,
  Users,
  PawPrint,
  TrainFront,
  Building,
} from 'lucide-react';

export interface CategoryInfo {
  id: number;
  slug: string;
  nameThai: string;
  nameEng: string;
  description: string;
  color: string;
}

export const CATEGORIES_CONFIG: Record<string, CategoryInfo> = {
  luxury: {
    id: 1,
    slug: 'luxury',
    nameThai: 'หรูหราพรีเมียม',
    nameEng: 'Luxury',
    description: 'คอนโดระดับซูเปอร์ลักชัวรี ดีไซน์ระดับโลก พร้อมบริการคอนเซียร์จ',
    color: '#C8963E',
  },
  budget: {
    id: 2,
    slug: 'budget',
    nameThai: 'ราคาประหยัด',
    nameEng: 'Budget',
    description: 'คอนโดราคาคุ้มค่า ค่าเช่าสมเหตุสมผล เหมาะสำหรับคนเริ่มต้นทำงาน',
    color: '#245842',
  },
  studio: {
    id: 3,
    slug: 'studio',
    nameThai: 'สตูดิโอคนเมือง',
    nameEng: 'Studio',
    description: 'พื้นที่กะทัดรัด คล่องตัว ดูแลรักษาง่ายสำหรับคนโสดและคนทำงานยุคใหม่',
    color: '#4A5B73',
  },
  family: {
    id: 4,
    slug: 'family',
    nameThai: 'สำหรับครอบครัว',
    nameEng: 'Family',
    description: 'ห้องขนาด 2-3 ห้องนอน พื้นที่กว้างขวาง ปลอดภัย สิ่งอำนวยความสะดวกครบ',
    color: '#8F5E36',
  },
  'pet-friendly': {
    id: 5,
    slug: 'pet-friendly',
    nameThai: 'เลี้ยงสัตว์ได้',
    nameEng: 'Pet Friendly',
    description: 'โครงการที่มีพื้นที่วิ่งเล่น สวนเฉพาะ และกฎอนุญาตเลี้ยงสัตว์อย่างชัดเจน',
    color: '#A46343',
  },
  'near-bts-mrt': {
    id: 6,
    slug: 'near-bts-mrt',
    nameThai: 'ใกล้รถไฟฟ้า',
    nameEng: 'Near BTS/MRT',
    description: 'ระยะเดินถึงสถานี BTS หรือ MRT ไม่เกิน 350 เมตร เดินทางสะดวก',
    color: '#1E5E45',
  },
};

export function getCategoryThaiName(slugOrName: string): string {
  if (!slugOrName) return 'คอนโดมิเนียม';
  const lower = slugOrName.toLowerCase().replace(/[\s_]+/g, '-');
  if (CATEGORIES_CONFIG[lower]) return CATEGORIES_CONFIG[lower].nameThai;

  const byName = Object.values(CATEGORIES_CONFIG).find(
    (c) => c.nameEng.toLowerCase() === slugOrName.toLowerCase() || c.nameThai === slugOrName
  );
  if (byName) return byName.nameThai;

  return slugOrName;
}

export function renderCategoryIcon(slug: string, size = 22, strokeWidth = 1.75) {
  const s = slug.toLowerCase();
  switch (s) {
    case 'luxury':
      return <Sparkles size={size} strokeWidth={strokeWidth} />;
    case 'budget':
      return <Coins size={size} strokeWidth={strokeWidth} />;
    case 'studio':
      return <Home size={size} strokeWidth={strokeWidth} />;
    case 'family':
      return <Users size={size} strokeWidth={strokeWidth} />;
    case 'pet-friendly':
      return <PawPrint size={size} strokeWidth={strokeWidth} />;
    case 'near-bts-mrt':
      return <TrainFront size={size} strokeWidth={strokeWidth} />;
    default:
      return <Building size={size} strokeWidth={strokeWidth} />;
  }
}
