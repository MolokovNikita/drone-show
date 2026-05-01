import React from 'react';

const STATUS_CFG = {
  active:      { label: 'Active',      color: 'var(--green)',  bg: 'rgba(115,220,130,0.12)', dot: true },
  maintenance: { label: 'Maintenance', color: 'var(--amber)',  bg: 'rgba(230,180,80,0.12)',  dot: true },
  retired:     { label: 'Retired',     color: 'var(--text3)',  bg: 'rgba(255,255,255,0.05)', dot: false },
  damaged:     { label: 'Damaged',     color: 'var(--red)',    bg: 'rgba(220,80,80,0.12)',   dot: true },
  scheduled:   { label: 'Scheduled',   color: 'var(--blue)',   bg: 'rgba(107,143,255,0.12)', dot: false },
  in_progress: { label: 'In Progress', color: 'var(--amber)',  bg: 'rgba(230,180,80,0.12)',  dot: true },
  completed:   { label: 'Completed',   color: 'var(--green)',  bg: 'rgba(115,220,130,0.12)', dot: false },
  cancelled:   { label: 'Cancelled',   color: 'var(--red)',    bg: 'rgba(220,80,80,0.12)',   dot: false },
  planning:    { label: 'Planning',    color: 'var(--purple)', bg: 'rgba(160,100,255,0.12)', dot: false },
  design:      { label: 'Design',      color: 'var(--cyan)',   bg: 'rgba(80,200,255,0.12)',  dot: false },
  testing:     { label: 'Testing',     color: 'var(--amber)',  bg: 'rgba(230,180,80,0.12)',  dot: true },
  approved:    { label: 'Approved',    color: 'var(--green)',  bg: 'rgba(115,220,130,0.12)', dot: false },
  warning:     { label: 'Warning',     color: 'var(--amber)',  bg: 'rgba(230,180,80,0.12)',  dot: true },
  error:       { label: 'Error',       color: 'var(--red)',    bg: 'rgba(220,80,80,0.12)',   dot: true },
  info:        { label: 'Info',        color: 'var(--blue)',   bg: 'rgba(107,143,255,0.12)', dot: false },
  critical:    { label: 'Critical',    color: 'var(--red)',    bg: 'rgba(220,80,80,0.16)',   dot: true },
  acknowledged:{ label: 'Acknowledged',color: 'var(--amber)',  bg: 'rgba(230,180,80,0.12)',  dot: false },
  resolved:    { label: 'Resolved',    color: 'var(--green)',  bg: 'rgba(115,220,130,0.12)', dot: false },
  dismissed:   { label: 'Dismissed',   color: 'var(--text3)',  bg: 'rgba(255,255,255,0.05)', dot: false },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || {
    label: status || '—',
    color: 'var(--text2)',
    bg: 'rgba(255,255,255,0.07)',
    dot: false,
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {cfg.dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: cfg.color,
          animation: 'pulse-dot 1.6s ease-in-out infinite', flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
