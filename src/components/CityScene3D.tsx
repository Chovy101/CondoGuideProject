'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// -------------------------------------------------------------
// Types & Bangkok Condo Building Data
// -------------------------------------------------------------
export interface BuildingData {
  id: string;
  slug: string;
  name: string;
  thaiName: string;
  district: string;
  price: string;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: string;
  accentColor: string;
  podiumHeight: number;
  roofType?: 'stepped' | 'spire' | 'twin' | 'garden' | 'flat';
  isFeatured?: boolean;
}

export const BANGKOK_CONDOS: BuildingData[] = [
  {
    id: 'bldg-1',
    slug: 'ritz-residence-sukhumvit',
    name: 'The Ritz Residence',
    thaiName: 'เดอะ ริทซ์ เรสซิเดนซ์ สุขุมวิท',
    district: 'วัฒนา',
    price: '฿35,000 - 150,000/ด.',
    position: [-2.6, 0, 1.2],
    size: [1.8, 6.4, 1.8],
    color: '#4E5667', // Soft Twilight Slate
    accentColor: '#C8963E', // Bangkok Evening Gold
    podiumHeight: 0.6,
    roofType: 'stepped',
    isFeatured: true,
  },
  {
    id: 'bldg-2',
    slug: 'mandarin-oriental-residences',
    name: 'Mandarin Oriental Residences',
    thaiName: 'เดอะ เรสซิเดนเซส แอท แมนดาริน โอเรียนเต็ล',
    district: 'บางรัก',
    price: '฿120,000 - 500,000/ด.',
    position: [3.4, 0, 2.0],
    size: [2.0, 7.5, 1.9],
    color: '#464E5E', // Warm Riverside Slate
    accentColor: '#C8963E', // Gold
    podiumHeight: 0.7,
    roofType: 'spire',
    isFeatured: true,
  },
  {
    id: 'bldg-3',
    slug: 'the-bangkok-sathorn',
    name: 'The Bangkok Sathorn',
    thaiName: 'เดอะ แบงค็อค สาทร',
    district: 'สาทร',
    price: '฿55,000 - 200,000/ด.',
    position: [2.8, 0, -2.4],
    size: [1.9, 6.0, 1.9],
    color: '#525B6C', // Architectural Concrete Gray
    accentColor: '#C8963E',
    podiumHeight: 0.6,
    roofType: 'twin',
    isFeatured: true,
  },
  {
    id: 'bldg-4',
    slug: 'ideo-mobi-sukhumvit-81',
    name: 'Ideo Mobi Sukhumvit 81',
    thaiName: 'ไอดีโอ โมบิ สุขุมวิท 81',
    district: 'พระโขนง',
    price: '฿12,000 - 40,000/ด.',
    position: [-1.4, 0, -3.0],
    size: [1.6, 5.0, 1.6],
    color: '#4A5364',
    accentColor: '#245842', // BTS Transit Green
    podiumHeight: 0.5,
    roofType: 'flat',
    isFeatured: true,
  },
  {
    id: 'bldg-5',
    slug: 'whizdom-essence-sukhumvit',
    name: 'Whizdom Essence',
    thaiName: 'วิสซ์ดอม เอสเซ้นส์ สุขุมวิท',
    district: 'พระโขนง',
    price: '฿15,000 - 42,000/ด.',
    position: [4.6, 0, -0.4],
    size: [1.6, 5.4, 1.5],
    color: '#4E5768',
    accentColor: '#2D6B50',
    podiumHeight: 0.5,
    roofType: 'garden',
    isFeatured: true,
  },
  {
    id: 'bldg-6',
    slug: 'noble-state-39',
    name: 'Noble State 39',
    thaiName: 'โนเบิล สเตท 39',
    district: 'วัฒนา',
    price: '฿18,000 - 35,000/ด.',
    position: [-4.6, 0, -1.6],
    size: [1.5, 4.8, 1.5],
    color: '#586173', // Dusk Steel
    accentColor: '#C8963E',
    podiumHeight: 0.5,
    roofType: 'stepped',
    isFeatured: false,
  },
  {
    id: 'bldg-7',
    slug: 'lumpini-park-rama9',
    name: 'Lumpini Park Rama 9',
    thaiName: 'ลุมพินี พาร์ค พระราม 9',
    district: 'ห้วยขวาง',
    price: '฿8,500 - 25,000/ด.',
    position: [-3.8, 0, 3.2],
    size: [2.2, 4.2, 1.6],
    color: '#5C6577',
    accentColor: '#A46343', // Warm Terracotta
    podiumHeight: 0.5,
    roofType: 'flat',
    isFeatured: true,
  },
];

