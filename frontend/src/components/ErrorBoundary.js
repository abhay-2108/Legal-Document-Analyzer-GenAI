import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                maxWidth: 600,
                width: '100%',
              }}
            >
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Something went wrong</AlertTitle>
                We're sorry, but something unexpected happened. Please try refreshing the page or going back to the home page.
              </Alert>

              <Typography variant="h4" gutterBottom color="error">
                Oops! Something went wrong
              </Typography>

              <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                The application encountered an error and couldn't recover. 
                This has been logged and our team will investigate.
              </Typography>

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  size="large"
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Go Home
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && (
                <Box mt={4}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Error Details (Development Mode):
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
