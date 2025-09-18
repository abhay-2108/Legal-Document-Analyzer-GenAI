import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Button,
  Tabs,
  Tab,
  Badge,
  Chip,
  Stack,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Dashboard,
  CloudUpload,
  Description,
  Analytics,
  Settings,
  Gavel,
  Notifications,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);
const MotionButton = motion.create(Button);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [notifications] = useState(3); // Mock notification count

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setProfileMenuAnchor(null);
    setMobileMenuAnchor(null);
  };

  // Logout functionality removed

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/', 
      icon: <Dashboard />, 
      color: '#1976d2',
      shortLabel: 'Home'
    },
    { 
      label: 'Upload Document', 
      path: '/upload', 
      icon: <CloudUpload />, 
      color: '#4caf50',
      shortLabel: 'Upload'
    },
    { 
      label: 'Documents', 
      path: '/documents', 
      icon: <Description />, 
      color: '#ff9800',
      shortLabel: 'Docs'
    },
    { 
      label: 'Analytics', 
      path: '/analytics', 
      icon: <Analytics />, 
      color: '#9c27b0',
      shortLabel: 'Analytics'
    },
  ];

  const getCurrentTabValue = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? menuItems.indexOf(currentItem) : 0;
  };

  const handleTabChange = (event, newValue) => {
    navigate(menuItems[newValue].path);
  };


  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Logo and Brand */}
          <MotionBox 
            sx={{ display: 'flex', alignItems: 'center', mr: { xs: 2, md: 4 } }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Gavel 
                sx={{ 
                  mr: 1, 
                  fontSize: { xs: 28, sm: 32 },
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }} 
              />
            </motion.div>
            <Typography
              variant="h6"
              component={motion.div}
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              Legal Document Analyzer
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'block', sm: 'none' },
              }}
            >
              LDA
            </Typography>
          </MotionBox>

          {/* Desktop Navigation */}
          {!isTablet && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  borderRadius: 6,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
              >
                <Tabs
                  value={getCurrentTabValue()}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    minHeight: 48,
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.04)',
                        transform: 'translateY(-2px)',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    },
                  }}
                >
                  {menuItems.map((item, index) => (
                    <Tab
                      key={item.path}
                      icon={
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {React.cloneElement(item.icon, {
                            sx: { 
                              fontSize: 20,
                              color: location.pathname === item.path ? item.color : 'action.active',
                              transition: 'color 0.2s ease-in-out',
                            }
                          })}
                        </motion.div>
                      }
                      label={isMobile ? item.shortLabel : item.label}
                      iconPosition="start"
                      sx={{
                        color: location.pathname === item.path ? item.color : 'text.secondary',
                        minWidth: { xs: 100, md: 140 },
                      }}
                    />
                  ))}
                </Tabs>
              </Paper>
            </Box>
          )}

          {/* Mobile Navigation Toggle */}
          {isTablet && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Stack direction="row" spacing={1}>
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Tooltip key={item.path} title={item.label}>
                      <MotionButton
                        onClick={() => navigate(item.path)}
                        sx={{
                          minWidth: 48,
                          height: 48,
                          borderRadius: 3,
                          color: isActive ? item.color : 'action.active',
                          bgcolor: isActive ? `${item.color}15` : 'transparent',
                          border: isActive ? `1px solid ${item.color}30` : '1px solid transparent',
                          '&:hover': {
                            bgcolor: `${item.color}20`,
                            border: `1px solid ${item.color}40`,
                          },
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {React.cloneElement(item.icon, {
                          sx: { fontSize: 22 }
                        })}
                      </MotionButton>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Right Side Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Badge badgeContent={notifications} color="error" variant="dot">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings (Mobile Only) */}
            {isTablet && (
              <Tooltip title="More Options">
                <IconButton 
                  onClick={handleMobileMenuOpen}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            )}

            {/* Profile */}
            <Tooltip title="Profile">
              <MotionButton
                onClick={handleProfileMenuOpen}
                sx={{
                  borderRadius: 4,
                  p: 0.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    U
                  </Avatar>
                  {!isTablet && (
                    <Box sx={{ textAlign: 'left', display: { xs: 'none', lg: 'block' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        User
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                        demo
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </MotionButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(profileMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 280,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            '& .MuiMenuItem-root': {
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease-in-out',
              },
            },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: 1, cursor: 'default' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48,
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              U
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Demo User
              </Typography>
              <Typography variant="body2" color="text.secondary">
                demo@example.com
              </Typography>
              <Chip 
                label="Premium" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
              />
            </Box>
          </Stack>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <Settings sx={{ mr: 2, color: 'primary.main' }} fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={500}>Account Settings</Typography>
            <Typography variant="caption" color="text.secondary">Manage your preferences</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Mobile Options Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <Settings sx={{ mr: 2, color: 'primary.main' }} fontSize="small" />
          Settings
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
