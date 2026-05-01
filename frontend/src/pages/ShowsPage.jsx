import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogActions, TextField } from '@mui/material';
import { fetchShows, createShow, updateShow, deleteShow, generateShowWithAI } from '../store/slices/showSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import api from '../services/api';
import AIChat from '../components/AIChat';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import AnimCounter from '../components/AnimCounter';

const emptyForm = {
  showName: '', projectId: '', showDate: '', showTime: '', venue: '',
  weatherConditions: '', crowdSize: '', durationSeconds: '', status: 'scheduled', notes: '',
};

function ShowsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: shows, loading: showsLoading } = useSelector((state) => state.shows);
  const { items: projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!showsLoading && shows.length === 0) dispatch(fetchShows());
    if (!projectsLoading && projects.length === 0) dispatch(fetchProjects());
  }, [dispatch, showsLoading, shows.length, projectsLoading, projects.length]);

  const handleOpen = (show = null) => {
    setEditing(show);
    setFormData(show ? {
      showName: show.showName || '', projectId: show.projectId || '', showDate: show.showDate || '',
      showTime: show.showTime || '', venue: show.venue || '', weatherConditions: show.weatherConditions || '',
      crowdSize: show.crowdSize || '', durationSeconds: show.durationSeconds || '',
      status: show.status || 'scheduled', notes: show.notes || '',
    } : { ...emptyForm });
    setOpen(true);
  };
  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleConfirmShow = async (systemData) => {
    if (!systemData) {
      const lastAIMessage = chatMessages.filter((m) => m.role === 'assistant' && m.systemData).slice(-1)[0];
      if (!lastAIMessage?.systemData) { alert('Нет данных для создания шоу'); return; }
      if (lastAIMessage.showId) { navigate(`/choreography/show/${lastAIMessage.showId}`); setChatOpen(false); return; }
      systemData = lastAIMessage.systemData;
    }
    const existingMessage = chatMessages
      .filter((m) => m.role === 'assistant' && m.systemData && m.showId)
      .find((m) => m.systemData.showName === systemData.showName && JSON.stringify(m.systemData.choreographyIdeas) === JSON.stringify(systemData.choreographyIdeas));
    if (existingMessage?.showId) { navigate(`/choreography/show/${existingMessage.showId}`); setChatOpen(false); return; }

    try {
      setGenerating(true);
      const showData = {
        showName: systemData.showName, venue: systemData.venue, durationSeconds: systemData.durationSeconds || 300,
        notes: systemData.notes, showDate: formData.showDate || new Date().toISOString().split('T')[0],
        showTime: formData.showTime || '20:00:00', status: 'scheduled', projectId: formData.projectId || null,
      };
      const createdShow = await dispatch(createShow(showData)).unwrap();
      if (createdShow?.showId) {
        if (systemData.choreographyIdeas?.length > 0) {
          try {
            const dronesResponse = await api.get('/drones', { params: { status: 'active' } });
            const availableDrones = dronesResponse.data?.items || dronesResponse.data || [];
            const getDrones = (n) => Array.from({ length: n }, (_, i) => availableDrones[i % availableDrones.length]).filter(Boolean);
            const generatePathData = (startPos, endPos, duration = 60) => {
              const steps = 50;
              return Array.from({ length: steps + 1 }, (_, i) => {
                const t = i / steps;
                return { x: startPos.x + (endPos.x - startPos.x) * t, y: startPos.y + (endPos.y - startPos.y) * t, z: startPos.z + (endPos.z - startPos.z) * t, time: t * duration };
              });
            };
            for (let i = 0; i < systemData.choreographyIdeas.length; i++) {
              const idea = systemData.choreographyIdeas[i];
              const req = idea.droneCount || 10;
              const createdChoreo = await api.post('/choreographies', { showId: createdShow.showId, choreographyName: idea.name, durationSeconds: idea.durationSeconds || 60, droneCount: req, sceneOrder: i + 1, status: 'draft' });
              const choreographyId = createdChoreo.data?.choreographyId || createdChoreo.data?.id;
              const drones = getDrones(req);
              if (drones.length > 0) {
                const spacing = 10, rows = Math.ceil(Math.sqrt(req));
                const flightPaths = drones.map((drone, j) => {
                  const pos = idea.dronePositions?.[j] || { startPosition: { x: (j % rows) * spacing, y: 0, z: 10 + Math.floor(j / rows) * 5 }, endPosition: { x: (j % rows) * spacing + 5, y: 5, z: 15 + Math.floor(j / rows) * 5 }, maxAltitude: 20 };
                  return { droneId: drone.droneId, startPosition: pos.startPosition, endPosition: pos.endPosition, maxAltitude: pos.maxAltitude, pathDataJson: generatePathData(pos.startPosition, pos.endPosition, idea.durationSeconds || 60), collisionCheckStatus: 'pending' };
                });
                if (flightPaths.length > 0) await api.post('/flight-paths/bulk', { choreographyId, flightPaths });
              }
            }
          } catch (e) { console.error('Choreo creation error:', e); }
        }
        setChatMessages((prev) => prev.map((msg, idx) => idx === prev.length - 1 && msg.role === 'assistant' ? { ...msg, showId: createdShow.showId } : msg));
        navigate(`/choreography/show/${createdShow.showId}`);
        setChatOpen(false);
        dispatch(fetchShows());
      } else { alert('Шоу создано, но не удалось перейти.'); }
    } catch (e) { console.error(e); alert('Ошибка при создании шоу: ' + (e.message || 'Неизвестная ошибка')); }
    finally { setGenerating(false); }
  };

  const handleChatMessage = async (message) => {
    setChatMessages((prev) => [...prev, { role: 'user', content: message, timestamp: new Date().toISOString() }]);
    try {
      setGenerating(true);
      const result = await dispatch(generateShowWithAI({ prompt: message || 'Generate a creative drone light show', projectId: formData.projectId || null, showDate: formData.showDate || new Date().toISOString().split('T')[0], showTime: formData.showTime || '20:00:00', create: false })).unwrap();
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: result.userView || { showName: result.show?.showName, venue: result.show?.venue, durationSeconds: result.show?.durationSeconds, concept: result.show?.notes, choreographyIdeas: result.choreographyIdeas || [] },
        systemData: result.systemData || { showName: result.show?.showName, venue: result.show?.venue, durationSeconds: result.show?.durationSeconds, notes: result.show?.notes, choreographyIdeas: result.choreographyIdeas || [] },
        showId: result.show?.showId || null,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e.message || 'Failed to generate show.'}`, timestamp: new Date().toISOString() }]);
    } finally { setGenerating(false); }
  };

  const handleSubmit = async () => {
    try {
      const data = { ...formData, crowdSize: formData.crowdSize ? parseInt(formData.crowdSize) : null, durationSeconds: formData.durationSeconds ? parseInt(formData.durationSeconds) : 300 };
      if (editing) await dispatch(updateShow({ id: editing.showId, data })).unwrap();
      else await dispatch(createShow(data)).unwrap();
      handleClose(); dispatch(fetchShows());
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this show?')) {
      try { await dispatch(deleteShow(id)).unwrap(); dispatch(fetchShows()); } catch (e) { console.error(e); }
    }
  };
  const handleStartShow = async (id) => { try { await api.put(`/shows/${id}`, { status: 'in_progress' }); dispatch(fetchShows()); } catch (e) { console.error(e); } };
  const handleStopShow = async (id) => { try { await api.put(`/shows/${id}`, { status: 'completed' }); dispatch(fetchShows()); } catch (e) { console.error(e); } };

  const stats = [
    { label: 'Total', value: shows.length, color: 'var(--cyan)' },
    { label: 'Scheduled', value: shows.filter((s) => s.status === 'scheduled').length, color: 'var(--blue)' },
    { label: 'Live', value: shows.filter((s) => s.status === 'in_progress').length, color: 'var(--amber)' },
    { label: 'Completed', value: shows.filter((s) => s.status === 'completed').length, color: 'var(--green)' },
  ];

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Stats + buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <GlassCard key={s.label} style={{ flex: 1, minWidth: 100, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}><AnimCounter target={s.value} /></div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{s.label}</div>
          </GlassCard>
        ))}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleOpen()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 12, padding: '0 20px', height: '100%', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 20px rgba(80,200,255,0.35)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >＋ New Show</button>
          <button
            onClick={() => { setChatOpen(true); if (chatMessages.length === 0) setChatMessages([{ role: 'assistant', content: 'Привет! Я могу помочь создать световое шоу дронов. Опишите, какое шоу вы хотите.', timestamp: new Date().toISOString() }]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(160,100,255,0.15)', border: '1px solid rgba(160,100,255,0.3)', borderRadius: 12, padding: '0 20px', height: '100%', color: 'var(--purple)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(160,100,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(160,100,255,0.15)'; }}
          >✨ AI Chat</button>
        </div>
      </div>

      {/* Table */}
      <GlassCard style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Show Name', 'Project', 'Date / Time', 'Venue', 'Status', 'Duration', ''].map((h) => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shows.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No shows yet</td></tr>
            ) : shows.map((s, i) => (
              <tr key={s.showId}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.showName}</div>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text3)' }}>{s.project?.projectName || 'N/A'}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{s.showDate ? new Date(s.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{s.showTime || ''}</div>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text2)' }}>{s.venue || 'N/A'}</td>
                <td style={{ padding: '16px 20px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '16px 20px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>
                  {s.durationSeconds ? `${Math.floor(s.durationSeconds / 60)} min` : 'N/A'}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {s.status === 'scheduled' && (
                      <button onClick={() => handleStartShow(s.showId)} style={{ background: 'rgba(115,220,130,0.1)', border: '1px solid rgba(115,220,130,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--green)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} title="Start" onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(115,220,130,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(115,220,130,0.1)'}>▶</button>
                    )}
                    {s.status === 'in_progress' && (
                      <button onClick={() => handleStopShow(s.showId)} style={{ background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} title="Stop" onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.1)'}>■</button>
                    )}
                    <button onClick={() => navigate(`/choreography/show/${s.showId}`)} style={{ background: 'rgba(160,100,255,0.1)', border: '1px solid rgba(160,100,255,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--purple)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} title="Choreography" onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(160,100,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(160,100,255,0.1)'}>⚙</button>
                    <button onClick={() => handleOpen(s)} style={{ background: 'rgba(80,200,255,0.1)', border: '1px solid rgba(80,200,255,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} title="Edit" onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.1)'}>✎</button>
                    <button onClick={() => handleDelete(s.showId)} style={{ background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.2)', borderRadius: 8, padding: '5px 10px', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} title="Delete" onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.1)'}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Show form dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Show' : 'Create New Show'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" required label="Show Name" value={formData.showName} onChange={(e) => setFormData({ ...formData, showName: e.target.value })} />
          <TextField fullWidth margin="normal" select label="Project" value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} SelectProps={{ native: true }}>
            <option value="">Select Project</option>
            {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
          </TextField>
          <TextField fullWidth margin="normal" required label="Show Date" type="date" value={formData.showDate} onChange={(e) => setFormData({ ...formData, showDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="normal" required label="Show Time" type="time" value={formData.showTime} onChange={(e) => setFormData({ ...formData, showTime: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="normal" required label="Venue" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
          <TextField fullWidth margin="normal" label="Weather Conditions" value={formData.weatherConditions} onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })} />
          <TextField fullWidth margin="normal" label="Crowd Size" type="number" value={formData.crowdSize} onChange={(e) => setFormData({ ...formData, crowdSize: e.target.value })} />
          <TextField fullWidth margin="normal" required label="Duration (seconds)" type="number" value={formData.durationSeconds} onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })} />
          <TextField fullWidth margin="normal" select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} SelectProps={{ native: true }}>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </TextField>
          <TextField fullWidth margin="normal" label="Notes" multiline rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 22px', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 16px rgba(80,200,255,0.35)' }}>{editing ? 'Update' : 'Create'}</button>
        </DialogActions>
      </Dialog>

      {/* AI Chat dialog */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { height: '90vh', maxHeight: '90vh' } }}>
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AIChat
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            isLoading={generating}
            onClose={() => setChatOpen(false)}
            onConfirmShow={handleConfirmShow}
            lastShowData={chatMessages.filter((m) => m.role === 'assistant' && m.systemData).pop()?.systemData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ShowsPage;
