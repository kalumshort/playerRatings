import { createContext, useContext } from "react";

const MyContext = createContext();

export const FixtureGradientProvider = ({ children, value }) => {
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export const useFixtureGradientProvider = () => useContext(MyContext);
