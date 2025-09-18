import axios from 'axios';

// Dynamic API URL based on environment
const getApiBaseUrl = () => {
  // If explicitly set via environment variable, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If running in production (Vercel), use the backend Vercel URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_BACKEND_URL || 'https://your-backend-app.vercel.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // No authentication required
  }

  // Authentication methods removed

  // Document endpoints
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getDocuments(offset = 0, limit = 50) {
    return this.api.get(`/documents?offset=${offset}&limit=${limit}`);
  }

  async deleteDocument(documentId) {
    return this.api.delete(`/documents/${documentId}`);
  }

  // Get document details
  async getDocumentDetails(documentId) {
    try {
      const response = await this.api.get(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw new Error('Failed to fetch document details');
    }
  }

  // Ask question about document
  async askQuestion(documentId, question) {
    try {
      const response = await this.api.post(`/documents/${documentId}/question`, {
        document_id: documentId,
        question: question
      });
      return response.data;
    } catch (error) {
      console.error('Error asking question:', error);
      throw new Error('Failed to ask question');
    }
  }

  // Export document analysis
  async exportDocument(documentId, format = 'json', sections = ['summary', 'risks', 'recommendations']) {
    try {
      const response = await this.api.post(`/documents/${documentId}/export`, {
        document_id: documentId,
        format: format,
        sections: sections
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting document:', error);
      throw new Error('Failed to export document');
    }
  }

  // Workflow endpoints
  async getWorkflowStatus(workflowId) {
    return this.api.get(`/workflows/${workflowId}/status`);
  }

  async getWorkflowResults(workflowId) {
    return this.api.get(`/workflows/${workflowId}/results`);
  }

  // Analytics endpoints
  async getDashboardAnalytics() {
    return this.api.get('/analytics/dashboard');
  }

  async getDetailedAnalytics() {
    return this.api.get('/analytics/detailed');
  }

  // Query endpoints
  async queryDocument(query) {
    return this.api.post('/query', query);
  }

  // Health check
  async healthCheck() {
    return this.api.get('/health');
  }

  // Statistics (admin)
  async getStatistics() {
    return this.api.get('/statistics');
  }

  async clearCache() {
    return this.api.post('/admin/clear-cache');
  }

  // Generic methods
  async get(url, config = {}) {
    return this.api.get(url, config);
  }

  async post(url, data, config = {}) {
    return this.api.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return this.api.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.api.delete(url, config);
  }
}

export const apiService = new ApiService();
export default apiService;
