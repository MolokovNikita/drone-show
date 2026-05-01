import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert,
} from '@mui/material';
import { fetchDrones, createDrone, updateDrone, deleteDrone } from '../store/slices/droneSlice';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';

const emptyForm = {
  serialNumber: '', model: '', manufacturer: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  status: 'active', maxFlightHours: 1000,
};

function DronesPage() {
  const dispatch = useDispatch();
  const { items: drones, loading } = useSelector((state) => state.drones);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && drones.length === 0) dispatch(fetchDrones());
  }, [dispatch, loading, drones.length]);

  const handleOpen = (drone = null) => {
    setEditing(drone);
    setFormData(drone ? { ...drone } : { ...emptyForm });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await dispatch(updateDrone({ id: editing.droneId, data: formData }));
    } else {
      await dispatch(createDrone(formData));
    }
    setOpen(false);
    dispatch(fetchDrones());
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this drone?')) {
      await dispatch(deleteDrone(id));
      dispatch(fetchDrones());
    }
  };

  const filtered = drones.filter((d) =>
    !search || d.serialNumber?.toLowerCase().includes(search.toLowerCase()) || d.model?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search drones..."
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '9px 16px', color: 'var(--text)', fontSize: 13,
            flex: 1, maxWidth: 320, outline: 'none', fontFamily: 'var(--font)',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(80,200,255,0.4)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          onClick={() => handleOpen()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #50c8ff, #6b8fff)',
            border: 'none', borderRadius: 10, padding: '9px 20px', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
            boxShadow: '0 4px 20px rgba(80,200,255,0.35)', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(80,200,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,200,255,0.35)'; }}
        >
          ＋ Add Drone
        </button>
      </div>

      {/* Table */}
      <GlassCard style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Serial Number', 'Model', 'Manufacturer', 'Status', 'Max Hours', ''].map((h) => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  {drones.length === 0 ? 'No drones yet. Add one to get started.' : 'No results for your search.'}
                </td>
              </tr>
            )}
            {filtered.map((d, i) => (
              <tr
                key={d.droneId}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--cyan)' }}>{d.serialNumber}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text)' }}>{d.model}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)' }}>{d.manufacturer}</td>
                <td style={{ padding: '14px 20px' }}><StatusBadge status={d.status} /></td>
                <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{d.maxFlightHours}h</td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpen(d)}
                      style={{ background: 'rgba(80,200,255,0.1)', border: '1px solid rgba(80,200,255,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.1)'}
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(d.droneId)}
                      style={{ background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.1)'}
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Drone' : 'Add New Drone'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth margin="normal" label="Serial Number" value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
          <TextField fullWidth margin="normal" label="Model" value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
          <TextField fullWidth margin="normal" label="Manufacturer" value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
          <TextField fullWidth margin="normal" label="Purchase Date" type="date" value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            InputLabelProps={{ shrink: true }} />
          <TextField fullWidth margin="normal" label="Max Flight Hours" type="number" value={formData.maxFlightHours}
            onChange={(e) => setFormData({ ...formData, maxFlightHours: parseFloat(e.target.value) })} />
          <TextField fullWidth margin="normal" select label="Status" value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            SelectProps={{ native: true }}>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
            <option value="damaged">Damaged</option>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 22px', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 16px rgba(80,200,255,0.35)' }}>
            {editing ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DronesPage;
