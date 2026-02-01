import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type EmptyStateProps = {
  onAddPress: () => void;
};

export const EmptyState = memo(({ onAddPress }: EmptyStateProps) => (
  <View style={styles.container}>
    {/* Icon with Soft Radial Gradient Glow */}
    <View style={styles.iconContainer}>
      {/* SVG Radial Gradient for true soft glow */}
      <View style={styles.glowContainer}>
        <Svg height="200" width="200" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient
              id="grad"
              cx="100"
              cy="100"
              rx="100"
              ry="100"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="#f28b2c" stopOpacity="0.2" />
              <Stop offset="0.5" stopColor="#f28b2c" stopOpacity="0.1" />
              <Stop offset="1" stopColor="#f28b2c" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="100" fill="url(#grad)" />
        </Svg>
      </View>

      {/* Icon centered */}
      <MaterialCommunityIcons name="cupcake" size={48} color="#f28b2c" />
    </View>

    {/* Title */}
    <Text style={styles.title}>还没有配方</Text>

    {/* Subtitle */}
    <Text style={styles.subtitle}>
      点击下方按钮开始添加你的{'\n'}第一个烘焙配方
    </Text>

    {/* Add Button */}
    <Pressable
      onPress={onAddPress}
      style={({ pressed }) => [
        styles.addButton,
        pressed && styles.addButtonPressed,
      ]}
    >
      <Text style={styles.buttonPlus}>+</Text>
      <Text style={styles.buttonText}>添加配方</Text>
    </Pressable>
  </View>
));

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Warm off-white background from design
    backgroundColor: '#fffaf5',
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    // Make glow larger than container to let it fade out
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1c',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#9a9a9a',
    textAlign: 'center',
    marginBottom: 36,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f28b2c',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    // Subtle shadow for button
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonPlus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

