import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as apiLogin, registerUser as apiRegister, getCurrentUser as apiGetCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('rcm_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('rcm_auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('rcm_auth_token');
      if (savedToken) {
        try {
          const res = await apiGetCurrentUser();
          if (res?.data) {
            setUser((prev) => ({ ...prev, ...res.data }));
            localStorage.setItem('rcm_user', JSON.stringify({ ...user, ...res.data }));
          }
        } catch (err) {
          // Token might be expired or backend is using local demo
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    const data = res.data;

    const authToken = data.token;
    const authUser = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      companyId: data.companyId,
      companyName: data.companyName,
      accountStatus: data.accountStatus
    };

    localStorage.setItem('rcm_auth_token', authToken);
    localStorage.setItem('rcm_user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);

    return authUser;
  };

  const register = async (formData) => {
    const res = await apiRegister(formData);
    const data = res.data;

    if (data.token) {
      const authToken = data.token;
      const authUser = {
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.companyId,
        companyName: data.companyName,
        accountStatus: data.accountStatus
      };

      localStorage.setItem('rcm_auth_token', authToken);
      localStorage.setItem('rcm_user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

      return authUser;
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('rcm_auth_token');
    localStorage.removeItem('rcm_user');
    setToken(null);
    setUser(null);
  };

  const isRcmAdmin = () => user?.role === 'RCM_ADMIN';
  const isInsuranceCompany = () => user?.role === 'INSURANCE_COMPANY';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        isRcmAdmin,
        isInsuranceCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
