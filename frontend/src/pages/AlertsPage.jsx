import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import { fetchAlerts, acknowledgeAlert } from '../store/slices/alertSlice';

function AlertsPage() {
  const dispatch = useDispatch();
  const { items: alerts } = useSelector((state) => state.alerts);

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const handleAcknowledge = async (id) => {
    await dispatch(acknowledgeAlert(id));
    dispatch(fetchAlerts());
  };

  const getSeverityColor = (severity) => {
    const severityStyles = {
      info: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        border: '1px solid #93c5fd',
        fontWeight: 600,
      },
      warning: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
      critical: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
    };
    return severityStyles[severity] || {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
      fontWeight: 600,
    };
  };

  const getStatusColor = (status) => {
    const statusStyles = {
      active: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
      acknowledged: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      resolved: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        border: '1px solid #6ee7b7',
        fontWeight: 600,
      },
      dismissed: {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        border: '1px solid #d1d5db',
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
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Drone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.alertId}>
                <TableCell>{alert.alertType}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.severity}
                    size="small"
                    sx={getSeverityColor(alert.severity)}
                  />
                </TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>{alert.drone?.serialNumber || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.resolved ? 'Resolved' : 'Active'}
                    size="small"
                    sx={getStatusColor(alert.resolved ? 'resolved' : 'active')}
                  />
                </TableCell>
                <TableCell>
                  {new Date(alert.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {!alert.resolved && (
                    <Button
                      size="small"
                      onClick={() => handleAcknowledge(alert.alertId)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AlertsPage;
