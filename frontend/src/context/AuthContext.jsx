import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('fh_user');
    const token = localStorage.getItem('fh_token');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data; // expecting { message, requiresOtp, email }
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const { token, user } = res.data;
    
    localStorage.setItem('fh_token', token);
    localStorage.setItem('fh_user', JSON.stringify(user));
    setCurrentUser(user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('fh_token');
    localStorage.removeItem('fh_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
