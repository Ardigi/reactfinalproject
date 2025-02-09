import * as React from "react";
import { TextInput, View, Text, StyleSheet, Image, Pressable, Alert, ActivityIndicator } from "react-native";
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Onboarding() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  
  const [fontsLoaded] = useFonts({
    'Karla-Regular': require('../assets/fonts/Karla-Regular.ttf'),
    'MarkaziText-Regular': require('../assets/fonts/MarkaziText-Regular.ttf'),
  });

  React.useEffect(() => {
    // Load saved user data when component mounts
    const loadUserData = async () => {
      try {
        const savedFirstName = await AsyncStorage.getItem('firstName');
        const savedLastName = await AsyncStorage.getItem('lastName');
        const savedEmail = await AsyncStorage.getItem('email');
        
        if (savedFirstName) setFirstName(savedFirstName);
        if (savedLastName) setLastName(savedLastName);
        if (savedEmail) setEmail(savedEmail);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const validateEmail = (email) => {
    return email.match(
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    );
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      // Save user data
      await AsyncStorage.multiSet([
        ['firstName', firstName],
        ['lastName', lastName],
        ['email', email],
      ]);
      
      // Navigate to Profile screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save user data. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#495E57" />
      </View>
    );
  }

  const LogoPlaceholder = () => (
    <View style={[styles.logo, { backgroundColor: '#F4CE14', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }]}>
      <Text style={{ color: '#495E57', fontSize: 16, fontWeight: 'bold' }}>LITTLE LEMON</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LogoPlaceholder />
          <Text style={styles.headerText}>LITTLE LEMON</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Let us get to know you</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              onChangeText={setFirstName}  
              value={firstName}
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              onChangeText={setLastName}  
              value={lastName}
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              onChangeText={setEmail}  
              value={email}
              keyboardType="email-address"
              maxLength={50}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable 
            onPress={handleSubmit}
            style={[
              styles.nextButton,
              firstName.trim() && lastName.trim() && email.trim() && styles.nextButtonActive
            ]}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#EDEFEE',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerText: {
    color: '#495E57',
    fontSize: 20,
    letterSpacing: 1.5,
    fontFamily: 'Karla-Regular',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#EDEFEE',
  },
  welcomeText: {
    fontSize: 32,
    color: '#495E57',
    fontFamily: 'MarkaziText-Regular',
    marginTop: 60,
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 40,
  },
  inputLabel: {
    color: '#495E57',
    fontFamily: 'Karla-Regular',
    fontSize: 24,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#79797930',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    fontFamily: 'Karla-Regular',
    color: '#333333',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#CBD2D9',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 12,
  },
  nextButtonActive: {
    backgroundColor: '#495E57',
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Karla-Regular',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});