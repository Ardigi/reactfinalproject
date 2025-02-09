import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const imageCache = {};
const cacheDirectory = `${FileSystem.cacheDirectory}images/`;

export const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
  }
};

export const getCachedImage = async (url) => {
  // Web platform doesn't need caching as browsers handle it
  if (Platform.OS === 'web') {
    return { uri: url };
  }

  try {
    await ensureDirExists();

    const filename = url.split('/').pop();
    const filePath = cacheDirectory + filename;
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      // Download and cache the image
      await FileSystem.downloadAsync(url, filePath);
      imageCache[url] = filePath;
    }

    return { uri: imageCache[url] || filePath };
  } catch (error) {
    console.error('Error caching image:', error);
    // Fallback to original URL if caching fails
    return { uri: url };
  }
}; 