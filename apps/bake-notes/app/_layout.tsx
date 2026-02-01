import '../global.css';

import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';

const headerBackground =
  Platform.OS === 'android'
    ? () => (
        <View className="h-full border-b border-[#eadfce] bg-white/70" />
      )
    : undefined;

export default function RootLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        headerBlurEffect: Platform.OS === 'ios' ? 'systemUltraThinMaterial' : undefined,
        headerBackground,
        headerShadowVisible: false,
        headerTintColor: '#2f1f10',
        headerTitleStyle: { fontWeight: '600', color: '#2f1f10' },
        headerStyle: { backgroundColor: 'rgba(255,255,255,0.65)' },
      }}
    />
  );
}
