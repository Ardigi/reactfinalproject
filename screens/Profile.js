import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaskedTextInput } from 'react-native-mask-text';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ firstName: '', email: '' });
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notifications, setNotifications] = useState({
    orderStatuses: true,
    passwordChanges: true,
    specialOffers: true,
    newsletter: true,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.multiGet([
        'firstName', 
        'email', 
        'lastName', 
        'phoneNumber', 
        'profileImage', 
        'notifications'
      ]);
      
      if (!data) {
        throw new Error('Failed to load user data');
      }

      const [firstName, email, lastName, phoneNumber, profileImage, notifications] = data.map(item => item[1]);
      
      // Validate required fields
      if (!firstName || !email) {
        Alert.alert(
          'Data Error',
          'Some required user data is missing. Please complete your profile.',
          [{ text: 'OK' }]
        );
      }

      setUserData({ firstName: firstName || '', email: email || '' });
      setLastName(lastName || '');
      setPhoneNumber(phoneNumber || '');
      setProfileImage(profileImage || null);
      setNotifications(
        notifications ? JSON.parse(notifications) : {
          orderStatuses: true,
          passwordChanges: true,
          specialOffers: true,
          newsletter: true,
        }
      );
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(
        'Error',
        'Failed to load user data. Please try again.',
        [
          { 
            text: 'Retry',
            onPress: loadUserData
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.replace('Onboarding');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(number);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    if (!userData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }

    if (!userData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }

    if (!validateEmail(userData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateInputs()) return;

    setIsSaving(true);
    try {
      if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid US phone number');
        return;
      }

      const formattedPhone = phoneNumber ? phoneNumber.replace(
        /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
        '($1) $2-$3'
      ) : '';

      await AsyncStorage.multiSet([
        ['firstName', userData.firstName.trim()],
        ['lastName', lastName.trim()],
        ['email', userData.email.trim()],
        ['phoneNumber', formattedPhone],
        ['notifications', JSON.stringify(notifications)],
        ['profileImage', profileImage || ''],
      ]);

      Alert.alert('Success', 'Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert(
        'Error',
        'Failed to save changes. Please try again.',
        [
          {
            text: 'Retry',
            onPress: handleSaveChanges
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getInitials = () => {
    const firstInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  const AvatarDisplay = ({ profileImage, initials }) => {
    if (profileImage) {
      return <Image source={{ uri: profileImage }} style={styles.avatar} />;
    }
    return (
      <View style={styles.initialsContainer}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#495E57" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Personal Information</Text>
      
      <View style={styles.avatarSection}>
        <AvatarDisplay profileImage={profileImage} initials={getInitials()} />
        <View style={styles.avatarButtons}>
          <Pressable style={styles.changeButton} onPress={pickImage}>
            <Text style={styles.buttonText}>Change</Text>
          </Pressable>
          {profileImage && (
            <Pressable style={styles.removeButton} onPress={removeImage}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          )}
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={userData.firstName}
        onChangeText={(text) => setUserData(prev => ({ ...prev, firstName: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={userData.email}
        onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
      />
      <MaskedTextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        mask="(999) 999-9999"
        keyboardType="phone-pad"
      />

      <Text style={styles.title}>Email Notifications</Text>
      <View style={styles.notificationSection}>
        {Object.entries(notifications).map(([key, value]) => (
          <Pressable
            key={key}
            style={styles.checkboxRow}
            onPress={() => toggleNotification(key)}
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.discardButton} 
          onPress={() => {
            Alert.alert(
              'Confirm Discard',
              'Are you sure you want to discard all changes?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Discard',
                  onPress: loadUserData,
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <Text style={styles.discardButtonText}>Discard changes</Text>
        </Pressable>
        <Pressable 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontFamily: 'MarkaziText-Regular',
    color: '#495E57',
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  avatarButtons: {
    gap: 12,
  },
  changeButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#495E57',
  },
  removeButtonText: {
    color: '#495E57',
    fontSize: 16,
  },
  notificationSection: {
    gap: 12,
    marginBottom: 32,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#495E57',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#495E57',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#495E57',
  },
  logoutButton: {
    backgroundColor: '#F4CE14',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#495E57',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  discardButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#495E57',
  },
  discardButtonText: {
    color: '#495E57',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  initialsContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#495E57',
    fontSize: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
}); 