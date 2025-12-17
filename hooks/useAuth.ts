'use client';

import { useAuth } from '@/contexts/AuthContext';

export const useAuthCheck = () => {
  const { user, token, isLoading } = useAuth();
  
  return {
    isAuthenticated: !!user && !!token,
    user,
    token,
    isLoading,
  };
};