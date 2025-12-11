import { createContext, useContext, useState } from 'react';

const GodModeContext = createContext();

export function GodModeProvider({ children }) {
  const [isGodMode, setIsGodMode] = useState(false);

  const toggleGodMode = () => {
    setIsGodMode(prev => !prev);
  };

  return (
    <GodModeContext.Provider value={{ isGodMode, toggleGodMode }}>
      {children}
    </GodModeContext.Provider>
  );
}

export function useGodMode() {
  const context = useContext(GodModeContext);
  if (context === undefined) {
    throw new Error('useGodMode must be used within a GodModeProvider');
  }
  return context;
}
