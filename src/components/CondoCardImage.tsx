'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface CondoCardImageProps {
  slug: string;
  name: string;
  district: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageIsIllustrative?: boolean;
  categoryName?: string;
  floorTotal?: number;
  priority?: boolean;
}

// Architectural Blueprint Specifications for Bangkok Condos
interface ArchitecturalProfile {
  bgColor: string;
  accentColor: string;
  floors: number;
  roofSilhouette: 'stepped' | 'spire' | 'twin' | 'garden' | 'flat';
  tagline: string;
}

const CONDO_PROFILES: Record<string, ArchitecturalProfile> = {
  'ritz-residence-sukhumvit': {
    bgColor: '#1D222C',
    accentColor: '#C8963E',
    floors: 45,
    roofSilhouette: 'stepped',
    tagline: 'ตึกยอดหลืบชั้นวิวเมืองสุขุมวิท',
  },
  'mandarin-oriental-residences': {
    bgColor: '#19212C',
    accentColor: '#D4AF37',
    floors: 52,
    roofSilhouette: 'spire',
    tagline: 'ตึกยอดแหลมริมเจ้าพระยา',
  },
  'the-bangkok-sathorn': {
    bgColor: '#21252F',
    accentColor: '#C8963E',
    floors: 50,
    roofSilhouette: 'twin',
    tagline: 'ตึกแฝดสะพานเชื่อมลอยฟ้า สาทร',
  },
  'ideo-mobi-sukhumvit-81': {
    bgColor: '#1A2325',
    accentColor: '#245842',
    floors: 28,
    roofSilhouette: 'flat',
    tagline: 'ตึกโมเดิร์นแนวรถไฟฟ้า อ่อนนุช',
  },
  'whizdom-essence-sukhumvit': {
    bgColor: '#1A2421',
    accentColor: '#2D6B50',
    floors: 50,
    roofSilhouette: 'garden',
    tagline: 'ตึกสูงพร้อมสวนลอยฟ้า ปุณณวิถี',
  },
  'noble-state-39': {
    bgColor: '#22242C',
    accentColor: '#C8963E',
    floors: 32,
    roofSilhouette: 'stepped',
    tagline: 'ตึกมินิมอลโมเดิร์น พร้อมพงษ์',
  },
  'lumpini-park-rama9': {
    bgColor: '#23242B',
    accentColor: '#A46343',
    floors: 35,
    roofSilhouette: 'flat',
    tagline: 'อาคารคู่ใจกลางย่านธุรกิจ พระราม 9',
  },
  'life-asoke-hype': {
    bgColor: '#20232B',
    accentColor: '#C8963E',
    floors: 40,
    roofSilhouette: 'stepped',
    tagline: 'ตึกสูงวิวเปิดโล่ง อโศก-ดินแดง',
  },
};

