import React, { useState, useCallback, useRef, useEffect } from 'react';
// Authentication removed
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Fade,
  Slide,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Delete,
  Refresh,
  Security,
  Analytics,
  Timeline,
  InsertDriveFile,
  PictureAsPdf,
  TextSnippet,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);
const MotionCard = motion.create(Card);

const DocumentUpload = () => {
  const theme = useTheme();
  // Authentication removed - all users can upload
  const user = { email: 'demo@example.com' };
  const isAuthenticated = true;
  const token = 'demo-token';
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState({});
  const [workflowStatus, setWorkflowStatus] = useState({});
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);
  
  // Check authentication on component mount
  useEffect(() => {
    console.log('DocumentUpload - Auth status:', { isAuthenticated, user: user.email, hasToken: !!token });
    if (!isAuthenticated) {
      console.warn('User not authenticated for upload');
    }
  }, [isAuthenticated, user.email, token]);

  const steps = [
    'Select Documents',
    'Upload & Validate',
    'Process & Analyze',
    'View Results'
  ];

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#f44336' }} />;
      case 'txt':
        return <TextSnippet sx={{ color: '#2196f3' }} />;
      case 'docx':
      case 'doc':
        return <Description sx={{ color: '#1976d2' }} />;
      default:
        return <InsertDriveFile sx={{ color: '#666' }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Max size: 50MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} is not a supported file type`);
          } else {
            toast.error(`Error with ${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'ready',
        preview: null
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`${acceptedFiles.length} file(s) added successfully!`);
      
      if (currentStep === 0) {
        setCurrentStep(1);
      }
    }
  }, [currentStep]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    delete uploadProgress[fileId];
    delete workflowStatus[fileId];
    
    if (files.length === 1) {
      setCurrentStep(0);
      setUploadResults([]);
    }
  };

  const uploadFile = async (fileItem) => {
    const { id, file } = fileItem;
    
    try {
      // Authentication removed - proceed with upload
      console.log('Upload proceeding without authentication');
      
      // Set file status to uploading
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploading' } : f
      ));

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) {
          clearInterval(progressInterval);
          progress = 90;
        }
        setUploadProgress(prev => ({ ...prev, [id]: progress }));
      }, 200);

      console.log('Starting upload for file:', file.name);
      console.log('API Base URL:', apiService.api.defaults.baseURL);
      console.log('Auth token present:', !!localStorage.getItem('token'));
      
      const response = await apiService.uploadDocument(file);
      console.log('Upload response:', response);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [id]: 100 }));
      
      // Set file status to uploaded
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'uploaded', workflowId: response.data.workflow_id } : f
      ));

      // Start monitoring workflow
      monitorWorkflow(id, response.data.workflow_id);
      
      return response.data;
    } catch (error) {
      console.error('Upload error for file:', file.name, error);
      console.error('Full error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      let errorMessage = 'Upload failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.detail || `Server error: ${error.response.status}`;
        
        // Authentication removed - no special handling for 401
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Upload failed';
      }
      
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'error', error: errorMessage } : f
      ));
      
      toast.error(`Upload failed for ${file.name}: ${errorMessage}`);
      throw error;
    }
  };

  const monitorWorkflow = async (fileId, workflowId) => {
    try {
      const response = await apiService.getWorkflowStatus(workflowId);
      
      setWorkflowStatus(prev => ({
        ...prev,
        [fileId]: response.data
      }));

      if (response.data.status === 'completed') {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'completed' } : f
        ));
      } else if (response.data.status === 'processing') {
        // Continue monitoring
        setTimeout(() => monitorWorkflow(fileId, workflowId), 2000);
      }
    } catch (error) {
      console.error('Failed to get workflow status:', error);
    }
  };

  const handleUploadAll = async () => {
    setUploading(true);
    setCurrentStep(2);
    
    const readyFiles = files.filter(f => f.status === 'ready');
    const results = [];
    
    try {
      for (const fileItem of readyFiles) {
        const result = await uploadFile(fileItem);
        results.push(result);
      }
      
      setUploadResults(results);
      toast.success(`Successfully uploaded ${results.length} document(s)!`);
      
      // Wait a bit then move to results step
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
      
    } catch (error) {
      toast.error('Some uploads failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setCurrentStep(0);
    setUploadProgress({});
    setWorkflowStatus({});
    setUploadResults([]);
    setUploading(false);
  };


  return (
    <Container maxWidth="xl" sx={{ 
      mt: 4, 
      mb: 4,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box mb={4}>
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
            Document Upload & Analysis
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Upload your legal documents for AI-powered analysis with enterprise-grade security
          </Typography>
        </Box>
        
        {/* System Status */}
        <Box mb={4}>
          <Alert 
            severity='success'
            sx={{ borderRadius: 3 }}
          >
            ✅ System ready for document upload and analysis
          </Alert>
        </Box>

        {/* Progress Stepper */}
        <Fade in timeout={800}>
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Stepper activeStep={currentStep} orientation="horizontal" alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '1rem',
                        fontWeight: 500,
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Fade>

        <AnimatePresence mode="wait">
          {/* Step 0 & 1: File Selection */}
          {(currentStep === 0 || currentStep === 1) && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <MotionPaper
                {...getRootProps()}
                elevation={isDragActive ? 8 : 2}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: `2px dashed ${
                    isDragReject ? theme.palette.error.main :
                    isDragActive ? theme.palette.primary.main :
                    theme.palette.grey[300]
                  }`,
                  bgcolor: isDragActive ? 'primary.main08' : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'primary.main04',
                    borderColor: 'primary.main',
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input {...getInputProps()} ref={fileInputRef} />
                
                <motion.div
                  animate={{ 
                    y: isDragActive ? -10 : 0,
                    scale: isDragActive ? 1.1 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CloudUpload 
                    sx={{ 
                      fontSize: 80, 
                      color: isDragActive ? 'primary.main' : 'grey.400',
                      mb: 2 
                    }} 
                  />
                </motion.div>
                
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {isDragActive ? 'Drop files here' : 'Upload Legal Documents'}
                </Typography>
                
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                  Drag and drop your files here, or click to browse
                </Typography>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CloudUpload />}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  }}
                >
                  Choose Files
                </Button>
                
                <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.secondary' }}>
                  Supported formats: PDF, DOCX, TXT • Max size: 50MB per file
                </Typography>
              </MotionPaper>

              {/* File List */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Paper elevation={2} sx={{ mt: 3, borderRadius: 3 }}>
                      <Box p={3}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <Description sx={{ mr: 1 }} />
                          Selected Files ({files.length})
                        </Typography>
                        
                        <List>
                          {files.map((fileItem, index) => (
                            <motion.div
                              key={fileItem.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <ListItem
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'grey.200',
                                  borderRadius: 2,
                                  mb: 1,
                                  bgcolor: 'background.paper',
                                }}
                              >
                                <ListItemIcon>
                                  {getFileIcon(fileItem.file.name)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Typography variant="subtitle1" fontWeight={500}>
                                      {fileItem.file.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="textSecondary">
                                        {formatFileSize(fileItem.file.size)} • {fileItem.file.type || 'Unknown type'}
                                      </Typography>
                                      {uploadProgress[fileItem.id] !== undefined && (
                                        <Box mt={1}>
                                          <LinearProgress 
                                            variant="determinate" 
                                            value={uploadProgress[fileItem.id]} 
                                            sx={{ borderRadius: 1 }}
                                          />
                                          <Typography variant="caption" color="textSecondary">
                                            {Math.round(uploadProgress[fileItem.id])}% uploaded
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  }
                                />
                                <Box display="flex" gap={1} alignItems="center">
                                  <Chip
                                    label={fileItem.status}
                                    color={
                                      fileItem.status === 'ready' ? 'default' :
                                      fileItem.status === 'uploading' ? 'primary' :
                                      fileItem.status === 'uploaded' ? 'info' :
                                      fileItem.status === 'completed' ? 'success' : 'error'
                                    }
                                    size="small"
                                    icon={
                                      fileItem.status === 'completed' ? <CheckCircle /> :
                                      fileItem.status === 'error' ? <Error /> :
                                      fileItem.status === 'uploading' ? <CircularProgress size={16} /> : null
                                    }
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => removeFile(fileItem.id)}
                                    disabled={fileItem.status === 'uploading'}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            </motion.div>
                          ))}
                        </List>

                        <Box mt={3} display="flex" gap={2} justifyContent="center">
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleUploadAll}
                            disabled={uploading || files.length === 0 || files.every(f => f.status !== 'ready')}
                            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                            sx={{
                              px: 4,
                              py: 1.5,
                              borderRadius: 2,
                              background: 'linear-gradient(45deg, #4caf50, #81c784)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #43a047, #66bb6a)'
                              }
                            }}
                          >
                            {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'ready').length} File(s)`}
                          </Button>
                          
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={resetUpload}
                            startIcon={<Refresh />}
                            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                          >
                            Reset
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Step 2: Processing */}
          {currentStep === 2 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <MotionCard
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                sx={{ borderRadius: 3 }}
              >
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Analytics sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  </motion.div>
                  
                  <Typography variant="h5" gutterBottom fontWeight={600}>
                    Processing Documents
                  </Typography>
                  
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                    Our AI is analyzing your documents for risks, clauses, and compliance issues.
                    This may take a few moments.
                  </Typography>
                  
                  <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                    {files.map((fileItem) => (
                      workflowStatus[fileItem.id] && (
                        <Box key={fileItem.id} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2">{fileItem.file.name}</Typography>
                            <Typography variant="caption" color="primary">
                              {Math.round(workflowStatus[fileItem.id].progress || 0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={workflowStatus[fileItem.id].progress || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                            {workflowStatus[fileItem.id].current_step || 'Initializing...'}
                          </Typography>
                        </Box>
                      )
                    ))}
                  </Box>
                </CardContent>
              </MotionCard>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <MotionCard
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                sx={{ borderRadius: 3 }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box textAlign="center" mb={4}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    >
                      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                    </motion.div>
                    
                    <Typography variant="h4" gutterBottom fontWeight={600} color="success.main">
                      Upload Successful!
                    </Typography>
                    
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                      Your documents have been uploaded and are being processed. 
                      You can view the progress and results in your dashboard.
                    </Typography>
                  </Box>

                  {/* Results Summary */}
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Processing Summary
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={2}>
                      <Box textAlign="center">
                        <Typography variant="h3" fontWeight="bold" color="primary.main">
                          {uploadResults.length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Files Uploaded
                        </Typography>
                      </Box>
                      
                      <Box textAlign="center">
                        <Typography variant="h3" fontWeight="bold" color="success.main">
                          {files.filter(f => f.status === 'completed').length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Completed
                        </Typography>
                      </Box>
                      
                      <Box textAlign="center">
                        <Typography variant="h3" fontWeight="bold" color="info.main">
                          ~2-3
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Minutes ETA
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => window.location.href = '/documents'}
                      startIcon={<Description />}
                      sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                      View Documents
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => window.location.href = '/'}
                      startIcon={<Timeline />}
                      sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                      Go to Dashboard
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={resetUpload}
                      startIcon={<CloudUpload />}
                      sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                      Upload More
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Notice */}
        <Slide in timeout={1000}>
          <Alert 
            severity="info" 
            icon={<Security />}
            sx={{ 
              mt: 4,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: 24,
              },
            }}
          >
            <AlertTitle>Security & Privacy</AlertTitle>
            All uploaded documents are encrypted in transit and at rest. 
            PII is automatically detected and redacted before AI processing. 
            Your data is never used for training external models.
          </Alert>
        </Slide>
      </MotionBox>
    </Container>
  );
};

export default DocumentUpload;
