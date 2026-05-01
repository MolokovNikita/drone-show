import React, { useState } from 'react';

function GlassCard({ children, style, glow, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: hov ? `1px solid ${glow || 'rgba(255,255,255,0.14)'}` : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov && glow ? `0 8px 32px ${glow}30` : '0 2px 12px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
