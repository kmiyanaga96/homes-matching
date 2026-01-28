import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasPermission, isAdmin, isExecutive } from '../lib/constants';
import { API } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("homes_logged_in") === "1";
  });

  const [auth, setAuthState] = useState(() => ({
    id: localStorage.getItem("auth_id") || "",
    pass: localStorage.getItem("auth_pass") || ""
  }));

  const [roles, setRoles] = useState(() => {
    const stored = localStorage.getItem("auth_roles");
    return stored ? JSON.parse(stored) : [];
  });

  const [isFirstLogin, setIsFirstLogin] = useState(() => {
    return localStorage.getItem("homes_first_login") === "1";
  });

  const login = (id, pass, firstLogin = false) => {
    setIsLoggedIn(true);
    setAuthState({ id, pass });
    localStorage.setItem("homes_logged_in", "1");
    localStorage.setItem("auth_id", id);
    localStorage.setItem("auth_pass", pass);
    localStorage.setItem("homes_login_id", id);

    if (firstLogin) {
      localStorage.setItem("homes_first_login", "1");
      setIsFirstLogin(true);
    } else {
      localStorage.removeItem("homes_first_login");
      setIsFirstLogin(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setAuthState({ id: "", pass: "" });
    setRoles([]);
    setIsFirstLogin(false);
    localStorage.removeItem("homes_logged_in");
    localStorage.removeItem("auth_id");
    localStorage.removeItem("auth_pass");
    localStorage.removeItem("homes_login_id");
    localStorage.removeItem("homes_first_login");
    localStorage.removeItem("auth_roles");
  };

  const clearFirstLogin = () => {
    localStorage.removeItem("homes_first_login");
    setIsFirstLogin(false);
  };

  const hasAuth = () => {
    return !!auth.id && !!auth.pass;
  };

  // ログイン時にFirestoreからrolesを取得
  const fetchRoles = useCallback(async () => {
    if (!auth.id) return;
    try {
      const member = await API.getMember(auth.id);
      const memberRoles = member?.roles || [];
      setRoles(memberRoles);
      localStorage.setItem("auth_roles", JSON.stringify(memberRoles));
    } catch (e) {
      console.error("[AuthContext] fetchRoles error:", e);
    }
  }, [auth.id]);

  useEffect(() => {
    if (isLoggedIn && hasAuth()) {
      fetchRoles();
    }
  }, [isLoggedIn, fetchRoles]);

  // Check auth consistency on mount
  useEffect(() => {
    if (isLoggedIn && !hasAuth()) {
      logout();
    }
  }, []);

  // 権限チェックヘルパー
  const checkPermission = useCallback((permission) => {
    return hasPermission(roles, permission);
  }, [roles]);

  const checkAdmin = useCallback(() => {
    return isAdmin(roles);
  }, [roles]);

  const checkExecutive = useCallback(() => {
    return isExecutive(roles);
  }, [roles]);

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      auth,
      roles,
      isFirstLogin,
      login,
      logout,
      hasAuth,
      clearFirstLogin,
      fetchRoles,
      checkPermission,
      checkAdmin,
      checkExecutive,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
