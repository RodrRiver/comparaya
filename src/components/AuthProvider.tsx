"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

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
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function signIn() {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}
