import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { fetchAlerts } from '../store/slices/alertSlice';

const NAV = [
  { id: '/',           icon: '⬡', label: 'Dashboard' },
  { id: '/drones',     icon: '◈', label: 'Drones' },
  { id: '/shows',      icon: '◉', label: 'Shows' },
  { id: '/projects',   icon: '⬜', label: 'Projects' },
  { id: '/clients',    icon: '◎', label: 'Clients' },
  { id: '/telemetry',  icon: '◐', label: 'Telemetry' },
  { id: '/alerts',     icon: '◬', label: 'Alerts' },
];

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/drones':     'Fleet Management',
  '/shows':      'Light Shows',
  '/projects':   'Projects',
  '/clients':    'Clients',
  '/telemetry':  'Live Telemetry',
  '/alerts':     'Alerts & Notifications',
  '/choreography': 'Choreography Editor',
};

function NavItem({ icon, label, active, onClick, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 12,
        border: 'none',
        background: active ? 'rgba(80,200,255,0.12)' : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? 'var(--cyan)' : hov ? 'rgba(255,255,255,0.8)' : 'var(--text2)',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font)',
        fontSize: 14,
        fontWeight: 500,
        position: 'relative',
      }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 24, background: 'var(--cyan)', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: 'var(--red)', color: '#fff', borderRadius: 10,
          padding: '1px 7px', fontSize: 11, fontWeight: 700,
        }}>{badge}</span>
      )}
    </button>
  );
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: alerts } = useSelector((state) => state.alerts);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    dispatch(fetchAlerts({ resolved: false }));
  }, [dispatch]);

  const alertCount = alerts.filter((a) => !a.resolved).length;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const initials = user?.fullName?.[0] || user?.username?.[0] || user?.email?.[0] || 'A';
  const displayName = user?.fullName || user?.username || 'Admin';
  const displayEmail = user?.email || 'admin@droneos.io';
  const pageTitle = PAGE_TITLES[location.pathname] || 'DroneOS';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        background: 'linear-gradient(180deg, #0b1120 0%, #060912 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #50c8ff, #6b8fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 4px 16px rgba(80,200,255,0.4)',
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}>◈</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>DroneOS</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>v2.0 STUDIO</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map((n) => (
            <NavItem
              key={n.id}
              icon={n.icon}
              label={n.label}
              active={location.pathname === n.id}
              onClick={() => navigate(n.id)}
              badge={n.id === '/alerts' ? alertCount : 0}
            />
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #50c8ff, #6b8fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0, color: '#fff',
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayEmail}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0, transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
          >⏻</button>
        </div>

        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          zIndex: 10,
        }} />
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Topbar */}
        <div style={{
          height: 64, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          background: 'rgba(6,9,18,0.8)', backdropFilter: 'blur(20px)',
          gap: 16,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
            {pageTitle}
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite', display: 'block' }} />
              <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>LIVE</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
