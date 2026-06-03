import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

import { Role, User } from "../types";

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type DecodedToken = User & {
  exp?: number;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (nextToken: string) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  hasRole: (role: Role | Role[]) => boolean;
};

const decodeUserFromToken = (token: string): User => {
  const decoded = jwtDecode<DecodedToken>(token);

  if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
    throw new Error("Session expired");
  }

  return {
    id: decoded.id,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
    email: decoded.email,
    role: decoded.role,
    exp: decoded.exp
  };
};

const getSavedUser = (): User | null => {
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(getSavedUser);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    try {
      const decodedUser = decodeUserFromToken(token);
      const savedUser = getSavedUser();
      const nextUser = savedUser?.id === decodedUser.id ? { ...decodedUser, firstName: savedUser.firstName, lastName: savedUser.lastName } : decodedUser;
      setUser(nextUser);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      logout();
    }
  }, [logout, token]);

  const login = useCallback((nextToken: string) => {
    const decodedUser = decodeUserFromToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(decodedUser));
    setToken(nextToken);
    setUser(decodedUser);
  }, []);

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = { ...currentUser, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const hasRole = useCallback(
    (role: Role | Role[]) => {
      if (!user?.role) {
        return false;
      }

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateCurrentUser,
      isAdmin: () => hasRole("ADMIN"),
      hasRole
    }),
    [hasRole, login, logout, token, updateCurrentUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
