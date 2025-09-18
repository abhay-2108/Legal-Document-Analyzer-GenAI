import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  Chip,
  Divider,
} from '@mui/material';
import {
  Gavel,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Shield,
  CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'demo123'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Animation sequence on mount
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationStep(1), 200);
    const timer2 = setTimeout(() => setAnimationStep(2), 600);
    const timer3 = setTimeout(() => setAnimationStep(3), 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData);
      if (result.success) {
        toast.success('Welcome back! Login successful.');
      } else {
        toast.error(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      toast.error('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (userType) => {
    const demoCredentials = {
      user: { email: 'demo@example.com', password: 'demo123' },
      admin: { email: 'admin@example.com', password: 'admin123' }
    };
    
    setFormData(demoCredentials[userType]);
    toast.success(`${userType === 'admin' ? 'Admin' : 'User'} credentials loaded!`);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
            <Gavel sx={{ fontSize: 30 }} />
          </Avatar>
        </motion.div>
      </Box>
    );
  };

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
      
      <Container maxWidth="md">
        <MotionPaper
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Header Section */}
          <Fade in={animationStep >= 1} timeout={800}>
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #9c27b0 100%)',
                color: 'white',
                position: 'relative',
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: { xs: 60, md: 80 },
                    height: { xs: 60, md: 80 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    margin: '0 auto 20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <Gavel sx={{ fontSize: { xs: 30, md: 40 } }} />
                </Avatar>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    letterSpacing: '-0.02em'
                  }}
                >
                  Legal Document Analyzer
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.95,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  🔒 Secure AI-powered legal document analysis
                </Typography>
              </motion.div>
            </Box>
          </Fade>

          {/* Form Section */}
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Slide in={animationStep >= 2} direction="up" timeout={600}>
              <Box>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{ 
                    textAlign: 'center', 
                    mb: 3, 
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Welcome Back
                </Typography>

                <AnimatePresence>
                  {Object.keys(errors).length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert 
                        severity="error" 
                        sx={{ mb: 2, borderRadius: 2 }}
                        onClose={() => setErrors({})}
                      >
                        Please fix the following errors:
                        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                          {Object.values(errors).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </Box>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color={errors.email ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color={errors.password ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  />

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                        boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #7b1fa2 100%)',
                          boxShadow: '0 6px 25px rgba(25, 118, 210, 0.5)',
                        },
                        '&:disabled': {
                          background: 'grey.300',
                        },
                      }}
                    >
                      {isLoading ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Security sx={{ fontSize: 20 }} />
                          </motion.div>
                          Signing in...
                        </Box>
                      ) : (
                        'Sign In Securely'
                      )}
                    </Button>
                  </motion.div>
                </Box>
              </Box>
            </Slide>

            {/* Demo Credentials Section */}
            <Fade in={animationStep >= 3} timeout={800}>
              <Box>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Demo Access
                  </Typography>
                </Divider>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      icon={<Security />}
                      label="Load User Demo"
                      onClick={() => handleDemoLogin('user')}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Chip
                      icon={<Shield />}
                      label="Load Admin Demo"
                      onClick={() => handleDemoLogin('admin')}
                      color="secondary"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  </motion.div>
                </Box>

                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CheckCircle color="success" sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Demo Credentials Ready
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                    Use the buttons above to automatically fill credentials, or enter manually:
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1, fontSize: '0.875rem' }}>
                    <Typography variant="body2" fontWeight={500}>User:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>demo@example.com / demo123</Typography>
                    <Typography variant="body2" fontWeight={500}>Admin:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>admin@example.com / admin123</Typography>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          </Box>
        </MotionPaper>

        <Fade in={animationStep >= 3} timeout={1000}>
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Security sx={{ fontSize: 16 }} />
              Enterprise Security
              <span>•</span>
              <Shield sx={{ fontSize: 16 }} />
              Privacy-first AI
              <span>•</span>
              <CheckCircle sx={{ fontSize: 16 }} />
              GDPR Compliant
            </Typography>
          </Box>
        </Fade>
      </Container>
    </MotionBox>
  );
};

export default Login;
