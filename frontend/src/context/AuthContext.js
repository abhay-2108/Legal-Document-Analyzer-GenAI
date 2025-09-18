import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      apiService.setToken(token);
      // In a real app, you'd validate the token here
      setUser({ id: 'demo_user', email: 'demo@example.com', name: 'Demo User' });
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/login', credentials);
      const { access_token } = response.data;
      
      setToken(access_token);
      localStorage.setItem('token', access_token);
      apiService.setToken(access_token);
      
      // Set user info (in real app, get from token or API)
      setUser({ id: 'demo_user', email: 'demo@example.com', name: 'Demo User' });
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    apiService.setToken(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
