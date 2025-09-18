import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Security,
  Analytics,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [workflowId, setWorkflowId] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  const handleFileUpload = async (file) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiService.uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('completed');
      
      const { document_id, workflow_id, redaction_summary } = response.data;
      setUploadedDocument({
        id: document_id,
        name: file.name,
        size: file.size,
        redaction_summary,
      });
      setWorkflowId(workflow_id);

    } catch (error) {
      setUploadStatus('error');
      setUploadError(error.response?.data?.detail || 'Upload failed');
    }
  };

  const steps = [
    'Upload Document',
    'Security Scan',
    'PII Redaction', 
    'AI Analysis',
    'Results Ready'
  ];

  const getCurrentStep = () => {
    switch (uploadStatus) {
      case 'uploading': return 0;
      case 'processing': return 2;
      case 'completed': return 4;
      case 'error': return 0;
      default: return 0;
    }
  };

  const UploadZone = () => (
    <Paper
      {...getRootProps()}
      sx={{
        p: 6,
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        cursor: 'pointer',
        textAlign: 'center',
        bgcolor: isDragActive ? 'primary.50' : 'background.paper',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.50',
        },
      }}
    >
      <input {...getInputProps()} />
      <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {isDragActive ? 'Drop your document here' : 'Upload Legal Document'}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Drag and drop your file here, or click to browse
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Supported formats: PDF, DOCX, TXT (Max: 50MB)
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<CloudUpload />}
        sx={{ mt: 2 }}
      >
        Choose File
      </Button>
    </Paper>
  );

  const SecurityFeatures = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 1 }} />
          Security & Privacy Features
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Automatic PII Detection & Redaction"
              secondary="Removes names, addresses, phone numbers, and other sensitive information"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="End-to-End Encryption"
              secondary="Your documents are encrypted in transit and at rest"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Privacy-First AI Processing"
              secondary="No data retention or training on your content"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Secure Document Storage"
              secondary="Documents are stored securely with controlled access"
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const UploadProgress = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Processing Your Document
        </Typography>
        
        <Stepper activeStep={getCurrentStep()} sx={{ mt: 3, mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
        />
        <Typography variant="body2" color="textSecondary" align="center">
          {uploadProgress}% Complete
        </Typography>
      </CardContent>
    </Card>
  );

  const UploadResults = () => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircle color="success" sx={{ mr: 1 }} />
          Upload Successful
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          Your document has been uploaded and is being processed. You can now view the analysis results.
        </Alert>

        {uploadedDocument && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Document Information:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText
                  primary={uploadedDocument.name}
                  secondary={`Size: ${(uploadedDocument.size / 1024).toFixed(1)} KB`}
                />
              </ListItem>
            </List>

            {uploadedDocument.redaction_summary && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Security Analysis:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Security />}
                    label={`${uploadedDocument.redaction_summary.entities_detected || 0} PII items detected`}
                    color="info"
                    size="small"
                  />
                  <Chip
                    icon={<CheckCircle />}
                    label="Document encrypted"
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => navigate(`/workflow/${workflowId}`)}
          >
            View Analysis Results
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/documents')}
          >
            Go to Documents
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setUploadStatus('idle');
              setUploadProgress(0);
              setUploadError('');
              setUploadedDocument(null);
            }}
          >
            Upload Another Document
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, ml: { md: '240px' }, width: { md: 'calc(100% - 240px)' } }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          Upload Legal Document
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Upload your legal document for AI-powered analysis, risk assessment, and compliance checking.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {uploadStatus === 'idle' && <UploadZone />}
          {(uploadStatus === 'uploading' || uploadStatus === 'processing') && <UploadProgress />}
          {uploadStatus === 'completed' && <UploadResults />}
          
          {uploadError && (
            <Alert 
              severity="error" 
              sx={{ mt: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => {
                    setUploadStatus('idle');
                    setUploadError('');
                  }}
                >
                  Try Again
                </Button>
              }
            >
              {uploadError}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <SecurityFeatures />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DocumentUpload;
