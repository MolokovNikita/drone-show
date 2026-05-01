import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import { login, register } from '../store/slices/authSlice';

function ParticleField({ count = 60 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
      a: Math.random(),
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,200,255,${p.a * 0.6})`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(80,200,255,${0.1 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [count]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function LoginField({ label, value, onChange, type = 'text', error, disabled }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        disabled={disabled}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, outline: 'none',
          background: 'rgba(255,255,255,0.05)', fontFamily: 'var(--font)',
          border: error ? '1px solid var(--red)' : focus ? '1px solid rgba(80,200,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text)', fontSize: 14,
          boxShadow: focus ? '0 0 0 3px rgba(80,200,255,0.12)' : 'none',
          transition: 'all 0.2s',
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {error && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function LoginPage() {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required';
    else if (tab === 'register' && username.trim().length < 3) errs.username = 'Min 3 characters';
    if (tab === 'register') {
      if (!fullName.trim()) errs.fullName = 'Full name is required';
      if (!email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email';
    }
    if (!password) errs.password = 'Password is required';
    else if (tab === 'register' && password.length < 6) errs.password = 'Min 6 characters';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validate()) return;
    try {
      if (tab === 'login') {
        await dispatch(login({ username, password })).unwrap();
      } else {
        await dispatch(register({ username, email, password, fullName })).unwrap();
      }
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const getGeneralError = () => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error.error) return error.error;
    if (error.message) return error.message;
    return null;
  };

  const switchTab = (t) => {
    setTab(t);
    setValidationErrors({});
    setUsername(''); setEmail(''); setPassword(''); setFullName('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      <ParticleField count={70} />

      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(80,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(80,200,255,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(80,200,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,100,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #50c8ff, #6b8fff)',
            fontSize: 28, marginBottom: 16,
            boxShadow: '0 8px 32px rgba(80,200,255,0.45)',
            animation: 'glow-pulse 3s ease-in-out infinite',
          }}>◈</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>DroneOS</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Light Show Management Platform</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, backdropFilter: 'blur(16px)', padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, marginBottom: 24, gap: 3 }}>
            {['login', 'register'].map((t) => (
              <button key={t} onClick={() => switchTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                background: tab === t ? 'rgba(80,200,255,0.15)' : 'transparent',
                color: tab === t ? 'var(--cyan)' : 'var(--text3)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s', textTransform: 'capitalize',
              }}>{t === 'login' ? 'Sign In' : 'Register'}</button>
            ))}
          </div>

          {getGeneralError() && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{getGeneralError()}</Alert>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LoginField label="Username" value={username} onChange={setUsername} error={validationErrors.username} disabled={loading} />
            {tab === 'register' && (
              <>
                <LoginField label="Full Name" value={fullName} onChange={setFullName} error={validationErrors.fullName} disabled={loading} />
                <LoginField label="Email" value={email} onChange={setEmail} type="email" error={validationErrors.email} disabled={loading} />
              </>
            )}
            <LoginField label="Password" value={password} onChange={setPassword} type="password" error={validationErrors.password} disabled={loading} />

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                background: loading ? 'rgba(80,200,255,0.2)' : 'linear-gradient(135deg, #50c8ff, #6b8fff)',
                border: 'none', borderRadius: 10, padding: '12px', color: '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                fontFamily: 'var(--font)', transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(80,200,255,0.4)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Authenticating...
                </span>
              ) : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
