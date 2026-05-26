import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const decodeUserFromToken = (token) => {
  const decoded = jwtDecode(token);

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

const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
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
      setUser(decodedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(decodedUser));
    } catch {
      logout();
    }
  }, [logout, token]);

  const login = useCallback((nextToken) => {
    const decodedUser = decodeUserFromToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(decodedUser));
    setToken(nextToken);
    setUser(decodedUser);
  }, []);

  const hasRole = useCallback(
    (role) => {
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

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      isAdmin: () => hasRole("ADMIN"),
      hasRole
    }),
    [hasRole, login, logout, token, user]
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
