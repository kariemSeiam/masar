'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { normalizePhoneNumber } from '@/lib/utils/phone';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { handleError } from '@/lib/utils/errors';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, name?: string) => Promise<void>;
  logout: () => void;
  updateName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        handleError(error, 'UserContext.loadUser');
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        try {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
          handleError(error, 'UserContext.saveUser');
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_KEYS.USER);
        } catch (error) {
          handleError(error, 'UserContext.removeUser');
        }
      }
    }
  }, [user]);

  const login = useCallback(async (phone: string, name?: string) => {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Check if user exists in localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
          const existingUser = JSON.parse(storedUser);
          if (existingUser.phone === normalizedPhone) {
            // User exists, update name if provided
            if (name && name.trim()) {
              setUser({
                ...existingUser,
                name: name.trim(),
              });
            } else {
              setUser(existingUser);
            }
            return;
          }
        }
      } catch (error) {
        handleError(error, 'UserContext.checkExistingUser');
      }
    }

    // New user - create user object
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: normalizedPhone,
      name: name || '',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateName = useCallback((name: string) => {
    if (user) {
      setUser({
        ...user,
        name: name.trim(),
      });
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

