import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { fetchClients, createClient, updateClient, deleteClient, clearError } from '../store/slices/clientSlice';
import GlassCard from '../components/GlassCard';

const emptyForm = { companyName: '', contactPerson: '', email: '', phone: '', address: '', notes: '' };

function ClientsPage() {
  const dispatch = useDispatch();
  const { items: clients, loading, error } = useSelector((state) => state.clients);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewClient, setViewClient] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchClients({ ...(search.trim() && { search: search.trim() }) })), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, dispatch]);

  const openCreate = () => { setEditing(null); setFormData(emptyForm); setFormOpen(true); dispatch(clearError()); };
  const openEdit = (c) => {
    setEditing(c);
    setFormData({ companyName: c.companyName || '', contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' });
    setFormOpen(true); dispatch(clearError());
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); setFormData(emptyForm); };

  const handleSubmit = async () => {
    const { companyName, contactPerson, email, phone } = formData;
    if (!companyName?.trim() || !contactPerson?.trim() || !email?.trim() || !phone?.trim()) return;
    const payload = { companyName: formData.companyName.trim(), contactPerson: formData.contactPerson.trim(), email: formData.email.trim(), phone: formData.phone.trim(), address: formData.address?.trim() || null, notes: formData.notes?.trim() || null };
    try {
      if (editing) await dispatch(updateClient({ id: editing.clientId, data: payload })).unwrap();
      else await dispatch(createClient(payload)).unwrap();
      closeForm();
      dispatch(fetchClients({ ...(search.trim() && { search: search.trim() }) }));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? Projects referencing this client may be affected.')) return;
    try { await dispatch(deleteClient(id)).unwrap(); dispatch(fetchClients({ ...(search.trim() && { search: search.trim() }) })); }
    catch (e) { console.error(e); }
  };

  const formValid = formData.companyName?.trim() && formData.contactPerson?.trim() && formData.email?.trim() && formData.phone?.trim();

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search clients..."
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '9px 16px', color: 'var(--text)', fontSize: 13,
            flex: 1, maxWidth: 320, outline: 'none', fontFamily: 'var(--font)', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(80,200,255,0.4)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 10, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', boxShadow: '0 4px 20px rgba(80,200,255,0.35)', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(80,200,255,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(80,200,255,0.35)'; }}
        >＋ New Client</button>
      </div>

      {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => dispatch(clearError())}>{typeof error === 'string' ? error : error?.message || 'Request failed'}</Alert>}

      {/* Table */}
      <GlassCard style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Company', 'Contact', 'Email', 'Phone', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No clients found</td></tr>
              ) : clients.map((c, i) => (
                <tr key={c.clientId}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(160,100,255,0.3), rgba(80,200,255,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--purple)', flexShrink: 0 }}>
                        {c.companyName?.[0]}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.companyName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)' }}>{c.contactPerson}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{c.email}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{c.phone}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewClient(c)} style={{ background: 'rgba(80,200,255,0.1)', border: '1px solid rgba(80,200,255,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(80,200,255,0.1)'}>View</button>
                      <button onClick={() => openEdit(c)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 12px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Edit</button>
                      <button onClick={() => handleDelete(c.clientId)} style={{ background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.2)', borderRadius: 8, padding: '5px 12px', color: 'var(--red)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220,80,80,0.1)'}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* View dialog */}
      <Dialog open={Boolean(viewClient)} onClose={() => setViewClient(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Client Details</DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {viewClient && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
              {[['Company', viewClient.companyName], ['Contact', viewClient.contactPerson], ['Email', viewClient.email], ['Phone', viewClient.phone], ['Address', viewClient.address || '—'], ['Notes', viewClient.notes || '—']].map(([k, v]) => (
                <div key={k}><span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k}</span><div style={{ fontSize: 14, color: 'var(--text)', marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <button onClick={() => setViewClient(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 20px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)' }}>Close</button>
          {viewClient && <button onClick={() => { const c = viewClient; setViewClient(null); openEdit(c); }} style={{ background: 'linear-gradient(135deg, #50c8ff, #6b8fff)', border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>Edit</button>}
        </DialogActions>
      </Dialog>

      {/* Form dialog */}
      <Dialog open={formOpen} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Client' : 'New Client'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" required label="Company name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
          <TextField fullWidth margin="normal" required label="Contact person" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
          <TextField fullWidth margin="normal" required type="email" label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <TextField fullWidth margin="normal" required label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <TextField fullWidth margin="normal" label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <TextField fullWidth margin="normal" label="Notes" multiline rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <button onClick={closeForm} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 22px', color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!formValid} style={{ background: formValid ? 'linear-gradient(135deg, #50c8ff, #6b8fff)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: formValid ? 'pointer' : 'default', fontFamily: 'var(--font)', boxShadow: formValid ? '0 4px 16px rgba(80,200,255,0.35)' : 'none' }}>{editing ? 'Save' : 'Create'}</button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ClientsPage;
