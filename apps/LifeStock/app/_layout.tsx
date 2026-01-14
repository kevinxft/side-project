import { Stack } from 'expo-router';
import { HeroUINativeProvider } from 'heroui-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>

        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>

      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
