import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../lib/api";

/*
 * Authentication state.
 *
 * The server session (an httpOnly cookie the browser sends automatically) is
 * the ONLY authority on whether the user is signed in. JavaScript cannot read
 * that cookie, so it can never be inspected or forged here.
 *
 * `smartresume_user` survives purely as a local, non-authoritative CACHE of
 * profile display fields. It is used to avoid a name flash while the session
 * is being resolved, and it never grants access. Resume storage is untouched
 * by this file.
 *
 * Status values:
 *   initializing   - the session is being resolved on mount; access is undecided
 *   authenticated  - the server confirmed a valid session
 *   unauthenticated- the server said there is no session
 *   unavailable    - the server could not be reached or is unhealthy
 *
 * `unavailable` is deliberately distinct from `unauthenticated`: a server
 * outage must never be silently presented as "you are signed out".
 */

const STORAGE_KEY = "smartresume_user";

const AuthContext = createContext(null);

/* ------------------------------------------------------------------ */
/* Local profile cache (non-authoritative)                              */
/* ------------------------------------------------------------------ */

const shapeUser = (source) => {
  const firstName = source?.firstName || "SmartResume";
  const surname = source?.surname || "";

  return {
    id: source?.id || "",
    firstName,
    surname,
    fullName: `${firstName}${surname ? " " + surname : ""}`,
    email: source?.email || "",
  };
};

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return shapeUser(parsed);
  } catch (error) {
    console.error("Could not read the cached profile:", error);
    return null;
  }
};

const writeCachedUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Could not cache the profile:", error);
  }
};

const clearCachedUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Could not clear the cached profile:", error);
  }
};

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

export const AuthProvider = ({ children }) => {
  /*
   * Seeded from the cache purely so the shell can render a name during the
   * session check. `isAuthenticated` stays false until the server confirms.
   */
  const [user, setUser] = useState(() => readCachedUser());

  const [status, setStatus] = useState("initializing");

  // Guards against setting state after the provider unmounts.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const applyUser = useCallback((nextUser) => {
    const shaped = shapeUser(nextUser);

    if (mounted.current) {
      setUser(shaped);
    }

    writeCachedUser(shaped);

    return shaped;
  }, []);

  /* -------------------------------------------------------------- */
  /* RESOLVE SESSION ON MOUNT                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await getSession();

      if (!active) {
        return;
      }

      if (result.ok && result.data?.user) {
        applyUser(result.data.user);
        setStatus("authenticated");
        return;
      }

      // Only an explicit 401 means "not signed in". A 503 or a dead server
      // is a different situation and must not be reported as a sign-out.
      if (result.status === 401) {
        clearCachedUser();
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      setStatus("unavailable");
    })();

    return () => {
      active = false;
    };
  }, [applyUser]);

  /* -------------------------------------------------------------- */
  /* ACTIONS                                                         */
  /* -------------------------------------------------------------- */

  const login = useCallback(
    async (credentials) => {
      const result = await loginRequest(credentials);

      if (result.ok && result.data?.user) {
        applyUser(result.data.user);
        setStatus("authenticated");
      }

      return result;
    },
    [applyUser],
  );

  const register = useCallback(
    async (details) => {
      const result = await registerRequest(details);

      if (result.ok && result.data?.user) {
        applyUser(result.data.user);
        setStatus("authenticated");
      }

      return result;
    },
    [applyUser],
  );

  /*
   * Local state is cleared synchronously so an existing caller doing
   * `logout(); navigate("/login")` keeps working unchanged, and so the user is
   * never left in a signed-in state because the server is slow or down.
   * The server call is fire-and-forget: the cookie is cleared best-effort.
   */
  const logout = useCallback(async () => {
    clearCachedUser();
    setUser(null);
    setStatus("unauthenticated");

    await logoutRequest();

    return { ok: true };
  }, []);

  /*
   * Edit the signed-in user's profile.
   *
   * This writes the local `smartresume_user` cache only. There is no profile
   * endpoint yet, so these changes are NOT synced to the server and are
   * labelled as such in Settings. Syncing profiles is future work.
   */
  const updateProfile = useCallback(
    (updates = {}) => {
      setUser((current) => {
        if (!current) {
          return current;
        }

        const firstName =
          updates.firstName === undefined
            ? current.firstName
            : updates.firstName;

        const surname =
          updates.surname === undefined ? current.surname : updates.surname;

        const email =
          updates.email === undefined ? current.email : updates.email;

        const updated = shapeUser({
          id: current.id,
          firstName,
          surname,
          email,
        });

        writeCachedUser(updated);

        return updated;
      });

      return user;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      isInitializing: status === "initializing",
      isAuthenticated: status === "authenticated",
      isServerReachable: status !== "unavailable" && status !== "initializing",
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, status, login, register, logout, updateProfile],
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