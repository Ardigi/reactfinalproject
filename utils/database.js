import * as SQLite from 'expo-sqlite';

// Use the same database connection across the app
const db = SQLite.openDatabase('little_lemon.db');

// Export the db connection for potential direct use
export { db };

let dbInitPromise = null;

export const initDatabase = () => {
  // Only initialize once
  if (!dbInitPromise) {
    dbInitPromise = new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, price REAL, category TEXT, image TEXT);',
            [],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        },
        (error) => {
          console.error('Error creating table:', error);
          dbInitPromise = null; // Reset on error
          reject(error);
        },
        () => {
          console.log('Database initialized successfully');
          resolve();
        }
      );
    });
  }
  return dbInitPromise;
};

export const saveMenuItems = (menuItems) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DELETE FROM menu;');
        
        menuItems.forEach((item) => {
          tx.executeSql(
            'INSERT INTO menu (name, description, price, category, image) VALUES (?, ?, ?, ?, ?);',
            [
              item.name,
              item.description,
              item.price,
              item.category,
              item.image.uri // Store the cached path
            ]
          );
        });
      },
      (error) => {
        console.error('Error saving menu items:', error);
        reject(error);
      },
      resolve
    );
  });
};

export const getMenuItems = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT * FROM menu;',
          [],
          (_, { rows: { _array } }) => {
            const menuItems = _array.map(item => ({
              ...item,
              image: { uri: item.image }
            }));
            resolve(menuItems);
          }
        );
      },
      (error) => {
        console.error('Error getting menu items:', error);
        reject(error);
      }
    );
  });
};

export const hasData = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM menu;',
          [],
          (_, { rows: { _array } }) => {
            resolve(_array[0].count > 0);
          }
        );
      },
      (error) => {
        console.error('Error checking data:', error);
        reject(error);
      }
    );
  });
};

export const getMenuItemsByCategories = (categories) => {
  return new Promise((resolve, reject) => {
    if (!categories || categories.length === 0) {
      // If no categories selected, return all items
      return getMenuItems();
    }

    const placeholders = categories.map(() => '?').join(',');
    const query = `SELECT * FROM menu WHERE category IN (${placeholders});`;

    db.transaction(
      (tx) => {
        tx.executeSql(
          query,
          categories,
          (_, { rows: { _array } }) => {
            const menuItems = _array.map(item => ({
              ...item,
              image: { uri: item.image }
            }));
            resolve(menuItems);
          }
        );
      },
      (error) => {
        console.error('Error filtering menu items:', error);
        reject(error);
      }
    );
  });
};

export const searchMenuItems = (searchText, categories = []) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM menu WHERE name LIKE ?';
    const params = [`%${searchText}%`];

    if (categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      query += ` AND category IN (${placeholders})`;
      params.push(...categories);
    }

    db.transaction(
      (tx) => {
        tx.executeSql(
          query,
          params,
          (_, { rows: { _array } }) => {
            const menuItems = _array.map(item => ({
              ...item,
              image: { uri: item.image }
            }));
            resolve(menuItems);
          }
        );
      },
      (error) => {
        console.error('Error searching menu items:', error);
        reject(error);
      }
    );
  });
};

export const closeDatabase = () => {
  db._db.close();
}; 