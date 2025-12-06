import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import droneReducer from './slices/droneSlice';
import showReducer from './slices/showSlice';
import projectReducer from './slices/projectSlice';
import telemetryReducer from './slices/telemetrySlice';
import alertReducer from './slices/alertSlice';
import clientReducer from './slices/clientSlice';
import choreographyReducer from './slices/choreographySlice';
import flightPathReducer from './slices/flightPathSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    drones: droneReducer,
    shows: showReducer,
    projects: projectReducer,
    telemetry: telemetryReducer,
    alerts: alertReducer,
    clients: clientReducer,
    choreographies: choreographyReducer,
    flightPaths: flightPathReducer,
  },
});

