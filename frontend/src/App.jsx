import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DronesPage from './pages/DronesPage';
import ShowsPage from './pages/ShowsPage';
import ProjectsPage from './pages/ProjectsPage';
import ClientsPage from './pages/ClientsPage';
import TelemetryPage from './pages/TelemetryPage';
import AlertsPage from './pages/AlertsPage';
import ChoreographyEditorPage from './pages/ChoreographyEditorPage';
import WebSocketStatus from './components/WebSocketStatus';

function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="drones" element={<DronesPage />} />
          <Route path="shows" element={<ShowsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="telemetry" element={<TelemetryPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="choreography/:id?" element={<ChoreographyEditorPage />} />
          <Route path="choreography/show/:showId" element={<ChoreographyEditorPage />} />
        </Route>
      </Routes>
      {isAuthenticated && <WebSocketStatus />}
    </>
  );
}

export default App;
