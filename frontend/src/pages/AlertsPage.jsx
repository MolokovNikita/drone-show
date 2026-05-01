import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlerts, acknowledgeAlert } from '../store/slices/alertSlice';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';

const SEV_ICON = { info: 'ℹ', warning: '⚠', error: '✕', critical: '◬' };
const SEV_GLOW = {
  error:    'rgba(220,80,80,0.4)',
  critical: 'rgba(220,80,80,0.4)',
  warning:  'rgba(230,180,80,0.3)',
};

function AlertsPage() {
  const dispatch = useDispatch();
  const { items: alerts } = useSelector((state) => state.alerts);

  useEffect(() => { dispatch(fetchAlerts()); }, [dispatch]);

  const handleResolve = async (id) => {
    await dispatch(acknowledgeAlert(id));
    dispatch(fetchAlerts());
  };

  const active   = alerts.filter((a) => !a.resolved).length;
  const warnings = alerts.filter((a) => a.severity === 'warning').length;
  const infoCount = alerts.filter((a) => a.severity === 'info').length;

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { label: 'Active', count: active, color: 'var(--red)' },
          { label: 'Warnings', count: warnings, color: 'var(--amber)' },
          { label: 'Info', count: infoCount, color: 'var(--blue)' },
        ].map((s) => (
          <GlassCard key={s.label} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.count}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label} Alerts</div>
          </GlassCard>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.length === 0 && (
          <GlassCard style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>◬</div>
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>No alerts</div>
          </GlassCard>
        )}
        {alerts.map((alert, i) => (
          <GlassCard
            key={alert.alertId}
            glow={SEV_GLOW[alert.severity]}
            style={{
              padding: '16px 20px',
              opacity: alert.resolved ? 0.5 : 1,
              animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
              transition: 'opacity 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                color: alert.severity === 'error' || alert.severity === 'critical' ? 'var(--red)' : alert.severity === 'warning' ? 'var(--amber)' : 'var(--blue)',
              }}>
                {SEV_ICON[alert.severity] || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {alert.notes || alert.alertType}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  {new Date(alert.createdAt).toLocaleString()} · {alert.alertType}
                  {alert.drone?.serialNumber && ` · ${alert.drone.serialNumber}`}
                </div>
              </div>
              <StatusBadge status={alert.severity} />
              {!alert.resolved ? (
                <button
                  onClick={() => handleResolve(alert.alertId)}
                  style={{
                    background: 'rgba(115,220,130,0.1)', border: '1px solid rgba(115,220,130,0.25)',
                    borderRadius: 8, padding: '6px 16px', color: 'var(--green)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(115,220,130,0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(115,220,130,0.1)'; }}
                >
                  Resolve
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>Resolved</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default AlertsPage;
