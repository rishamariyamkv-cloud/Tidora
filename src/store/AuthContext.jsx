import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

/** Usernames are mapped to Firebase Auth emails on this domain: "mariyam" → "mariyam@tidora.app". */
export const LOGIN_DOMAIN = 'tidora.app';

export const usernameToEmail = (username) => {
  const u = username.trim().toLowerCase();
  return u.includes('@') ? u : `${u}@${LOGIN_DOMAIN}`;
};

/** Turns Firebase error codes into short, friendly messages. */
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Incorrect username or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled for this app yet.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not set up for this project yet.';
    default:
      return 'Something went wrong while signing in. Please try again.';
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // false until Firebase restores the saved session

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    [],
  );

  const login = useCallback((username, password) => signInWithEmailAndPassword(auth, usernameToEmail(username), password), []);
  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
