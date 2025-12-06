import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchTelemetry, fetchLatestTelemetry } from '../store/slices/telemetrySlice';
import { fetchDrones } from '../store/slices/droneSlice';
import { fetchShows } from '../store/slices/showSlice';
import { fetchChoreographies } from '../store/slices/choreographySlice';
import websocketService from '../services/websocket';
import { addTelemetryData } from '../store/slices/telemetrySlice';
import DroneVisualization3D from '../components/DroneVisualization3D';

function TelemetryPage() {
  const dispatch = useDispatch();
  const { items: telemetry, latest } = useSelector((state) => state.telemetry);
  const { items: drones, loading: dronesLoading } = useSelector((state) => state.drones);
  const { items: shows, loading: showsLoading } = useSelector((state) => state.shows);
  const { items: choreographies } = useSelector((state) => state.choreographies);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    // Always fetch shows to get latest data
    dispatch(fetchShows());
    
    // Only fetch if not already loading and data is empty
    if (!dronesLoading && drones.length === 0) {
      dispatch(fetchDrones());
    }
    // Telemetry can be fetched more frequently
    dispatch(fetchTelemetry({ limit: 100 }));

    // Connect WebSocket only if backend is available
    const connectWebSocket = () => {
      try {
        websocketService.connect();
        websocketService.on('telemetry', (data) => {
          dispatch(addTelemetryData(data));
        });
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
      }
    };

    // Try to connect after a short delay to ensure backend is ready
    const timeoutId = setTimeout(connectWebSocket, 1000);

    return () => {
      clearTimeout(timeoutId);
      websocketService.off('telemetry');
      // Don't disconnect completely, just remove listeners
      // websocketService.disconnect();
    };
  }, [dispatch, dronesLoading, drones.length]);

  // Update selectedShow if it no longer exists in shows list
  useEffect(() => {
    if (selectedShow && shows.length > 0) {
      const showExists = shows.some(s => s.showId === parseInt(selectedShow));
      if (!showExists) {
        console.log('🔄 [TelemetryPage] Выбранное шоу больше не существует, сбрасываю выбор');
        setSelectedShow(null);
      }
    }
  }, [shows, selectedShow]);

  useEffect(() => {
    if (selectedDrone) {
      dispatch(fetchLatestTelemetry(selectedDrone));
    }
  }, [selectedDrone, dispatch]);

  useEffect(() => {
    if (selectedShow) {
      dispatch(fetchChoreographies({ showId: selectedShow }));
    }
  }, [selectedShow, dispatch]);

  // Update selectedShow if it no longer exists in shows list (force update when shows change)
  useEffect(() => {
    if (selectedShow && shows.length > 0) {
      const showExists = shows.some(s => s.showId === parseInt(selectedShow));
      if (!showExists) {
        console.log('🔄 [TelemetryPage] Выбранное шоу больше не существует, сбрасываю выбор');
        setSelectedShow(null);
      }
    }
  }, [shows, selectedShow]);

  const latestData = selectedDrone ? latest[selectedDrone] : null;
  const droneTelemetry = telemetry.filter((t) => !selectedDrone || t.droneId === selectedDrone);

  const chartData = droneTelemetry.slice(0, 50).map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    battery: t.batteryLevel || t.batteryPercentage,
    altitude: t.altitude,
    speed: t.speed,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Telemetry
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Show</InputLabel>
            <Select
              value={selectedShow || ''}
              onChange={(e) => setSelectedShow(e.target.value)}
              label="Select Show"
            >
              <MenuItem value="">No Show</MenuItem>
              {shows.map((show) => (
                <MenuItem key={show.showId} value={show.showId}>
                  {show.showName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Drone</InputLabel>
            <Select
              value={selectedDrone || ''}
              onChange={(e) => setSelectedDrone(e.target.value)}
              label="Select Drone"
            >
              <MenuItem value="">All Drones</MenuItem>
              {drones.map((drone) => (
                <MenuItem key={drone.droneId} value={drone.droneId}>
                  {drone.serialNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {latestData && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Latest Telemetry - {drones.find((d) => d.droneId === selectedDrone)?.serialNumber}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography>Battery: {latestData.batteryLevel || latestData.batteryPercentage}%</Typography>
                  <Typography>Altitude: {latestData.altitude}m</Typography>
                  <Typography>Speed: {latestData.speed}m/s</Typography>
                  <Typography>Signal: {latestData.gpsSignalStrength || latestData.signalStrength}%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Telemetry Chart
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="battery" stroke="#2563eb" />
                <Line type="monotone" dataKey="altitude" stroke="#10b981" />
                <Line type="monotone" dataKey="speed" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <DroneVisualization3D 
            drones={selectedShow ? (() => {
              // Filter drones based on selected show's choreographies
              const showChoreographies = choreographies.filter((c) => c.showId === parseInt(selectedShow));
              if (showChoreographies.length === 0) return [];
              
              // Get drone IDs from flight paths of all choreographies in this show
              const showDroneIds = new Set();
              let totalDroneCount = 0;
              
              showChoreographies.forEach((choreo) => {
                if (choreo.flightPaths && choreo.flightPaths.length > 0) {
                  choreo.flightPaths.forEach((fp) => {
                    const droneId = fp.droneId || fp.drone?.droneId;
                    if (droneId) showDroneIds.add(droneId);
                  });
                } else if (choreo.droneCount > 0) {
                  totalDroneCount += choreo.droneCount;
                }
              });
              
              // If we have flight paths, filter by drone IDs
              if (showDroneIds.size > 0) {
                return drones.filter((d) => showDroneIds.has(d.droneId));
              }
              
              // If no flight paths but we have droneCount, show first N drones
              if (totalDroneCount > 0) {
                return drones.slice(0, Math.min(totalDroneCount, drones.length));
              }
              
              return [];
            })() : []} 
            telemetry={latest}
            showId={selectedShow}
            choreography={selectedShow ? choreographies.find((c) => c.showId === parseInt(selectedShow)) : null}
            flightPaths={selectedShow ? choreographies
              .filter((c) => c.showId === parseInt(selectedShow))
              .flatMap((c) => c.flightPaths || [])
              .map((fp) => ({
                droneId: fp.droneId || fp.drone?.droneId,
                pathId: fp.pathId,
                startPosition: fp.startPosition,
                endPosition: fp.endPosition,
                maxAltitude: fp.maxAltitude,
                pathDataJson: fp.pathDataJson || fp.pathData,
              }))
              .filter((fp) => fp.droneId) : []}
            showName={selectedShow ? shows.find((s) => s.showId === parseInt(selectedShow))?.showName : null}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default TelemetryPage;
