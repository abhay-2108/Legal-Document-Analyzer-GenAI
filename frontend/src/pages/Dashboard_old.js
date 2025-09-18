import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Analytics,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  Assessment,
  Security,
  Speed,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeWorkflows: 0,
    completedAnalyses: 0,
    avgRiskScore: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    fetchDashboardData();
    checkSystemHealth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [documentsResponse] = await Promise.all([
        apiService.getDocuments(0, 5),
      ]);

      setRecentDocuments(documentsResponse.data.documents || []);
      setStats(prev => ({
        ...prev,
        totalDocuments: documentsResponse.data.total || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      await apiService.healthCheck();
      setHealthStatus('healthy');
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, action }) => (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Box textAlign="right">
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
      {action && <CardActions>{action}</CardActions>}
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          bgcolor: color + '08',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <Avatar sx={{ bgcolor: color, width: 64, height: 64, margin: '0 auto 16px' }}>
          {icon}
        </Avatar>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="calc(100vh - 200px)"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, ml: { md: '240px' }, width: { md: 'calc(100% - 240px)' } }}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          Welcome to Legal Document Analyzer
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          Analyze legal documents with AI-powered insights, risk assessment, and compliance checking.
        </Typography>
        
        {/* System Status */}
        <Chip
          icon={healthStatus === 'healthy' ? <CheckCircle /> : <Warning />}
          label={`System Status: ${healthStatus === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}`}
          color={healthStatus === 'healthy' ? 'success' : 'error'}
          sx={{ mb: 3 }}
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Documents"
            value={stats.totalDocuments}
            icon={<Description />}
            color={theme.palette.primary.main}
            subtitle="Documents analyzed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Workflows"
            value={stats.activeWorkflows}
            icon={<Schedule />}
            color={theme.palette.warning.main}
            subtitle="Currently processing"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Analyses"
            value={stats.completedAnalyses}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle="Successfully processed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Risk Score"
            value={stats.avgRiskScore.toFixed(1)}
            icon={<Assessment />}
            color={theme.palette.error.main}
            subtitle="Risk assessment average"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Upload Document"
            description="Upload a new legal document for AI-powered analysis"
            icon={<CloudUpload />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/upload')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="View Documents"
            description="Browse and manage your analyzed documents"
            icon={<Description />}
            color={theme.palette.secondary.main}
            onClick={() => navigate('/documents')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Analytics Dashboard"
            description="View detailed analytics and insights"
            icon={<TrendingUp />}
            color={theme.palette.success.main}
            onClick={() => navigate('/analytics')}
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ mr: 1 }} />
                Recent Documents
              </Typography>
              {recentDocuments.length > 0 ? (
                <List>
                  {recentDocuments.map((doc, index) => (
                    <React.Fragment key={doc.document_id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={doc.filename}
                          secondary={`Uploaded: ${new Date(doc.upload_timestamp).toLocaleDateString()} • ${(doc.file_size / 1024).toFixed(1)} KB`}
                        />
                        <Chip
                          label={doc.encryption_enabled ? 'Encrypted' : 'Not Encrypted'}
                          color={doc.encryption_enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < recentDocuments.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    No documents uploaded yet. Upload your first document to get started!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => navigate('/upload')}
                    sx={{ mt: 2 }}
                  >
                    Upload Document
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Security Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.success.main }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="PII Redaction"
                    secondary="Automatically removes sensitive data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.success.main }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="End-to-End Encryption"
                    secondary="Your documents are always protected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.success.main }}>
                      <CheckCircle sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Privacy-First AI"
                    secondary="No training on your data"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ mr: 1 }} />
                System Performance
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  API Response Time
                </Typography>
                <LinearProgress variant="determinate" value={85} sx={{ mb: 1 }} />
                <Typography variant="caption" color="textSecondary">
                  Average: 1.2s
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  System Health
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={healthStatus === 'healthy' ? 100 : 60}
                  color={healthStatus === 'healthy' ? 'success' : 'warning'}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {healthStatus === 'healthy' ? 'All systems operational' : 'Minor issues detected'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
