import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  LinearProgress,
  Collapse,
  FormHelperText,
  Skeleton,
  Fade,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MotionCard = motion.create(Card);

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [settings, setSettings] = useState({
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      auditLogging: true,
      ipWhitelist: '',
      apiKeyRotation: 30,
    },
    privacy: {
      piiRedaction: true,
      dataRetention: 365,
      anonymizeAnalytics: true,
      encryptionLevel: 'AES-256',
      dataExportFormat: 'JSON',
      gdprCompliance: true,
    },
    notifications: {
      emailAlerts: true,
      workflowUpdates: true,
      securityAlerts: true,
      weeklyReports: false,
      pushNotifications: false,
      emailAddress: 'admin@company.com',
    },
    processing: {
      maxFileSize: 50,
      concurrentAnalysis: 3,
      autoBackup: true,
      cacheResults: true,
      backupRetention: 30,
      processingTimeout: 300,
    },
  });

  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    // Simulate loading settings from API
    setTimeout(() => {
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setLoading(false);
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check if settings have changed
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

  const validateSettings = () => {
    const errors = {};
    
    // Security validations
    if (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 180) {
      errors.sessionTimeout = 'Session timeout must be between 5 and 180 minutes';
    }
    if (settings.security.passwordExpiry < 30 || settings.security.passwordExpiry > 365) {
      errors.passwordExpiry = 'Password expiry must be between 30 and 365 days';
    }
    if (settings.security.apiKeyRotation < 7 || settings.security.apiKeyRotation > 365) {
      errors.apiKeyRotation = 'API key rotation must be between 7 and 365 days';
    }
    
    // Privacy validations
    if (settings.privacy.dataRetention < 30 || settings.privacy.dataRetention > 2555) {
      errors.dataRetention = 'Data retention must be between 30 and 2555 days';
    }
    
    // Processing validations
    if (settings.processing.maxFileSize < 1 || settings.processing.maxFileSize > 100) {
      errors.maxFileSize = 'Max file size must be between 1 and 100 MB';
    }
    if (settings.processing.concurrentAnalysis < 1 || settings.processing.concurrentAnalysis > 10) {
      errors.concurrentAnalysis = 'Concurrent analysis must be between 1 and 10';
    }
    if (settings.processing.processingTimeout < 60 || settings.processing.processingTimeout > 1800) {
      errors.processingTimeout = 'Processing timeout must be between 60 and 1800 seconds';
    }
    
    // Notification validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.notifications.emailAlerts && !emailRegex.test(settings.notifications.emailAddress)) {
      errors.emailAddress = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
    
    // Clear validation error for this field
    if (validationErrors[setting]) {
      setValidationErrors(prev => {
        const { [setting]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setValidationErrors({});
    setHasChanges(false);
    setResetDialogOpen(false);
    toast.success('Settings reset to last saved values');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getTabIcon = (index) => {
    const icons = [SecurityIcon, VisibilityIcon, NotificationsIcon, StorageIcon];
    const Icon = icons[index];
    return <Icon />;
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'Connected': { color: 'success', icon: <CheckIcon /> },
      'Operational': { color: 'success', icon: <CheckIcon /> },
      'Warning': { color: 'warning', icon: <WarningIcon /> },
      'Error': { color: 'error', icon: <ErrorIcon /> },
    };
    
    const config = statusMap[status] || { color: 'default', icon: <InfoIcon /> };
    
    return (
      <Chip
        label={status}
        color={config.color}
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box>
          <Skeleton variant="text" width="30%" height={50} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={30} sx={{ mb: 4 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
          
          <Grid container spacing={3}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              System Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Configure your system preferences, security, and privacy settings
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Reset to last saved">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  onClick={() => setResetDialogOpen(true)}
                  disabled={!hasChanges || saving}
                  color="warning"
                >
                  <ResetIcon />
                </IconButton>
              </motion.div>
            </Tooltip>
            
            <Tooltip title="Refresh settings">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  onClick={() => window.location.reload()}
                  disabled={saving}
                  color="info"
                >
                  <RefreshIcon />
                </IconButton>
              </motion.div>
            </Tooltip>
          </Box>
        </Box>

        {/* Progress bar when saving */}
        <Collapse in={saving}>
          <Box mb={2}>
            <LinearProgress sx={{ borderRadius: 2, height: 6 }} />
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              Saving settings...
            </Typography>
          </Box>
        </Collapse>

        {/* Change indicator */}
        <AnimatePresence>
          {hasChanges && !saving && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert 
                severity="info" 
                sx={{ mb: 3, borderRadius: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={handleSave}>
                    Save Now
                  </Button>
                }
              >
                You have unsaved changes
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 80,
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            {['Security', 'Privacy', 'Notifications', 'Processing'].map((label, index) => (
              <Tab
                key={label}
                label={
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    {getTabIcon(index)}
                    <Typography variant="caption">{label}</Typography>
                    {Object.keys(validationErrors).some(key => {
                      const categories = ['security', 'privacy', 'notifications', 'processing'];
                      return categories[index] === key.split('.')[0];
                    }) && (
                      <Badge color="error" variant="dot" />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Security Settings */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardHeader
                      title="Security Configuration"
                      avatar={<ShieldIcon color="primary" />}
                      subheader="Manage authentication, access control, and audit settings"
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.security.twoFactorAuth}
                                  onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Two-Factor Authentication"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Add an extra layer of security to user accounts
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Session Timeout (minutes)"
                              type="number"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                              error={!!validationErrors.sessionTimeout}
                              helperText={validationErrors.sessionTimeout || 'How long before inactive users are logged out'}
                              InputProps={{ inputProps: { min: 5, max: 180 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Password Expiry (days)"
                              type="number"
                              value={settings.security.passwordExpiry}
                              onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                              error={!!validationErrors.passwordExpiry}
                              helperText={validationErrors.passwordExpiry || 'Force password changes after this many days'}
                              InputProps={{ inputProps: { min: 30, max: 365 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="API Key Rotation (days)"
                              type="number"
                              value={settings.security.apiKeyRotation}
                              onChange={(e) => handleSettingChange('security', 'apiKeyRotation', parseInt(e.target.value))}
                              error={!!validationErrors.apiKeyRotation}
                              helperText={validationErrors.apiKeyRotation || 'Automatically rotate API keys'}
                              InputProps={{ inputProps: { min: 7, max: 365 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="IP Whitelist (comma-separated)"
                              value={settings.security.ipWhitelist}
                              onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
                              helperText="Leave empty to allow all IPs"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.security.auditLogging}
                                  onChange={(e) => handleSettingChange('security', 'auditLogging', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Enable Audit Logging"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Track all user actions and system changes
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>
            )}

            {/* Privacy Settings */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardHeader
                      title="Privacy & Data Protection"
                      avatar={<VisibilityIcon color="primary" />}
                      subheader="Control data handling, encryption, and privacy compliance"
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.privacy.piiRedaction}
                                  onChange={(e) => handleSettingChange('privacy', 'piiRedaction', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Automatic PII Redaction"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Automatically detect and redact personally identifiable information
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Data Retention Period (days)"
                              type="number"
                              value={settings.privacy.dataRetention}
                              onChange={(e) => handleSettingChange('privacy', 'dataRetention', parseInt(e.target.value))}
                              error={!!validationErrors.dataRetention}
                              helperText={validationErrors.dataRetention || 'How long to keep processed documents'}
                              InputProps={{ inputProps: { min: 30, max: 2555 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <FormControl fullWidth>
                              <InputLabel>Encryption Level</InputLabel>
                              <Select
                                value={settings.privacy.encryptionLevel}
                                label="Encryption Level"
                                onChange={(e) => handleSettingChange('privacy', 'encryptionLevel', e.target.value)}
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value="AES-128">AES-128 (Standard)</MenuItem>
                                <MenuItem value="AES-256">AES-256 (High Security)</MenuItem>
                                <MenuItem value="ChaCha20">ChaCha20 (Modern)</MenuItem>
                              </Select>
                              <FormHelperText>Encryption strength for stored data</FormHelperText>
                            </FormControl>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <FormControl fullWidth>
                              <InputLabel>Data Export Format</InputLabel>
                              <Select
                                value={settings.privacy.dataExportFormat}
                                label="Data Export Format"
                                onChange={(e) => handleSettingChange('privacy', 'dataExportFormat', e.target.value)}
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value="JSON">JSON</MenuItem>
                                <MenuItem value="CSV">CSV</MenuItem>
                                <MenuItem value="XML">XML</MenuItem>
                              </Select>
                              <FormHelperText>Default format for data exports</FormHelperText>
                            </FormControl>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.privacy.anonymizeAnalytics}
                                  onChange={(e) => handleSettingChange('privacy', 'anonymizeAnalytics', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Anonymize Analytics Data"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Remove identifying information from analytics
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.privacy.gdprCompliance}
                                  onChange={(e) => handleSettingChange('privacy', 'gdprCompliance', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="GDPR Compliance Mode"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Enable enhanced privacy controls for EU compliance
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>
            )}

            {/* Notifications Settings */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardHeader
                      title="Notification Preferences"
                      avatar={<NotificationsIcon color="primary" />}
                      subheader="Configure how and when you receive system notifications"
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Email Address"
                              type="email"
                              value={settings.notifications.emailAddress}
                              onChange={(e) => handleSettingChange('notifications', 'emailAddress', e.target.value)}
                              error={!!validationErrors.emailAddress}
                              helperText={validationErrors.emailAddress || 'Primary email for notifications'}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifications.emailAlerts}
                                  onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Email Alerts"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Receive important notifications via email
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifications.pushNotifications}
                                  onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Push Notifications"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Show desktop notifications in your browser
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifications.workflowUpdates}
                                  onChange={(e) => handleSettingChange('notifications', 'workflowUpdates', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Workflow Status Updates"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Get notified when document analysis completes
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifications.securityAlerts}
                                  onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Security Alerts"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Important security notifications and warnings
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.notifications.weeklyReports}
                                  onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Weekly Analytics Reports"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Summary of system activity and performance
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>
            )}

            {/* Processing Settings */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardHeader
                      title="Processing & Storage"
                      avatar={<SpeedIcon color="primary" />}
                      subheader="Configure system performance and storage settings"
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Max File Size (MB)"
                              type="number"
                              value={settings.processing.maxFileSize}
                              onChange={(e) => handleSettingChange('processing', 'maxFileSize', parseInt(e.target.value))}
                              error={!!validationErrors.maxFileSize}
                              helperText={validationErrors.maxFileSize || 'Maximum size for uploaded documents'}
                              InputProps={{ inputProps: { min: 1, max: 100 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Concurrent Analysis Limit"
                              type="number"
                              value={settings.processing.concurrentAnalysis}
                              onChange={(e) => handleSettingChange('processing', 'concurrentAnalysis', parseInt(e.target.value))}
                              error={!!validationErrors.concurrentAnalysis}
                              helperText={validationErrors.concurrentAnalysis || 'How many documents to process simultaneously'}
                              InputProps={{ inputProps: { min: 1, max: 10 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Processing Timeout (seconds)"
                              type="number"
                              value={settings.processing.processingTimeout}
                              onChange={(e) => handleSettingChange('processing', 'processingTimeout', parseInt(e.target.value))}
                              error={!!validationErrors.processingTimeout}
                              helperText={validationErrors.processingTimeout || 'Maximum time to spend on each document'}
                              InputProps={{ inputProps: { min: 60, max: 1800 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box mb={3}>
                            <TextField
                              fullWidth
                              label="Backup Retention (days)"
                              type="number"
                              value={settings.processing.backupRetention}
                              onChange={(e) => handleSettingChange('processing', 'backupRetention', parseInt(e.target.value))}
                              helperText="How long to keep backup files"
                              InputProps={{ inputProps: { min: 1, max: 365 } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.processing.autoBackup}
                                  onChange={(e) => handleSettingChange('processing', 'autoBackup', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Automatic Backups"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Regularly backup processed documents and results
                            </Typography>
                          </Box>

                          <Box mb={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.processing.cacheResults}
                                  onChange={(e) => handleSettingChange('processing', 'cacheResults', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Cache Analysis Results"
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                              Store results to speed up repeated analyses
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>

                {/* System Status */}
                <Grid item xs={12}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardHeader
                      title="System Status"
                      avatar={<CloudIcon color="primary" />}
                      subheader="Current system information and health metrics"
                    />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Paper 
                              elevation={2} 
                              sx={{ 
                                p: 3, 
                                textAlign: 'center', 
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                              }}
                            >
                              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Version
                              </Typography>
                              <Typography variant="h5" fontWeight={600}>v2.1.0</Typography>
                            </Paper>
                          </motion.div>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                              <Typography variant="body2" color="textSecondary">
                                Environment
                              </Typography>
                              {getStatusChip('Connected')}
                            </Paper>
                          </motion.div>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                              <Typography variant="body2" color="textSecondary">
                                Database
                              </Typography>
                              {getStatusChip('Operational')}
                            </Paper>
                          </motion.div>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                              <Typography variant="body2" color="textSecondary">
                                API Status
                              </Typography>
                              {getStatusChip('Operational')}
                            </Paper>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </MotionCard>
                </Grid>
              </Grid>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <Fade in timeout={1000}>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ResetIcon />}
              onClick={() => setResetDialogOpen(true)}
              disabled={!hasChanges || saving}
              sx={{ minWidth: 140, borderRadius: 3 }}
            >
              Reset
            </Button>
            
            <motion.div
              whileHover={{ scale: hasChanges ? 1.05 : 1 }}
              whileTap={{ scale: hasChanges ? 0.95 : 1 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges || saving || Object.keys(validationErrors).length > 0}
                sx={{ 
                  minWidth: 140, 
                  borderRadius: 3,
                  background: hasChanges ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' : undefined,
                  '&:hover': {
                    background: hasChanges ? 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)' : undefined,
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </motion.div>
          </Box>
        </Fade>

        {/* Reset Confirmation Dialog */}
        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reset Settings</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to reset all settings to their last saved values? 
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReset} color="warning" variant="contained">
              Reset
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default Settings;
