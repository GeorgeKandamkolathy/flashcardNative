import React, { useState, useContext } from 'react';

const DatabaseContext = React.createContext();

export const DatabaseProvider = ({ children, db }) => {
  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => useContext(DatabaseContext);