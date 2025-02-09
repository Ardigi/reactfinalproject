import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome Home!</Text>
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
  text: {
    fontSize: 24,
    color: '#495E57',
  },
}); 