export default function CondoCardImage({
  slug,
  name,
  district,
  imageUrl,
  imageAlt,
  imageCredit,
  imageIsIllustrative = false,
  floorTotal,
  priority = false,
}: CondoCardImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const profile = CONDO_PROFILES[slug] || {
    bgColor: '#1E232D',
    accentColor: '#C8963E',
    floors: floorTotal || 35,
    roofSilhouette: 'flat',
    tagline: `อาคารพักอาศัยสูง เขต${district}`,
  };

  const floors = floorTotal || profile.floors;
  // Local project path: /images/condos/[slug].jpg or provided imageUrl
  const resolvedImgUrl = imageUrl || `/images/condos/${slug}.jpg`;
  const shouldAttemptPhoto = Boolean(resolvedImgUrl) && !hasError;

  return (
    <div
      className="condo-blueprint-card"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        backgroundColor: profile.bgColor,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      role="img"
      aria-label={imageAlt || `แบบจำลองและภาพถ่ายตึกโครงการ ${name} เขต${district}`}
    >
      {/* 1. Underlying Procedural Architectural Blueprint Drawing (Zero blank frames, instant fallback) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: isLoaded && !hasError ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* Architectural Blueprint Grid & Dimension Guides */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.18,
            pointerEvents: 'none',
          }}
          viewBox="0 0 320 200"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id={`grid-${slug}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${slug})`} />
          <line x1="16" y1="50" x2="304" y2="50" stroke="#FFFFFF" strokeDasharray="2,2" strokeWidth="0.5" />
          <line x1="16" y1="100" x2="304" y2="100" stroke="#FFFFFF" strokeDasharray="2,2" strokeWidth="0.5" />
          <line x1="16" y1="150" x2="304" y2="150" stroke="#FFFFFF" strokeDasharray="2,2" strokeWidth="0.5" />
        </svg>

        {/* Procedural Architectural Building Silhouette */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            right: '12%',
            height: '94%',
            width: 'auto',
            maxWidth: '52%',
            opacity: 0.92,
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
            pointerEvents: 'none',
          }}
          viewBox="0 0 100 130"
        >
          <rect x="5" y="122" width="90" height="4" fill="#3D4554" rx="1" />
          <rect x="18" y="104" width="64" height="18" fill="#313744" stroke="#485265" strokeWidth="0.75" />
          <line x1="28" y1="106" x2="28" y2="122" stroke="#C8963E" strokeWidth="0.6" opacity="0.6" />
          <line x1="50" y1="106" x2="50" y2="122" stroke="#C8963E" strokeWidth="0.6" opacity="0.6" />
          <line x1="72" y1="106" x2="72" y2="122" stroke="#C8963E" strokeWidth="0.6" opacity="0.6" />

          {profile.roofSilhouette === 'spire' && (
            <g>
              <rect x="24" y="32" width="52" height="72" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <polygon points="28,32 50,6 72,32" fill="#4A5468" stroke="#5F6B84" strokeWidth="0.75" />
              <line x1="50" y1="6" x2="50" y2="0" stroke={profile.accentColor} strokeWidth="2" />
              <circle cx="50" cy="0" r="1.5" fill="#FFEAA8" />
            </g>
          )}

          {profile.roofSilhouette === 'stepped' && (
            <g>
              <rect x="24" y="44" width="52" height="60" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <rect x="30" y="30" width="40" height="14" fill="#444E60" stroke="#57637A" strokeWidth="0.75" />
              <rect x="38" y="18" width="24" height="12" fill={profile.accentColor} opacity="0.85" rx="1" />
            </g>
          )}

          {profile.roofSilhouette === 'twin' && (
            <g>
              <rect x="22" y="36" width="22" height="68" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <rect x="56" y="36" width="22" height="68" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <rect x="40" y="48" width="20" height="7" fill={profile.accentColor} rx="1" />
            </g>
          )}

          {profile.roofSilhouette === 'garden' && (
            <g>
              <rect x="24" y="38" width="52" height="66" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <rect x="24" y="32" width="52" height="6" fill="#245842" rx="1" />
              <circle cx="34" cy="29" r="3" fill="#2E6B50" />
              <circle cx="48" cy="28" r="4" fill="#367F60" />
              <circle cx="64" cy="29" r="3" fill="#2E6B50" />
            </g>
          )}

          {profile.roofSilhouette === 'flat' && (
            <g>
              <rect x="24" y="38" width="52" height="66" fill="#3A4252" stroke="#4E586C" strokeWidth="0.75" />
              <rect x="30" y="32" width="40" height="6" fill={profile.accentColor} rx="1" />
            </g>
          )}

          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <g key={row} opacity="0.85">
              <circle cx="32" cy={52 + row * 7} r="1" fill="#FFE8B0" />
              <circle cx="42" cy={52 + row * 7} r="1" fill="#FFE8B0" />
              <circle cx="58" cy={52 + row * 7} r="1" fill="#FFE8B0" />
              <circle cx="68" cy={52 + row * 7} r="1" fill="#FFE8B0" />
            </g>
          ))}
        </svg>
      </div>

      {/* 2. Real Photography Layer (next/image) */}
      {shouldAttemptPhoto && (
        <Image
          src={resolvedImgUrl}
          alt={imageAlt || `ตึกคอนโด ${name} เขต${district}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          priority={priority}
          style={{
            objectFit: 'cover',
            zIndex: 1,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.28s ease',
          }}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(false);
          }}
        />
      )}

      {/* 3. Dark Bottom Gradient Overlay when photo is active (WCAG AA text contrast) */}
      {isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '52%',
            background: 'linear-gradient(to top, rgba(15, 18, 24, 0.88) 0%, rgba(15, 18, 24, 0.45) 55%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 4. Top-Left Badge: Architectural Elevation Stamp ('ตึก X ชั้น') */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          zIndex: 3,
          backgroundColor: 'rgba(20, 24, 31, 0.82)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-xs)',
          padding: '0.22rem 0.55rem',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-thai)',
          fontWeight: 500,
          color: '#F4F2EB',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        ตึก {floors} ชั้น
      </div>

      {/* 5. Bottom-Left: Concise Thai Architectural Description */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.65rem',
          left: '0.75rem',
          zIndex: 3,
          maxWidth: '65%',
        }}
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#F4F2EB',
            lineHeight: 1.35,
            textShadow: '0 1px 3px rgba(0,0,0,0.85)',
            fontFamily: 'var(--font-thai)',
          }}
        >
          {profile.tagline}
        </div>
      </div>

      {/* 6. Illustrative Simulation Badge if imageIsIllustrative */}
      {imageIsIllustrative && (
        <div
          style={{
            position: 'absolute',
            bottom: '0.65rem',
            right: '0.75rem',
            zIndex: 3,
            backgroundColor: 'rgba(20, 24, 31, 0.82)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.15rem 0.45rem',
            fontSize: '0.65rem',
            color: '#E8E5DD',
            fontWeight: 500,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          ภาพประกอบ
        </div>
      )}

      {/* 7. Image Credit Tag (if provided) */}
      {imageCredit && (
        <div
          style={{
            position: 'absolute',
            bottom: imageIsIllustrative ? '2.1rem' : '0.65rem',
            right: '0.75rem',
            zIndex: 3,
            fontSize: '0.65rem',
            color: 'rgba(244, 242, 235, 0.82)',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
            fontFamily: 'var(--font-thai)',
            whiteSpace: 'nowrap',
          }}
        >
          ภาพ: {imageCredit}
        </div>
      )}
    </div>
  );
}
