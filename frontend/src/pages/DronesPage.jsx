import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchDrones, createDrone, updateDrone, deleteDrone } from '../store/slices/droneSlice';

function DronesPage() {
  const dispatch = useDispatch();
  const { items: drones, loading } = useSelector((state) => state.drones);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: '',
    model: '',
    manufacturer: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'active',
    maxFlightHours: 1000,
  });

  useEffect(() => {
    if (!loading && drones.length === 0) {
      dispatch(fetchDrones());
    }
  }, [dispatch, loading, drones.length]);

  const handleOpen = (drone = null) => {
    if (drone) {
      setEditing(drone);
      setFormData(drone);
    } else {
      setEditing(null);
      setFormData({ 
        serialNumber: '', 
        model: '', 
        manufacturer: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'active',
        maxFlightHours: 1000,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (editing) {
      await dispatch(updateDrone({ id: editing.droneId, data: formData }));
    } else {
      await dispatch(createDrone(formData));
    }
    handleClose();
    dispatch(fetchDrones());
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this drone?')) {
      await dispatch(deleteDrone(id));
      dispatch(fetchDrones());
    }
  };

  const getStatusColor = (status) => {
    const statusStyles = {
      active: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd',
        fontWeight: 600,
      },
      maintenance: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      retired: {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: '1px solid #d1d5db',
        fontWeight: 600,
      },
      damaged: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
    };
    return statusStyles[status] || {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
      fontWeight: 600,
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Drones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Drone
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Serial Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drones.map((drone) => (
              <TableRow key={drone.droneId}>
                <TableCell>{drone.serialNumber}</TableCell>
                <TableCell>{drone.model}</TableCell>
                <TableCell>
                  <Chip
                    label={drone.status}
                    size="small"
                    sx={getStatusColor(drone.status)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(drone)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(drone.droneId)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 2 }}>
          {editing ? 'Edit Drone' : 'Add Drone'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            required
            label="Serial Number"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Purchase Date"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Max Flight Hours"
            type="number"
            value={formData.maxFlightHours}
            onChange={(e) => setFormData({ ...formData, maxFlightHours: parseFloat(e.target.value) })}
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
            <option value="damaged">Damaged</option>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DronesPage;
