"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getFirebaseAuth();
    return onAuthStateChanged(a, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function signIn() {
    await signInWithPopup(getFirebaseAuth(), googleProvider);
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
  }

  return (
    <AuthContext value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}
