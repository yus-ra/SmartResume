import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "smartresume_user";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      id: parsed.id || crypto.randomUUID(),
      firstName: parsed.firstName || "SmartResume",
      surname: parsed.surname || "",
      email: parsed.email || "",
    };
  } catch (error) {
    console.error("Could not load stored auth user:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());

  const login = (userData) => {
    const normalizedUser = {
      id: userData?.id || crypto.randomUUID(),
      firstName: userData?.firstName || "SmartResume",
      surname: userData?.surname || "",
      email: userData?.email || "",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
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
