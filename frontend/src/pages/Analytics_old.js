import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

const COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    riskDistribution: [
      { name: 'Low Risk', value: 45, color: '#34a853' },
      { name: 'Medium Risk', value: 30, color: '#fbbc04' },
      { name: 'High Risk', value: 20, color: '#ea4335' },
      { name: 'Critical', value: 5, color: '#9aa0a6' },
    ],
    documentTypes: [
      { type: 'Contracts', count: 120 },
      { type: 'NDAs', count: 85 },
      { type: 'Agreements', count: 60 },
      { type: 'Terms of Service', count: 40 },
      { type: 'Privacy Policies', count: 25 },
    ],
    monthlyTrends: [
      { month: 'Jan', documents: 30, risks: 12 },
      { month: 'Feb', documents: 45, risks: 18 },
      { month: 'Mar', documents: 38, risks: 15 },
      { month: 'Apr', documents: 52, risks: 20 },
      { month: 'May', documents: 61, risks: 25 },
      { month: 'Jun', documents: 74, risks: 28 },
    ],
    topRisks: [
      { risk: 'Liability Clauses', count: 45, severity: 'High' },
      { risk: 'Termination Terms', count: 32, severity: 'Medium' },
      { risk: 'Data Privacy', count: 28, severity: 'High' },
      { risk: 'Payment Terms', count: 24, severity: 'Medium' },
      { risk: 'Intellectual Property', count: 18, severity: 'Critical' },
    ],
  });

  useEffect(() => {
    // Simulate loading analytics data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      default:
        return 'success';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '240px' }, width: { md: 'calc(100% - 240px)' } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '240px' }, width: { md: 'calc(100% - 240px)' } }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '240px' }, width: { md: 'calc(100% - 240px)' } }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Comprehensive insights into your document analysis patterns and risk trends.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Risk Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Risk Distribution"
              avatar={<AssessmentIcon color="primary" />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Document Types"
              avatar={<SecurityIcon color="primary" />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.documentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4285f4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trends */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Monthly Trends"
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="documents" 
                    stroke="#4285f4" 
                    strokeWidth={2}
                    name="Documents Analyzed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="risks" 
                    stroke="#ea4335" 
                    strokeWidth={2}
                    name="Risks Identified"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Risk Categories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Top Risk Categories"
              avatar={<WarningIcon color="warning" />}
            />
            <CardContent>
              <List>
                {analytics.topRisks.map((risk, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip 
                        label={risk.count} 
                        size="small" 
                        color="primary"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={risk.risk}
                      secondary={
                        <Chip 
                          label={risk.severity} 
                          size="small" 
                          color={getSeverityColor(risk.severity)}
                          variant="outlined"
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Insights */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="System Insights"
              avatar={<AssessmentIcon color="info" />}
            />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Processing Efficiency
                </Typography>
                <Typography variant="h6" color="success.main">
                  94.2% Success Rate
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Average Analysis Time
                </Typography>
                <Typography variant="h6" color="primary">
                  2.3 minutes
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Data Security Score
                </Typography>
                <Typography variant="h6" color="success.main">
                  99.9% Compliant
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Privacy Protection
                </Typography>
                <Typography variant="h6" color="success.main">
                  100% PII Redacted
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
