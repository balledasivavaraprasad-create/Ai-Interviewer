import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('aura_auth_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('aura_auth_token', token);
    } else {
      localStorage.removeItem('aura_auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aura_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aura_user');
    }
  }, [user]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, role, organizationId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, organizationId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup initiation failed');
      return { success: true, email: data.email, message: data.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed');

      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email) => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Could not resend OTP');
    return { success: true, message: data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem('aura_user');
  };

  const loginDemoCandidate = async () => {
    return login('candidate@demo.local', 'Candidate2026!', 'CANDIDATE');
  };

  const loginDemoRecruiter = async () => {
    return login('recruiter@aurelia-demo.local', 'Aurelia2026!', 'RECRUITER');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        logout,
        loginDemoCandidate,
        loginDemoRecruiter,
        isAuthenticated: !!token && !!user,
        isRecruiter: user?.role === 'RECRUITER',
        isCandidate: user?.role === 'CANDIDATE'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
