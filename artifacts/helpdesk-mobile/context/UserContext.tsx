import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserProfile = {
  name: string;
  email: string;
  role: "employee" | "manager" | "admin";
};

type UserContextType = {
  user: UserProfile | null;
  setUser: (user: UserProfile) => Promise<void>;
  clearUser: () => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("userProfile").then((data) => {
      if (data) {
        try {
          setUserState(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const setUser = async (profile: UserProfile) => {
    setUserState(profile);
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
  };

  const clearUser = async () => {
    setUserState(null);
    await AsyncStorage.removeItem("userProfile");
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
