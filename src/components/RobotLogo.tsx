'use client';

import React, { useState, useEffect, useRef } from 'react';

interface RobotLogoProps {
  size?: number;
  interactive?: boolean;
}

export default function RobotLogo({ size = 40, interactive = true }: RobotLogoProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [eyes, setEyes] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Max eye displacement offset (in a 100x100 grid)
      const maxEyeOffset = 4.0;
      const angle = Math.atan2(dy, dx);
      const eyeStrength = Math.min(distance / 180, 1);
      const eyeX = Math.cos(angle) * eyeStrength * maxEyeOffset;
      const eyeY = Math.sin(angle) * eyeStrength * maxEyeOffset;

      setEyes({ x: eyeX, y: eyeY });

      // Tilt calculations (max 12 degrees for standard natural feel)
      const maxTilt = 12;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const screenX = (event.clientX - w / 2) / (w / 2);
      const screenY = (event.clientY - h / 2) / (h / 2);

      setTilt({
        x: -screenY * maxTilt,
        y: screenX * maxTilt,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [interactive]);

  const handleMouseLeave = () => {
    setEyes({ x: 0, y: 0 });
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div 
      className="inline-flex items-center justify-center select-none"
      onMouseLeave={handleMouseLeave}
      style={{ width: size, height: size }}
    >
      <svg
        ref={containerRef}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Intense neon glow */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Soft pink cheek glow */}
          <filter id="cheekGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Premium Metallic Gradient */}
          <linearGradient id="cyberHead" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" />   {/* Indigo 300 */}
            <stop offset="40%" stopColor="#6366F1" />   {/* Indigo 500 */}
            <stop offset="100%" stopColor="#4338CA" />  {/* Indigo 700 */}
          </linearGradient>

          {/* Dark Glass Visor */}
          <linearGradient id="cyberVisor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          {/* Glass Highlight */}
          <linearGradient id="glassGloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Ear cup gradient */}
          <linearGradient id="cyberEar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Cybernetic Shoulders / Base */}
        <path d="M28 86 C28 78, 72 78, 72 86 C72 92, 28 92, 28 86 Z" fill="#1E1B4B" opacity="0.9" />
        <path d="M34 85 C34 80, 66 80, 66 85 Z" fill="#312E81" />

        {/* Neck connector */}
        <rect x="45" y="76" width="10" height="10" rx="2" fill="#4F46E5" stroke="#312E81" strokeWidth="1" />
        <line x1="47" y1="81" x2="53" y2="81" stroke="#312E81" strokeWidth="1.5" />
        <line x1="47" y1="84" x2="53" y2="84" stroke="#312E81" strokeWidth="1.5" />

        {/* Left & Right Headphone-style Cybernetic Ears */}
        <g>
          {/* Left Ear */}
          <rect x="7" y="40" width="8" height="26" rx="4" fill="url(#cyberEar)" stroke="#312E81" strokeWidth="1.5" />
          <rect x="10" y="45" width="2" height="16" rx="1" fill="#22D3EE" filter="url(#neonGlow)" />
          {/* Right Ear */}
          <rect x="85" y="40" width="8" height="26" rx="4" fill="url(#cyberEar)" stroke="#312E81" strokeWidth="1.5" />
          <rect x="88" y="45" width="2" height="16" rx="1" fill="#22D3EE" filter="url(#neonGlow)" />
        </g>

        {/* Antenna */}
        <g>
          <path d="M50 24 L50 9" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="7" r="4.5" fill="#22D3EE" filter="url(#neonGlow)" className="animate-pulse" />
        </g>

        {/* Interactive 3D Head Group */}
        <g
          style={{
            transform: `perspective(200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformOrigin: '50% 75%',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Helmet Base */}
          <rect 
            x="14" 
            y="21" 
            width="72" 
            height="58" 
            rx="20" 
            fill="url(#cyberHead)" 
            stroke="#4338CA" 
            strokeWidth="2.5" 
          />

          {/* Forehead Tech Accent */}
          <path d="M45 21 L55 21 L53 26 L47 26 Z" fill="#312E81" opacity="0.5" />

          {/* Visor Area */}
          <rect 
            x="21" 
            y="31" 
            width="58" 
            height="32" 
            rx="10" 
            fill="url(#cyberVisor)" 
            stroke="#1E1B4B" 
            strokeWidth="1.5" 
          />

          {/* Cute Blushing Cheeks (below eyes) */}
          <g>
            <circle cx="28" cy="54" r="3" fill="#F472B6" opacity="0.6" filter="url(#cheekGlow)" />
            <circle cx="72" cy="54" r="3" fill="#F472B6" opacity="0.6" filter="url(#cheekGlow)" />
          </g>

          {/* Eye Tracking Group (moves with cursor) */}
          <g
            style={{
              transform: `translate(${eyes.x}px, ${eyes.y}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            {/* Left Eye */}
            <circle cx="36" cy="44" r="6" fill="#22D3EE" filter="url(#neonGlow)" />
            <circle cx="34.5" cy="42.5" r="1.8" fill="#FFFFFF" />
            <circle cx="37.5" cy="45.5" r="1" fill="#0891B2" />

            {/* Right Eye */}
            <circle cx="64" cy="44" r="6" fill="#22D3EE" filter="url(#neonGlow)" />
            <circle cx="62.5" cy="42.5" r="1.8" fill="#FFFFFF" />
            <circle cx="65.5" cy="45.5" r="1" fill="#0891B2" />
          </g>

          {/* Cybernetic Smile / Mouth */}
          <path 
            d="M43 64 Q50 69 57 64" 
            fill="none" 
            stroke="#22D3EE" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            filter="url(#neonGlow)"
          />

          {/* Glass Visor Highlight overlay (gloss effect) */}
          <path 
            d="M21 31 L60 31 L45 63 L21 63 Z" 
            fill="url(#glassGloss)" 
            pointerEvents="none" 
            clipPath="url(#visorClip)" 
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}
