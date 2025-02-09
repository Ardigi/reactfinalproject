import * as React from 'react';
import { View, Text, StyleSheet, Image, TextInput, FlatList, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase, saveMenuItems, getMenuItems, hasData, getMenuItemsByCategories, searchMenuItems } from '../utils/database';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { getCachedImage } from '../utils/imageCache';

const API_URL = 'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json';
const IMAGE_BASE_URL = Platform.OS === 'web' 
  ? 'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/images'
  : 'https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images';

const categories = ['Starters', 'Mains', 'Desserts', 'Drinks'];

export default function Home() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState(new Set());
  const [profileImage, setProfileImage] = React.useState(null);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [menuItems, setMenuItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  // Load user profile data
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.multiGet([
          'profileImage',
          'firstName',
          'lastName'
        ]);
        const data = Object.fromEntries(userData);
        
        setProfileImage(data.profileImage);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Initialize database when component mounts
  React.useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        
        const hasStoredData = await hasData();
        
        if (!hasStoredData) {
          const response = await fetch(API_URL);
          const json = await response.json();
          
          // Process images sequentially to avoid overwhelming the device
          const transformedData = await Promise.all(
            json.menu.map(async (item, index) => ({
              id: (index + 1).toString(),
              name: item.name,
              description: item.description,
              price: item.price.toFixed(2),
              category: item.category,
              image: await getImageUrl(item.name)
            }))
          );

          await saveMenuItems(transformedData);
          setMenuItems(transformedData);
        } else {
          const localMenuItems = await getMenuItems();
          // Ensure cached images are still valid
          const updatedItems = await Promise.all(
            localMenuItems.map(async item => ({
              ...item,
              image: await getCachedImage(item.image.uri)
            }))
          );
          setMenuItems(updatedItems);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setError('Failed to load menu items');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const getImageUrl = async (imageName) => {
    const imageMapping = {
      'Greek Salad': 'greekSalad',
      'Bruschetta': 'bruschetta',
      'Grilled Fish': 'grilledFish',
      'Pasta': 'pasta',
      'Lemon Dessert': 'lemonDessert'
    };
    
    const imagePath = imageMapping[imageName];
    const url = `${IMAGE_BASE_URL}/${imagePath}.jpg`;
    
    if (Platform.OS === 'web') {
      return { uri: url };
    }
    
    return await getCachedImage(url);
  };

  // Filter menu items based on search and category
  const filteredMenuItems = React.useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [menuItems, searchText]);

  // Update category selection handler
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(category)) {
        newSelection.delete(category);
      } else {
        newSelection.add(category);
      }
      return newSelection;
    });
  };

  // Add useEffect for category filtering
  React.useEffect(() => {
    const filterMenuItems = async () => {
      try {
        const categories = Array.from(selectedCategories);
        const filteredItems = await getMenuItemsByCategories(categories);
        setMenuItems(filteredItems);
      } catch (error) {
        console.error('Error filtering menu items:', error);
        setError('Failed to filter menu items');
      }
    };

    filterMenuItems();
  }, [selectedCategories]);

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce((text) => {
      setDebouncedSearchText(text);
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (text) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  // Update the search effect to show loading state
  React.useEffect(() => {
    const searchItems = async () => {
      try {
        setIsSearching(true);
        const categories = Array.from(selectedCategories);
        const results = await searchMenuItems(debouncedSearchText, categories);
        setMenuItems(results);
      } catch (error) {
        console.error('Error searching menu items:', error);
        setError('Failed to search menu items');
      } finally {
        setIsSearching(false);
      }
    };

    searchItems();
  }, [debouncedSearchText, selectedCategories]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#495E57" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Avatar component with initials fallback
  const AvatarDisplay = () => {
    if (profileImage) {
      return (
        <Image 
          source={{ uri: profileImage }}
          style={styles.avatar}
        />
      );
    }
    return (
      <View style={styles.initialsContainer}>
        <Text style={styles.initialsText}>
          {firstName.charAt(0)}{lastName.charAt(0)}
        </Text>
      </View>
    );
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>${item.price}</Text>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );

  // Update the LogoPlaceholder component
  const LogoPlaceholder = () => (
    <Text style={styles.logoText}>LITTLE LEMON</Text>
  );

  // Update the HeroBanner component
  const HeroBanner = ({ searchText, onSearchChange }) => (
    <View style={styles.hero}>
      <View style={styles.heroContent}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Little Lemon</Text>
          <Text style={styles.heroSubtitle}>Chicago</Text>
          <Text style={styles.heroDescription}>
            We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
          </Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder={isSearching ? "Searching..." : "Search menu items..."}
          value={searchText}
          onChangeText={onSearchChange}
          placeholderTextColor="#666666"
          editable={!isSearching}
        />
        {isSearching && (
          <ActivityIndicator 
            size="small" 
            color="#495E57"
            style={styles.searchSpinner}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LogoPlaceholder />
        </View>
        <Pressable 
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatarButton}
        >
          <AvatarDisplay />
        </Pressable>
      </View>

      {/* Hero Banner */}
      <HeroBanner 
        searchText={searchText} 
        onSearchChange={handleSearchChange}
      />

      {/* Categories */}
      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>ORDER FOR DELIVERY!</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
        >
          <View style={styles.categoryButtons}>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategories.has(category) && styles.categoryButtonActive
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategories.has(category) && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Menu List */}
      <FlatList
        data={filteredMenuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        style={styles.menuList}
        ListEmptyComponent={
          isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#495E57" />
              <Text style={styles.loadingText}>Searching menu items...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No menu items found</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 40,
  },
  avatarButton: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#495E57',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hero: {
    backgroundColor: '#495E57',
    padding: 16,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    color: '#F4CE14',
    fontSize: 40,
    fontFamily: 'Markazi Text',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Markazi Text',
    marginBottom: 8,
  },
  heroDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Karla',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
    fontFamily: 'Karla',
    color: '#333333',
  },
  categories: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEFEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryButtons: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EDEFEE',
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#495E57',
  },
  categoryButtonText: {
    color: '#495E57',
    fontSize: 16,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  menuList: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    marginBottom: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  menuItemText: {
    flex: 1,
    marginRight: 10,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  menuItemDescription: {
    color: '#495E57',
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    color: '#495E57',
  },
  divider: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginTop: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#495E57',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#495E57',
    padding: 20,
  },
  logoText: {
    color: '#495E57',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Markazi Text',
  },
}); 