// The database isn't properly closed on app exit
export const closeDatabase = () => {
  db._db.close();
};

// Consider adding cleanup in App.js:
React.useEffect(() => {
  return () => {
    closeDatabase();
  };
}, []); 