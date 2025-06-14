
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  temperature: number;
  setTemperature: (temp: number) => void;
  streamResponses: boolean;
  setStreamResponses: (stream: boolean) => void;
  enableMemory: boolean;
  setEnableMemory: (memory: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('synthesis-temperature');
    return saved ? parseFloat(saved) : 0.7;
  });
  
  const [streamResponses, setStreamResponses] = useState(() => {
    const saved = localStorage.getItem('synthesis-stream-responses');
    return saved !== null ? JSON.parse(saved) : false; // Disabled by default to fix Response object issue
  });
  
  const [enableMemory, setEnableMemory] = useState(() => {
    const saved = localStorage.getItem('synthesis-enable-memory');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('synthesis-temperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('synthesis-stream-responses', JSON.stringify(streamResponses));
  }, [streamResponses]);

  useEffect(() => {
    localStorage.setItem('synthesis-enable-memory', JSON.stringify(enableMemory));
  }, [enableMemory]);

  return (
    <SettingsContext.Provider value={{
      temperature,
      setTemperature,
      streamResponses,
      setStreamResponses,
      enableMemory,
      setEnableMemory
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
