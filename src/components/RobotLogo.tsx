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
      const maxEyeOffset = 2.0; // Slightly lower offset to keep it within natural limits
      const angle = Math.atan2(dy, dx);
      const eyeStrength = Math.min(distance / 200, 1);
      const eyeX = Math.cos(angle) * eyeStrength * maxEyeOffset;
      const eyeY = Math.sin(angle) * eyeStrength * maxEyeOffset;

      setEyes({ x: eyeX, y: eyeY });

      // Parallax tilt effect
      const maxTilt = 5;
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
        style={{
          overflow: 'visible',
          transform: `perspective(300px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformOrigin: '50% 50%',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <defs>
          {/* Glowing pupil radial gradient (Orange/Amber) */}
          <radialGradient id="glowingEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FB923C" /> {/* Orange 400 */}
            <stop offset="60%" stopColor="#EA580C" stopOpacity="0.95" /> {/* Orange 600 */}
            <stop offset="85%" stopColor="#7C2D12" stopOpacity="0.45" /> {/* Orange 900 */}
            <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
          </radialGradient>
          
          {/* Cybernetic eye bloom effect */}
          <filter id="eyeBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Elliptical socket clips to prevent pupils from moving outside the natural boundary */}
          <clipPath id="leftSocketClip">
            <ellipse cx="37.8" cy="50.2" rx="4.8" ry="3.6" />
          </clipPath>
          <clipPath id="rightSocketClip">
            <ellipse cx="62.2" cy="50.2" rx="4.8" ry="3.6" />
          </clipPath>
        </defs>

        {/* Robot Head Image */}
        <image 
          href="/robot-face.png" 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
        />

        {/* Left Eye */}
        {/* Hide original eye with matching dark background */}
        <ellipse cx="37.8" cy="50.2" rx="5.4" ry="4.2" fill="#0c0e12" />
        {/* Render animated glowing eye */}
        <g clipPath="url(#leftSocketClip)">
          <g
            style={{
              transform: `translate(${eyes.x}px, ${eyes.y}px)`,
              transition: 'transform 0.08s ease-out',
            }}
          >
            <circle cx="37.8" cy="50.2" r="3.8" fill="url(#glowingEye)" filter="url(#eyeBloom)" />
            {/* Gloss reflection overlay */}
            <circle cx="37.0" cy="49.4" r="1.0" fill="#FFFFFF" opacity="0.9" />
          </g>
        </g>

        {/* Right Eye */}
        {/* Hide original eye with matching dark background */}
        <ellipse cx="62.2" cy="50.2" rx="5.4" ry="4.2" fill="#0c0e12" />
        {/* Render animated glowing eye */}
        <g clipPath="url(#rightSocketClip)">
          <g
            style={{
              transform: `translate(${eyes.x}px, ${eyes.y}px)`,
              transition: 'transform 0.08s ease-out',
            }}
          >
            <circle cx="62.2" cy="50.2" r="3.8" fill="url(#glowingEye)" filter="url(#eyeBloom)" />
            {/* Gloss reflection overlay */}
            <circle cx="61.4" cy="49.4" r="1.0" fill="#FFFFFF" opacity="0.9" />
          </g>
        </g>
      </svg>
    </div>
  );
}
