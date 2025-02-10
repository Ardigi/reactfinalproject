import { registerRootComponent } from 'expo';
import App from './App';

// Catch any errors that occur during app initialization
try {
  registerRootComponent(App);
} catch (error) {
  console.error('Error initializing app:', error);
} 