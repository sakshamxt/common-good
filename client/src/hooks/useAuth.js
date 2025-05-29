// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) { // Check for null as well since initial value is null
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};