// Filler skyline blocks for metropolitan depth with 4 distinct deep slate-blue shades
const FILLER_BLOCKS: Array<{ pos: [number, number, number]; size: [number, number, number]; color: string }> = [
  { pos: [-6.4, 0, 0.8], size: [1.3, 3.2, 1.4], color: '#4A5466' }, // Shade 1: Deep Twilight Slate
  { pos: [-5.8, 0, -3.8], size: [1.4, 3.5, 1.2], color: '#535E73' }, // Shade 2: Muted Steel Slate
  { pos: [0.8, 0, -4.8], size: [1.6, 3.7, 1.4], color: '#5C677C' }, // Shade 3: Ambient Gray-Blue
  { pos: [5.8, 0, -3.0], size: [1.3, 3.3, 1.3], color: '#4A5466' }, // Shade 1
  { pos: [6.2, 0, 2.0], size: [1.4, 3.9, 1.4], color: '#657186' }, // Shade 4: Atmospheric Horizon Slate
  { pos: [0.6, 0, 4.6], size: [1.5, 2.9, 1.5], color: '#535E73' }, // Shade 2
  { pos: [-1.8, 0, 4.8], size: [1.3, 2.7, 1.2], color: '#5C677C' }, // Shade 3
  { pos: [-5.2, 0, 4.2], size: [1.2, 2.4, 1.2], color: '#657186' }, // Shade 4
  { pos: [5.2, 0, 4.2], size: [1.3, 2.8, 1.3], color: '#4A5466' }, // Shade 1
];

