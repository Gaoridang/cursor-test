import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cursor Test</Text>
      <Text style={styles.subtitle}>
        React Native is running on {Platform.OS === 'ios' ? 'iPhone' : Platform.OS}
      </Text>
      <Text style={styles.hint}>Edit App.tsx to start building your app.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
