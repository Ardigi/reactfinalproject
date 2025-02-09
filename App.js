import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#FFFFFF'
          }
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={Onboarding}
        />
        <Stack.Screen  
          name="Home" 
          component={Home}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 