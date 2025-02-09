import * as React from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';

export default function Splash() {
  return (
    <View style={styles.container}>
      <LogoPlaceholder />
      <ActivityIndicator 
        size="large" 
        color="#495E57" 
        style={styles.loader}
      />
    </View>
  );
}

const LogoPlaceholder = () => (
  <View style={[styles.logo, { backgroundColor: '#F4CE14', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }]}>
    <Text style={{ color: '#495E57', fontSize: 24, fontWeight: 'bold' }}>LITTLE LEMON</Text>
  </View>
);

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