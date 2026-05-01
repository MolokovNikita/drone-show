import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTelemetry, fetchLatestTelemetry, addTelemetryData } from '../store/slices/telemetrySlice';
import { fetchDrones } from '../store/slices/droneSlice';
import { fetchShows } from '../store/slices/showSlice';
import { fetchChoreographies } from '../store/slices/choreographySlice';
import websocketService from '../services/websocket';
import DroneVisualization3D from '../components/DroneVisualization3D';
import GlassCard from '../components/GlassCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function MetricCard({ label, value, unit, color, pct }) {
  return (
    <GlassCard glow={color.replace('var(--', 'rgba(').replace(')', ',0.25)')} style={{ padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 700, color, fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 10 }}>
        {value}<span style={{ fontSize: 16, color: 'var(--text3)', fontWeight: 400 }}>{unit}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(pct, 100)}%`, background: color,
          borderRadius: 4, transition: 'width 0.8s ease',
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontFamily: 'var(--mono)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ fontSize: 13, color: p.stroke, fontFamily: 'var(--mono)' }}>
          {p.name}: {p.value?.toFixed ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

function TelemetryPage() {
  const dispatch = useDispatch();
  const { items: telemetry, latest } = useSelector((state) => state.telemetry);
  const { items: drones, loading: dronesLoading } = useSelector((state) => state.drones);
  const { items: shows, loading: showsLoading } = useSelector((state) => state.shows);
  const { items: choreographies } = useSelector((state) => state.choreographies);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    dispatch(fetchShows());
    if (!dronesLoading && drones.length === 0) dispatch(fetchDrones());
    dispatch(fetchTelemetry({ limit: 100 }));

    const handleTelemetry = (data) => dispatch(addTelemetryData(data));
    const connectWS = () => {
      try { websocketService.connect(); websocketService.on('telemetry', handleTelemetry); }
      catch (e) { console.warn('WebSocket:', e); }
    };
    const tid = setTimeout(connectWS, 1000);
    return () => { clearTimeout(tid); websocketService.off('telemetry', handleTelemetry); };
  }, [dispatch, dronesLoading, drones.length]);

  useEffect(() => {
    if (selectedShow && shows.length > 0 && !shows.some((s) => s.showId === parseInt(selectedShow))) setSelectedShow(null);
  }, [shows, selectedShow]);

  useEffect(() => { if (selectedDrone) dispatch(fetchLatestTelemetry(selectedDrone)); }, [selectedDrone, dispatch]);
  useEffect(() => { if (selectedShow) dispatch(fetchChoreographies({ showId: selectedShow })); }, [selectedShow, dispatch]);

  const latestData = selectedDrone ? latest[selectedDrone] : null;
  const droneTelemetry = telemetry.filter((t) => !selectedDrone || t.droneId === selectedDrone);

  const chartData = droneTelemetry.slice(0, 50).map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    battery: t.batteryLevel || t.batteryPercentage,
    altitude: t.altitude,
    speed: t.speed,
  }));

  const liveMetrics = latestData ? [
    { label: 'Battery', value: latestData.batteryLevel || latestData.batteryPercentage || 0, unit: '%', color: 'var(--green)', pct: latestData.batteryLevel || latestData.batteryPercentage || 0 },
    { label: 'Altitude', value: latestData.altitude || 0, unit: 'm', color: 'var(--cyan)', pct: ((latestData.altitude || 0) / 200) * 100 },
    { label: 'Speed', value: parseFloat(latestData.speed || 0).toFixed(1), unit: 'm/s', color: 'var(--amber)', pct: ((latestData.speed || 0) / 20) * 100 },
    { label: 'Signal', value: latestData.gpsSignalStrength || latestData.signalStrength || 0, unit: '%', color: 'var(--purple)', pct: latestData.gpsSignalStrength || latestData.signalStrength || 0 },
  ] : null;

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '9px 14px', color: 'var(--text)', fontSize: 13,
    outline: 'none', fontFamily: 'var(--font)', cursor: 'pointer', minWidth: 180,
  };

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={selectStyle} value={selectedDrone || ''} onChange={(e) => setSelectedDrone(e.target.value || null)}>
          <option value="">All Drones</option>
          {drones.map((d) => <option key={d.droneId} value={d.droneId}>{d.serialNumber}</option>)}
        </select>
        <select style={selectStyle} value={selectedShow || ''} onChange={(e) => setSelectedShow(e.target.value || null)}>
          <option value="">No Show</option>
          {shows.map((s) => <option key={s.showId} value={s.showId}>{s.showName}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 1.5s infinite', display: 'block' }} />
          STREAMING LIVE
        </div>
      </div>

      {/* Live metrics */}
      {liveMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {liveMetrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>
      )}
      {!liveMetrics && selectedDrone && (
        <GlassCard style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No telemetry data for selected drone
        </GlassCard>
      )}

      {/* Chart */}
      <GlassCard style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Telemetry History</div>
        {chartData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>No telemetry data</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 11, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font)', color: 'rgba(255,255,255,0.5)' }} />
              <Line type="monotone" dataKey="battery" name="Battery %" stroke="var(--green)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="altitude" name="Altitude m" stroke="var(--cyan)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="speed" name="Speed m/s" stroke="var(--amber)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </GlassCard>

      {/* 3D Visualization */}
      <GlassCard style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>3D Visualization</div>
        <DroneVisualization3D
          drones={selectedShow ? (() => {
            const showChoreographies = choreographies.filter((c) => c.showId === parseInt(selectedShow));
            if (showChoreographies.length === 0) return [];
            const showDroneIds = new Set();
            let totalDroneCount = 0;
            showChoreographies.forEach((choreo) => {
              if (choreo.flightPaths?.length > 0) {
                choreo.flightPaths.forEach((fp) => {
                  const droneId = fp.droneId || fp.drone?.droneId;
                  if (droneId) showDroneIds.add(droneId);
                });
              } else if (choreo.droneCount > 0) totalDroneCount += choreo.droneCount;
            });
            if (showDroneIds.size > 0) return drones.filter((d) => showDroneIds.has(d.droneId));
            if (totalDroneCount > 0) return drones.slice(0, Math.min(totalDroneCount, drones.length));
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
      </GlassCard>
    </div>
  );
}

export default TelemetryPage;
