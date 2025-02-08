import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './screens/Onboarding';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Onboarding" 
          component={Onboarding}
          options={{ headerShown: false }}
        />
        {/* Add your other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 