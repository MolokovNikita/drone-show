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
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as ProjectIcon,
} from '@mui/icons-material';
import { fetchProjects, createProject, updateProject, deleteProject } from '../store/slices/projectSlice';
import { fetchClients } from '../store/slices/clientSlice';

function ProjectsPage() {
  const dispatch = useDispatch();
  const { items: projects, loading } = useSelector((state) => state.projects);
  const { items: clients } = useSelector((state) => state.clients);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    clientId: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchClients());
  }, [dispatch]);

  const handleOpen = (project = null) => {
    if (project) {
      setEditing(project);
      setFormData({
        projectName: project.projectName || '',
        clientId: project.clientId || '',
        status: project.status || 'planning',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        budget: project.budget || '',
        location: project.location || '',
        description: project.description || '',
      });
    } else {
      setEditing(null);
      setFormData({
        projectName: '',
        clientId: '',
        status: 'planning',
        startDate: '',
        endDate: '',
        budget: '',
        location: '',
        description: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };
      
      if (editing) {
        await dispatch(updateProject({ id: editing.projectId, data: submitData })).unwrap();
      } else {
        await dispatch(createProject(submitData)).unwrap();
      }
      handleClose();
      dispatch(fetchProjects());
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dispatch(deleteProject(id)).unwrap();
        dispatch(fetchProjects());
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const statusStyles = {
      planning: {
        backgroundColor: '#e0e7ff',
        color: '#3730a3',
        border: '1px solid #a5b4fc',
        fontWeight: 600,
      },
      design: {
        backgroundColor: '#fce7f3',
        color: '#9f1239',
        border: '1px solid #f9a8d4',
        fontWeight: 600,
      },
      testing: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      approved: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        border: '1px solid #6ee7b7',
        fontWeight: 600,
      },
      completed: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd',
        fontWeight: 600,
      },
      cancelled: {
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

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['planning', 'design', 'testing', 'approved'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ProjectIcon sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ProjectIcon sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ProjectIcon sx={{ fontSize: 40, color: '#f59e0b', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.projectId}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {project.projectName}
                  </Typography>
                  {project.description && (
                    <Typography variant="caption" color="text.secondary">
                      {project.description.substring(0, 50)}...
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{project.client?.companyName || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    size="small"
                    sx={getStatusColor(project.status)}
                  />
                </TableCell>
                <TableCell>
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {project.budget
                    ? `$${parseFloat(project.budget).toLocaleString()}`
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(project)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(project.projectId)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editing ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            required
            label="Project Name"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Client"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client.clientId} value={client.clientId}>
                {client.companyName}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="planning">Planning</option>
            <option value="design">Design</option>
            <option value="testing">Testing</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProjectsPage;
