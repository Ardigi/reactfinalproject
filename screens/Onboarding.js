import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = () => (
  <View style={styles.header}>
    <Image 
      source={require('../assets/Logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

export default function Onboarding({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');

  const isValid = firstName.length > 0 && email.length > 0 && email.includes('@');

  const handleSubmit = async () => {
    try {
      await AsyncStorage.multiSet([
        ['firstName', firstName],
        ['email', email],
      ]);
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Welcome to Little Lemon</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Pressable 
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  logo: {
    width: 200,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: 'MarkaziText-Regular',
    color: '#333333',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#495E57',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Karla-Regular',
  },
  button: {
    backgroundColor: '#F4CE14',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});