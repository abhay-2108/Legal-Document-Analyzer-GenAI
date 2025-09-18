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
  Paper,
  Button,
  IconButton,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
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
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const MotionCard = motion.create(Card);

const Analytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    riskDistribution: [
      { name: 'Low Risk', value: 45, color: '#4caf50' },
      { name: 'Medium Risk', value: 30, color: '#ff9800' },
      { name: 'High Risk', value: 20, color: '#f44336' },
      { name: 'Critical', value: 5, color: '#9c27b0' },
    ],
    documentTypes: [
      { type: 'Contracts', count: 120, percentage: 35 },
      { type: 'NDAs', count: 85, percentage: 25 },
      { type: 'Agreements', count: 60, percentage: 18 },
      { type: 'Terms of Service', count: 40, percentage: 12 },
      { type: 'Privacy Policies', count: 25, percentage: 10 },
    ],
    monthlyTrends: [
      { month: 'Jan', documents: 30, risks: 12, processed: 28 },
      { month: 'Feb', documents: 45, risks: 18, processed: 43 },
      { month: 'Mar', documents: 38, risks: 15, processed: 36 },
      { month: 'Apr', documents: 52, risks: 20, processed: 50 },
      { month: 'May', documents: 61, risks: 25, processed: 58 },
      { month: 'Jun', documents: 74, risks: 28, processed: 71 },
    ],
    topRisks: [
      { risk: 'Liability Clauses', count: 45, severity: 'High', color: '#f44336' },
      { risk: 'Termination Terms', count: 32, severity: 'Medium', color: '#ff9800' },
      { risk: 'Data Privacy', count: 28, severity: 'High', color: '#f44336' },
      { risk: 'Payment Terms', count: 24, severity: 'Medium', color: '#ff9800' },
      { risk: 'Intellectual Property', count: 18, severity: 'Critical', color: '#9c27b0' },
    ],
    performanceMetrics: [
      { metric: 'Processing Efficiency', value: 94.2, unit: '%', trend: '+2.1%' },
      { metric: 'Average Analysis Time', value: 2.3, unit: 'min', trend: '-0.5min' },
      { metric: 'Data Security Score', value: 99.9, unit: '%', trend: 'stable' },
      { metric: 'Privacy Protection', value: 100, unit: '%', trend: 'stable' },
    ]
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await apiService.getDetailedAnalytics();
      
      // Update analytics with real data if available, keep mock as fallback
      if (response.data) {
        setAnalytics(prevAnalytics => ({
          ...prevAnalytics,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('Failed to load analytics data');
      // Keep using mock data
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed!');
  };


  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ 
        mt: 4, 
        mb: 4,
        px: { xs: 2, sm: 3, md: 4 },
      }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <CircularProgress size={60} thickness={4} />
          </motion.div>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ 
      mt: 4, 
      mb: 4,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
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
              Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive insights into your document analysis patterns and risk trends.
            </Typography>
          </Box>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderRadius: 3 }}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 3 }}
            >
              Export
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshIcon />
                </motion.div>
              </IconButton>
            </motion.div>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Monthly Trends - Full Width Primary Chart */}
          <Grid item xs={12}>
            <Fade in timeout={800}>
              <MotionCard
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <CardHeader
                  title={
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      Monthly Processing Trends
                    </Typography>
                  }
                  avatar={<TrendingUpIcon sx={{ color: 'white', fontSize: 32 }} />}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box height={{ xs: 400, sm: 500, md: 600 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={analytics.monthlyTrends}
                        margin={{
                          top: 30,
                          right: 40,
                          left: 30,
                          bottom: 30,
                        }}
                      >
                        <defs>
                          <linearGradient id="documentsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#00ff88" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="risksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="processedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                        <XAxis 
                          dataKey="month"
                          tick={{ fontSize: 14, fill: 'white' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 14, fill: 'white' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '20px',
                            color: 'white'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="documents" 
                          stroke="#00ff88" 
                          fillOpacity={1} 
                          fill="url(#documentsGradient)"
                          strokeWidth={4}
                          name="Documents Uploaded"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="processed" 
                          stroke="#4fc3f7" 
                          fillOpacity={1} 
                          fill="url(#processedGradient)"
                          strokeWidth={4}
                          name="Successfully Processed"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="risks" 
                          stroke="#ff6b6b" 
                          fillOpacity={1} 
                          fill="url(#risksGradient)"
                          strokeWidth={4}
                          name="Risks Identified"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </MotionCard>
            </Fade>
          </Grid>

          {/* Risk Distribution - Enhanced */}
          <Grid item xs={12} lg={8}>
            <Fade in timeout={1000}>
              <MotionCard
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{ height: '100%', borderRadius: 3 }}
              >
                <CardHeader
                  title={
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Risk Distribution Analysis
                    </Typography>
                  }
                  avatar={<AssessmentIcon sx={{ color: 'warning.main', fontSize: 32 }} />}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box height={{ xs: 400, sm: 450, md: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.riskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={160}
                          innerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analytics.riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }}
                          formatter={(value, name) => [`${value} documents`, name]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={60}
                          iconType="circle"
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </MotionCard>
            </Fade>
          </Grid>

          {/* Document Types - Enhanced */}
          <Grid item xs={12} lg={4}>
            <Fade in timeout={1200}>
              <MotionCard
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{ 
                  height: '100%', 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white'
                }}
              >
                <CardHeader
                  title={
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      Document Types
                    </Typography>
                  }
                  avatar={<SecurityIcon sx={{ color: 'white', fontSize: 32 }} />}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Box height={{ xs: 400, sm: 450, md: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analytics.documentTypes}
                        layout="horizontal"
                        margin={{
                          top: 20,
                          right: 30,
                          left: 100,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 12, fill: 'white' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="category"
                          dataKey="type"
                          tick={{ fontSize: 12, fill: 'white' }}
                          axisLine={false}
                          tickLine={false}
                          width={90}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white'
                          }}
                          formatter={(value) => [`${value} documents`, 'Count']}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#ffffff"
                          radius={[0, 8, 8, 0]}
                          opacity={0.9}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </MotionCard>
            </Fade>
          </Grid>

          {/* Top Risk Categories */}
          <Grid item xs={12} lg={6}>
            <Fade in timeout={1400}>
              <MotionCard
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{ height: '100%', borderRadius: 3 }}
              >
                <CardHeader
                  title="Top Risk Categories"
                  avatar={<WarningIcon color="warning" />}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                  <List>
                    {analytics.topRisks.map((risk, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 1.4 }}
                      >
                        <ListItem
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            bgcolor: 'grey.50',
                            border: `1px solid ${risk.color}20`,
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: risk.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                              }}
                            >
                              {risk.count}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {risk.risk}
                              </Typography>
                            }
                            secondary={
                              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                  label={risk.severity}
                                  size="small"
                                  sx={{
                                    bgcolor: risk.color,
                                    color: 'white',
                                    fontWeight: 500,
                                  }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  {((risk.count / analytics.topRisks.reduce((sum, r) => sum + r.count, 0)) * 100).toFixed(1)}% of total risks
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </CardContent>
              </MotionCard>
            </Fade>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} lg={6}>
            <Fade in timeout={1600}>
              <MotionCard
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                sx={{ height: '100%', borderRadius: 3 }}
              >
                <CardHeader
                  title="System Performance"
                  avatar={<AssessmentIcon color="info" />}
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                  <Grid container spacing={2}>
                    {analytics.performanceMetrics.map((metric, index) => (
                      <Grid item xs={12} key={index}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 1.6 }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 3,
                              bgcolor: 'primary.main',
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}08 100%)`,
                              border: `1px solid ${theme.palette.primary.main}30`,
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  {metric.metric}
                                </Typography>
                                <Box display="flex" alignItems="baseline" gap={1}>
                                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                                    {metric.value}
                                  </Typography>
                                  <Typography variant="body1" color="textSecondary">
                                    {metric.unit}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip
                                label={metric.trend}
                                size="small"
                                color={metric.trend.includes('+') ? 'success' : metric.trend.includes('-') ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </MotionCard>
            </Fade>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Analytics;
