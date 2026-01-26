import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("homes_logged_in") === "1";
  });

  const [auth, setAuthState] = useState(() => ({
    id: sessionStorage.getItem("auth_id") || "",
    pass: sessionStorage.getItem("auth_pass") || ""
  }));

  const [isFirstLogin, setIsFirstLogin] = useState(() => {
    return sessionStorage.getItem("homes_first_login") === "1";
  });

  const login = (id, pass, firstLogin = false) => {
    setIsLoggedIn(true);
    setAuthState({ id, pass });
    sessionStorage.setItem("homes_logged_in", "1");
    sessionStorage.setItem("auth_id", id);
    sessionStorage.setItem("auth_pass", pass);
    sessionStorage.setItem("homes_login_id", id);

    if (firstLogin) {
      sessionStorage.setItem("homes_first_login", "1");
      setIsFirstLogin(true);
    } else {
      sessionStorage.removeItem("homes_first_login");
      setIsFirstLogin(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setAuthState({ id: "", pass: "" });
    setIsFirstLogin(false);
    sessionStorage.removeItem("homes_logged_in");
    sessionStorage.removeItem("auth_id");
    sessionStorage.removeItem("auth_pass");
    sessionStorage.removeItem("homes_login_id");
    sessionStorage.removeItem("homes_first_login");
  };

  const clearFirstLogin = () => {
    sessionStorage.removeItem("homes_first_login");
    setIsFirstLogin(false);
  };

  const hasAuth = () => {
    return !!auth.id && !!auth.pass;
  };

  // Check auth consistency on mount
  useEffect(() => {
    if (isLoggedIn && !hasAuth()) {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      auth,
      isFirstLogin,
      login,
      logout,
      hasAuth,
      clearFirstLogin
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
