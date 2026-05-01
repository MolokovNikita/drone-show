import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDrones } from '../store/slices/droneSlice';
import { fetchShows } from '../store/slices/showSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { fetchAlerts } from '../store/slices/alertSlice';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import AnimCounter from '../components/AnimCounter';

function MiniSparkline({ data, color = 'var(--cyan)', height = 36 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const norm = (v) => height - ((v - min) / (max - min + 0.001)) * height;
  const w = 100;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${norm(v)}`).join(' ');
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${w},${height}`} fill={`url(#sg${color.replace(/[^a-z]/gi, '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardPage() {
  const dispatch = useDispatch();
  const { items: drones } = useSelector((state) => state.drones);
  const { items: shows } = useSelector((state) => state.shows);
  const { items: projects } = useSelector((state) => state.projects);
  const { items: alerts } = useSelector((state) => state.alerts);

  useEffect(() => {
    if (drones.length === 0) dispatch(fetchDrones());
    if (shows.length === 0) dispatch(fetchShows());
    if (projects.length === 0) dispatch(fetchProjects());
    if (alerts.length === 0) dispatch(fetchAlerts({ resolved: false }));
  }, [dispatch, drones.length, shows.length, projects.length, alerts.length]);

  const activeAlerts = alerts.filter((a) => !a.resolved).length;

  const stats = [
    { label: 'Total Drones', value: drones.length, sub: 'fleet size', color: 'var(--cyan)', glow: 'rgba(80,200,255,0.25)', icon: '◈', spark: [4, 6, 5, 7, 6, 8, 8] },
    { label: 'Active Shows', value: shows.filter((s) => s.status === 'in_progress').length, sub: 'live now', color: 'var(--amber)', glow: 'rgba(230,180,80,0.25)', icon: '◉', spark: [1, 0, 2, 1, 3, 2, 1] },
    { label: 'Projects', value: projects.length, sub: 'total', color: 'var(--purple)', glow: 'rgba(160,100,255,0.25)', icon: '⬜', spark: [2, 2, 3, 3, 4, 4, 4] },
    { label: 'Active Alerts', value: activeAlerts, sub: 'need attention', color: 'var(--red)', glow: 'rgba(220,80,80,0.25)', icon: '◬', spark: [3, 2, 4, 3, 5, 4, 3] },
  ];

  const fleetSummary = [
    { label: 'Active',      count: drones.filter((d) => d.status === 'active').length,      color: 'var(--green)' },
    { label: 'Maintenance', count: drones.filter((d) => d.status === 'maintenance').length,  color: 'var(--amber)' },
    { label: 'Damaged',     count: drones.filter((d) => d.status === 'damaged').length,      color: 'var(--red)' },
    { label: 'Retired',     count: drones.filter((d) => d.status === 'retired').length,      color: 'var(--text3)' },
  ];

  const recentShows = shows.slice(0, 4);

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {stats.map((s, i) => (
          <GlassCard key={s.label} glow={s.glow} style={{ padding: 24, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 28, color: s.color, lineHeight: 1 }}>{s.icon}</div>
              <MiniSparkline data={s.spark} color={s.color} height={36} />
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
              <AnimCounter target={s.value} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--mono)' }}>{s.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent shows */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Recent Shows</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentShows.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>No shows yet</div>
            ) : recentShows.map((show) => (
              <div key={show.showId} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(80,200,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                }}>◉</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show.showName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{show.venue}</div>
                </div>
                <StatusBadge status={show.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Fleet overview */}
        <GlassCard style={{ padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Fleet Overview</div>
          <div style={{ display: 'flex', height: 8, borderRadius: 8, overflow: 'hidden', marginBottom: 20, gap: 2 }}>
            {fleetSummary.map((f) => (
              <div key={f.label} style={{ flex: f.count || 0.3, background: f.color, opacity: f.count ? 1 : 0.15, transition: 'flex 0.8s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fleetSummary.map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'block', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{f.label}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{f.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alert strip */}
      {activeAlerts > 0 && (
        <GlassCard glow="rgba(220,80,80,0.4)" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 18, animation: 'pulse-dot 1.5s infinite' }}>◬</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>
              <strong style={{ color: 'var(--red)' }}>{activeAlerts} active alert{activeAlerts > 1 ? 's' : ''}</strong>
              {alerts.find((a) => !a.resolved) ? ` — ${alerts.find((a) => !a.resolved).notes || alerts.find((a) => !a.resolved).alertType}` : ''}
            </span>
            <StatusBadge status="warning" />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default DashboardPage;
