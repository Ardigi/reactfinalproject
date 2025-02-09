import * as React from 'react';
import { View, Text, StyleSheet, Image, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaskedTextInput } from 'react-native-mask-text';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [notifications, setNotifications] = React.useState({
    orderStatuses: true,
    passwordChanges: true,
    specialOffers: true,
    newsletter: true,
  });
  const [profileImage, setProfileImage] = React.useState(null);

  React.useEffect(() => {
    // Load user data when component mounts
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.multiGet([
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'profileImage',
        'notifications'
      ]);

      const data = Object.fromEntries(userData);

      // Update all states with loaded data
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '');
      setProfileImage(data.profileImage || null);
      
      // Load notifications state
      if (data.notifications) {
        setNotifications(JSON.parse(data.notifications));
      }

      console.log('Loaded user data:', data);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all data from AsyncStorage
      await AsyncStorage.multiRemove([
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'profileImage',
        'notifications'
      ]);

      // Navigate back to Onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(number);
  };

  const handleSaveChanges = async () => {
    try {
      // Validate phone number if one is provided
      if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
        Alert.alert('Invalid Phone Number', 'Please enter a valid US phone number');
        return;
      }

      // Format phone number before saving
      const formattedPhone = phoneNumber ? phoneNumber.replace(
        /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
        '($1) $2-$3'
      ) : '';

      // Save all user data
      await AsyncStorage.multiSet([
        ['firstName', firstName],
        ['lastName', lastName],
        ['email', email],
        ['phoneNumber', formattedPhone],
        ['notifications', JSON.stringify(notifications)],  // Save notifications state
        // Profile image is already being saved in pickImage function
      ]);

      Alert.alert('Success', 'Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        await AsyncStorage.setItem('profileImage', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const AvatarDisplay = () => (
    profileImage ? (
      <Image 
        source={{ uri: profileImage }}
        style={styles.largeAvatar}
      />
    ) : (
      <View style={styles.initialsContainer}>
        <Text style={styles.initialsText}>{getInitials()}</Text>
      </View>
    )
  );

  const handleDiscardChanges = async () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard all changes?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          onPress: loadUserData,  // Reload the original data
          style: 'destructive',
        },
      ]
    );
  };

  // Back button placeholder
  const BackButton = () => (
    <View style={[styles.backButton, { backgroundColor: '#495E57', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#fff', fontSize: 16 }}>←</Text>
    </View>
  );

  // Logo placeholder
  const LogoPlaceholder = () => (
    <View style={[styles.logoContainer, { backgroundColor: '#F4CE14', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }]}>
      <Text style={{ color: '#495E57', fontSize: 16, fontWeight: 'bold' }}>LITTLE LEMON</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <Pressable onPress={() => navigation.goBack()}>
            <BackButton />
          </Pressable>
        )}
        <LogoPlaceholder />
        <AvatarDisplay />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Personal information</Text>
        
        <View style={styles.avatarSection}>
          <AvatarDisplay />
          <View style={styles.avatarButtons}>
            <Pressable style={styles.changeButton} onPress={pickImage}>
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
            <Pressable 
              style={styles.removeButton} 
              onPress={() => {
                setProfileImage(null);
                AsyncStorage.removeItem('profileImage');
              }}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Phone number</Text>
          <MaskedTextInput
            style={styles.input}
            mask="(999) 999-9999"
            value={phoneNumber}
            onChangeText={(text, rawText) => {
              setPhoneNumber(rawText);
            }}
            keyboardType="phone-pad"
            placeholder="(123) 456-7890"
          />
        </View>

        <Text style={styles.title}>Email notifications</Text>
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
                {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>

        <View style={styles.buttonContainer}>
          <Pressable 
            style={styles.discardButton} 
            onPress={handleDiscardChanges}
          >
            <Text style={styles.discardButtonText}>Discard changes</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save changes</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#DEE3E9',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  logoContainer: {
    width: 150,
    height: 40,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495E57',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495E57',
    marginVertical: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  changeButton: {
    backgroundColor: '#495E57',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeButtonText: {
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
  form: {
    gap: 12,
  },
  label: {
    color: '#495E57',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#495E57',
    borderRadius: 8,
    padding: 12,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
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
  logo: {
    width: 150,
    height: 40,
  },
}); 