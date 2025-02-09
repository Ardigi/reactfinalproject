import * as React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function Splash() {
  return (
    <View style={styles.container}>
      <Image 
        style={styles.logo}
        source={require('../assets/logo.png')}
        resizeMode="contain"
      />
      <ActivityIndicator 
        size="large" 
        color="#495E57" 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200,
    height: 100,
  },
  loader: {
    marginTop: 30
  }
}); 