import * as FileSystem from 'expo-file-system';

const imageCache = {};
const cacheDirectory = `${FileSystem.cacheDirectory}images/`;
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
  }
};

export const getCachedImage = async (url) => {
  try {
    await ensureDirExists();
    const filename = url.split('/').pop();
    const filePath = cacheDirectory + filename;
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (!fileInfo.exists) {
      await FileSystem.downloadAsync(url, filePath);
      imageCache[url] = filePath;
    }

    return { uri: imageCache[url] || filePath };
  } catch (error) {
    console.error('Error caching image:', error);
    return { uri: url };
  }
};

export const clearOldCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
    if (!dirInfo.exists) return;

    const contents = await FileSystem.readDirectoryAsync(cacheDirectory);
    const now = new Date().getTime();

    for (const filename of contents) {
      const filePath = cacheDirectory + filename;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (now - fileInfo.modificationTime > CACHE_EXPIRY) {
        await FileSystem.deleteAsync(filePath);
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}; 