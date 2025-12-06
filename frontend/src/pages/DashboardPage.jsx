import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  FlightTakeoff as DroneIcon,
  TheaterComedy as ShowIcon,
  Folder as ProjectIcon,
  Notifications as AlertIcon,
} from '@mui/icons-material';
import { fetchDrones } from '../store/slices/droneSlice';
import { fetchShows } from '../store/slices/showSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { fetchAlerts } from '../store/slices/alertSlice';

function DashboardPage() {
  const dispatch = useDispatch();
  const { items: drones } = useSelector((state) => state.drones);
  const { items: shows } = useSelector((state) => state.shows);
  const { items: projects } = useSelector((state) => state.projects);
  const { items: alerts } = useSelector((state) => state.alerts);

  useEffect(() => {
    // Only fetch if data is not already loaded
    if (drones.length === 0) {
      dispatch(fetchDrones());
    }
    if (shows.length === 0) {
      dispatch(fetchShows());
    }
    if (projects.length === 0) {
      dispatch(fetchProjects());
    }
    if (alerts.length === 0) {
      dispatch(fetchAlerts({ status: 'active' }));
    }
  }, [dispatch, drones.length, shows.length, projects.length, alerts.length]);

  const stats = [
    {
      title: 'Total Drones',
      value: drones.length,
      icon: <DroneIcon />,
      color: '#0ea5e9',
      bgColor: '#f0f9ff',
      glowColor: 'rgba(14, 165, 233, 0.3)',
    },
    {
      title: 'Active Shows',
      value: shows.filter((s) => s.status === 'in_progress').length,
      icon: <ShowIcon />,
      color: '#10b981',
      bgColor: '#f0fdf4',
      glowColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      title: 'Projects',
      value: projects.length,
      icon: <ProjectIcon />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      glowColor: 'rgba(245, 158, 11, 0.3)',
    },
    {
      title: 'Active Alerts',
      value: alerts.length,
      icon: <AlertIcon />,
      color: '#ef4444',
      bgColor: '#fef2f2',
      glowColor: 'rgba(239, 68, 68, 0.3)',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          mb: 3,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      background: stat.bgColor,
                      borderRadius: '12px',
                      p: 1.5,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 20px 0 ${stat.glowColor}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& svg': {
                        fontSize: 28,
                        color: stat.color,
                      },
                      '&:hover': {
                        boxShadow: `0 6px 30px 0 ${stat.glowColor}`,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        color: '#0f172a',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default DashboardPage;
