'use client';
import { createContext, useContext, useState } from 'react';

const AdminLayoutContext = createContext<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}>({ isMobileMenuOpen: false, setIsMobileMenuOpen: () => {} });

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <AdminLayoutContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export const useAdminLayout = () => useContext(AdminLayoutContext);
