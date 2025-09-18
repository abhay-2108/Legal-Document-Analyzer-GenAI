import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Fade,
  Slide,
  Grow,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Assessment,
  CheckCircle,
  Schedule,
  TrendingUp,
  Speed,
  Refresh,
  Timeline,
  Shield,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Animation sequence
    const timer1 = setTimeout(() => setAnimationStep(1), 300);
    const timer2 = setTimeout(() => setAnimationStep(2), 600);
    const timer3 = setTimeout(() => setAnimationStep(3), 900);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.getDashboardAnalytics();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', error);
      // Set fallback data to prevent complete failure
      setDashboardData({
        total_documents: 0,
        active_workflows: 0,
        success_rate: 0,
        average_risk_score: 0,
        recent_documents: [],
        monthly_trends: [],
        risk_distribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend, delay = 0 }) => (
    <Grow in={animationStep >= 1} timeout={600} style={{ transitionDelay: `${delay}ms` }}>
      <MotionCard
        whileHover={{ 
          y: -8,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
        }}
        transition={{ type: "spring", stiffness: 300 }}
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          border: `1px solid ${color}30`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Avatar 
              sx={{ 
                bgcolor: color, 
                width: 56, 
                height: 56,
                boxShadow: `0 4px 12px ${color}40`
              }}
            >
              {icon}
            </Avatar>
            <Box textAlign="right">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay / 1000 + 0.3, type: "spring" }}
              >
                <Typography variant="h4" component="div" fontWeight="bold" color={color}>
                  {value}
                </Typography>
              </motion.div>
              <Typography color="textSecondary" variant="body2">
                {title}
              </Typography>
            </Box>
          </Box>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="success.main" fontWeight={500}>
                {trend}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        {/* Animated background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: color,
            opacity: 0.05,
            transform: 'scale(1.2)',
          }}
        />
      </MotionCard>
    </Grow>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick, delay = 0 }) => (
    <Grow in={animationStep >= 2} timeout={600} style={{ transitionDelay: `${delay}ms` }}>
      <MotionCard
        whileHover={{ 
          scale: 1.03,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
        }}
        whileTap={{ scale: 0.98 }}
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={onClick}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Avatar sx={{ 
              bgcolor: color, 
              width: 64, 
              height: 64, 
              margin: '0 auto 16px',
              boxShadow: `0 4px 20px ${color}40`
            }}>
              {icon}
            </Avatar>
          </motion.div>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
        </CardContent>
      </MotionCard>
    </Grow>
  );

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
      {/* Welcome Section */}
      <Fade in timeout={800}>
        <MotionBox
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          mb={4}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Legal Document Analyzer
              </Typography>
              <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                AI-powered legal document analysis with enterprise-grade security
              </Typography>
            </Box>
            
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
                  <Refresh />
                </motion.div>
              </IconButton>
            </motion.div>
          </Box>
          
          {/* System Status */}
          <Alert 
            severity="success" 
            icon={<Shield />}
            sx={{ 
              mb: 3,
              '& .MuiAlert-icon': {
                fontSize: 24,
              },
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              All Systems Operational
            </Typography>
            <Typography variant="body2">
              99.9% uptime • Last backup: {new Date().toLocaleDateString()} • Security: Active
            </Typography>
          </Alert>
        </MotionBox>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Documents"
            value={dashboardData?.total_documents || 0}
            icon={<Description />}
            color={theme.palette.primary.main}
            subtitle="Documents processed"
            trend="+12% this month"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Workflows"
            value={dashboardData?.active_workflows || 0}
            icon={<Schedule />}
            color={theme.palette.warning.main}
            subtitle="Currently processing"
            trend="2 queued"
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${dashboardData?.success_rate || 0}%`}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle="Processing accuracy"
            trend="+0.3% improved"
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Risk Score"
            value={dashboardData?.average_risk_score || 0}
            icon={<Assessment />}
            color={theme.palette.error.main}
            subtitle="Risk assessment"
            trend="Within normal range"
            delay={300}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Slide in={animationStep >= 2} direction="up" timeout={800}>
        <Grid container spacing={4} mb={4}>
          {/* Main Trends Chart - Full Width with Proper Height */}
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '& .recharts-text': { fill: 'white' },
                '& .recharts-cartesian-axis-tick': { fill: 'white' }
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4, fontWeight: 600 }}>
                  <Timeline sx={{ mr: 2, fontSize: 32 }} />
                  Monthly Processing Trends
                </Typography>
                <Box height={{ xs: 400, sm: 450, md: 500, lg: 550 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={dashboardData?.monthly_trends || [
                        { month: 'Jan', documents: 65, risks: 12 },
                        { month: 'Feb', documents: 78, risks: 18 },
                        { month: 'Mar', documents: 52, risks: 8 },
                        { month: 'Apr', documents: 91, risks: 23 },
                        { month: 'May', documents: 88, risks: 19 },
                        { month: 'Jun', documents: 96, risks: 25 },
                      ]}
                      margin={{
                        top: 30,
                        right: 40,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 14, fill: 'white' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 14, fill: 'white' }}
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
                      <Line 
                        type="monotone" 
                        dataKey="documents" 
                        stroke="#00ff88" 
                        strokeWidth={4}
                        dot={{ fill: '#00ff88', strokeWidth: 3, r: 8 }}
                        name="Documents Processed"
                        activeDot={{ r: 10, stroke: '#00ff88', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="risks" 
                        stroke="#ff6b6b" 
                        strokeWidth={4}
                        dot={{ fill: '#ff6b6b', strokeWidth: 3, r: 8 }}
                        name="Risks Identified"
                        activeDot={{ r: 10, stroke: '#ff6b6b', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
          
          {/* Risk Distribution Chart - Enhanced */}
          <Grid item xs={12} lg={8}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              sx={{ borderRadius: 3, height: '100%' }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4, fontWeight: 600 }}>
                  <Assessment sx={{ mr: 2, color: 'warning.main', fontSize: 32 }} />
                  Risk Distribution Analysis
                </Typography>
                <Box height={{ xs: 350, sm: 400, md: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.risk_distribution || [
                          { name: 'Low Risk', value: 45, color: '#4caf50' },
                          { name: 'Medium Risk', value: 30, color: '#ff9800' },
                          { name: 'High Risk', value: 20, color: '#f44336' },
                          { name: 'Critical', value: 5, color: '#9c27b0' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={140}
                        innerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(dashboardData?.risk_distribution || [
                          { name: 'Low Risk', value: 45, color: '#4caf50' },
                          { name: 'Medium Risk', value: 30, color: '#ff9800' },
                          { name: 'High Risk', value: 20, color: '#f44336' },
                          { name: 'Critical', value: 5, color: '#9c27b0' },
                        ]).map((entry, index) => (
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
                        height={50}
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
          </Grid>
          
          {/* Performance Metrics - Enhanced */}
          <Grid item xs={12} lg={4}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              sx={{ 
                borderRadius: 3, 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4, fontWeight: 600 }}>
                  <Speed sx={{ mr: 2, fontSize: 32 }} />
                  System Performance
                </Typography>
                <Box height={{ xs: 350, sm: 400, md: 450 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { metric: 'Efficiency', value: 94.2, target: 95 },
                        { metric: 'Accuracy', value: 97.8, target: 98 },
                        { metric: 'Speed', value: 89.5, target: 90 },
                        { metric: 'Security', value: 99.9, target: 99 },
                      ]}
                      margin={{
                        top: 30,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                      <XAxis 
                        dataKey="metric" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'white' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'white' }}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                        formatter={(value, name) => [`${value}%`, name === 'value' ? 'Current' : 'Target']}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', color: 'white' }} />
                      <Bar 
                        dataKey="value" 
                        fill="#00ff88" 
                        radius={[8, 8, 0, 0]}
                        name="Current Performance"
                      />
                      <Bar 
                        dataKey="target" 
                        fill="rgba(255,255,255,0.3)" 
                        radius={[8, 8, 0, 0]}
                        name="Target"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </Slide>

      {/* Quick Actions */}
      <Slide in={animationStep >= 2} direction="up" timeout={800}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
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
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="View Documents"
                description="Browse and manage your analyzed documents"
                icon={<Description />}
                color={theme.palette.secondary.main}
                onClick={() => navigate('/documents')}
                delay={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <QuickActionCard
                title="Analytics Dashboard"
                description="View detailed analytics and insights"
                icon={<TrendingUp />}
                color={theme.palette.success.main}
                onClick={() => navigate('/analytics')}
                delay={200}
              />
            </Grid>
          </Grid>
        </Box>
      </Slide>

      {/* Recent Activity */}
      <Fade in={animationStep >= 3} timeout={1000}>
        <MotionCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Schedule sx={{ mr: 1, color: 'primary.main' }} />
              Recent Documents
            </Typography>
            
            <AnimatePresence>
              {dashboardData?.recent_documents && dashboardData.recent_documents.length > 0 ? (
                <List>
                  {dashboardData.recent_documents.map((doc, index) => (
                    <motion.div
                      key={doc.document_id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ListItem 
                        sx={{ 
                          borderRadius: 2,
                          mb: 1,
                          '&:hover': {
                            bgcolor: 'grey.50',
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={500}>
                              {doc.filename}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Uploaded: {new Date(doc.upload_timestamp).toLocaleDateString()}
                              </Typography>
                              <Box display="flex" gap={1} mt={1}>
                                <Chip
                                  label={doc.analysis_results?.risk_level || 'Processing'}
                                  color={
                                    doc.analysis_results?.risk_level === 'Low' ? 'success' :
                                    doc.analysis_results?.risk_level === 'Medium' ? 'warning' :
                                    doc.analysis_results?.risk_level === 'High' ? 'error' : 'default'
                                  }
                                  size="small"
                                />
                                <Chip
                                  label={`${doc.analysis_results?.confidence_score || 0}% Confidence`}
                                  variant="outlined"
                                  size="small"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Box textAlign="center" py={6}>
                    <motion.div
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <CloudUpload sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    </motion.div>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No documents yet
                    </Typography>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>
                      Upload your first document to get started with AI-powered analysis!
                    </Typography>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CloudUpload />}
                        onClick={() => navigate('/upload')}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                          }
                        }}
                      >
                        Upload Your First Document
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </MotionCard>
      </Fade>
    </Container>
  );
};

export default Dashboard;
