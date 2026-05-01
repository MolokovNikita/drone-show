import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { fetchProjects, createProject, updateProject, deleteProject } from '../store/slices/projectSlice';
import { fetchClients } from '../store/slices/clientSlice';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import AnimCounter from '../components/AnimCounter';

const emptyForm = { projectName: '', clientId: '', status: 'planning', startDate: '', endDate: '', budget: '', location: '', description: '' };

function ProjectsPage() {
  const dispatch = useDispatch();
  const { items: projects } = useSelector((state) => state.projects);
  const { items: clients } = useSelector((state) => state.clients);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { dispatch(fetchProjects()); dispatch(fetchClients()); }, [dispatch]);

  const handleOpen = (project = null) => {
    setEditing(project);
    setFormData(project ? {
      projectName: project.projectName || '', clientId: project.clientId || '',
      status: project.status || 'planning', startDate: project.startDate || '',
      endDate: project.endDate || '', budget: project.budget || '',
      location: project.location || '', description: project.description || '',
    } : { ...emptyForm });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = { ...formData, budget: formData.budget ? parseFloat(formData.budget) : null };
      if (editing) await dispatch(updateProject({ id: editing.projectId, data })).unwrap();
      else await dispatch(createProject(data)).unwrap();
      setOpen(false); dispatch(fetchProjects());
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try { await dispatch(deleteProject(id)).unwrap(); dispatch(fetchProjects()); }
      catch (e) { console.error(e); }
    }
  };

  const stats = [
    { label: 'Total', value: projects.length, color: 'var(--cyan)' },
    { label: 'Active', value: projects.filter((p) => ['planning', 'design', 'testing', 'approved'].includes(p.status)).length, color: 'var(--green)' },
    { label: 'Completed', value: projects.filter((p) => p.status === 'completed').length, color: 'var(--purple)' },
  ];

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Stats + button */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <GlassCard key={s.label} style={{ flex: 1, minWidth: 120, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}><AnimCounter target={s.value} /></div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
          </GlassCard>
        ))}
        <button
          onClick={() => handleOpen()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 12, padding: '0 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 20px rgba(80,200,255,0.35)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(80,200,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,200,255,0.35)'; }}
        >＋ New Project</button>
      </div>

      {/* Project cards grid */}
      {projects.length === 0 ? (
        <GlassCard style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No projects yet</GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {projects.map((p, i) => (
            <GlassCard key={p.projectId} style={{ padding: 22, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.projectName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.client?.companyName || 'No client'}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Budget</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                    {p.budget ? `$${parseFloat(p.budget).toLocaleString()}` : '—'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Deadline</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                    {p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
              {p.location && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>📍 {p.location}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleOpen(p)} style={{ background: 'rgba(80,200,255,0.1)', border: '1px solid rgba(80,200,255,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.1)'}>Edit</button>
                <button onClick={() => handleDelete(p.projectId)} style={{ background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.1)'}>Delete</button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" required label="Project Name" value={formData.projectName} onChange={(e) => setFormData({ ...formData, projectName: e.target.value })} />
          <TextField fullWidth margin="normal" select label="Client" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} SelectProps={{ native: true }}>
            <option value="">Select Client</option>
            {clients.map((c) => <option key={c.clientId} value={c.clientId}>{c.companyName}</option>)}
          </TextField>
          <TextField fullWidth margin="normal" select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} SelectProps={{ native: true }}>
            <option value="planning">Planning</option>
            <option value="design">Design</option>
            <option value="testing">Testing</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </TextField>
          <TextField fullWidth margin="normal" label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="normal" label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="normal" label="Budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
          <TextField fullWidth margin="normal" label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          <TextField fullWidth margin="normal" label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 22px', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 16px rgba(80,200,255,0.35)' }}>{editing ? 'Update' : 'Create'}</button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ProjectsPage;