// -------------------------------------------------------------
// Interactive Condo Tower Component
// -------------------------------------------------------------
function CondoTower({
  data,
  isHovered,
  isSelected,
  onHover,
  onUnhover,
  onClick,
}: {
  data: BuildingData;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [w, h, d] = data.size;
  const pHeight = data.podiumHeight;
  const currentY = useRef(0);

  // Smooth hover elevation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = isHovered || isSelected ? 0.35 : 0;
    currentY.current = THREE.MathUtils.lerp(currentY.current, targetY, delta * 9);
    groupRef.current.position.y = currentY.current;
  });

  // Base building facade material
  const baseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isHovered || isSelected ? '#5C6577' : data.color,
      roughness: 0.42,
      metalness: 0.22,
      emissive: isHovered || isSelected ? data.accentColor : '#000000',
      emissiveIntensity: isHovered || isSelected ? 0.32 : 0,
    });
  }, [data.color, data.accentColor, isHovered, isSelected]);

  // Podium base material (slightly darker, textured concrete)
  const podiumMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#343A46',
      roughness: 0.65,
      metalness: 0.15,
    });
  }, []);

  // Subtle warm evening window dots (fine-grain architectural slits, not thick white slabs)
  const windowLitMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#FFE8B0',
      emissive: '#FFCF70',
      emissiveIntensity: 0.65,
      roughness: 0.25,
    });
  }, []);

  const windowDimMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#282E39',
      roughness: 0.7,
      metalness: 0.1,
    });
  }, []);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: data.accentColor,
      roughness: 0.35,
      metalness: 0.45,
    });
  }, [data.accentColor]);

  // Calculate floor count and window grid columns
  const floorCount = Math.floor(h / 0.55);
  const xColumns = Math.max(2, Math.floor(w / 0.45));

  return (
    <group
      ref={groupRef}
      position={[data.position[0], 0, data.position[2]]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onUnhover();
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* 1. Ground Podium Base (Wider structural plinth) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, pHeight / 2, 0]}
        material={podiumMaterial}
      >
        <boxGeometry args={[w * 1.16, pHeight, d * 1.16]} />
      </mesh>

      {/* Podium Lobby Entrance Glass */}
      <mesh position={[0, pHeight * 0.45, (d * 1.16) / 2 + 0.008]} material={windowLitMaterial}>
        <planeGeometry args={[w * 0.55, pHeight * 0.5]} />
      </mesh>

      {/* 2. Main Tower Shaft */}
      <mesh
        castShadow
        receiveShadow
        position={[0, pHeight + h / 2, 0]}
        material={baseMaterial}
      >
        <boxGeometry args={[w, h, d]} />
      </mesh>

      {/* Architectural Floor Division Bands (Crisp horizontal relief every 2 floors) */}
      {Array.from({ length: Math.floor(floorCount / 2) }).map((_, sIdx) => {
        const slabY = pHeight + 0.6 + sIdx * 1.04;
        return (
          <mesh
            key={`slab-${sIdx}`}
            position={[0, slabY, 0]}
            material={podiumMaterial}
          >
            <boxGeometry args={[w * 1.035, 0.045, d * 1.035]} />
          </mesh>
        );
      })}

      {/* 3. Subtle Window Dot Matrix across all 4 building faces */}
      {Array.from({ length: floorCount }).map((_, fIdx) => {
        const floorY = pHeight + 0.35 + fIdx * 0.52;
        return (
          <group key={fIdx} position={[0, floorY, 0]}>
            {/* Front facade windows */}
            {Array.from({ length: xColumns }).map((_, cIdx) => {
              const xPos = -w * 0.36 + (cIdx / (xColumns - 1 || 1)) * (w * 0.72);
              // Organic illumination: 70% lit, 30% dimmed
              const isLit = (fIdx * 3 + cIdx * 7) % 10 > 2;
              return (
                <mesh
                  key={`f-${cIdx}`}
                  position={[xPos, 0, d / 2 + 0.008]}
                  material={isLit ? windowLitMaterial : windowDimMaterial}
                >
                  <planeGeometry args={[w * 0.2 / xColumns + 0.12, 0.14]} />
                </mesh>
              );
            })}

            {/* Back facade windows */}
            {Array.from({ length: xColumns }).map((_, cIdx) => {
              const xPos = -w * 0.36 + (cIdx / (xColumns - 1 || 1)) * (w * 0.72);
              const isLit = (fIdx * 5 + cIdx * 2) % 10 > 3;
              return (
                <mesh
                  key={`b-${cIdx}`}
                  position={[xPos, 0, -d / 2 - 0.008]}
                  rotation={[0, Math.PI, 0]}
                  material={isLit ? windowLitMaterial : windowDimMaterial}
                >
                  <planeGeometry args={[w * 0.2 / xColumns + 0.12, 0.14]} />
                </mesh>
              );
            })}

            {/* Left side facade windows (gives architectural depth to front boxes) */}
            <mesh
              position={[-w / 2 - 0.008, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              material={(fIdx * 4) % 10 > 3 ? windowLitMaterial : windowDimMaterial}
            >
              <planeGeometry args={[d * 0.45, 0.14]} />
            </mesh>

            {/* Right side facade windows */}
            <mesh
              position={[w / 2 + 0.008, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              material={(fIdx * 3 + 2) % 10 > 3 ? windowLitMaterial : windowDimMaterial}
            >
              <planeGeometry args={[d * 0.45, 0.14]} />
            </mesh>
          </group>
        );
      })}

      {/* 4. Roof Architecture by Typology */}
      {data.roofType === 'stepped' && (
        <group position={[0, pHeight + h, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.3, 0]} material={accentMaterial}>
            <boxGeometry args={[w * 0.76, 0.6, d * 0.76]} />
          </mesh>
          <mesh castShadow position={[0, 0.75, 0]} material={baseMaterial}>
            <boxGeometry args={[w * 0.48, 0.45, d * 0.48]} />
          </mesh>
        </group>
      )}

      {data.roofType === 'spire' && (
        <group position={[0, pHeight + h, 0]}>
          <mesh castShadow position={[0, 0.35, 0]} material={accentMaterial}>
            <boxGeometry args={[w * 0.8, 0.7, d * 0.8]} />
          </mesh>
          <mesh castShadow position={[0, 1.15, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.03, 0.1, 1.3, 8]} />
          </mesh>
        </group>
      )}

      {data.roofType === 'twin' && (
        <group position={[0, pHeight + h, 0]}>
          <mesh castShadow position={[-w * 0.25, 0.35, 0]} material={baseMaterial}>
            <boxGeometry args={[w * 0.35, 0.7, d * 0.7]} />
          </mesh>
          <mesh castShadow position={[w * 0.25, 0.35, 0]} material={baseMaterial}>
            <boxGeometry args={[w * 0.35, 0.7, d * 0.7]} />
          </mesh>
          {/* Architectural Skybridge */}
          <mesh castShadow position={[0, 0.42, 0]} material={accentMaterial}>
            <boxGeometry args={[w * 0.6, 0.18, d * 0.38]} />
          </mesh>
        </group>
      )}

      {data.roofType === 'garden' && (
        <group position={[0, pHeight + h, 0]}>
          {/* Sky Terrace Greenery */}
          <mesh castShadow position={[0, 0.12, 0]}>
            <boxGeometry args={[w * 0.9, 0.24, d * 0.9]} />
            <meshStandardMaterial color="#274C37" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0]} material={accentMaterial}>
            <boxGeometry args={[w * 0.5, 0.36, d * 0.5]} />
          </mesh>
        </group>
      )}

      {data.roofType === 'flat' && (
        <group position={[0, pHeight + h, 0]}>
          <mesh castShadow position={[0, 0.12, 0]} material={accentMaterial}>
            <boxGeometry args={[w * 0.88, 0.24, d * 0.88]} />
          </mesh>
          {/* Rooftop mechanical penthouse */}
          <mesh castShadow position={[0, 0.35, 0]} material={podiumMaterial}>
            <boxGeometry args={[w * 0.45, 0.3, d * 0.45]} />
          </mesh>
        </group>
      )}

      {/* 5. In-Scene 3D Tooltip: Minimal, non-obtrusive short project title */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, pHeight + h + 0.9, 0]}
          center
          distanceFactor={23}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              backgroundColor: 'rgba(20, 24, 31, 0.92)',
              backdropFilter: 'blur(8px)',
              color: '#F7F5F0',
              padding: '4px 10px',
              borderRadius: '3px',
              border: '1px solid #C8963E',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
              fontFamily: 'var(--font-thai)',
              fontSize: '13px',
              fontWeight: 600,
              maxWidth: '180px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {data.thaiName || data.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// -------------------------------------------------------------
// Urban Infrastructure: Transit Skytrain & Ground Masterplan
// -------------------------------------------------------------
function UrbanMasterplan() {
  const trainRef = useRef<THREE.Group>(null);
  const trainZ = useRef(0);

  // Animated BTS Skytrain carriage moving along viaduct
  useFrame((_, delta) => {
    if (!trainRef.current) return;
    trainZ.current += delta * 2.1;
    if (trainZ.current > 7.5) trainZ.current = -7.5;
    trainRef.current.position.z = trainZ.current;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Masterplan Slab (Softer architectural stone surface) */}
      <mesh receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[11.5, 12.0, 0.4, 56]} />
        <meshLambertMaterial color="#E4E0D6" />
      </mesh>

      {/* 2. Sub-ground Pedestal Rim */}
      <mesh receiveShadow position={[0, -0.42, 0]}>
        <cylinderGeometry args={[12.2, 12.6, 0.2, 56]} />
        <meshLambertMaterial color="#D5D0C4" />
      </mesh>

      {/* 3. Urban Avenue Ribbons (Crisp dark slate pavement) */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 1.3]} />
        <meshLambertMaterial color="#363C47" />
      </mesh>
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[20, 1.1]} />
        <meshLambertMaterial color="#363C47" />
      </mesh>

      {/* Centerline Dash Marking */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 0.06]} />
        <meshBasicMaterial color="#E8E4DA" />
      </mesh>

      {/* 4. Elevated BTS Skytrain Viaduct */}
      <group position={[-1.2, 1.55, 0]}>
        {/* Track Beam */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.55, 0.22, 15]} />
          <meshStandardMaterial color="#9E988D" roughness={0.65} />
        </mesh>
        {/* Dual Rails */}
        <mesh position={[-0.14, 0.13, 0]}>
          <boxGeometry args={[0.04, 0.04, 15]} />
          <meshStandardMaterial color="#245842" roughness={0.3} />
        </mesh>
        <mesh position={[0.14, 0.13, 0]}>
          <boxGeometry args={[0.04, 0.04, 15]} />
          <meshStandardMaterial color="#245842" roughness={0.3} />
        </mesh>

        {/* Viaduct Concrete Piers */}
        {[-5.2, -2.6, 0, 2.6, 5.2].map((zPos, idx) => (
          <mesh key={idx} castShadow receiveShadow position={[0, -0.85, zPos]}>
            <cylinderGeometry args={[0.16, 0.2, 1.5, 12]} />
            <meshStandardMaterial color="#8F8A7E" roughness={0.7} />
          </mesh>
        ))}

        {/* Moving BTS Carriage */}
        <group ref={trainRef} position={[0, 0.25, 0]}>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.38, 0.3, 1.9]} />
            <meshStandardMaterial color="#F4F2EB" roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.39, 0.06, 1.91]} />
            <meshStandardMaterial color="#245842" roughness={0.3} />
          </mesh>
          <pointLight color="#FFE5A3" intensity={0.75} distance={2.4} position={[0, 0, 1.05]} />
        </group>
      </group>

      {/* 5. Minimalist Low-Poly Street Trees along Avenues */}
      {[
        [-1.8, 0.35, -2.0],
        [-1.8, 0.35, 0.2],
        [-1.8, 0.35, 2.4],
        [1.8, 0.35, -1.2],
        [1.8, 0.35, 1.0],
        [1.8, 0.35, 3.2],
      ].map(([tx, ty, tz], idx) => (
        <group key={idx} position={[tx, ty, tz]}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <coneGeometry args={[0.22, 0.45, 6]} />
            <meshStandardMaterial color="#2B4D3A" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
            <meshStandardMaterial color="#5C4D3C" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 6. Background Filler Buildings for Skyline Depth */}
      {FILLER_BLOCKS.map((item, idx) => (
        <mesh
          key={idx}
          castShadow
          receiveShadow
          position={[item.pos[0], item.size[1] / 2, item.pos[2]]}
        >
          <boxGeometry args={item.size} />
          <meshLambertMaterial color={item.color} />
        </mesh>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Camera Rig: Wider FOV & Pulled-back Orbit for Full Panorama
// -------------------------------------------------------------
function CameraRig({
  prefersReducedMotion,
  isMobile,
}: {
  prefersReducedMotion: boolean;
  isMobile: boolean;
}) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const scrollRatio = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const maxScroll = Math.max(1, window.innerHeight * 1.2);
      scrollRatio.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame((_, delta) => {
    const s = scrollRatio.current;

    // Pulled-back Camera Radius: lets entire skyline breathe with no edge clipping
    const baseRadius = isMobile ? 26.5 : 23.5;
    const baseHeight = isMobile ? 18.0 : 16.2;

    // Gentle scroll arc around city
    const scrollAngle = 0.80 + s * 0.35;
    const targetX = Math.cos(scrollAngle) * (baseRadius - s * 3.5);
    const targetZ = Math.sin(scrollAngle) * (baseRadius - s * 3.5);
    const targetY = baseHeight - s * 4.0;

    // Mouse parallax tilt
    const tiltMultiplier = prefersReducedMotion ? 0 : 0.6;
    const parallaxX = mouse.current.x * tiltMultiplier;
    const parallaxY = mouse.current.y * tiltMultiplier * 0.4;

    // Smooth Lerp Camera Position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX + parallaxX, delta * 3.2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + parallaxY, delta * 3.2);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ + parallaxX * 0.5, delta * 3.2);

    camera.lookAt(0, 2.2 + s * 0.8, 0);
  });

  return null;
}

// -------------------------------------------------------------
// Main 3D City Scene Container Component
// -------------------------------------------------------------
interface CityScene3DProps {
  onSelectCondo?: (slug: string) => void;
  onHoverCondo?: (slug: string | null) => void;
  selectedSlug?: string;
}

export default function CityScene3D({
  onSelectCondo,
  onHoverCondo,
  selectedSlug,
}: CityScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check WebGL availability with try/catch
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        throw new Error('WebGL context is not supported or hardware acceleration is disabled.');
      }
    } catch (err) {
      console.error('[CityScene3D] WebGL capability check failed:', err);
      setHasWebGLError(true);
    }

    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(motionQuery.matches);
      setIsMobile(window.innerWidth < 768);

      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // IntersectionObserver: Pause rendering when 3D hero is offscreen (60fps performance rule)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2D Fallback if WebGL fails
  if (hasWebGLError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: '380px',
          backgroundColor: '#EAE7E1',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-line)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--ink-primary)' }}>
          Bangkok Architectural Skyline
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', maxWidth: '44ch' }}>
          โหมดแสดงผลผังเมือง 2D (บราวเซอร์หรืออุปกรณ์ของคุณไม่รองรับ WebGL หรือปิดการเร่งความเร็วด้วยฮาร์ดแวร์)
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Interactive Helper Overlay: Lightweight, single line, semi-transparent */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          right: '0.75rem',
          zIndex: 10,
          backgroundColor: 'rgba(20, 24, 31, 0.50)',
          backdropFilter: 'blur(6px)',
          color: '#EAE7E1',
          padding: '0.25rem 0.65rem',
          borderRadius: '3px',
          fontSize: '0.72rem',
          letterSpacing: '0.01em',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#C8963E', fontSize: '0.65rem' }}>●</span>
        <span>คลิกตึกเพื่อดูข้อมูล</span>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]} // Cap pixel ratio to max 2 for 60fps performance
        frameloop={isInView ? 'always' : 'never'} // Stop rendering when off-screen
        camera={{ position: [23.5, 16.5, 23.5], fov: 36, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Soft Ambient Light - prevents harsh pitch black shadows */}
        <ambientLight color="#EDE8E0" intensity={0.82} />

        {/* Primary Warm Sun (Bangkok Twilight / Golden Hour - Casts deep crisp shadows) */}
        <directionalLight
          position={[16, 24, 12]}
          intensity={1.85}
          color="#FFDFBA"
          castShadow
          shadow-mapSize={[isMobile ? 512 : 1024, isMobile ? 512 : 1024]}
          shadow-bias={-0.0001}
          shadow-camera-left={-13}
          shadow-camera-right={13}
          shadow-camera-top={13}
          shadow-camera-bottom={-13}
        />

        {/* Secondary Cool City Fill Light - softens back building shadows to rich slate-blue */}
        <directionalLight
          position={[-14, 9, -9]}
          intensity={0.65}
          color="#9BB4D4"
        />

        {/* Center Base Accent Point Light */}
        <pointLight
          position={[0, 1.8, 0]}
          intensity={0.5}
          distance={14}
          color="#E8A855"
        />

        {/* Camera Rig (Scroll Dolly + Mouse Parallax Tilt) */}
        <CameraRig
          prefersReducedMotion={prefersReducedMotion}
          isMobile={isMobile}
        />

        {/* Masterplan Base & BTS Transit Corridor */}
        <UrbanMasterplan />

        {/* Interactive Condo Towers (Raycaster hover/click enabled) */}
        {BANGKOK_CONDOS.map((condo) => (
          <CondoTower
            key={condo.id}
            data={condo}
            isHovered={hoveredId === condo.id}
            isSelected={selectedSlug === condo.slug}
            onHover={() => {
              setHoveredId(condo.id);
              if (onHoverCondo) onHoverCondo(condo.slug);
            }}
            onUnhover={() => {
              setHoveredId(null);
              if (onHoverCondo) onHoverCondo(null);
            }}
            onClick={() => {
              if (onSelectCondo) {
                onSelectCondo(condo.slug);
              }
              // Smooth scroll to corresponding condo card on the page
              const cardEl = document.getElementById(`condo-card-${condo.slug}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cardEl.classList.add('pulse-highlight');
                setTimeout(() => cardEl.classList.remove('pulse-highlight'), 2000);
              }
            }}
          />
        ))}
      </Canvas>
    </div>
  );
}
