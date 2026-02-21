import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
}

interface AuthState {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    { name: "pos-karczma-auth" }
  )
);
