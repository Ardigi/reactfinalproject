// The image mapping assumes these files exist
const imageMapping = {
  'Greek Salad': 'greekSalad.jpg',
  'Bruschetta': 'bruschetta.jpg',
  'Grilled Fish': 'grilledFish.jpg',
  'Pasta': 'pasta.jpg',
  'Lemon Dessert': 'lemonDessert 2.jpg'
};

// Make sure these image files are in your assets folder 

// Add better error handling for failed image loads
<Image 
  source={item.image}
  style={styles.menuItemImage}
  defaultSource={require('../assets/placeholder.png')}
  onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
/> 