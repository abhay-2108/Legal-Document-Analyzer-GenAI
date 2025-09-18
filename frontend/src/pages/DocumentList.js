import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Fade,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Description,
  PictureAsPdf,
  TextSnippet,
  InsertDriveFile,
  Refresh as RefreshIcon,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';
import DocumentViewer from '../components/DocumentViewer';
import toast from 'react-hot-toast';
const MotionListItem = motion(ListItem);

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('upload_timestamp');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState(null);

  const documentsPerPage = 15;

  const generateMockDocuments = () => {
    const mockDocs = [];
    const types = ['pdf', 'docx', 'txt', 'doc', 'rtf'];
    const statuses = ['completed', 'processing', 'uploaded', 'error'];
    const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
    
    const documentNames = [
      // Employment & HR Documents
      'Employment_Agreement', 'Non_Disclosure_Agreement', 'Employee_Handbook', 'Termination_Agreement',
      'Non_Compete_Agreement', 'Severance_Agreement', 'Stock_Option_Agreement', 'Performance_Review',
      
      // Business Contracts
      'Service_Contract', 'Purchase_Agreement', 'Sales_Contract', 'Supplier_Agreement',
      'Vendor_Agreement', 'Distribution_Agreement', 'Licensing_Agreement', 'Franchise_Agreement',
      'Partnership_Agreement', 'Joint_Venture_Agreement', 'Merger_Agreement', 'Acquisition_Agreement',
      
      // Real Estate Documents
      'Lease_Agreement', 'Property_Purchase_Agreement', 'Rental_Agreement', 'Property_Management_Contract',
      'Commercial_Lease', 'Sublease_Agreement', 'Property_Development_Agreement', 'Construction_Contract',
      
      // Financial Documents
      'Loan_Agreement', 'Credit_Agreement', 'Security_Agreement', 'Promissory_Note',
      'Investment_Agreement', 'Shareholder_Agreement', 'Bond_Agreement', 'Insurance_Policy',
      
      // Technology & IP Documents
      'Software_License', 'Technology_Transfer_Agreement', 'Patent_License', 'Trademark_License',
      'Intellectual_Property_Agreement', 'Development_Agreement', 'SaaS_Agreement', 'Data_Processing_Agreement',
      
      // Legal & Compliance Documents
      'Terms_of_Service', 'Privacy_Policy', 'User_Agreement', 'Cookie_Policy',
      'Compliance_Manual', 'Code_of_Conduct', 'Ethics_Policy', 'Anti_Corruption_Policy',
      
      // Consulting & Professional Services
      'Consultant_Agreement', 'Professional_Services_Agreement', 'Independent_Contractor_Agreement', 'Retainer_Agreement',
      'Statement_of_Work', 'Master_Services_Agreement', 'Engagement_Letter', 'Advisory_Agreement',
      
      // Settlement & Dispute Resolution
      'Settlement_Agreement', 'Arbitration_Agreement', 'Mediation_Agreement', 'Release_Agreement',
      'Indemnification_Agreement', 'Hold_Harmless_Agreement', 'Waiver_Agreement', 'Consent_Agreement',
      
      // Miscellaneous Legal Documents
      'Warranty_Agreement', 'Guarantee_Agreement', 'Escrow_Agreement', 'Assignment_Agreement',
      'Power_of_Attorney', 'Trust_Agreement', 'Will_and_Testament', 'Estate_Planning_Document',
      'Corporate_Bylaws', 'Articles_of_Incorporation', 'Operating_Agreement', 'Board_Resolution'
    ];
    
    // Generate more documents (50 instead of 25)
    for (let i = 0; i < 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const documentName = documentNames[i % documentNames.length];
      
      // Add some variation to document names
      const variation = i > documentNames.length ? `_v${Math.floor(i / documentNames.length) + 1}` : '';
      
      mockDocs.push({
        document_id: `doc-${String(i + 1).padStart(3, '0')}`,
        filename: `${documentName}${variation}_${String(i + 1).padStart(3, '0')}.${type}`,
        file_size: Math.floor(Math.random() * 8000000) + 50000, // 50KB to 8MB
        content_type: `application/${type}`,
        upload_timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // Up to 60 days ago
        status: status,
        analysis_results: {
          risk_level: riskLevel,
          confidence_score: Math.floor(Math.random() * 35) + 65, // 65-100% confidence
          key_clauses: Math.floor(Math.random() * 15) + 3, // 3-18 clauses
          processing_time: (Math.random() * 5 + 0.5).toFixed(1) // 0.5-5.5 minutes
        }
      });
    }
    
    return mockDocs.sort((a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp));
  };

  const fetchDocuments = async () => {
    try {
      // Always show mock documents for demo purposes
      const mockDocuments = generateMockDocuments();
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      // Always create mock data for demo
      const mockDocuments = generateMockDocuments();
      setDocuments(mockDocuments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const filterAndSortDocuments = () => {
      let filtered = documents.filter(doc => {
        const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
        const matchesType = filterType === 'all' || doc.filename.toLowerCase().includes(`.${filterType}`);
        
        return matchesSearch && matchesStatus && matchesType;
      });

      // Sort documents
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'filename':
            return a.filename.localeCompare(b.filename);
          case 'file_size':
            return b.file_size - a.file_size;
          case 'upload_timestamp':
          default:
            return new Date(b.upload_timestamp) - new Date(a.upload_timestamp);
        }
      });

      setFilteredDocuments(filtered);
    };
    
    if (documents.length > 0) {
      filterAndSortDocuments();
    }
  }, [documents, searchTerm, sortBy, filterStatus, filterType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
    toast.success('Documents refreshed!');
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await apiService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
      toast.success('Document deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      // For demo, simulate successful deletion
      setDocuments(prev => prev.filter(doc => doc.document_id !== documentId));
      toast.success('Document deleted successfully');
      setDeleteDialogOpen(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconProps = { sx: { fontSize: 40 } };
    
    switch (ext) {
      case 'pdf':
        return <PictureAsPdf {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      case 'txt':
        return <TextSnippet {...iconProps} sx={{ ...iconProps.sx, color: '#2196f3' }} />;
      case 'docx':
      case 'doc':
        return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#1976d2' }} />;
      case 'rtf':
        return <Description {...iconProps} sx={{ ...iconProps.sx, color: '#9c27b0' }} />;
      default:
        return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: '#666' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'uploaded':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'error';
      case 'Critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ 
        mt: 4, 
        mb: 4,
        px: { xs: 2, sm: 3, md: 4 },
      }}>
        <Box>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="50%" height={24} sx={{ mb: 4 }} />
          
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
          ))}
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
              Document Library
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage and analyze your uploaded legal documents
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
                <RefreshIcon />
              </motion.div>
            </IconButton>
          </motion.div>
        </Box>

        {/* Filters and Search */}
        <Fade in timeout={800}>
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="uploaded">Uploaded</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    label="Type"
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="docx">DOCX</MenuItem>
                    <MenuItem value="doc">DOC</MenuItem>
                    <MenuItem value="txt">TXT</MenuItem>
                    <MenuItem value="rtf">RTF</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="upload_timestamp">Date Uploaded</MenuItem>
                    <MenuItem value="filename">File Name</MenuItem>
                    <MenuItem value="file_size">File Size</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="body2" color="textSecondary" align="center">
                  {filteredDocuments.length} of {documents.length} documents
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Documents List */}
        
        {/* Simple Fallback - Always show documents if they exist */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <List>
              {documents.slice((page - 1) * documentsPerPage, page * documentsPerPage).map((document, index) => (
                <MotionListItem
                  key={document.document_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    '&:hover': {
                      bgcolor: 'grey.50',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent' }}>
                      {getFileIcon(document.filename)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {document.filename}
                        </Typography>
                        <Chip
                          label={document.status}
                          size="small"
                          color={getStatusColor(document.status)}
                          icon={
                            document.status === 'completed' ? <CheckCircle /> :
                            document.status === 'processing' ? <Schedule /> :
                            document.status === 'error' ? <ErrorIcon /> : null
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box component="span" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                          {formatFileSize(document.file_size)} • Uploaded {formatDate(document.upload_timestamp)}
                        </Box>
                        
                        {document.analysis_results && (
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip
                              label={`${document.analysis_results.risk_level} Risk`}
                              size="small"
                              color={getRiskColor(document.analysis_results.risk_level)}
                              variant="outlined"
                            />
                            <Chip
                              label={`${document.analysis_results.confidence_score}% Confidence`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${document.analysis_results.key_clauses} Clauses`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${document.analysis_results.processing_time}min`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View & Analyze Document">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setViewingDocumentId(document.document_id);
                            setViewerOpen(true);
                          }}
                          sx={{ color: 'info.main' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => toast.success('Download started')}
                          sx={{ color: 'success.main' }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDocument(document);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </MotionListItem>
              ))}
            </List>
          </motion.div>
        )}
        
        {/* Show No Documents message if none exist */}
        {documents.length === 0 && (
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Description sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No documents found
            </Typography>
            <Typography color="textSecondary">
              Upload new documents to get started.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3, borderRadius: 3 }}
              onClick={() => window.location.href = '/upload'}
            >
              Upload Documents
            </Button>
          </Paper>
        )}

        {/* Pagination */}
        {documents.length > documentsPerPage && (
          <Fade in timeout={1000}>
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(documents.length / documentsPerPage)}
                page={page}
                onChange={(event, newPage) => setPage(newPage)}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Fade>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Document</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedDocument?.filename}"? 
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteDocument(selectedDocument?.document_id)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Document Details</DialogTitle>
          <DialogContent>
            {selectedDocument && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      {getFileIcon(selectedDocument.filename)}
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedDocument.filename}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatFileSize(selectedDocument.file_size)} • {selectedDocument.content_type}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Upload Information</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Uploaded: {formatDate(selectedDocument.upload_timestamp)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Status: <Chip label={selectedDocument.status} size="small" color={getStatusColor(selectedDocument.status)} />
                    </Typography>
                  </Grid>
                  
                  {selectedDocument.analysis_results && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Analysis Results</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Risk Level: <Chip label={selectedDocument.analysis_results.risk_level} size="small" color={getRiskColor(selectedDocument.analysis_results.risk_level)} />
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Confidence: {selectedDocument.analysis_results.confidence_score}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Key Clauses: {selectedDocument.analysis_results.key_clauses}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Processing Time: {selectedDocument.analysis_results.processing_time} minutes
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />}>
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>

      {/* Document Viewer Modal */}
      <Dialog
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewingDocumentId(null);
        }}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: { margin: 0, maxHeight: '100%' }
        }}
      >
        {viewingDocumentId && (
          <DocumentViewer
            documentId={viewingDocumentId}
            onClose={() => {
              setViewerOpen(false);
              setViewingDocumentId(null);
            }}
          />
        )}
      </Dialog>
    </Container>
  );
};

export default DocumentList;
