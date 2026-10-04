import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

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

    const firstName = parsed.firstName || "SmartResume";
    const surname = parsed.surname || "";
    const fullName = `${firstName}${surname ? " " + surname : ""}`;

    return {
      id: parsed.id || crypto.randomUUID(),
      firstName,
      surname,
      fullName,
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
    const firstName = userData?.firstName || "SmartResume";
    const surname = userData?.surname || "";
    const fullName = `${firstName}${surname ? " " + surname : ""}`;

    const normalizedUser = {
      id: userData?.id || crypto.randomUUID(),
      firstName,
      surname,
      fullName,
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

  /*
   * Edit the signed-in user's profile.
   *
   * This is LOCAL to the current browser only. SmartResume has no backend
   * authentication yet, so this writes the same `smartresume_user` key the
   * rest of the auth layer already owns. It deliberately does not touch
   * resume or portfolio storage.
   */
  const updateProfile = useCallback(
    (updates = {}) => {
      if (!user) {
        return null;
      }

      const firstName =
        updates.firstName === undefined ? user.firstName : updates.firstName;

      const surname =
        updates.surname === undefined ? user.surname : updates.surname;

      const email =
        updates.email === undefined ? user.email : updates.email;

      const fullName = `${firstName}${surname ? " " + surname : ""}`;

      const updatedUser = {
        id: user.id,
        firstName,
        surname,
        fullName,
        email,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

      setUser(updatedUser);

      return updatedUser;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateProfile,
    }),
    [user, updateProfile],
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
