import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar
} from '@mui/material';
import {
  Send as SendIcon,
  QuestionAnswer as QAIcon,
  Search as SearchIcon,
  Highlight as HighlightIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  SmartToy as AIIcon,
  Psychology as InsightIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const DocumentViewer = ({ documentId, onClose }) => {
  const [document, setDocument] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Q&A System State
  const [question, setQuestion] = useState('');
  const [qaHistory, setQAHistory] = useState([]);
  const [askingQuestion, setAskingQuestion] = useState(false);
  
  // Document Display State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('analysis'); // analysis, raw, structured
  
  // Interactive Features
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [bookmarks, setBookmarks] = useState([]);
  
  const qaContainerRef = useRef(null);
  const documentContentRef = useRef(null);

  // Predefined question suggestions
  const suggestedQuestions = [
    "What are the main risks in this document?",
    "What are my obligations under this agreement?",
    "What are the termination conditions?",
    "Are there any unusual or unfavorable terms?",
    "What are the payment terms and deadlines?",
    "What happens if I breach this contract?",
    "Are there any automatic renewal clauses?",
    "What are the liability limitations?",
    "What governing law applies to this document?",
    "What are the key deadlines I need to know about?"
  ];

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDocumentDetails(documentId);
        
        // The API returns document data directly, not nested in a document property
        setDocument(response);
        setAnalysisResults(response);
        
        // Load any existing Q&A history from localStorage
        const savedQA = localStorage.getItem(`qa_${documentId}`);
        if (savedQA) {
          setQAHistory(JSON.parse(savedQA));
        }
        
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document details');
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [documentId]);

  useEffect(() => {
    if (qaContainerRef.current) {
      qaContainerRef.current.scrollTop = qaContainerRef.current.scrollHeight;
    }
  }, [qaHistory]);


  const handleAskQuestion = async () => {
    if (!question.trim() || askingQuestion) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setAskingQuestion(true);

    // Add question to history immediately
    const newQA = {
      id: Date.now(),
      question: currentQuestion,
      answer: null,
      timestamp: new Date().toISOString(),
      loading: true
    };

    const updatedHistory = [...qaHistory, newQA];
    setQAHistory(updatedHistory);

    try {
      const response = await apiService.askQuestion(documentId, currentQuestion);
      
      // Update the answer in history
      const finalHistory = updatedHistory.map(qa => 
        qa.id === newQA.id 
          ? { ...qa, answer: response.answer, loading: false }
          : qa
      );
      
      setQAHistory(finalHistory);
      
      // Save to localStorage
      localStorage.setItem(`qa_${documentId}`, JSON.stringify(finalHistory));
      
      toast.success('Question answered!');
      
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Update with error state
      const errorHistory = updatedHistory.map(qa => 
        qa.id === newQA.id 
          ? { ...qa, answer: 'Sorry, I could not answer your question at this time. Please try again.', loading: false, error: true }
          : qa
      );
      
      setQAHistory(errorHistory);
      toast.error('Failed to get answer');
    } finally {
      setAskingQuestion(false);
    }
  };

  const handleSuggestedQuestion = (suggestedQ) => {
    setQuestion(suggestedQ);
  };

  const handleExportDocument = async () => {
    try {
      const response = await apiService.exportDocument(documentId, exportFormat, ['summary', 'risks', 'recommendations']);
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.filename}_analysis.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'txt') {
        const blob = new Blob([response.report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.filename}_analysis.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Document exported as ${exportFormat.toUpperCase()}`);
      setShowExportDialog(false);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const addBookmark = (text, section) => {
    const bookmark = {
      id: Date.now(),
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      section,
      timestamp: new Date().toISOString()
    };
    
    const updatedBookmarks = [...bookmarks, bookmark];
    setBookmarks(updatedBookmarks);
    localStorage.setItem(`bookmarks_${documentId}`, JSON.stringify(updatedBookmarks));
    toast.success('Bookmark added');
  };

  const renderDocumentContent = () => {
    if (!analysisResults) return null;

    // Use the mock data structure from the API
    const analysis = {
      summary: analysisResults.summary,
      key_clauses: analysisResults.key_clauses,
      risks: analysisResults.risks
    };

    switch (viewMode) {
      case 'analysis':
        return (
          <Box>
            {/* Executive Summary */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <InsightIcon color="primary" />
                  <Typography variant="h6">Executive Summary</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
                  {analysis.summary || 'Analysis in progress...'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<BookmarkIcon />}
                  onClick={() => addBookmark(analysis.summary, 'Executive Summary')}
                >
                  Bookmark
                </Button>
              </AccordionDetails>
            </Accordion>

            {/* Risk Assessment */}
            {analysis.risks && analysis.risks.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Badge 
                      badgeContent={analysis.risks.length} 
                      color="error"
                    >
                      <WarningIcon />
                    </Badge>
                    <Typography variant="h6">Risk Assessment</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Identified Risks:</strong> {analysis.risks.length} risks found
                    </Typography>
                    
                    <Box mt={2}>
                      <List>
                        {analysis.risks.map((risk, index) => (
                          <ListItem key={index} divider>
                            <ListItemIcon>
                              <Chip
                                size="small"
                                label={risk.level}
                                color={risk.level === 'High' || risk.level === 'Critical' ? 'error' : risk.level === 'Medium' ? 'warning' : 'success'}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={risk.type}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="textSecondary" paragraph>
                                    {risk.description}
                                  </Typography>
                                  {risk.recommendation && (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                                      Recommendation: {risk.recommendation}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Clauses Analysis */}
            {analysis.key_clauses && analysis.key_clauses.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <HighlightIcon color="primary" />
                    <Typography variant="h6">Key Clauses ({analysis.key_clauses.length})</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {analysis.key_clauses.map((clause, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                            <Typography variant="caption">{index + 1}</Typography>
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={clause}
                          secondary="Important clause identified in the document"
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Recommendations */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckIcon color="success" />
                  <Typography variant="h6">AI Recommendations</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="High" color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Review compliance requirements with legal counsel"
                      secondary="Recommended within 30 days"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="Medium" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Consider updating liability limitations"
                      secondary="Review during next contract revision"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Chip size="small" label="Low" color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Verify intellectual property clauses"
                      secondary="Optional enhancement"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        );

      case 'raw':
        return (
          <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {analysisResults.content || 'Document content not available'}
            </Typography>
          </Paper>
        );

      case 'structured':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Document Structure</Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              This is a structured view of the document with enhanced navigation and organization.
            </Typography>
            {/* Placeholder for structured view - would need backend support */}
            <Alert severity="info">
              Structured document view coming soon. This will provide an organized, navigable view of the document sections.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderQASystem = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Q&A Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Document Assistant</Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          Ask questions about this document and get instant AI-powered answers
        </Typography>
      </Box>

      {/* Suggested Questions */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>Suggested Questions:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {suggestedQuestions.slice(0, 6).map((suggestedQ, index) => (
            <Chip
              key={index}
              label={suggestedQ}
              size="small"
              variant="outlined"
              onClick={() => handleSuggestedQuestion(suggestedQ)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {/* Q&A History */}
      <Box 
        ref={qaContainerRef}
        sx={{ flex: 1, overflow: 'auto', p: 2 }}
      >
        {qaHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <QAIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="body2" color="textSecondary">
              No questions asked yet. Try asking about risks, obligations, or terms in the document.
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {qaHistory.map((qa) => (
              <motion.div
                key={qa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ mb: 3 }}>
                  {/* Question */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: '16px 16px 4px 16px'
                      }}
                    >
                      <Typography variant="body2">{qa.question}</Typography>
                    </Paper>
                  </Box>

                  {/* Answer */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        bgcolor: qa.error ? 'error.light' : 'grey.100',
                        borderRadius: '16px 16px 16px 4px'
                      }}
                    >
                      {qa.loading ? (
                        <Box>
                          <Skeleton variant="text" width="80%" />
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {qa.answer}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1, mt: 0.5, display: 'block' }}>
                    {new Date(qa.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>

      {/* Question Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask a question about this document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            disabled={askingQuestion}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleAskQuestion}
            disabled={!question.trim() || askingQuestion}
            sx={{ alignSelf: 'flex-end' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="90%" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" alignItems="center" justifyContent="between" gap={2}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {document?.filename}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                size="small"
                label={document?.status || 'Unknown'}
                color={document?.status === 'completed' ? 'success' : document?.status === 'failed' ? 'error' : 'warning'}
              />
              <Typography variant="caption" color="textSecondary">
                Uploaded: {document?.upload_timestamp ? new Date(document.upload_timestamp).toLocaleDateString() : 'Unknown'}
              </Typography>
            </Box>
          </Box>

          {/* View Mode Toggle */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              label="View"
            >
              <MenuItem value="analysis">Analysis</MenuItem>
              <MenuItem value="raw">Raw Text</MenuItem>
              <MenuItem value="structured">Structured</MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Box display="flex" gap={1}>
            <Tooltip title="Export Document">
              <IconButton onClick={() => setShowExportDialog(true)}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            {onClose && (
              <Tooltip title="Close">
                <IconButton onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Document Content */}
        <Box
          ref={documentContentRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            borderRight: 1,
            borderColor: 'divider'
          }}
        >
          {renderDocumentContent()}
        </Box>

        {/* Q&A System Sidebar */}
        <Box sx={{ width: 400, bgcolor: 'background.paper', borderLeft: 1, borderColor: 'divider' }}>
          {renderQASystem()}
        </Box>
      </Box>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)}>
        <DialogTitle>Export Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format"
            >
              <MenuItem value="json">JSON (Analysis Data)</MenuItem>
              <MenuItem value="txt">Text Report</MenuItem>
              <MenuItem value="pdf">PDF Report (Coming Soon)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExportDocument}
            variant="contained"
            disabled={exportFormat === 'pdf'}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentViewer;
