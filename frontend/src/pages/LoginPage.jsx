import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import { login, register } from '../store/slices/authSlice';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tab, setTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const validateForm = () => {
    const errors = {};

    if (tab === 0) {
      // Login validation
      if (!username.trim()) {
        errors.username = 'Username is required';
      }
      if (!password) {
        errors.password = 'Password is required';
      }
    } else {
      // Register validation
      if (!username.trim()) {
        errors.username = 'Username is required';
      } else if (username.trim().length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
      
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      }
      
      if (!email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      if (tab === 0) {
        await dispatch(login({ username, password })).unwrap();
      } else {
        await dispatch(register({ username, email, password, fullName })).unwrap();
      }
      navigate('/');
    } catch (err) {
      // Error is handled by Redux and displayed in error state
      console.error('Auth error:', err);
    }
  };

  const getFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      return validationErrors[fieldName];
    }
    
    // Parse backend validation errors
    if (error && typeof error === 'object' && error.errors) {
      const backendError = error.errors.find(e => e.path === fieldName);
      if (backendError) {
        return backendError.msg || `Invalid ${fieldName}`;
      }
    }
    
    return null;
  };

  const getGeneralError = () => {
    if (error) {
      if (typeof error === 'string') {
        return error;
      }
      if (error.error) {
        return error.error;
      }
      if (error.message) {
        return error.message;
      }
    }
    return null;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          sx={{ 
            p: 4, 
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Drone Light Show Management
          </Typography>
          <Tabs value={tab} onChange={(e, v) => {
            setTab(v);
            setValidationErrors({});
            setUsername('');
            setEmail('');
            setPassword('');
            setFullName('');
          }} sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          
          {getGeneralError() && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getGeneralError()}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {tab === 0 ? (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (validationErrors.username) {
                      setValidationErrors({ ...validationErrors, username: null });
                    }
                  }}
                  error={!!getFieldError('username')}
                  helperText={getFieldError('username')}
                  disabled={loading}
                  autoComplete="username"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: null });
                    }
                  }}
                  error={!!getFieldError('password')}
                  helperText={getFieldError('password')}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </>
            ) : (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (validationErrors.username) {
                      setValidationErrors({ ...validationErrors, username: null });
                    }
                  }}
                  error={!!getFieldError('username')}
                  helperText={getFieldError('username') || 'Minimum 3 characters'}
                  disabled={loading}
                  autoComplete="username"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (validationErrors.fullName) {
                      setValidationErrors({ ...validationErrors, fullName: null });
                    }
                  }}
                  error={!!getFieldError('fullName')}
                  helperText={getFieldError('fullName')}
                  disabled={loading}
                  autoComplete="name"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: null });
                    }
                  }}
                  error={!!getFieldError('email')}
                  helperText={getFieldError('email')}
                  disabled={loading}
                  autoComplete="email"
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: null });
                    }
                  }}
                  error={!!getFieldError('password')}
                  helperText={getFieldError('password') || 'Minimum 6 characters'}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                tab === 0 ? 'Login' : 'Register'
              )}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
