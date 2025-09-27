'use client';

import { IUser } from '@/models';
import React, { createContext, useContext, useMemo, useState } from 'react';

type AppContextType = {
  user: IUser | undefined,
  setUser: React.Dispatch<IUser | undefined>
};

const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({
  children,
  initUser
}: {
  children: React.ReactNode;
  initUser: IUser
}) {
  const [user, setUser] = useState<IUser | undefined>(initUser)

  const value = useMemo(
    () => ({
    user,
    setUser
    }),
    [user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    console.error('useApp must be used within a AppContext');
    return {} as AppContextType; // Return an empty object casted to AppContextType
  }
  return context;
}
