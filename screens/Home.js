import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase, saveMenuItems, getMenuItems, hasData, getMenuItemsByCategories, searchMenuItems, closeDatabase } from '../utils/database';
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { getCachedImage } from '../utils/imageCache';

const API_URL = 'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/images';

const MENU_ITEMS = [
  { 
    id: '1', 
    name: 'Greek Salad', 
    price: '12.99', 
    category: 'Starters', 
    description: 'The famous greek salad of crispy lettuce, peppers, olives and our Chicago style feta cheese, garnished with crunchy garlic and rosemary croutons.'
  },
  { 
    id: '2', 
    name: 'Bruschetta', 
    price: '7.99', 
    category: 'Starters', 
    description: 'Our Bruschetta is made from grilled bread that has been smeared with garlic and seasoned with salt and olive oil.'
  },
  { 
    id: '3', 
    name: 'Grilled Fish', 
    price: '20.00', 
    category: 'Mains', 
    description: 'Barbequed catch of the day, with red onion, crisp capers, chive creme fraiche.'
  },
  { 
    id: '4', 
    name: 'Pasta', 
    price: '18.99', 
    category: 'Mains', 
    description: 'Penne with fried aubergines, tomato sauce, fresh chilli, garlic, basil & salted ricotta.'
  },
  { 
    id: '5', 
    name: 'Lemon Dessert', 
    price: '6.99', 
    category: 'Desserts', 
    description: 'Light and fluffy traditional homemade Italian Lemon and ricotta cake'
  }
];

const CATEGORIES = ['Starters', 'Mains', 'Desserts', 'Drinks'];

const COLORS = {
  primary: '#495E57',    // Dark green
  secondary: '#F4CE14',  // Yellow
  highlight: '#EE9972',  // Peach/Salmon
  highlight2: '#FBDABB', // Light Peach
  dark: '#333333',
  light: '#EDEFEE',
  white: '#FFFFFF'
};

export default function Home() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [profileImage, setProfileImage] = React.useState(null);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [menuItems, setMenuItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchHandler, setSearchHandler] = React.useState(() => () => {});
  const [isDatabaseReady, setIsDatabaseReady] = React.useState(false);

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
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        
        if (!mounted) return;
        setIsDatabaseReady(true);

        const hasStoredData = await hasData();
        if (!mounted) return;

        if (!hasStoredData) {
          const response = await fetch(API_URL);
          const json = await response.json();
          
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

          if (!mounted) return;
          await saveMenuItems(transformedData);
          setMenuItems(transformedData);
        } else {
          const localMenuItems = await getMenuItems();
          if (!mounted) return;
          setMenuItems(localMenuItems);
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        if (mounted) {
          setError('Failed to load menu items');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      closeDatabase();
    };
  }, []);

  // Handle search text changes
  React.useEffect(() => {
    const handler = async () => {
      if (!isDatabaseReady) return;
      
      setIsSearching(true);
      try {
        const filteredItems = await searchMenuItems(
          debouncedSearchText,
          selectedCategory ? [selectedCategory] : []
        );
        setMenuItems(filteredItems);
      } catch (error) {
        console.error('Error searching items:', error);
        setError('Failed to search menu items');
      } finally {
        setIsSearching(false);
      }
    };

    setSearchHandler(() => debounce(handler, 500));
  }, [isDatabaseReady, selectedCategory]);

  // Handle category selection
  const handleCategorySelect = async (category) => {
    setSelectedCategory(prev => prev === category ? '' : category);
    setIsSearching(true);
    
    try {
      const categories = category ? [category] : [];
      const filteredItems = await getMenuItemsByCategories(categories);
      setMenuItems(filteredItems);
    } catch (error) {
      console.error('Error filtering by category:', error);
      setError('Failed to filter menu items');
    } finally {
      setIsSearching(false);
    }
  };

  // Get image URL for menu item
  const getImageUrl = async (imageName) => {
    const imageMapping = {
      'Greek Salad': 'greekSalad.jpg',
      'Bruschetta': 'bruschetta.jpg',
      'Grilled Fish': 'grilledFish.jpg',
      'Pasta': 'pasta.jpg',
      'Lemon Dessert': 'lemonDessert 2.jpg'  // Note the space in filename
    };
    
    const imagePath = imageMapping[imageName];
    if (!imagePath) {
      console.error(`No image mapping found for: ${imageName}`);
      return null;
    }

    const url = `${IMAGE_BASE_URL}/${imagePath}`;
    try {
      return await getCachedImage(url);
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

  // Handle search text changes with debounce
  const handleSearchChange = (text) => {
    setSearchText(text);
    setDebouncedSearchText(text);
    searchHandler();
  };

  // Render menu item
  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.menuItemPrice}>${item.price}</Text>
        </View>
        <Image 
          source={item.image}
          style={styles.menuItemImage}
          onError={(e) => {
            console.error('Image load error:', e.nativeEvent.error);
            // Just show the colored background if image fails
          }}
        />
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#495E57" />
        <Text style={styles.loadingText}>Loading menu items...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Little Lemon</Text>
          <Text style={styles.heroSubtitle}>Chicago</Text>
          <Text style={styles.heroDescription}>
            We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.
          </Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search menu items..."
              value={searchText}
              onChangeText={handleSearchChange}
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
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>ORDER FOR DELIVERY!</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryButtons}
          style={styles.categoryScroll}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryText
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      {menuItems.length === 0 ? (
        <Text style={styles.emptyText}>No menu items found</Text>
      ) : (
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={item => item.id}
          style={styles.menuList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  heroContent: {
    maxWidth: 600,
  },
  heroTitle: {
    color: COLORS.secondary,
    fontSize: 64,
    fontFamily: 'MarkaziText-Regular',
  },
  heroSubtitle: {
    color: COLORS.white,
    fontSize: 40,
    fontFamily: 'MarkaziText-Regular',
  },
  heroDescription: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Karla-Regular',
    maxWidth: '80%',
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
    fontFamily: 'Karla-Regular',
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
    backgroundColor: COLORS.light,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    color: '#495E57',
    fontSize: 16,
    fontFamily: 'Karla-Regular',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  menuList: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontFamily: 'Karla-Regular',
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  menuItemDescription: {
    fontFamily: 'Karla-Regular',
    color: COLORS.primary,
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontFamily: 'Karla-Regular',
    color: COLORS.primary,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
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
}); 