import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>烘焙笔记</Text>
      <Text style={styles.subtitle}>这是最简页面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});
