import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sdms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sdms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/profile')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('sdms_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('sdms_token');
        localStorage.removeItem('sdms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('sdms_token', res.data.token);
    localStorage.setItem('sdms_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('sdms_token');
    localStorage.removeItem('sdms_user');
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
