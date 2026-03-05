"use client";

import React, { createContext, useContext, useState } from "react";

const DrawerContext = createContext({
  isOpen: false,
  toggleDrawer: (open: boolean) => {},
});

export const DrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = (open: boolean) => setIsOpen(open);

  return (
    <DrawerContext.Provider value={{ isOpen, toggleDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);
