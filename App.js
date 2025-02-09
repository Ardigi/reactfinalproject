import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Splash from './screens/Splash';
import { MaskedTextInput } from 'react-native-mask-text';
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './utils/database';

const Stack = createNativeStackNavigator();

// Initialize database connection at the top level
const db = SQLite.openDatabase('little_lemon.db');

// Initialize database tables
initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(error => {
    console.error('Error initializing database:', error);
  });

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = React.useState(false);

  React.useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const firstName = await AsyncStorage.getItem('firstName');
      const email = await AsyncStorage.getItem('email');
      setIsOnboardingCompleted(Boolean(firstName && email));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      // Add a small delay to show splash screen
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  if (isLoading) {
    return <Splash />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isOnboardingCompleted ? "Profile" : "Onboarding"}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#FFFFFF'
          }
        }}
      >
        {!isOnboardingCompleted ? (
          // Auth Stack
          <Stack.Screen 
            name="Onboarding" 
            component={Onboarding}
          />
        ) : (
          // App Stack
          <>
            <Stack.Screen 
              name="Profile" 
              component={Profile}
            />
            <Stack.Screen  
              name="Home" 
              component={Home}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 