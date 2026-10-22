"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { firebaseAuth, firebaseConfigured } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  /** True until Firebase reports whether someone is signed in. */
  loading: boolean;
  configured: boolean;
  /** A fresh ID token for the backend. Throws when signed out. */
  getToken: () => Promise<string>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, create: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(firebaseAuth(), (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured: firebaseConfigured,
      getToken: async () => {
        const current = firebaseAuth().currentUser;
        if (!current) throw new Error("Not signed in");
        return current.getIdToken();
      },
      signInWithGoogle: async () => {
        await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
      },
      signInWithEmail: async (email, password, create) => {
        const auth = firebaseAuth();
        if (create) await createUserWithEmailAndPassword(auth, email, password);
        else await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: () => firebaseSignOut(firebaseAuth()),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { AuthProvider, useAuth };
